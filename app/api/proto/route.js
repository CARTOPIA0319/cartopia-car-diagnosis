function addCookies(jar, setCookieText) {
  if (!setCookieText) return jar;

  const pieces = setCookieText.split(/,\s*(?=[^;,]+=)/);

  for (const piece of pieces) {
    const first = piece.split(";")[0].trim();
    const eq = first.indexOf("=");

    if (eq > 0) {
      const name = first.slice(0, eq);
      const value = first.slice(eq + 1);

      if (value !== "deleted") {
        jar[name] = value;
      } else {
        delete jar[name];
      }
    }
  }

  return jar;
}

function jarToCookie(jar) {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function unique(array) {
  return Array.from(new Set(array));
}

function extractStockIdsFromPublic(html) {
  return unique(
    Array.from(
      html.matchAll(/stock_ids\[\][^>]*value=['"]([A-Z0-9]+)['"]/gi)
    ).map((m) => m[1])
  );
}

function extractStockIdsFromSave(html) {
  return unique([
    ...Array.from(
      html.matchAll(/StockId=([A-Z0-9]+)/gi)
    ).map((m) => m[1]),

    ...Array.from(
      html.matchAll(/list_check_[A-Z0-9]+['"][^>]*value=['"]([A-Z0-9]+)['"]/gi)
    ).map((m) => m[1]),
  ]);
}

function findSavePerPageLinks(html) {
  return unique(
    Array.from(
      html.matchAll(/\/stock\/savelist\/(?:index|paging)\/[0-9]+\/[0-9]+/gi)
    ).map((m) => m[0])
  );
}

export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";
    const jar = {};

    const page = await fetch(loginUrl);
    addCookies(jar, page.headers.get("set-cookie") || "");

    const html = await page.text();

    const csrf =
      html.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];

    const sessionId =
      html.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

    const login = await fetch(loginUrl, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://motorgate.jp",
        Referer: loginUrl,
        Cookie: jarToCookie(jar),
      },
      body: new URLSearchParams({
        fuel_csrf_token: csrf,
        session_id: sessionId,
        client_id: clientId,
        user_id: "",
        client_pw: password,
      }),
    });

    addCookies(jar, login.headers.get("set-cookie") || "");

    const publicUrl =
      "https://motorgate.jp/stock/newsearch/stocklist/index/1/100";

    const publicRes = await fetch(publicUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
      },
    });

    const publicHtml = await publicRes.text();
    const publicStockIds = extractStockIdsFromPublic(publicHtml);

    const savePage1Url =
      "https://motorgate.jp/stock/savelist";

    const savePage1Res = await fetch(savePage1Url, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: publicUrl,
      },
    });

    const savePage1Html = await savePage1Res.text();

    const perPageLinks = findSavePerPageLinks(savePage1Html);

    const candidateSaveUrls = unique([
      "https://motorgate.jp/stock/savelist/index/1/100",
      "https://motorgate.jp/stock/savelist/paging/1/100",
      "https://motorgate.jp/stock/savelist/index/1/75",
      "https://motorgate.jp/stock/savelist/paging/1/75",
      ...perPageLinks.map((url) =>
        url.startsWith("http")
          ? url
          : `https://motorgate.jp${url}`
      ),
    ]);

    const saveAttempts = [];

    for (const url of candidateSaveUrls) {
      const res = await fetch(url, {
        headers: {
          Cookie: jarToCookie(jar),
          Referer: savePage1Url,
        },
      });

      const html = await res.text();
      const ids = extractStockIdsFromSave(html);

      saveAttempts.push({
        url,
        status: res.status,
        count: ids.length,
        stockIds: ids,
      });
    }

    const bestSave =
      saveAttempts
        .slice()
        .sort((a, b) => b.count - a.count)[0];

    const allStockIds = unique([
      ...publicStockIds,
      ...(bestSave?.stockIds || []),
    ]);

    return Response.json({
      success: true,

      public: {
        count: publicStockIds.length,
        stockIds: publicStockIds,
      },

      save: {
        bestUrl: bestSave?.url || null,
        bestCount: bestSave?.count || 0,
        stockIds: bestSave?.stockIds || [],
        attempts: saveAttempts.map((a) => ({
          url: a.url,
          status: a.status,
          count: a.count,
        })),
        perPageLinks,
      },

      total: {
        simpleTotal:
          publicStockIds.length + (bestSave?.count || 0),
        uniqueTotal: allStockIds.length,
      },
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
