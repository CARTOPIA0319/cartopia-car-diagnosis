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

function extractStockIds(html) {
  return unique(
    Array.from(
      html.matchAll(/stock_ids\[\][^>]*value=['"]([A-Z0-9]+)['"]/gi)
    ).map((m) => m[1])
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
        "Content-Type":
          "application/x-www-form-urlencoded",
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

    const publicStockIds =
      extractStockIds(publicHtml);

    const saveUrl =
      "https://motorgate.jp/stock/savelist";

    const saveRes = await fetch(saveUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: publicUrl,
      },
    });

    const saveHtml = await saveRes.text();

    const saveStockIds =
      extractStockIds(saveHtml);

    return Response.json({
      success: true,

      public: {
        count: publicStockIds.length,
        stockIds: publicStockIds.slice(0, 100)
      },

      save: {
        count: saveStockIds.length,
        stockIds: saveStockIds.slice(0, 100)
      },

      total:
        publicStockIds.length +
        saveStockIds.length,

      publicPreview:
        publicHtml.substring(0, 1000),

      savePreview:
        saveHtml.substring(0, 1000)
    });

  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack
    });
  }
}
