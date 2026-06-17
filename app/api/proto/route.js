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
  return new TextDecoder("utf-8").decode(buffer);
}

function unique(array) {
  return Array.from(new Set(array));
}

function repairKnownMojibake(text) {
  if (!text) return text;

  const map = {
    "繝ｬ繧ｯ繧ｵ繧ｹ": "レクサス",
    "繝医Κ繧ｿ": "トヨタ",
    "譌･逕｣": "日産",
    "繝帙Φ繝": "ホンダ",
    "繝槭ヤ繝": "マツダ",
    "荳芽廠": "三菱",
    "繧ｹ繝舌Ν": "スバル",
    "繝繧､繝上ヤ": "ダイハツ",
    "繧ｹ繧ｺ繧ｭ": "スズキ",

    "繧､繝ｳ繝励Ξ繝�し繧ｹ繝昴�繝�": "インプレッサスポーツ",
    "繧｢繝ｫ繝輔ぃ繝ｼ繝峨ワ繧､繝悶Μ繝�ラ": "アルファードハイブリッド",
    "繝ｯ繧ｴ繝ｳ�ｲ": "ワゴンR",
    "繝輔Μ繝ｼ繝�": "フリード",
    "繝弱�繝�": "ノート",

    "繝代�繝ｫ繝帙Ρ繧､繝茨ｽ懃悄迴�逋ｽ": "パールホワイト",
    "繝悶Λ繝�け�憺ｻ�": "ブラック",
    "繝悶Λ繝�け": "ブラック",
    "繧ｯ繝ｪ繧ｹ繧ｿ繝ｫ繝帙Ρ繧､繝医ヱ繝ｼ繝ｫ": "クリスタルホワイトパール",
  };

  let result = text;

  for (const [bad, good] of Object.entries(map)) {
    result = result.split(bad).join(good);
  }

  return result;
}

function normalizeText(text) {
  if (!text) return null;

  return repairKnownMojibake(
    text
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim()
  );
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

function extractSelectValue(html, key) {
  const regex = new RegExp(
    `<select[^>]*(?:id|name)=["']${key}["'][\\s\\S]*?<\\/select>`,
    "i"
  );

  const match = html.match(regex);
  if (!match) return null;

  return match[0].match(
    /<option[^>]*value=["']([^"']*)["'][^>]*selected[^>]*>/i
  )?.[1] || null;
}

function extractSelectText(html, key) {
  const regex = new RegExp(
    `<select[^>]*(?:id|name)=["']${key}["'][\\s\\S]*?<\\/select>`,
    "i"
  );

  const match = html.match(regex);
  if (!match) return null;

  const text =
    match[0].match(
      /<option[^>]*selected[^>]*>(.*?)<\/option>/i
    )?.[1] || null;

  return normalizeText(text);
}

function extractInput(html, key) {
  const regex = new RegExp(
    `(?:id|name)=["']${key}["'][^>]*value=["']([^"']*)["']`,
    "i"
  );

  return normalizeText(html.match(regex)?.[1] || null);
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

function cleanGradeName(text) {
  if (!text) return null;

  return normalizeText(text)
    ?.replace(/\(5名\)/g, "")
    ?.replace(/\(4名\)/g, "")
    ?.replace(/\(5蜷�\)/g, "")
    ?.replace(/\(4蜷�\)/g, "")
    ?.trim() || null;
}

function buildEditUrl({ clientId, stockId, stockStatus, source }) {
  if (source === "save") {
    return `https://motorgate.jp/car/newregist/register?kbn=1&client_id=${clientId}&StockStatus=${stockStatus}&StockId=${stockId}&ScreenId=SIH_001`;
  }

  return `https://motorgate.jp/car/newregist/register?kbn=1&ClientId=${clientId}&StockId=${stockId}&StockStatus=${stockStatus}&ScreenId=CB101GR`;
}

function fallbackByCode(codes, current) {
  const brandMap = {
    "1005": "レクサス",
    "1010": "トヨタ",
    "1015": "日産",
    "1020": "ホンダ",
    "1025": "マツダ",
    "1040": "三菱",
    "1045": "スバル",
    "1050": "ダイハツ",
    "1055": "スズキ",
  };

  const modelMap = {
    "10451015": "インプレッサスポーツ",
    "10102056": "アルファードハイブリッド",
    "10051004": "LS",
    "10552003": "ワゴンR",
    "10202030": "フリード",
    "10151042": "ノート",
  };

  return {
    brand:
      brandMap[codes.brandCode] ||
      current.brand,

    car:
      modelMap[codes.modelCode] ||
      current.car,
  };
}

async function fetchVehicle({ clientId, jar, stockId, stockStatus, source }) {
  const editUrl = buildEditUrl({
    clientId,
    stockId,
    stockStatus,
    source,
  });

  const edit = await fetch(editUrl, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/top",
    },
  });

  const html = await readText(edit);

  const codes = {
    brandCode: extractSelectValue(html, "BrandName"),
    modelCode: extractSelectValue(html, "ModelName"),
    gradeCode: extractSelectValue(html, "Grade"),
    kataCode: extractSelectValue(html, "Kata"),
    bodyColorCode: extractSelectValue(html, "ColorBody"),
  };

  const rawVehicle = {
    brand: extractSelectText(html, "BrandName"),
    car: extractSelectText(html, "ModelName"),
  };

  const fallback = fallbackByCode(codes, rawVehicle);

  return {
    stockId,
    source,
    status: source === "public" ? "掲載中" : "一時保存",
    editStatus: edit.status,
    containsLoginForm: html.includes('name="client_pw"'),

    brand: fallback.brand,
    car: fallback.car,
    grade: cleanGradeName(
      extractInput(html, "GradeName") ||
      extractSelectText(html, "Grade")
    ),
    kata:
      extractSelectText(html, "Kata") ||
      extractInput(html, "KataName"),

    year: extractSelectValue(html, "AdY"),
    month: extractSelectValue(html, "AdM"),
    mileage: extractInput(html, "Soukou"),
    price: extractInput(html, "Kakaku"),
    totalPrice: extractInput(html, "TotalPrice"),

    colorCode: extractInput(html, "ColorCodeSerch"),
    color:
      extractInput(html, "AdColorName") ||
      extractInput(html, "CatColor"),
    bodyColor: extractSelectText(html, "ColorBody"),

    chassisNumber:
      extractInput(html, "SyadaiNum") ||
      extractInput(html, "temp_syadai_num"),

    mainImageUrl: extractMainImageUrl(html, stockId),

    codes,
  };
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
        stockStatus: "00180002",
        source: "public",
      })),

      ...saveStockIds.map((stockId) => ({
        stockId,
        stockStatus: "00180002",
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
        "Production vehicle API with temporary mojibake repair and code fallback.",

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
