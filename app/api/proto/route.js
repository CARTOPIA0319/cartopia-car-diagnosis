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

function cleanTag(tag) {
  return tag
    .replace(/\s+/g, " ")
    .trim();
}

function findSaveLinks(html) {
  const hrefs = Array.from(
    html.matchAll(/href=["']([^"']+)["']/gi)
  ).map((m) => m[1]);

  const actions = Array.from(
    html.matchAll(/action=["']([^"']+)["']/gi)
  ).map((m) => m[1]);

  const scripts = Array.from(
    html.matchAll(/(?:location\.href|location|open)\s*=?\s*["']([^"']+)["']/gi)
  ).map((m) => m[1]);

  return unique([...hrefs, ...actions, ...scripts])
    .filter((url) =>
      /StockId|stock|save|register|SIH_001|newregist|edit/i.test(url)
    )
    .slice(0, 200);
}

function findStockIds(html) {
  return unique(
    Array.from(
      html.matchAll(/StockId=([A-Z0-9]+)/gi)
    ).map((m) => m[1])
  );
}

function findScreenIds(html) {
  return unique(
    Array.from(
      html.matchAll(/ScreenId=([A-Z0-9_]+)/gi)
    ).map((m) => m[1])
  );
}

function findInterestingInputs(html) {
  return Array.from(
    html.matchAll(/<input[^>]+>/gi)
  )
    .map((m) => cleanTag(m[0]))
    .filter((tag) =>
      /stock|save|temp|car|screen|status|id/i.test(tag)
    )
    .slice(0, 200);
}

function findInterestingText(html) {
  const words = [
    "SIH_001",
    "StockId",
    "StockStatus",
    "newregist",
    "register",
    "一時",
    "保存",
    "temp",
    "save",
    "savelist",
  ];

  const result = {};

  for (const word of words) {
    const index = html.indexOf(word);

    result[word] =
      index >= 0
        ? html
            .substring(Math.max(0, index - 500), index + 1500)
            .replace(/\s+/g, " ")
            .trim()
        : null;
  }

  return result;
}

export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";
    const saveUrl = "https://motorgate.jp/stock/savelist";

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

    const saveRes = await fetch(saveUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
      },
    });

    const saveHtml = await saveRes.text();

    return Response.json({
      success: true,
      status: saveRes.status,
      containsLoginForm: saveHtml.includes('name="client_pw"'),

      stockIds: findStockIds(saveHtml),
      screenIds: findScreenIds(saveHtml),
      links: findSaveLinks(saveHtml),
      inputs: findInterestingInputs(saveHtml),
      text: findInterestingText(saveHtml),

      preview: saveHtml.substring(0, 3000),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
