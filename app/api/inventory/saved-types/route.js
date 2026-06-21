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

function extractCheckedSnippets(html) {
  const snippets = [];

  const checkedMatches = [
    ...String(html || "").matchAll(/<input\b[^>]*checked[^>]*>/gi),
  ];

  for (const match of checkedMatches) {
    const index = match.index || 0;
    const start = Math.max(0, index - 500);
    const end = Math.min(html.length, index + 800);

    snippets.push({
      input: match[0],
      aroundText: cleanText(html.substring(start, end)),
    });
  }

  return snippets.slice(0, 50);
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

  return {
    stockId,
    editUrl,
    status: res.status,
    title: cleanText(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || ""),
    containsFatalError: html.includes("FatalError"),
    htmlLength: html.length,
    checkedSnippets: extractCheckedSnippets(html),
  };
}

export async function GET() {
  try {
    const { jar, loginStatus } = await loginMotorgate();

    const stockIds = await fetchSavedList(jar);
    const targets = stockIds.slice(0, 2);

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
