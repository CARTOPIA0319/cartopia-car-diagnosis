export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BASE_URL = "https://motorgate.jp";
const PUBLIC_LIST_URL =
  "https://motorgate.jp/stock/newsearch/stocklist/index/1/100";

const SAVED_LIST_URLS = [
  "https://motorgate.jp/stock/savelist",
  "https://motorgate.jp/stock/savelist/index/2",
];

function json(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function isTimeoutError(error) {
  const text = `${error?.name || ""} ${error?.message || ""}`.toLowerCase();
  return (
    text.includes("timeout") ||
    text.includes("abort") ||
    text.includes("aborted") ||
    text.includes("the operation was aborted")
  );
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

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

function absoluteUrl(src, baseUrl = BASE_URL) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return new URL(src, baseUrl).toString();
  return new URL(src, baseUrl).toString();
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
      .replace(/Ｓ/g, "S")
      .replace(/Ｕ/g, "U")
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
      !type.includes("…") &&
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

function uniqueByStockId(vehicles) {
  const map = new Map();

  for (const vehicle of vehicles || []) {
    if (vehicle.stockId) map.set(vehicle.stockId, vehicle);
  }

  return Array.from(map.values());
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
    .map((m) => absoluteUrl(decodeHtmlEntities(m[1]), baseUrl))
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

function extractQualityImageMap(html, baseUrl) {
  const map = {};
  const regex = /<input\b[^>]*name=['"]quality_img_url\[\]['"][^>]*>/gi;
  const inputs = String(html || "").match(regex) || [];

  for (const input of inputs) {
    const id =
      input.match(/data-quality-img-url-id=["']([^"']+)["']/i)?.[1] ||
      input.match(/id=["']quality_img_url_([^"']+)["']/i)?.[1] ||
      "";

    const value = input.match(/value=["']([^"']+)["']/i)?.[1] || "";

    if (id && value) {
      map[id] = absoluteUrl(decodeHtmlEntities(value), baseUrl);
    }
  }

  return map;
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
      bytes.push(...new TextEncoder().encode(text[i]));
    }
  }

  return new TextDecoder("utf-8", { fatal: false }).decode(
    Uint8Array.from(bytes)
  );
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

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractAttribute(tagHtml, attributeName) {
  const escaped = escapeRegExp(attributeName);
  const regex = new RegExp(`${escaped}\\s*=\\s*["']([^"']*)["']`, "i");
  return decodeHtmlEntities(String(tagHtml || "").match(regex)?.[1] || "");
}

function normalizeLooseKey(value) {
  return toHalfWidthAscii(String(value || ""))
    .toLowerCase()
    .replace(/[\s_\-:[\]（）()]/g, "");
}

function extractSelectedOptionText(selectHtml) {
  const selectedOption =
    String(selectHtml || "").match(
      /<option\b[^>]*selected[^>]*>([\s\S]*?)<\/option>/i
    )?.[1] || "";

  if (selectedOption) {
    return compactText(cleanHtmlToText(selectedOption));
  }

  const firstOption =
    String(selectHtml || "").match(/<option\b[^>]*>([\s\S]*?)<\/option>/i)?.[1] ||
    "";

  return compactText(cleanHtmlToText(firstOption));
}

function extractValueByName(html, name) {
  const escaped = escapeRegExp(name);

  const inputRegex = new RegExp(
    `<input\\b[^>]*name=["']${escaped}["'][^>]*>`,
    "i"
  );

  const textareaRegex = new RegExp(
    `<textarea\\b[^>]*name=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/textarea>`,
    "i"
  );

  const selectRegex = new RegExp(
    `<select\\b[^>]*name=["']${escaped}["'][^>]*>([\\s\\S]*?)<\\/select>`,
    "i"
  );

  const input = String(html || "").match(inputRegex)?.[0] || "";

  if (input) {
    const value = input.match(/value=["']([^"']*)["']/i)?.[1] || "";
    return compactText(cleanHtmlToText(value));
  }

  const textarea = String(html || "").match(textareaRegex)?.[1] || "";

  if (textarea) {
    return compactText(cleanHtmlToText(textarea));
  }

  const selectHtml = String(html || "").match(selectRegex)?.[1] || "";

  if (selectHtml) {
    return extractSelectedOptionText(selectHtml);
  }

  return "";
}

function extractValueByAnyName(html, names) {
  for (const name of names) {
    const value = extractValueByName(html, name);

    if (value) return value;
  }

  return "";
}

function extractValueByLooseName(html, keywords) {
  const htmlText = String(html || "");
  const normalizedKeywords = keywords.map(normalizeLooseKey).filter(Boolean);

  const inputMatches = Array.from(htmlText.matchAll(/<input\b[^>]*>/gi));

  for (const match of inputMatches) {
    const tag = match[0];
    const key = normalizeLooseKey(
      `${extractAttribute(tag, "name")} ${extractAttribute(tag, "id")} ${extractAttribute(tag, "class")}`
    );

    if (normalizedKeywords.some((keyword) => key.includes(keyword))) {
      const value = extractAttribute(tag, "value");
      if (value) return compactText(cleanHtmlToText(value));
    }
  }

  const textareaMatches = Array.from(
    htmlText.matchAll(/<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi)
  );

  for (const match of textareaMatches) {
    const attrs = match[1] || "";
    const body = match[2] || "";
    const key = normalizeLooseKey(
      `${extractAttribute(attrs, "name")} ${extractAttribute(attrs, "id")} ${extractAttribute(attrs, "class")}`
    );

    if (normalizedKeywords.some((keyword) => key.includes(keyword))) {
      const value = compactText(cleanHtmlToText(body));
      if (value) return value;
    }
  }

  const selectMatches = Array.from(
    htmlText.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)
  );

  for (const match of selectMatches) {
    const attrs = match[1] || "";
    const body = match[2] || "";
    const key = normalizeLooseKey(
      `${extractAttribute(attrs, "name")} ${extractAttribute(attrs, "id")} ${extractAttribute(attrs, "class")}`
    );

    if (normalizedKeywords.some((keyword) => key.includes(keyword))) {
      const value = extractSelectedOptionText(body);
      if (value) return value;
    }
  }

  return "";
}

function extractValueNearLabel(html, label) {
  const text = String(html || "");
  const escapedLabel = escapeRegExp(label);

  const patterns = [
    new RegExp(
      `${escapedLabel}[\\s\\S]{0,1000}?<input\\b[^>]*value=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `${escapedLabel}[\\s\\S]{0,1000}?<textarea\\b[^>]*>([\\s\\S]*?)<\\/textarea>`,
      "i"
    ),
    new RegExp(
      `${escapedLabel}[\\s\\S]{0,1000}?<select\\b[^>]*>([\\s\\S]*?)<\\/select>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);

    if (match?.[1]) {
      if (pattern.source.includes("<select")) {
        return extractSelectedOptionText(match[1]);
      }

      return compactText(cleanHtmlToText(decodeHtmlEntities(match[1])));
    }
  }

  return "";
}

function extractValueNearAnyLabel(html, labels) {
  for (const label of labels) {
    const value = extractValueNearLabel(html, label);

    if (value) return value;
  }

  return "";
}

function lineContainsAnyLabel(line, labels) {
  return labels.some((label) => String(line || "").includes(label));
}

function cleanLabeledValue(value, stopLabels = []) {
  let text = compactText(value)
    .replace(/^[：:\s]+/, "")
    .replace(/[｜|]/g, " ")
    .trim();

  for (const stopLabel of stopLabels) {
    const index = text.indexOf(stopLabel);

    if (index > 0) {
      text = text.slice(0, index).trim();
    }
  }

  return compactText(text);
}

function extractLineValueByLabels(text, labels, stopLabels = []) {
  const lines = String(text || "")
    .split(/\n+/)
    .map((line) => compactText(line))
    .filter(Boolean);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const label of labels) {
      const index = line.indexOf(label);

      if (index >= 0) {
        const afterLabel = cleanLabeledValue(
          line.slice(index + label.length),
          stopLabels
        );

        if (
          afterLabel &&
          !lineContainsAnyLabel(afterLabel, labels) &&
          !lineContainsAnyLabel(afterLabel, stopLabels)
        ) {
          return afterLabel;
        }

        for (let j = i + 1; j <= i + 4 && j < lines.length; j++) {
          const nextLine = cleanLabeledValue(lines[j], stopLabels);

          if (!nextLine) continue;
          if (lineContainsAnyLabel(nextLine, labels)) continue;
          if (lineContainsAnyLabel(nextLine, stopLabels)) break;

          return nextLine;
        }
      }
    }
  }

  return "";
}

