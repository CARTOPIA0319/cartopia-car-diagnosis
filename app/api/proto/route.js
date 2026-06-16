function addCookies(jar, setCookieText) {
  if (!setCookieText) return jar;

  const pieces = setCookieText.split(/,\s*(?=[^;,]+=)/);

  for (const piece of pieces) {
    const first = piece.split(";")[0].trim();
    const eq = first.indexOf("=");

    if (eq > 0) {
      const name = first.slice(0, eq);
      const value = first.slice(eq + 1);

      if (value !== "deleted") jar[name] = value;
      else delete jar[name];
    }
  }

  return jar;
}

function jarToCookie(jar) {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function cleanText(text) {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";
    const stockUrl = "https://motorgate.jp/stock/search";
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

    const stock = await fetch(stockUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
      },
    });

    const stockHtml = await stock.text();

    const stockIdMatch =
      stockHtml.match(/StockId=([A-Z0-9]+)/i);

    const stockStatusMatch =
      stockHtml.match(/StockStatus=([0-9]+)/i);

    if (!stockIdMatch) {
      return Response.json({
        success: false,
        error: "stock id not found",
      });
    }

    const stockId = stockIdMatch[1];
    const stockStatus = stockStatusMatch?.[1] || "00180002";

    const editUrl =
      `https://motorgate.jp/car/newregist/register?kbn=1&ClientId=${clientId}&StockId=${stockId}&StockStatus=${stockStatus}&ScreenId=CB101GR`;

    const edit = await fetch(editUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: stockUrl,
      },
    });

    const editHtml = await edit.text();
    const editText = cleanText(editHtml);

    return Response.json({
      success: true,
      stockId,
      stockStatus,
      editStatus: edit.status,
      containsLoginForm: editHtml.includes('name="client_pw"'),
      editUrl,
      editText: editText.substring(0, 10000),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
