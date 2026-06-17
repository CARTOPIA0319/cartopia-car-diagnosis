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

function extractSelectHtml(html, key) {
  const regex = new RegExp(
    `<select[^>]*(?:id|name)=["']${key}["'][\\s\\S]*?<\\/select>`,
    "i"
  );

  return html.match(regex)?.[0] || null;
}

function extractSelectValue(html, key) {
  const selectHtml = extractSelectHtml(html, key);
  if (!selectHtml) return null;

  return selectHtml.match(
    /<option[^>]*value=["']([^"']*)["'][^>]*selected[^>]*>/i
  )?.[1] || null;
}

function extractSelectText(html, key) {
  const selectHtml = extractSelectHtml(html, key);
  if (!selectHtml) return null;

  return selectHtml.match(
    /<option[^>]*selected[^>]*>(.*?)<\/option>/i
  )?.[1]
    ?.replace(/<[^>]+>/g, "")
    ?.replace(/\s+/g, " ")
    ?.trim() || null;
}

function extractInput(html, key) {
  const regex = new RegExp(
    `(?:id|name)=["']${key}["'][^>]*value=["']([^"']*)["']`,
    "i"
  );

  return html.match(regex)?.[1] || null;
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

  return text
    .replace(/\(5名\)/g, "")
    .replace(/\(4名\)/g, "")
    .replace(/\(5蜷�\)/g, "")
    .replace(/\(4蜷�\)/g, "")
    .trim();
}

function buildEditUrl({ clientId, stockId, stockStatus, source }) {
  if (source === "save") {
    return `https://motorgate.jp/car/newregist/register?kbn=1&client_id=${clientId}&StockStatus=${stockStatus}&StockId=${stockId}&ScreenId=SIH_001`;
  }

  return `https://motorgate.jp/car/newregist/register?kbn=1&ClientId=${clientId}&StockId=${stockId}&StockStatus=${stockStatus}&ScreenId=CB101GR`;
}

function makeDebugSelects(html) {
  const keys = [
    "BrandName",
    "ModelName",
    "CarName",
    "Grade",
    "Kata",
    "ColorBody",
  ];

  const result = {};

  for (const key of keys) {
    const selectHtml = extractSelectHtml(html, key);

    result[key] = {
      exists: Boolean(selectHtml),
      selectedValue: extractSelectValue(html, key),
      selectedText: extractSelectText(html, key),
      htmlPreview: selectHtml
        ? selectHtml.replace(/\s+/g, " ").substring(0, 2500)
        : null,
    };
  }

  result.contains = {
    subaru: html.includes("スバル"),
    impreza: html.includes("インプレッサ"),
    lexus: html.includes("レクサス"),
    toyota: html.includes("トヨタ"),
    honda: html.includes("ホンダ"),
    gt7: html.includes("GT7"),
    mojibakeSubaru: html.includes("繧ｹ繝舌Ν"),
    mojibakeLexus: html.includes("繝ｬ繧ｯ繧ｵ繧ｹ"),
  };

  return result;
}

function findKeywordSnippets(html) {
  const keywords = [
    "BrandNamechange",
    "ModelNamechange",
    "brand",
    "maker",
    "model",
    "car_name",
    "maker_name",
    "brand_name"
  ];

  const result = {};

  for (const keyword of keywords) {
    const index = html.indexOf(keyword);

    result[keyword] =
      index >= 0
        ? html.substring(
            Math.max(0, index - 1000),
            Math.min(html.length, index + 1000)
          )
        : null;
  }

  return result;
}

async function fetchVehicle({ clientId, jar, stockId, stockStatus, source, withDebug }) {
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

  const vehicle = {
    stockId,
    source,
    status: source === "public" ? "掲載中" : "一時保存",
    editStatus: edit.status,
    containsLoginForm: html.includes('name="client_pw"'),

    brand: extractSelectText(html, "BrandName"),
    car: extractSelectText(html, "ModelName"),
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

    codes: {
      brandCode: extractSelectValue(html, "BrandName"),
      modelCode: extractSelectValue(html, "ModelName"),
      gradeCode: extractSelectValue(html, "Grade"),
      kataCode: extractSelectValue(html, "Kata"),
      bodyColorCode: extractSelectValue(html, "ColorBody"),
    },
  };

  if (withDebug) {
    vehicle.debugSelects = makeDebugSelects(html);
    vehicle.keywordSnippets = findKeywordSnippets(html);
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
        "Production vehicle API with optional debug select HTML and keyword snippets. Use debug=1 to inspect the first vehicle only.",

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
