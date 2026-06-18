export const runtime = "nodejs";
export const dynamic = "force-dynamic";

let SHIFT_JIS_REVERSE_MAP = null;

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

function safeDecodeURIComponent(value) {
  if (!value) return "";

  try {
    return decodeURIComponent(String(value).replace(/\+/g, " "));
  } catch {
    return String(value);
  }
}

function getRawQueryParam(urlString, name) {
  const decodedUrl = decodeHtmlEntities(urlString || "");
  const query = decodedUrl.split("?")[1] || "";

  for (const part of query.split("&")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;

    const key = part.slice(0, eq);
    const value = part.slice(eq + 1);

    if (key === name) {
      return safeDecodeURIComponent(value);
    }
  }

  return "";
}

function scoreText(text) {
  const goodWords = [
    "ハスラー",
    "ルークス",
    "インプレッサ",
    "Ｎ－ＯＮＥ",
    "ＬＳ",
    "ハイブリッド",
    "４ＷＤ",
    "ナビ",
    "カメラ",
    "価格",
    "総額",
    "万円",
    "年",
    "車検",
  ];

  const badWords = [
    "繝",
    "繧",
    "郢",
    "陜",
    "髴",
    "邵",
    "驍",
    "隰",
    "鬮",
    "蟷",
    "荳",
    "譁",
    "萓",
    "邱",
    "霆",
    "縺",
    "�",
  ];

  let score = 0;

  for (const word of goodWords) {
    if (text.includes(word)) score += 200;
  }

  for (const word of badWords) {
    const count = (text.match(new RegExp(word, "g")) || []).length;
    score -= count * 30;
  }

  const japaneseCount =
    (text.match(/[ぁ-んァ-ヶ一-龠々ーＡ-Ｚａ-ｚ０-９]/g) || []).length;

  score += Math.min(japaneseCount, 1000);

  return score;
}

function buildShiftJisReverseMap() {
  if (SHIFT_JIS_REVERSE_MAP) return SHIFT_JIS_REVERSE_MAP;

  const decoder = new TextDecoder("shift_jis", { fatal: false });
  const map = new Map();

  for (let b = 0x00; b <= 0xff; b++) {
    const char = decoder.decode(Uint8Array.from([b]));
    if (char && char !== "�" && !map.has(char)) {
      map.set(char, [b]);
    }
  }

  const leadRanges = [
    [0x81, 0x9f],
    [0xe0, 0xfc],
  ];

  const trailRanges = [
    [0x40, 0x7e],
    [0x80, 0xfc],
  ];

  for (const [leadStart, leadEnd] of leadRanges) {
    for (let lead = leadStart; lead <= leadEnd; lead++) {
      for (const [trailStart, trailEnd] of trailRanges) {
        for (let trail = trailStart; trail <= trailEnd; trail++) {
          const char = decoder.decode(Uint8Array.from([lead, trail]));
          if (char && char !== "�" && !map.has(char)) {
            map.set(char, [lead, trail]);
          }
        }
      }
    }
  }

  SHIFT_JIS_REVERSE_MAP = map;
  return map;
}

function reverseMojibake(text) {
  if (!text) return "";

  const map = buildShiftJisReverseMap();
  const bytes = [];

  for (const char of Array.from(text)) {
    const sjisBytes = map.get(char);

    if (sjisBytes) {
      bytes.push(...sjisBytes);
    } else {
      bytes.push(...new TextEncoder().encode(char));
    }
  }

  const repaired = new TextDecoder("utf-8", { fatal: false }).decode(
    Uint8Array.from(bytes)
  );

  return scoreText(repaired) > scoreText(text) ? repaired : text;
}

