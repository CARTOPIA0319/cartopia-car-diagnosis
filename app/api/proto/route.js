export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function percentDecodeUtf8(value) {
  const text = String(value || "").replace(/\+/g, "%20");
  const bytes = [];

  for (let i = 0; i < text.length; i++) {
    if (
      text[i] === "%" &&
      i + 2 < text.length &&
      /^[0-9a-fA-F]{2}$/.test(text.slice(i + 1, i + 3))
    ) {
      bytes.push(parseInt(text.slice(i + 1, i + 3), 16));
      i += 2;
    } else {
      const code = text.charCodeAt(i);
      if (code <= 0x7f) {
        bytes.push(code);
      } else {
        const encoded = new TextEncoder().encode(text[i]);
        bytes.push(...encoded);
      }
    }
  }

  let result = "";
  let i = 0;

  while (i < bytes.length) {
    const b1 = bytes[i];

    if (b1 < 0x80) {
      result += String.fromCodePoint(b1);
      i += 1;
    } else if ((b1 & 0xe0) === 0xc0) {
      const b2 = bytes[i + 1];
      result += String.fromCodePoint(((b1 & 0x1f) << 6) | (b2 & 0x3f));
      i += 2;
    } else if ((b1 & 0xf0) === 0xe0) {
      const b2 = bytes[i + 1];
      const b3 = bytes[i + 2];
      result += String.fromCodePoint(
        ((b1 & 0x0f) << 12) | ((b2 & 0x3f) << 6) | (b3 & 0x3f)
      );
      i += 3;
    } else if ((b1 & 0xf8) === 0xf0) {
      const b2 = bytes[i + 1];
      const b3 = bytes[i + 2];
      const b4 = bytes[i + 3];
      result += String.fromCodePoint(
        ((b1 & 0x07) << 18) |
          ((b2 & 0x3f) << 12) |
          ((b3 & 0x3f) << 6) |
          (b4 & 0x3f)
      );
      i += 4;
    } else {
      result += "�";
      i += 1;
    }
  }

  return result;
}

function getQueryParamRaw(urlText, name) {
  const text = decodeHtmlEntities(String(urlText || ""));
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`[?&]${escapedName}=([^&#"']*)`, "i");
  const match = text.match(regex);

  return match ? match[1] : "";
}

function getQueryParamDecoded(urlText, name) {
  return fixBasicMojibake(percentDecodeUtf8(getQueryParamRaw(urlText, name)));
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

function absoluteUrl(src, baseUrl) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return new URL(src, baseUrl).toString();
  return new URL(src, baseUrl).toString();
}

function extractRawHrefValues(html) {
  return Array.from(
    String(html || "").matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)
  )
    .map((m) => decodeHtmlEntities(m[1]))
    .filter(Boolean);
}

function extractHrefValues(html, baseUrl) {
  return extractRawHrefValues(html)
    .map((href) => absoluteUrl(href, baseUrl))
    .filter(Boolean);
}

function extractImageValues(html, baseUrl) {
  return Array.from(
    String(html || "").matchAll(/<img\b[^>]*src=["']([^"']+)["'][^>]*>/gi)
  )
    .map((m) => decodeHtmlEntities(m[1]))
    .map((src) => absoluteUrl(src, baseUrl))
    .filter(Boolean);
}

function findFirstUrl(urls, includesText) {
  return urls.find((url) => url.includes(includesText)) || "";
}

