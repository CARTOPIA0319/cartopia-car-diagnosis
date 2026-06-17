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
  return unique(
    [
      ...Array.from(
        html.matchAll(/StockId=([A-Z0-9]+)/gi)
      ).map((m) => m[1]),

      ...Array.from(
        html.matchAll(/list_check_[A-Z0-9]+['"][^>]*value=['"]([A-Z0-9]+)['"]/gi)
      ).map((m) => m[1])
    ]
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
    const savePage1StockIds = extractStockIdsFromSave(savePage1Html);

    const savePage2Url =
      "https://motorgate.jp/stock/savelist/paging/2/25";

    const savePage2Res = await fetch(savePage2Url, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: savePage1Url,
      },
    });

    const savePage2Html = await savePage2Res.text();
    const savePage2StockIds = extractStockIdsFromSave(savePage2Html);

    const saveStockIds = unique([
      ...savePage1StockIds,
      ...savePage2StockIds,
    ]);

    const allStockIds = unique([
      ...publicStockIds,
      ...saveStockIds,
    ]);

    return Response.json({
      success: true,

      public: {
        count: publicStockIds.length,
        stockIds: publicStockIds,
      },

      save: {
        page1Count: savePage1StockIds.length,
        page2Count: savePage2StockIds.length,
        count: saveStockIds.length,
        stockIds: saveStockIds,
      },

      total: {
        simpleTotal:
          publicStockIds.length + saveStockIds.length,

        uniqueTotal:
          allStockIds.length,
      },

      page2Preview:
        savePage2Html.substring(0, 1000),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
