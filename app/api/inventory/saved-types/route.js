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

function cleanText(text) {
  return String(text || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeType(type) {
  const value = String(type || "")
    .replace(/ＳＵＶ/g, "SUV")
    .replace(/EＶ・ＨＶ/g, "EV・HV")
    .replace(/ＥＶ・ＨＶ/g, "EV・HV")
    .replace(/ｅｖ・ｈｖ/gi, "EV・HV")
    .trim();

  return value;
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

  return {
    jar,
    loginStatus: login.status,
  };
}

async function fetchSavedList(jar) {
  const urls = [
    "https://motorgate.jp/stock/savelist",
    "https://motorgate.jp/stock/savelist/index/2",
  ];

  const stockIds = [];

  for (const url of urls) {
    const res = await fetch(url, {
      headers: {
        Cookie: jarToCookie(jar),
      },
    });

    const html = await readUtf8Text(res);

    const ids = [
      ...html.matchAll(/StockId=([A-Za-z0-9]+)/g),
    ].map((m) => m[1]);

    stockIds.push(...ids);
  }

  return [...new Set(stockIds)];
}

function extractTypes(html) {
  const text = cleanText(html);

  const found = [];

  const candidates = [
    "SUV",
    "ミニバン",
    "セダン",
    "コンパクトカー",
    "ステーションワゴン",
    "スポーティ",
    "スライドドア",
    "EV・HV",
    "EＶ・ＨＶ",
    "ＳＵＶ",
    "バン・トラック",
    "スタンダード",
  ];

  for (const type of candidates) {
    if (text.includes(type)) {
      found.push(normalizeType(type));
    }
  }

  return [...new Set(found)];
}

async function inspectVehicle(jar, stockId) {
  const editUrl =
    `https://motorgate.jp/car/edit/new?kbn=1&ClientId=0902332&StockId=${stockId}&ScreenId=CB101GR`;

  const res = await fetch(editUrl, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/top",
    },
  });

  const html = await readUtf8Text(res);

  return {
    stockId,
    status: res.status,
    typeKeys: extractTypes(html),
    htmlLength: html.length,
  };
}

export async function GET() {
  try {
    const { jar, loginStatus } = await loginMotorgate();

    const stockIds = await fetchSavedList(jar);

    const targets = stockIds.slice(0, 5);

    const results = [];

    for (const stockId of targets) {
      results.push(
        await inspectVehicle(jar, stockId)
      );
    }

    return json({
      success: true,
      loginStatus,
      totalSavedVehicles: stockIds.length,
      testedVehicles: results.length,
      results,
    });
  } catch (e) {
    return json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