function extractGradeExtraInfo(html) {
  return (
    extractValueNearLabel(html, "グレード付加情報") ||
    extractValueByName(html, "grade_additional_info") ||
    extractValueByName(html, "grade_info") ||
    extractValueByName(html, "GradeAddition") ||
    ""
  );
}

function extractFirstMatch(text, regex) {
  const match = String(text || "").match(regex);
  return match ? match[1] || match[0] : "";
}

function normalizePrice(value) {
  const text = compactText(value);

  if (!text) return "";
  if (text.includes("万円")) return text;

  const numeric = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";

  return numeric ? `${numeric}万円` : text;
}

function normalizeMileage(value) {
  const text = compactText(value);

  if (!text) return "";
  if (text.includes("万K")) return text;
  if (text.includes("万k")) return text.replace("万k", "万K");
  if (text.includes("走不明")) return "走不明";

  const numeric = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";

  return numeric ? `${numeric}万K` : text;
}

function normalizeYear(value) {
  const text = compactText(value);

  if (!text) return "";

  const westernWithMonth = text.match(/((?:19|20)\d{2})\s*年\s*([0-9]{1,2})\s*月/);

  if (westernWithMonth) {
    return `${westernWithMonth[1]}年${westernWithMonth[2]}月`;
  }

  const westernYear = text.match(/((?:19|20)\d{2})\s*年?/);

  if (westernYear) {
    return `${westernYear[1]}年`;
  }

  const warekiWithMonth = text.match(/((?:令和|平成|昭和)\s*[0-9元]+\s*年\s*[0-9]{1,2}\s*月)/);

  if (warekiWithMonth) {
    return compactText(warekiWithMonth[1]).replace(/\s+/g, "");
  }

  const warekiYear = text.match(/((?:令和|平成|昭和)\s*[0-9元]+\s*年)/);

  if (warekiYear) {
    return compactText(warekiYear[1]).replace(/\s+/g, "");
  }

  if (text.includes("年")) return text.slice(0, 30);

  return text;
}

