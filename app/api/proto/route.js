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

async function readText(response) {
  const buffer = await response.arrayBuffer();
  return new TextDecoder("shift-jis").decode(buffer);
}

function unique(array) {
  return Array.from(new Set(array));
}

function decodeHtmlEntities(text) {
  if (!text) return "";

  return text
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function htmlToText(html) {
  return decodeHtmlEntities(html)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(td|th|tr|div|p|li|span)>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanValue(value) {
  if (!value) return null;
  const cleaned = value.replace(/\s+/g, " ").trim();
  return cleaned || null;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractBetween(text, label, nextLabels) {
  const start = text.indexOf(label);
  if (start < 0) return null;

  const from = start + label.length;
  let end = text.length;

  for (const nextLabel of nextLabels) {
    const index = text.indexOf(nextLabel, from);
    if (index >= 0 && index < end) end = index;
  }

  return cleanValue(text.slice(from, end));
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

function normalizeImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://motorgate.jp${url}`;
  return url;
}

function extractMainImageUrl(html, stockId) {
  const urls = unique([
    ...Array.from(
      html.matchAll(/https?:\/\/[^"'\s<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/gi)
    ).map((m) => m[0]),

    ...Array.from(
      html.matchAll(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)
    ).map((m) => m[1]),
  ])
    .map(normalizeImageUrl)
    .filter(Boolean)
    .filter((url) =>
      !url.includes("car_nophoto") &&
      !url.includes("no_photo") &&
      !url.includes("nophoto") &&
      !url.includes("/assets/img/common/car") &&
      !url.includes("/assets/img/common/img-set") &&
      !url.includes("_NO") &&
      !url.includes("_MP")
    );

  const realImages = urls.filter((url) =>
    url.includes("secure.goo-net.com") ||
    url.includes("picture-referrer.goo-net.com")
  );

  const sorted = realImages.slice().sort((a, b) => {
    const score = (url) => {
      let value = 0;
      if (url.includes("/Q/")) value += 100;
      if (url.includes("01.jpg")) value += 50;
      if (url.includes("00.jpg")) value += 40;
      if (url.includes(stockId)) value += 20;
      return value;
    };

    return score(b) - score(a);
  });

  return sorted[0] || null;
}

function parseDetailPage({ html, stockId, source }) {
  const text = htmlToText(html);

  const maker = extractBetween(text, "メーカー", ["年式"]);
  const year = extractBetween(text, "年式", ["車種"]);
  const car = extractBetween(text, "車種", ["グレード"]);
  const grade = extractBetween(text, "グレード", ["グレード付加", "車台番号"]);
  const gradeInfo = extractBetween(text, "グレード付加 情報", ["車台番号"]);
  const chassisNumber = extractBetween(text, "車台番号", ["管理番号"]);
  const cc = extractBetween(text, "排気量", ["修復歴"]);
  const repairHistory = extractBetween(text, "修復歴", ["走行距離"]);
  const mileage = extractBetween(text, "走行距離", ["車検"]);
  const inspection = extractBetween(text, "車検", ["車体色"]);
  const color = extractBetween(text, "車体色", ["ドア"]);
  const door = extractBetween(text, "ドア", ["車体サイズ"]);
  const mission = extractBetween(text, "ミッション", ["リサイクル料"]);
  const price = extractBetween(text, "車両本体価格", ["支払総額"]);
  const totalPrice = extractBetween(text, "支払総額", ["諸費用"]);
  const expenses = extractBetween(text, "諸費用", ["業販価格"]);

  return {
    stockId,
    source,
    status: source === "public" ? "掲載中" : "一時保存",

    maker,
    brand: maker,
    car,
    grade,
    gradeInfo,

    year,
    mileage,
    color,
    bodyColor: color,
    inspection,
    cc,
    repairHistory,
    door,
    mission,

    price,
    totalPrice,
    expenses,

    chassisNumber,
    mainImageUrl: extractMainImageUrl(html, stockId),

    detailTextPreview: text.slice(0, 1500),
  };
}

async function fetchVehicle({ clientId, jar, stockId, source, withDebug }) {
  const detailUrl =
    `https://motorgate.jp/stock/detail?ClientId=${clientId}&StockId=${stockId}`;

  const detail = await fetch(detailUrl, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/top",
    },
  });

  const html = await readText(detail);

  const vehicle = parseDetailPage({
    html,
    stockId,
    source,
  });

  vehicle.detailStatus = detail.status;
  vehicle.detailUrl = detailUrl;
  vehicle.containsLoginForm = html.includes('name="client_pw"');

  if (!withDebug) {
    delete vehicle.detailTextPreview;
  }

  return vehicle;
}

export async function GET(request) {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const url = new URL(request.url);
    const page = Math.max(Number(url.searchParams.get("page") || 1), 1);
    const limit = Math.min(
      Math.max(Number(url.searchParams.get("limit") || 10), 1),
      20
    );

    const debug =
      url.searchParams.get("debug") === "1" ||
      url.searchParams.get("debug") === "true";

    const loginUrl = "https://motorgate.jp/login/index";
    const jar = {};

    const loginPage = await fetch(loginUrl);
    addCookies(jar, loginPage.headers.get("set-cookie") || "");

    const loginHtml = await readText(loginPage);

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

    const publicHtml = await readText(publicRes);
    const publicStockIds = extractStockIdsFromPublic(publicHtml);

    const saveUrl =
      "https://motorgate.jp/stock/savelist/index/1/100";

    const saveRes = await fetch(saveUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: publicUrl,
      },
    });

    const saveHtml = await readText(saveRes);
    const saveStockIds = extractStockIdsFromSave(saveHtml);

    const targets = [
      ...publicStockIds.map((stockId) => ({
        stockId,
        source: "public",
      })),

      ...saveStockIds.map((stockId) => ({
        stockId,
        source: "save",
      })),
    ];

    const start = (page - 1) * limit;
    const pagedTargets = targets.slice(start, start + limit);

    const vehicles = [];

    for (const target of pagedTargets) {
      vehicles.push(
        await fetchVehicle({
          clientId,
          jar,
          ...target,
          withDebug: debug && vehicles.length === 0,
        })
      );
    }

    return Response.json({
      success: true,

      page,
      limit,
      debug,

      counts: {
        public: publicStockIds.length,
        save: saveStockIds.length,
        total: targets.length,
        returned: vehicles.length,
        totalPages: Math.ceil(targets.length / limit),
      },

      note:
        "Vehicle API using Motorgate stock detail page instead of edit page.",

      vehicles,
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
