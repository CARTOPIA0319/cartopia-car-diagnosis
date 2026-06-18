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
  return await response.text();
}

function unique(array) {
  return Array.from(new Set(array));
}

function repairMojibake(text) {
  if (!text) return text;

  const map = {
    "謗ｲ霈我ｸｭ": "掲載中",
    "蝨ｨ蠎ｫ": "在庫",
    "繝ｬ繧ｯ繧ｵ繧ｹ": "レクサス",
    "繝医Κ繧ｿ": "トヨタ",
    "譌･逕｣": "日産",
    "繝帙Φ繝": "ホンダ",
    "繝槭ヤ繝": "マツダ",
    "荳芽廠": "三菱",
    "繧ｹ繝舌Ν": "スバル",
    "繝繧､繝上ヤ": "ダイハツ",
    "繧ｹ繧ｺ繧ｭ": "スズキ",
    "繝｡繝ｼ繧ｫ繝ｼ": "メーカー",
    "霆顔ｨｮ": "車種",
    "繧ｰ繝ｬ繝ｼ繝�": "グレード",
    "蟷ｴ蠑�": "年式",
    "走行距離": "走行距離",
    "霆頑､�": "車検",
    "霆贋ｸ｡譛ｬ菴謎ｾ｡譬ｼ": "車両本体価格",
    "謾ｯ謇慕ｷ城｡�": "支払総額",
    "繝舌�繧ｸ繝ｧ繝ｳ": "バージョン",
    "繝代ャ繧ｱ繝ｼ繧ｸ": "パッケージ",
    "繝代�繝ｫ繝帙Ρ繧､繝�": "パールホワイト",
    "繧ｽ繝九ャ繧ｯ繧ｯ繧ｩ繝ｼ繝�": "ソニッククォーツ",
    "繝上う繝悶Μ繝�ラ": "ハイブリッド",
    "繝上せ繝ｩ繝ｼ": "ハスラー",
    "繝弱�繝�": "ノート"
  };

  let result = text;

  for (const [bad, good] of Object.entries(map)) {
    result = result.split(bad).join(good);
  }

  return result;
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
  return repairMojibake(
    decodeHtmlEntities(html)
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<\/(td|th|tr|div|p|li|span)>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function cleanValue(value) {
  if (!value) return null;

  const cleaned = repairMojibake(value)
    .replace(/\s+/g, " ")
    .trim();

  return cleaned || null;
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
  const mileage = extractBetween(text, "走行距離", ["車検"]);
  const color = extractBetween(text, "車体色", ["ドア"]);
  const price = extractBetween(text, "車両本体価格", ["支払総額"]);
  const totalPrice = extractBetween(text, "支払総額", ["諸費用"]);

  return {
    stockId,
    source,
    status: source === "public" ? "掲載中" : "一時保存",

    maker,
    car,
    grade,
    gradeInfo,

    year,
    mileage,
    color,

    price,
    totalPrice,

    imageUrl: extractMainImageUrl(html, stockId),

    lineCard: {
      title: car,
      subtitle: grade,
      description: [year, mileage, color].filter(Boolean).join(" / "),
      price,
      totalPrice,
      imageUrl: extractMainImageUrl(html, stockId),
    },
  };
}

async function fetchVehicle({ clientId, jar, stockId, source }) {
  const detailUrl =
    source === "save"
      ? `https://motorgate.jp/stock/detail?ClientId=${clientId}&StockId=${stockId}&ScreenId=SIH_001`
      : `https://motorgate.jp/stock/detail?ClientId=${clientId}&StockId=${stockId}`;

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
  vehicle.containsLoginForm = html.includes('name="client_pw"');

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

    const loginUrl = "https://motorgate.jp/login/index";
    const jar = {};

    const loginPage = await fetch(loginUrl);

    addCookies(
      jar,
      loginPage.headers.get("set-cookie") || ""
    );

    const loginHtml = await readText(loginPage);

    const csrf =
      loginHtml.match(
        /name="fuel_csrf_token"\s+value="([^"]+)"/
      )?.[1];

    const sessionId =
      loginHtml.match(
        /name="session_id"\s+value="([^"]+)"/
      )?.[1];

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

    addCookies(
      jar,
      login.headers.get("set-cookie") || ""
    );

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
        })
      );
    }

    return Response.json({
      success: true,

      page,
      limit,

      counts: {
        public: publicStockIds.length,
        save: saveStockIds.length,
        total: targets.length,
        returned: vehicles.length,
        totalPages: Math.ceil(targets.length / limit),
      },

      note:
        "Vehicle API for LINE cards. StockId is internal and should not be shown to customers.",

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