function normalizeColor(value) {
  let text = compactText(fixBasicMojibake(value))
    .replace(/^(車体色|ボディカラー|外装色|カラー|色)\s*[：:]\s*/g, "")
    .replace(/^(車体色|ボディカラー|外装色|カラー|色)\s+/g, "")
    .replace(/カラーコード[\s\S]*$/g, "")
    .replace(/色コード[\s\S]*$/g, "")
    .trim();

  const stopLabels = [
    "初度登録",
    "初年度登録",
    "年式",
    "走行距離",
    "走行",
    "車検",
    "排気量",
    "価格",
    "支払総額",
    "型式",
    "グレード",
    "修復歴",
  ];

  for (const label of stopLabels) {
    const index = text.indexOf(label);

    if (index > 0) {
      text = text.slice(0, index).trim();
    }
  }

  return compactText(text).slice(0, 80);
}

function extractImageCandidates(html) {
  const raw = String(html || "");
  const urls = [];

  for (const match of raw.matchAll(
    /https?:\/\/[^"'\\\s>]+?\.(?:jpg|jpeg|png|webp)/gi
  )) {
    urls.push(decodeHtmlEntities(match[0]));
  }

  for (const match of raw.matchAll(
    /value=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi
  )) {
    urls.push(decodeHtmlEntities(match[1]));
  }

  return Array.from(new Set(urls))
    .filter((url) => !url.includes("/common/"))
    .filter((url) => !url.includes("logo"))
    .filter((url) => !url.includes("noimage"))
    .filter((url) => !url.includes("nophoto"));
}

function extractFirstImageUrl(html) {
  const candidates = extractImageCandidates(html);

  return (
    candidates.find((url) => url.includes("picture") && url.includes("goo-net")) ||
    candidates.find((url) => url.includes("goo-net")) ||
    candidates[0] ||
    ""
  );
}

function extractSavedVehicleDetails(html) {
  const text = cleanHtmlToText(html);

  const year = normalizeYear(
    extractValueNearAnyLabel(html, [
      "初度登録",
      "初年度登録",
      "初度登録年月",
      "初年度登録年月",
      "年式",
      "モデル年式",
    ]) ||
      extractValueByAnyName(html, [
        "Nenshiki",
        "nenshiki",
        "Year",
        "year",
        "ModelYear",
        "model_year",
        "FirstRegistration",
        "first_registration",
        "FirstRegist",
        "first_regist",
        "FirstRegistYear",
        "first_regist_year",
        "FirstRegistrationYear",
        "first_registration_year",
        "RegistYear",
        "regist_year",
        "RegistrationYear",
        "registration_year",
      ]) ||
      extractValueByLooseName(html, [
        "初度登録",
        "初年度登録",
        "nenshiki",
        "modelyear",
        "model_year",
        "firstregistration",
        "first_registration",
        "firstregist",
        "first_regist",
        "registrationyear",
        "registration_year",
        "registyear",
        "regist_year",
      ]) ||
      extractLineValueByLabels(
        text,
        ["初度登録", "初年度登録", "初度登録年月", "初年度登録年月", "年式"],
        ["走行距離", "走行", "車体色", "ボディカラー", "外装色", "カラー", "車検", "排気量"]
      ) ||
      extractFirstMatch(text, /((?:19|20)\d{2}\s*年\s*[0-9]{1,2}\s*月)/) ||
      extractFirstMatch(text, /((?:19|20)\d{2}\s*年)/) ||
      extractFirstMatch(text, /((?:令和|平成|昭和)\s*[0-9元]+\s*年\s*[0-9]{1,2}\s*月)/) ||
      extractFirstMatch(text, /((?:令和|平成|昭和)\s*[0-9元]+\s*年)/)
  );

  const mileage = normalizeMileage(
    extractValueNearAnyLabel(html, ["走行距離", "走行"]) ||
      extractValueByAnyName(html, [
        "Soukou",
        "soukou",
        "SoukouKyori",
        "soukou_kyori",
        "Mileage",
        "mileage",
        "MileageDistance",
        "mileage_distance",
      ]) ||
      extractValueByLooseName(html, [
        "走行距離",
        "soukou",
        "soukoukyori",
        "soukou_kyori",
        "mileage",
        "mileagedistance",
      ]) ||
      extractLineValueByLabels(
        text,
        ["走行距離", "走行"],
        ["初度登録", "初年度登録", "車体色", "ボディカラー", "外装色", "カラー", "車検", "排気量"]
      ) ||
      extractFirstMatch(text, /(\d+(?:\.\d+)?万[ＫKk])/) ||
      (text.includes("走不明") ? "走不明" : "")
  );

  const color = normalizeColor(
    extractValueNearAnyLabel(html, [
      "車体色",
      "ボディカラー",
      "外装色",
      "カラー",
    ]) ||
      extractValueByAnyName(html, [
        "BodyColor",
        "body_color",
        "BodyColorName",
        "body_color_name",
        "Color",
        "color",
        "CarColor",
        "car_color",
        "CarColorName",
        "car_color_name",
        "ExteriorColor",
        "exterior_color",
        "ExteriorColorName",
        "exterior_color_name",
      ]) ||
      extractValueByLooseName(html, [
        "車体色",
        "ボディカラー",
        "外装色",
        "bodycolor",
        "body_color",
        "bodycolorname",
        "body_color_name",
        "carcolor",
        "car_color",
        "exteriorcolor",
        "exterior_color",
        "colorname",
        "color_name",
      ]) ||
      extractLineValueByLabels(
        text,
        ["車体色", "ボディカラー", "外装色", "カラー"],
        ["初度登録", "初年度登録", "年式", "走行距離", "走行", "車検", "排気量", "価格", "支払総額"]
      )
  );

  const bodyPrice = normalizePrice(
    extractValueNearAnyLabel(html, ["車両本体価格", "本体価格", "価格"]) ||
      extractValueByAnyName(html, [
        "Kakaku",
        "kakaku",
        "Price",
        "price",
        "BodyPrice",
        "body_price",
      ]) ||
      extractValueByLooseName(html, [
        "kakaku",
        "bodyprice",
        "body_price",
        "vehicleprice",
        "vehicle_price",
      ]) ||
      extractFirstMatch(text, /価格\s*([0-9]+(?:\.[0-9]+)?万円)/)
  );

  const totalPrice = normalizePrice(
    extractValueNearAnyLabel(html, ["支払総額", "総額"]) ||
      extractValueByAnyName(html, [
        "TotalPrice",
        "total_price",
        "Total",
        "total",
        "SiharaiTotal",
        "siharai_total",
        "ShiharaiTotal",
        "shiharai_total",
      ]) ||
      extractValueByLooseName(html, [
        "totalprice",
        "total_price",
        "siharaitotal",
        "siharai_total",
        "shiharaitotal",
        "shiharai_total",
      ]) ||
      extractFirstMatch(text, /総額\s*([0-9]+(?:\.[0-9]+)?万円)/)
  );

  const gradeExtraInfo = extractGradeExtraInfo(html);
  const imageUrl = extractFirstImageUrl(html);

  return {
    year,
    mileage,
    color,
    bodyPrice,
    totalPrice,
    gradeExtraInfo,
    imageUrl,
  };
}

function parsePublicVehicleRow(row, baseUrl, qualityImageMap) {
  const { stockId, rowHtml } = row;

  const rawHrefs = extractRawHrefValues(rowHtml);
  const urls = extractHrefValues(rowHtml, baseUrl);
  const rowImages = extractImageValues(rowHtml, baseUrl);

  const rawTireHref =
    rawHrefs.find((href) => href.includes("get_tire_from_car_model")) || "";

  const detailUrl = findFirstUrl(urls, "/stock/detail");
  const editUrl = findFirstUrl(urls, "/car/edit/new");
  const gooUrl = findFirstUrl(urls, "goo-net.com");

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
  const infoItemsFixed = extractLiTexts(infoCellHtml).map(fixBasicMojibake);

  const costCellHtml = extractTdByClass(rowHtml, "item__cost");

  const bodyPriceNumber = extractSpanById(
    costCellHtml,
    `kakaku_display_${stockId}`
  );
  const totalPriceNumber = extractSpanById(
    costCellHtml,
    `total_display_${stockId}`
  );

  const realRowImages = rowImages.filter(
    (imageUrl) =>
      !imageUrl.includes("car_nophoto") &&
      !imageUrl.includes("total_price_unset") &&
      !imageUrl.includes("/common/")
  );

  const imageUrl = qualityImageMap[stockId] || realRowImages[0] || "";

  const title = [carName, gradeName].filter(Boolean).join(" ").trim();

  return {
    stockId,
    title,
    description:
      visibleTitleFixed && !visibleTitleFixed.includes("�")
        ? visibleTitleFixed
        : title,
    carName,
    gradeName,
    gradeExtraInfo: "",
    classificationName,
    year: infoItemsFixed[0] || "",
    mileage: infoItemsFixed[1] || "",
    color: infoItemsFixed[2] || "",
    inspection: infoItemsFixed[3] || "",
    displacement: infoItemsFixed[4] || "",
    bodyPrice: bodyPriceNumber ? `${fixBasicMojibake(bodyPriceNumber)}万円` : "",
    totalPrice: totalPriceNumber ? `${fixBasicMojibake(totalPriceNumber)}万円` : "",
    imageUrl,
    detailUrl,
    editUrl,
    gooUrl,
    sourceStatus: "掲載在庫",
    types: [],
    typeKeys: [],
  };
}

function extractSavedVehicles(html, pageUrl) {
  const stockIds = Array.from(
    new Set(
      [...String(html || "").matchAll(/StockId=([A-Za-z0-9]+)/g)].map(
        (m) => m[1]
      )
    )
  );

  const titles = [
    ...String(html || "").matchAll(/stock\/detail[\s\S]*?>(.*?)<\/a>/gi),
  ]
    .map((m) => compactText(cleanHtmlToText(m[1])))
    .filter(Boolean);

  return stockIds.map((stockId, index) => ({
    stockId,
    title: titles[index] || "",
    description: titles[index] || "",
    carName: titles[index] || "",
    gradeName: "",
    gradeExtraInfo: "",
    classificationName: "",
    year: "",
    mileage: "",
    color: "",
    inspection: "",
    displacement: "",
    bodyPrice: "",
    totalPrice: "",
    imageUrl: "",
    gooUrl: "",
    sourceStatus: "一時保存",
    sourcePageUrl: pageUrl,
    editUrl: `https://motorgate.jp/car/newregist/register?kbn=1&client_id=0902332&StockStatus=00180002&StockId=${stockId}&ScreenId=SIH_001`,
    detailUrl: `https://motorgate.jp/stock/detail?ClientId=0902332&StockId=${stockId}`,
    types: [],
    typeKeys: [],
    updatedAt: new Date().toISOString(),
  }));
}

async function loginMotorgate() {
  const clientId = process.env.MOTORGATE_CLIENT_ID;
  const password = process.env.MOTORGATE_PASSWORD;

  const loginUrl = "https://motorgate.jp/login/index";
  const jar = {};

  const loginPage = await fetchWithTimeout(
    loginUrl,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    },
    30000
  );

  addCookies(jar, loginPage.headers.get("set-cookie") || "");

  const loginHtml = await readUtf8Text(loginPage);

  const csrf = loginHtml.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];
  const sessionId = loginHtml.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

  const login = await fetchWithTimeout(
    loginUrl,
    {
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
    },
    30000
  );

  addCookies(jar, login.headers.get("set-cookie") || "");

  return { jar, loginStatus: login.status };
}