function replaceKnownMojibake(text) {
  return String(text || "")
    .replace(/蟷ｴ/g, "年")
    .replace(/譛�/g, "月")
    .replace(/荳⑫/g, "万K")
    .replace(/荳��/g, "万円")
    .replace(/讀�/g, "検")
    .replace(/霆頑､懈紛蛯吩ｻ�/g, "車検整備付")
    .replace(/萓｡譬ｼ/g, "価格")
    .replace(/邱城｡�/g, "総額")
    .replace(/謗ｲ霈我ｸｭ/g, "掲載中")
    .replace(/霆贋ｸ｡諠��ｱ繧堤ｷｨ髮�/g, "車両情報を編集")
    .replace(/繧ｿ繧､繝､繧呈爾縺�/g, "タイヤを探す")

    .replace(/繝上せ繝ｩ繝ｼ/g, "ハスラー")
    .replace(/繝ｫ繝ｼ繧ｯ繧ｹ/g, "ルークス")
    .replace(/繧､繝ｳ繝励Ξ繝�し繧ｹ繝昴�繝�/g, "インプレッサスポーツ")
    .replace(/繝上う繝悶Μ繝�ラ/g, "ハイブリッド")

    .replace(/�費ｼｷ�､/g, "４ＷＤ")
    .replace(/�ｼ撰ｼ撰ｽ/g, "６００ｈ")
    .replace(/繧ｪ繝励す繝ｧ繝ｳ/g, "オプション")
    .replace(/繝��繝医Φ繧ｫ繝ｩ繝ｼ/g, "ツートンカラー")
    .replace(/邏疲ｭ｣/g, "純正")
    .replace(/繝翫ン/g, "ナビ")
    .replace(/繧ｫ繝｡繝ｩ/g, "カメラ")
    .replace(/蜈ｨ譁ｹ菴阪Δ繝九ち繝ｼ/g, "全方位モニター")
    .replace(/蜈ｨ譁ｹ菴�/g, "全方位")
    .replace(/蜑榊ｸｭ/g, "前席")
    .replace(/繧ｷ繝ｼ繝医ヲ繝ｼ繧ｿ繝ｼ/g, "シートヒーター")
    .replace(/繝ｫ繝ｼ繝輔Ξ繝ｼ繝ｫ/g, "ルーフレール")
    .replace(/繧ｹ繝弱�繝｢繝ｼ繝峨/g, "スノーモード")
    .replace(/繝代�繧ｭ繝ｳ繧ｰ繧ｽ繝翫�/g, "パーキングソナー")
    .replace(/繧ｷ繝ｼ繝医ヰ繝�け繝��繝悶Ν/g, "シートバックテーブル")
    .replace(/繝輔か繧ｰ/g, "フォグ")
    .replace(/繝悶Ν繝ｼ/g, "ブルー")
    .replace(/繧ｽ繝九ャ繧ｯ繧ｯ繧ｩ繝ｼ繝�/g, "ソニッククォーツ");
}