function extractTdByClass(rowHtml, className) {
  const regex = new RegExp(
    `<td\\b[^>]*class=["'][^"']*${className}[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
    "i"
  );

  return rowHtml.match(regex)?.[1] || "";
}

function extractNameAnchorHtml(nameCellHtml) {
  const carModelDiv =
    nameCellHtml.match(
      /<div\b[^>]*class=["'][^"']*car-model[^"']*["'][^>]*>([\s\S]*?)<\/div>/i
    )?.[1] || nameCellHtml;

  return carModelDiv.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1] || "";
}

function extractLiTexts(html) {
  return Array.from(String(html || "").matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi))
    .map((m) => cleanHtmlToText(m[1]))
    .map((text) => compactText(text))
    .filter(Boolean);
}

function extractSpanById(html, idPart) {
  const regex = new RegExp(
    `<span\\b[^>]*id=["'][^"']*${idPart}[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`,
    "i"
  );

  return compactText(cleanHtmlToText(html.match(regex)?.[1] || ""));
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
    .replace(/繝上せ繝ｩ繝ｼ/g, "ハスラー")
    .replace(/繝上う繝悶Μ繝�ラ�ｸ/g, "ハイブリッドＸ")
    .replace(/繝上う繝悶Μ繝�ラ/g, "ハイブリッド")
    .replace(/繝舌�繝溘Μ繧ｪ繝ｳ繧ｪ繝ｬ繝ｳ繧ｸ�ｩ�ｩ/g, "バーミリオンオレンジＩＩ")
    .replace(/繝悶Ν繝ｼ繧､繝�す繝･繝悶Λ繝�け繝代�繝ｫ�難ｼｩ�ｩ/g, "ブルーイッシュブラックパール３ＩＩ")
    .trim();
}

function extractVehicleRows(html) {
  const rows = [];

  const regex =
    /<tr\b[^>]*id=["']tr_([A-Za-z0-9]+)["'][^>]*>([\s\S]*?)(?=<tr\b[^>]*id=["']tr_[A-Za-z0-9]+["']|<\/tbody>|<\/table>)/gi;

  let match;

  while ((match = regex.exec(html)) !== null) {
    rows.push({
      stockId: match[1],
      rowHtml: match[0],
    });
  }

  return rows;
}

function parseVehicleRow(row, baseUrl) {
  const { stockId, rowHtml } = row;

  const rawHrefs = extractRawHrefValues(rowHtml);
  const urls = extractHrefValues(rowHtml, baseUrl);
  const images = extractImageValues(rowHtml, baseUrl);

  const rawTireHref =
    rawHrefs.find((href) => href.includes("get_tire_from_car_model")) || "";

  const tireUrl = findFirstUrl(urls, "get_tire_from_car_model");
  const detailUrl = findFirstUrl(urls, "/stock/detail");
  const editUrl = findFirstUrl(urls, "/car/edit/new");
  const gooUrl = findFirstUrl(urls, "goo-net.com");

  const rawCarName = getQueryParamRaw(rawTireHref, "car_name");
  const rawGradeName = getQueryParamRaw(rawTireHref, "grade_name");
  const rawClassificationName = getQueryParamRaw(
    rawTireHref,
    "classification_name"
  );

  const carName = getQueryParamDecoded(rawTireHref, "car_name");
  const gradeName = getQueryParamDecoded(rawTireHref, "grade_name");
  const classificationName = getQueryParamDecoded(
    rawTireHref,
    "classification_name"
  );

  const nameCellHtml = extractTdByClass(rowHtml, "item__name");
  const visibleTitleRaw = compactText(
    cleanHtmlToText(extractNameAnchorHtml(nameCellHtml))
  );
  const visibleTitleFixed = fixBasicMojibake(visibleTitleRaw);

  const infoCellHtml = extractTdByClass(rowHtml, "item__info");
  const infoItemsRaw = extractLiTexts(infoCellHtml);
  const infoItemsFixed = infoItemsRaw.map(fixBasicMojibake);

  const costCellHtml = extractTdByClass(rowHtml, "item__cost");

  const bodyPriceNumber = extractSpanById(
    costCellHtml,
    `kakaku_display_${stockId}`
  );
  const totalPriceNumber = extractSpanById(
    costCellHtml,
    `total_display_${stockId}`
  );
  const btobPriceNumber = extractSpanById(
    costCellHtml,
    `btob_kakaku_display_${stockId}`
  );

  const year = infoItemsFixed[0] || "";
  const mileage = infoItemsFixed[1] || "";
  const color = infoItemsFixed[2] || "";
  const inspection = infoItemsFixed[3] || "";
  const displacement = infoItemsFixed[4] || "";

  const bodyPrice = bodyPriceNumber
    ? `${fixBasicMojibake(bodyPriceNumber)}万円`
    : "";

  const totalPrice = totalPriceNumber
    ? `${fixBasicMojibake(totalPriceNumber)}万円`
    : "";

  const btobPrice =
    btobPriceNumber && btobPriceNumber !== "-"
      ? `${fixBasicMojibake(btobPriceNumber)}万円`
      : "";

  const realImages = images.filter(
    (imageUrl) =>
      !imageUrl.includes("car_nophoto") &&
      !imageUrl.includes("total_price_unset") &&
      !imageUrl.includes("/common/")
  );

  const titleFromParams = [carName, gradeName].filter(Boolean).join(" ").trim();
  const title = titleFromParams || visibleTitleFixed || stockId;

  const description =
    visibleTitleFixed && !visibleTitleFixed.includes("�")
      ? visibleTitleFixed
      : title;

  return {
    stockId,

    lineCard: {
      title,
      description,
      footer: [
        year,
        mileage,
        color,
        totalPrice ? `総額 ${totalPrice}` : "",
      ]
        .filter(Boolean)
        .join(" / "),
      imageUrl: realImages[0] || images[0] || "",
    },

    extracted: {
      carName,
      gradeName,
      classificationName,
      year,
      mileage,
      color,
      inspection,
      displacement,
      bodyPrice,
      totalPrice,
      btobPrice,
    },

    urls: {
      detailUrl,
      editUrl,
      tireUrl,
      gooUrl,
    },

    images: {
      firstUsableImage: realImages[0] || "",
      allImages: images,
    },

    debug: {
      rawTireHref,
      rawCarName,
      rawGradeName,
      rawClassificationName,
      decodedCarName: carName,
      decodedGradeName: gradeName,
      decodedClassificationName: classificationName,
      visibleTitleRaw,
      visibleTitleFixed,
      infoItemsRaw,
      infoItemsFixed,
    },
  };
}

function vehicleMatches(vehicle, keyword) {
  const key = String(keyword || "").trim();

  if (!key) return true;

  const target = [
    vehicle.stockId,
    vehicle.lineCard.title,
    vehicle.lineCard.description,
    vehicle.extracted.carName,
    vehicle.extracted.gradeName,
    vehicle.extracted.classificationName,
    vehicle.debug.rawCarName,
    vehicle.debug.rawGradeName,
    vehicle.debug.visibleTitleRaw,
    vehicle.debug.visibleTitleFixed,
  ].join(" ");

  return target.includes(key);
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

  return {
    jar,
    loginStatus: login.status,
  };
}

export async function GET(request) {
  try {
    const { jar, loginStatus } = await loginMotorgate();

    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "search";
    const keyword =
      url.searchParams.get("keyword") || "0902332A30260610W001";
    const limit = Number(url.searchParams.get("limit") || "5");

    const publicListUrl =
      "https://motorgate.jp/stock/newsearch/stocklist/index/1/100";

    if (mode !== "search") {
      return json({
        success: true,
        note: "Manual UTF-8 percent decode test.",
        loginStatus,
        usage: {
          targetHustler:
            "/api/proto?mode=search&keyword=0902332A30260610W001&limit=5",
        },
        targetUrl: publicListUrl,
      });
    }

    const res = await fetch(publicListUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    });

    const html = await readUtf8Text(res);

    const vehicleRows = extractVehicleRows(html);
    const allVehicles = vehicleRows.map((row) =>
      parseVehicleRow(row, publicListUrl)
    );

    const matchedVehicles = allVehicles
      .filter((vehicle) => vehicleMatches(vehicle, keyword))
      .slice(0, limit);

    return json({
      success: true,
      mode,
      keyword,
      targetUrl: publicListUrl,
      status: res.status,
      contentType: res.headers.get("content-type"),
      loginStatus,
      containsLoginForm: html.includes('name="client_pw"'),

      checks: {
        rowCountFound: vehicleRows.length,
        allVehicleCount: allVehicles.length,
        matchedVehicleCount: matchedVehicles.length,
        hasCarNameParam: html.includes("car_name="),
        hasGradeNameParam: html.includes("grade_name="),
        manualDecodeTestHustler: percentDecodeUtf8(
          "%E3%83%8F%E3%82%B9%E3%83%A9%E3%83%BC"
        ),
        manualDecodeTestGrade: percentDecodeUtf8(
          "%E3%83%8F%E3%82%A4%E3%83%96%E3%83%AA%E3%83%83%E3%83%89%EF%BC%B8"
        ),
      },

      vehicles: matchedVehicles,

      debug: {
        first10StockIds: vehicleRows.slice(0, 10).map((row) => row.stockId),
        first10DecodedTitles: allVehicles.slice(0, 10).map((vehicle) => ({
          stockId: vehicle.stockId,
          title: vehicle.lineCard.title,
          carName: vehicle.extracted.carName,
          gradeName: vehicle.extracted.gradeName,
          rawCarName: vehicle.debug.rawCarName,
          rawGradeName: vehicle.debug.rawGradeName,
        })),
      },
    });
  } catch (e) {
    return json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