async function fetchVehicleDetailFromEditPage(jar, vehicle) {
  if (!vehicle.editUrl) {
    return {
      ...vehicle,
      typeResult: {
        status: null,
        success: false,
        reason: "editUrl not found",
        timeout: false,
        error: "",
      },
    };
  }

  try {
    const res = await fetchWithTimeout(
      vehicle.editUrl,
      {
        headers: {
          Cookie: jarToCookie(jar),
          Referer:
            vehicle.sourceStatus === "一時保存"
              ? "https://motorgate.jp/stock/savelist"
              : "https://motorgate.jp/top",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
          "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
        },
      },
      25000
    );

    const html = await readUtf8Text(res);
    const text = cleanHtmlToText(html);

    const types = Array.from(
      new Set([...extractTypesFromText(html), ...extractTypesFromText(text)])
    );
    const typeKeys = buildTypeKeys(types);

    const savedDetails =
      vehicle.sourceStatus === "一時保存" ? extractSavedVehicleDetails(html) : {};

    const gradeExtraInfo = extractGradeExtraInfo(html);

    return {
      ...vehicle,
      ...savedDetails,
      gradeExtraInfo: gradeExtraInfo || savedDetails.gradeExtraInfo || "",
      types,
      typeKeys,
      typeResult: {
        status: res.status,
        success: typeKeys.length > 0,
        containsFatalError: html.includes("FatalError"),
        timeout: false,
        error: "",
      },
    };
  } catch (error) {
    return {
      ...vehicle,
      typeResult: {
        status: null,
        success: false,
        containsFatalError: false,
        timeout: isTimeoutError(error),
        error: error.message || String(error),
      },
    };
  }
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const currentIndex = index;
      index += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );

  return results;
}