function fixText(text) {
  if (!text) return "";

  const reversed = reverseMojibake(text);
  const knownFixed = replaceKnownMojibake(reversed);

  return knownFixed
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
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

function extractHrefValues(html, baseUrl) {
  return Array.from(
    String(html || "").matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)
  )
    .map((m) => decodeHtmlEntities(m[1]))
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

  const urls = extractHrefValues(rowHtml, baseUrl);
  const images = extractImageValues(rowHtml, baseUrl);

  const detailUrl = findFirstUrl(urls, "/stock/detail");
  const editUrl = findFirstUrl(urls, "/car/edit/new");
  const tireUrl = findFirstUrl(urls, "get_tire_from_car_model");
  const gooUrl = findFirstUrl(urls, "goo-net.com");

  const carNameFromUrl = getRawQueryParam(tireUrl, "car_name");
  const gradeNameFromUrl = getRawQueryParam(tireUrl, "grade_name");
  const classificationNameFromUrl = getRawQueryParam(
    tireUrl,
    "classification_name"
  );

  const nameCellHtml = extractTdByClass(rowHtml, "item__name");
  const visibleTitleRaw = compactText(
    cleanHtmlToText(extractNameAnchorHtml(nameCellHtml))
  );
  const visibleTitleFixed = fixText(visibleTitleRaw);

  const infoCellHtml = extractTdByClass(rowHtml, "item__info");
  const infoItemsRaw = extractLiTexts(infoCellHtml);
  const infoItemsFixed = infoItemsRaw.map(fixText);

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

  const bodyPrice = bodyPriceNumber ? `${bodyPriceNumber}万円` : "";
  const totalPrice = totalPriceNumber ? `${totalPriceNumber}万円` : "";
  const btobPrice =
    btobPriceNumber && btobPriceNumber !== "-"
      ? `${btobPriceNumber}万円`
      : "";

  const realImages = images.filter(
    (imageUrl) =>
      !imageUrl.includes("car_nophoto") &&
      !imageUrl.includes("total_price_unset") &&
      !imageUrl.includes("/common/")
  );

  const titleFromUrl = [carNameFromUrl, gradeNameFromUrl]
    .filter(Boolean)
    .join(" ")
    .trim();

  const title =
    titleFromUrl ||
    visibleTitleFixed ||
    visibleTitleRaw ||
    stockId;

  const description =
    visibleTitleFixed && visibleTitleFixed.length > title.length
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
      carName: carNameFromUrl,
      gradeName: gradeNameFromUrl,
      classificationName: classificationNameFromUrl,
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
      visibleTitleRaw,
      visibleTitleFixed,
      infoItemsRaw,
      infoItemsFixed,
      rowTextFixedPreview: fixText(compactText(cleanHtmlToText(rowHtml))).substring(
        0,
        1200
      ),
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
    vehicle.debug.visibleTitleRaw,
    vehicle.debug.visibleTitleFixed,
  ].join(" ");

  return target.includes(key);
}

function pickAround(html, keyword, before = 3000, after = 7000) {
  const index = html.indexOf(keyword);

  if (index < 0) {
    return null;
  }

  return html.substring(
    Math.max(0, index - before),
    Math.min(html.length, index + after)
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

  return {
    clientId,
    jar,
    loginStatus: login.status,
  };
}

export async function GET(request) {
  try {
    const { jar, loginStatus } = await loginMotorgate();

    const url = new URL(request.url);
    const mode = url.searchParams.get("mode") || "search";
    const keyword = url.searchParams.get("keyword") || "ハスラー";
    const limit = Number(url.searchParams.get("limit") || "5");

    const publicListUrl =
      "https://motorgate.jp/stock/newsearch/stocklist/index/1/100";

    if (mode !== "search") {
      return Response.json({
        success: true,
        note: "Motorgate list search extraction.",
        loginStatus,
        usage: {
          searchHustler:
            "/api/proto?mode=search&keyword=ハスラー&limit=5",
          searchByStockId:
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

    return Response.json({
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
        hasTrStockId: /<tr\b[^>]*id=["']tr_[A-Za-z0-9]+["']/i.test(html),
        hasCarNameParam: html.includes("car_name="),
        hasGradeNameParam: html.includes("grade_name="),
        hasVehicleEdit: html.includes("car/edit/new"),
        hasDetailLink: html.includes("/stock/detail"),
      },

      vehicles: matchedVehicles,

      debug: {
        first10StockIds: vehicleRows.slice(0, 10).map((row) => row.stockId),
        first10Titles: allVehicles.slice(0, 10).map((vehicle) => ({
          stockId: vehicle.stockId,
          title: vehicle.lineCard.title,
          carName: vehicle.extracted.carName,
          gradeName: vehicle.extracted.gradeName,
        })),
        aroundKeyword: pickAround(html, keyword),
        aroundHustlerMojibake: pickAround(html, "繝上せ繝ｩ繝ｼ"),
        aroundCarNameParam: pickAround(html, "car_name="),
      },
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
