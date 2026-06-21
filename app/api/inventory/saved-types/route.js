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

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) =>
      String.fromCharCode(parseInt(num, 10))
    );
}

function cleanHtmlToText(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<\/td>/gi, "\n")
      .replace(/<\/th>/gi, "\n")
      .replace(/<\/tr>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compactText(text) {
  return String(text || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function fixBasicMojibake(text) {
  return String(text || "")
    .replace(/蟷ｴ/g, "年")
    .replace(/譛�/g, "月")
    .replace(/荳⑫/g, "万K")
    .replace(/荳��/g, "万円")
    .replace(/讀�/g, "検")
    .replace(/霆頑､懈紛蛯吩ｻ�/g, "車検整備付")
    .replace(/萓｡譬ｼ/g, "価格")
    .replace(/邱城｡�/g, "総額")
    .trim();
}

function toHalfWidthAscii(text) {
  return String(text || "").replace(/[！-～]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
}

function normalizeTypeText(text) {
  return fixBasicMojibake(
    decodeHtmlEntities(String(text || ""))
      .replace(/Ｔ/g, "T")
      .replace(/Ｙ/g, "Y")
      .replace(/Ｐ/g, "P")
      .replace(/Ｅ/g, "E")
      .replace(/Ｖ/g, "V")
      .replace(/Ｈ/g, "H")
      .replace(/ｔ/g, "t")
      .replace(/ｙ/g, "y")
      .replace(/ｐ/g, "p")
      .replace(/ｅ/g, "e")
      .replace(/ｖ/g, "v")
      .replace(/ｈ/g, "h")
      .replace(/：/g, ":")
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/　/g, " ")
  );
}

function normalizeTypeKey(type) {
  const value = toHalfWidthAscii(String(type || ""))
    .replace(/：/g, ":")
    .replace(/　/g, " ")
    .replace(/Ｅ/g, "E")
    .replace(/Ｖ/g, "V")
    .replace(/Ｈ/g, "H")
    .trim();

  if (/^suv$/i.test(value)) return "SUV";
  if (/^ev・hv$/i.test(value)) return "EV・HV";
  if (/^e[vｖ]・h[vｖ]$/i.test(value)) return "EV・HV";

  return value;
}

function extractTypesFromText(text) {
  const fixed = normalizeTypeText(text);
  const types = [];
  const regex = /TYPE\s*:\s*([^\s<>"'&]+)/gi;
  let match;

  while ((match = regex.exec(fixed)) !== null) {
    const type = compactText(match[1]).replace(/[、,。]/g, "");

    if (
      type &&
      !type.includes(".") &&
      !type.includes("_") &&
      !types.includes(type)
    ) {
      types.push(type);
    }
  }

  return types;
}

function buildTypeKeys(types) {
  return Array.from(
    new Set(types.map((type) => normalizeTypeKey(type)).filter(Boolean))
  );
}

async function loginMotorgate() {
  const clientId = process.env.MOTORGATE_CLIENT_ID;
  const password = process.env.MOTORGATE_PASSWORD;

  const loginUrl = "https://motorgate.jp/login/index";
  const jar = {};

  const loginPage = await fetch(loginUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

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
      Origin: "https://motorgate.jp",
      Referer: loginUrl,
      Cookie: jarToCookie(jar),
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
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
        Referer: "https://motorgate.jp/top",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    });

    const html = await readUtf8Text(res);

    const ids = [...html.matchAll(/StockId=([A-Za-z0-9]+)/g)].map(
      (m) => m[1]
    );

    stockIds.push(...ids);
  }

  return [...new Set(stockIds)];
}

function extractTypeDebugSnippets(html) {
  const fixed = normalizeTypeText(html);
  const snippets = [];
  const regex = /TYPE\s*:/gi;
  let match;

  while ((match = regex.exec(fixed)) !== null) {
    const index = match.index || 0;
    const start = Math.max(0, index - 120);
    const end = Math.min(fixed.length, index + 180);

    snippets.push(compactText(cleanHtmlToText(fixed.substring(start, end))));
  }

  return snippets.slice(0, 20);
}

async function inspectVehicle(jar, stockId) {
  const editUrl = `https://motorgate.jp/car/newregist/register?kbn=1&client_id=0902332&StockStatus=00180002&StockId=${stockId}&ScreenId=SIH_001`;

  const res = await fetch(editUrl, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/stock/savelist",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

  const html = await readUtf8Text(res);
  const cleanText = cleanHtmlToText(html);

  const typesFromHtml = extractTypesFromText(html);
  const typesFromText = extractTypesFromText(cleanText);
  const types = Array.from(new Set([...typesFromHtml, ...typesFromText]));
  const typeKeys = buildTypeKeys(types);

  return {
    stockId,
    editUrl,
    status: res.status,
    title: compactText(
      cleanHtmlToText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "")
    ),
    containsFatalError: html.includes("FatalError"),
    htmlLength: html.length,
    types,
    typeKeys,
    typeDebugSnippets: extractTypeDebugSnippets(html),
  };
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") || "5");

    const { jar, loginStatus } = await loginMotorgate();

    const stockIds = await fetchSavedList(jar);
    const targets = stockIds.slice(0, limit);

    const results = [];

    for (const stockId of targets) {
      results.push(await inspectVehicle(jar, stockId));
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