async function attachVehicleDetails(jar, vehicles) {
  return await mapWithConcurrency(vehicles, 12, async (vehicle) => {
    return await fetchVehicleDetailFromEditPage(jar, vehicle);
  });
}

function toInventoryVehicle(vehicle) {
  return {
    stockId: vehicle.stockId,
    title: vehicle.title,
    description: vehicle.description,
    carName: vehicle.carName,
    gradeName: vehicle.gradeName,
    gradeExtraInfo: vehicle.gradeExtraInfo || "",
    classificationName: vehicle.classificationName,
    year: vehicle.year,
    mileage: vehicle.mileage,
    color: vehicle.color,
    inspection: vehicle.inspection,
    displacement: vehicle.displacement,
    bodyPrice: vehicle.bodyPrice,
    totalPrice: vehicle.totalPrice,
    imageUrl: vehicle.imageUrl,
    detailUrl: vehicle.detailUrl,
    gooUrl: vehicle.gooUrl,
    sourceStatus: vehicle.sourceStatus,
    sourcePageUrl: vehicle.sourcePageUrl || "",
    editUrl: vehicle.editUrl || "",
    types: vehicle.types || [],
    typeKeys: vehicle.typeKeys || [],
    updatedAt: new Date().toISOString(),
    typeResult: vehicle.typeResult || null,
  };
}

