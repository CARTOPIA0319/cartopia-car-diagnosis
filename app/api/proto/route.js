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

async function readByDecoder(response, encoding) {
  const buffer = await response.arrayBuffer();
  return new TextDecoder(encoding).decode(buffer);
}

function extractSelectText(html, key) {
  const regex = new RegExp(
    `<select[^>]*(?:id|name)=["']${key}["'][\\s\\S]*?<\\/select>`,
    "i"
  );

  const match = html.match(regex);
  if (!match) return null;

  return match[0].match(
    /<option[^>]*selected[^>]*>(.*?)<\/option>/i
  )?.[1]
    ?.replace(/<[^>]+>/g, "")
    ?.replace(/\s+/g, " ")
    ?.trim() || null;
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

function extractInput(html, key) {
  const regex = new RegExp(
    `(?:id|name)=["']${key}["'][^>]*value=["']([^"']*)["']`,
    "i"
  );

  return html.match(regex)?.[1] || null;
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

function buildEditUrl(clientId, stockId) {
  return `https://motorgate.jp/car/newregist/register?kbn=1&ClientId=${clientId}&StockId=${stockId}&StockStatus=00180002&ScreenId=CB101GR`;
}

function extractVehicle(html, stockId) {
  return {
    brand: extractSelectText(html, "BrandName"),
    car: extractSelectText(html, "ModelName"),
    grade:
      extractInput(html, "GradeName") ||
      extractSelectText(html, "Grade"),
    kata:
      extractSelectText(html, "Kata") ||
      extractInput(html, "KataName"),
    year: extractSelectValue(html, "AdY"),
    month: extractSelectValue(html, "AdM"),
    mileage: extractInput(html, "Soukou"),
    price: extractInput(html, "Kakaku"),
    totalPrice: extractInput(html, "TotalPrice"),
    color:
      extractInput(html, "AdColorName") ||
      extractInput(html, "CatColor"),
    mainImageUrl: extractMainImageUrl(html, stockId),
    codes: {
      brandCode: extractSelectValue(html, "BrandName"),
      modelCode: extractSelectValue(html, "ModelName"),
      gradeCode: extractSelectValue(html, "Grade"),
      kataCode: extractSelectValue(html, "Kata"),
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

    const loginHtml = await readByDecoder(page, "utf-8");

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

    const publicHtml = await readByDecoder(publicRes, "utf-8");
    const stockIds = extractStockIdsFromPublic(publicHtml);

    const targetStockId = stockIds[0];

    const editUrl = buildEditUrl(clientId, targetStockId);

    const editRes = await fetch(editUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: publicUrl,
      },
    });

    const buffer = await editRes.arrayBuffer();

    const utf8Html = new TextDecoder("utf-8").decode(buffer);
    const shiftJisHtml = new TextDecoder("shift_jis").decode(buffer);
    const eucJpHtml = new TextDecoder("euc-jp").decode(buffer);

    return Response.json({
      success: true,

      stockId: targetStockId,

      note:
        "Compare utf8, shift_jis, and euc-jp. Send the result so we can choose the correct decoder.",

      utf8: extractVehicle(utf8Html, targetStockId),
      shift_jis: extractVehicle(shiftJisHtml, targetStockId),
      euc_jp: extractVehicle(eucJpHtml, targetStockId),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
