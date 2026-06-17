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

function extractSelectValue(html, key) {
  const regex = new RegExp(
    `<select[^>]*(?:id|name)=["']${key}["'][\\s\\S]*?<\\/select>`,
    "i"
  );

  const match = html.match(regex);
  if (!match) return null;

  const selected = match[0].match(
    /<option[^>]*value=["']([^"']*)["'][^>]*selected[^>]*>/i
  );

  return selected?.[1] || null;
}

function extractSelectText(html, key) {
  const regex = new RegExp(
    `<select[^>]*(?:id|name)=["']${key}["'][\\s\\S]*?<\\/select>`,
    "i"
  );

  const match = html.match(regex);
  if (!match) return null;

  const selected = match[0].match(
    /<option[^>]*selected[^>]*>(.*?)<\/option>/i
  );

  return selected?.[1]
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

function mapVehicle(values) {
  return {
    brand: values.brandText,
    car: values.modelText,
    grade: cleanGradeName(values.gradeName || values.gradeText),
    kata: values.kataText || values.kataName,

    year: values.year,
    month: values.month,

    mileage: values.mileage,
    price: values.price,
    totalPrice: values.totalPrice,

    colorCode: values.colorCode,
    color: values.advertisedColor || values.catalogColor,
    bodyColor: values.bodyColorText,

    chassisNumber: values.chassisNumber,
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

  const editHtml = await readText(edit);

  const values = {
    brandCode: extractSelectValue(editHtml, "BrandName"),
    brandText: extractSelectText(editHtml, "BrandName"),

    modelCode: extractSelectValue(editHtml, "ModelName"),
    modelText: extractSelectText(editHtml, "ModelName"),

    gradeCode: extractSelectValue(editHtml, "Grade"),
    gradeText: extractSelectText(editHtml, "Grade"),
    gradeName: extractInput(editHtml, "GradeName"),

    kataCode: extractSelectValue(editHtml, "Kata"),
    kataText: extractSelectText(editHtml, "Kata"),
    kataName: extractInput(editHtml, "KataName"),

    colorCode: extractInput(editHtml, "ColorCodeSerch"),
    catalogColor: extractInput(editHtml, "CatColor"),
    advertisedColor: extractInput(editHtml, "AdColorName"),

    bodyColorCode: extractSelectValue(editHtml, "ColorBody"),
    bodyColorText: extractSelectText(editHtml, "ColorBody"),

    year: extractSelectValue(editHtml, "AdY"),
    month: extractSelectValue(editHtml, "AdM"),

    mileage: extractInput(editHtml, "Soukou"),
    price: extractInput(editHtml, "Kakaku"),
    totalPrice: extractInput(editHtml, "TotalPrice"),

    chassisNumber:
      extractInput(editHtml, "SyadaiNum") ||
      extractInput(editHtml, "temp_syadai_num"),
  };

  const vehicle = mapVehicle(values);

  return {
    stockId,
    stockStatus,
    source,
    editStatus: edit.status,
    containsLoginForm: editHtml.includes('name="client_pw"'),

    ...vehicle,

    codes: {
      brandCode: values.brandCode,
      modelCode: values.modelCode,
      gradeCode: values.gradeCode,
      kataCode: values.kataCode,
      bodyColorCode: values.bodyColorCode,
    },
  };
}

export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";
    const jar = {};

    const page = await fetch(loginUrl);
    addCookies(jar, page.headers.get("set-cookie") || "");

    const html = await readText(page);

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

    const vehicles = [];

    for (const target of targets) {
      const vehicle = await fetchVehicle({
        clientId,
        jar,
        ...target,
      });

      vehicles.push(vehicle);
    }

    const codeSummary = {
      brandCodes: unique(
        vehicles.map((v) => v.codes.brandCode).filter(Boolean)
      ),

      modelCodes: unique(
        vehicles.map((v) => v.codes.modelCode).filter(Boolean)
      ),

      gradeCodes: unique(
        vehicles.map((v) => v.codes.gradeCode).filter(Boolean)
      ),

      kataCodes: unique(
        vehicles.map((v) => v.codes.kataCode).filter(Boolean)
      ),

      colorCodes: unique(
        vehicles.map((v) => v.colorCode).filter(Boolean)
      ),

      bodyColorCodes: unique(
        vehicles.map((v) => v.codes.bodyColorCode).filter(Boolean)
      ),
    };

    return Response.json({
      success: true,

      counts: {
        public: publicStockIds.length,
        save: saveStockIds.length,
        total: targets.length,
        crawled: vehicles.length,
      },

      note:
        "All vehicles crawled. Japanese text may still be mojibake, but codes are usable.",

      codeSummary,
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