async function fetchPublicVehicles(jar) {
  const res = await fetchWithTimeout(
    PUBLIC_LIST_URL,
    {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    },
    30000
  );

  const html = await readUtf8Text(res);
  const qualityImageMap = extractQualityImageMap(html, PUBLIC_LIST_URL);
  const rows = extractVehicleRows(html);

  const vehicles = rows.map((row) =>
    parsePublicVehicleRow(row, PUBLIC_LIST_URL, qualityImageMap)
  );

  const vehiclesWithDetails = await attachVehicleDetails(jar, vehicles);

  return {
    status: res.status,
    containsLoginForm: html.includes('name="client_pw"'),
    foundRows: rows.length,
    imageMapCount: Object.keys(qualityImageMap).length,
    vehicles: vehiclesWithDetails.map(toInventoryVehicle),
  };
}

async function fetchSavedPage(jar, pageUrl) {
  const res = await fetchWithTimeout(
    pageUrl,
    {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    },
    30000
  );

  const html = await readUtf8Text(res);
  const vehicles = extractSavedVehicles(html, pageUrl);

  return {
    pageUrl,
    status: res.status,
    count: vehicles.length,
    vehicles,
  };
}

async function fetchSavedVehicles(jar) {
  const pages = [];

  for (const pageUrl of SAVED_LIST_URLS) {
    const page = await fetchSavedPage(jar, pageUrl);
    pages.push(page);

    if (page.count === 0) break;
  }

  const vehicles = uniqueByStockId(pages.flatMap((page) => page.vehicles));
  const vehiclesWithDetails = await attachVehicleDetails(jar, vehicles);

  return {
    pages: pages.map((page) => ({
      pageUrl: page.pageUrl,
      status: page.status,
      count: page.count,
    })),
    vehicles: vehiclesWithDetails.map(toInventoryVehicle),
  };
}

