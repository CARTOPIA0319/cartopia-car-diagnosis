export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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

async function readUtf8Text(response) {
  const buffer = await response.arrayBuffer();
  return new TextDecoder("utf-8", { fatal: false }).decode(buffer);
}

function json(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

async function loginMotorgate() {
  const clientId = process.env.MOTORGATE_CLIENT_ID;
  const password = process.env.MOTORGATE_PASSWORD;

  const loginUrl = "https://motorgate.jp/login/index";
  const jar = {};

  const loginPage = await fetch(loginUrl);
  addCookies(jar, loginPage.headers.get("set-cookie") || "");

  const loginHtml = await readUtf8Text(loginPage);

  const csrf =
    loginHtml.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];

  const sessionId =
    loginHtml.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

  const login = await fetch(loginUrl, {
    method: "POST",
    redirect: "manual",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: jarToCookie(jar),
    },
    body: new URLSearchParams({
      fuel_csrf_token: csrf || "",
      session_id: sessionId || "",
      client_id: clientId || "",
      user_id: "",
      client_pw: password || "",
    }),
  });

  addCookies(jar, login.headers.get("set-cookie") || "");

  return { jar, loginStatus: login.status };
}

export async function GET() {
  try {
    const { jar, loginStatus } = await loginMotorgate();

    const res = await fetch(
      "https://motorgate.jp/stock/savelist",
      {
        headers: {
          Cookie: jarToCookie(jar),
          Referer: "https://motorgate.jp/top",
        },
      }
    );

    const html = await readUtf8Text(res);

    const stockIds = [
      ...html.matchAll(/StockId=([A-Za-z0-9]+)/g),
    ].map((m) => m[1]);

    const titles = [
      ...html.matchAll(
        /stock\/detail[\s\S]*?>(.*?)<\/a>/gi
      ),
    ]
      .map((m) =>
        String(m[1])
          .replace(/<[^>]+>/g, "")
          .trim()
      )
      .filter(Boolean);

    return json({
      success: true,
      loginStatus,
      status: res.status,
      stockCount: stockIds.length,
      stockIds: stockIds.slice(0, 50),
      titles: titles.slice(0, 50),
      htmlLength: html.length,
    });
  } catch (e) {
    return json({
      success: false,
      error: e.message,
    });
  }
}