async function fetchCurrentInventoryFromGitHub() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "CARTOPIA0319";
  const repo = process.env.GITHUB_REPO || "cartopia-car-diagnosis";
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = "data/inventory.json";

  if (!token) {
    return { sha: null, inventory: { vehicles: [] } };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const current = await fetchWithTimeout(
    `${apiUrl}?ref=${branch}&t=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "cartopia-inventory-updater",
        "Cache-Control": "no-store",
      },
    },
    30000
  );

  if (!current.ok) {
    return { sha: null, inventory: { vehicles: [] } };
  }

  const currentJson = await current.json();
  const text = Buffer.from(currentJson.content || "", "base64").toString("utf8");

  return {
    sha: currentJson.sha || null,
    inventory: JSON.parse(text),
  };
}

async function commitInventoryToGitHub(
  inventoryData,
  existingSha,
  message = "refresh public and saved inventory data"
) {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "CARTOPIA0319";
  const repo = process.env.GITHUB_REPO || "cartopia-car-diagnosis";
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = "data/inventory.json";

  if (!token) {
    return {
      saved: false,
      reason: "GITHUB_TOKEN is not set",
    };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const content = Buffer.from(
    JSON.stringify(inventoryData, null, 2),
    "utf8"
  ).toString("base64");

  const save = await fetchWithTimeout(
    apiUrl,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "cartopia-inventory-updater",
      },
      body: JSON.stringify({
        message,
        content,
        branch,
        ...(existingSha ? { sha: existingSha } : {}),
      }),
    },
    30000
  );

  const saveJson = await save.json();

  return {
    saved: save.ok,
    status: save.status,
    path,
    branch,
    commit: saveJson.commit?.html_url || "",
    commitSha: saveJson.commit?.sha || "",
    error: save.ok ? "" : saveJson,
  };
}

function mergeVehicles(publicVehicles, savedVehicles) {
  return uniqueByStockId([...(publicVehicles || []), ...(savedVehicles || [])]);
}

function summarizeTypeResults(vehicles) {
  return {
    success: vehicles.filter((v) => v.typeResult?.success).length,
    failed: vehicles.filter((v) => !v.typeResult?.success).length,
    timeout: vehicles.filter((v) => v.typeResult?.timeout).length,
  };
}

function summarizeGradeExtraInfo(vehicles) {
  return {
    found: vehicles.filter((v) => v.gradeExtraInfo).length,
    missing: vehicles.filter((v) => !v.gradeExtraInfo).length,
  };
}

function getTriggerLabel(request, save) {
  const cronHeader = request.headers.get("x-vercel-cron");
  const userAgent = request.headers.get("user-agent") || "";

  if (cronHeader || userAgent.toLowerCase().includes("vercel")) {
    return "自動更新";
  }

  return save ? "URL保存更新" : "URLプレビュー";
}

function buildFailureInventoryData(currentInventory, status) {
  return {
    ...(currentInventory || {}),
    lastFailedAt: status.finishedAt,
    lastUpdateStatus: status,
  };
}

export async function GET(request) {
  const startedAt = new Date();
  const url = new URL(request.url);
  const save = url.searchParams.get("save") === "1";
  const trigger = getTriggerLabel(request, save);

  let current = {
    sha: null,
    inventory: { vehicles: [] },
  };

  try {
    current = await fetchCurrentInventoryFromGitHub();

    const { jar, loginStatus } = await loginMotorgate();

    const publicResult = await fetchPublicVehicles(jar);
    const savedResult = await fetchSavedVehicles(jar);

    const vehicles = mergeVehicles(publicResult.vehicles, savedResult.vehicles);
    const finishedAt = new Date();
    const durationSeconds = Math.round(
      (finishedAt.getTime() - startedAt.getTime()) / 1000
    );

    const typeResults = summarizeTypeResults(vehicles);
    const success =
      loginStatus === 302 &&
      publicResult.status === 200 &&
      !publicResult.containsLoginForm &&
      vehicles.length > 0;

    const errorText = success
      ? ""
      : [
          loginStatus !== 302 ? `ログイン異常: ${loginStatus}` : "",
          publicResult.status !== 200 ? `掲載在庫取得異常: ${publicResult.status}` : "",
          publicResult.containsLoginForm ? "ログインフォームが表示されています" : "",
          vehicles.length === 0 ? "在庫取得件数が0件です" : "",
        ]
          .filter(Boolean)
          .join(" / ");

    const lastUpdateStatus = {
      success,
      statusText: success ? "正常更新" : "更新確認が必要",
      trigger,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationSeconds,
      error: errorText,
      timeout: false,
      typeFailed: typeResults.failed,
      typeTimeout: typeResults.timeout,
    };

    const inventoryData = {
      updatedAt: finishedAt.toISOString(),
      source: "motorgate",
      updateMode: save
        ? "full-public-and-saved-refresh"
        : "preview-full-public-and-saved-refresh",
      lastUpdateStatus,
      counts: {
        publicVehicles: publicResult.vehicles.length,
        savedVehicles: savedResult.vehicles.length,
        vehicles: vehicles.length,
        publicFoundRows: publicResult.foundRows,
        publicImageMapCount: publicResult.imageMapCount,
      },
      checks: {
        loginStatus,
        publicListStatus: publicResult.status,
        publicContainsLoginForm: publicResult.containsLoginForm,
        savedPages: savedResult.pages,
        typeResults,
        gradeExtraInfo: summarizeGradeExtraInfo(vehicles),
      },
      vehicles,
    };

    const github = save
      ? await commitInventoryToGitHub(
          inventoryData,
          current.sha,
          "refresh public and saved inventory data"
        )
      : {
          saved: false,
          reason: "preview only. add ?save=1 to save data/inventory.json",
        };

    return json({
      success,
      mode: inventoryData.updateMode,
      github,
      counts: inventoryData.counts,
      checks: inventoryData.checks,
      lastUpdateStatus: inventoryData.lastUpdateStatus,
      inventory: inventoryData,
    });
  } catch (error) {
    const finishedAt = new Date();
    const durationSeconds = Math.round(
      (finishedAt.getTime() - startedAt.getTime()) / 1000
    );

    const failureStatus = {
      success: false,
      statusText: "更新失敗",
      trigger,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationSeconds,
      error: error.message || String(error),
      timeout: isTimeoutError(error),
      typeFailed: null,
      typeTimeout: null,
    };

    let github = {
      saved: false,
      reason: "failure status was not saved",
    };

    if (save) {
      try {
        const failedInventoryData = buildFailureInventoryData(
          current.inventory,
          failureStatus
        );

        github = await commitInventoryToGitHub(
          failedInventoryData,
          current.sha,
          "record failed inventory update status"
        );
      } catch (commitError) {
        github = {
          saved: false,
          reason: "failed to save failure status",
          error: commitError.message || String(commitError),
        };
      }
    }

    return json({
      success: false,
      mode: save ? "full-public-and-saved-refresh" : "preview-full-public-and-saved-refresh",
      github,
      lastUpdateStatus: failureStatus,
      error: error.message || String(error),
      stack: error.stack || "",
    });
  }
}
