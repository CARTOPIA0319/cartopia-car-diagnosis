import { after } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

// 既存のGitHub Actionsが確認する互換バージョンは維持する。
const CODE_VERSION = "resumable-batch-v14";
const CODE_REVISION = "batch-v15-compatibility-fix";

const BASE_URL = "https://motorgate.jp";
const PUBLIC_LIST_URL = `${BASE_URL}/stock/newsearch/stocklist/index/1/100`;

const SAVED_LIST_URLS = Array.from({ length: 10 }, (_, index) =>
  index === 0
    ? `${BASE_URL}/stock/savelist`
    : `${BASE_URL}/stock/savelist/index/${index + 1}`,
);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

// 1リクエスト最大10台。2台ごとに車両と進捗を同じJSONへ確定保存する。
const DETAIL_CONCURRENCY = 2;
const BATCH_SIZE = 10;
const VEHICLE_BUDGET_MS = 60000;
const WORK_BUDGET_MS = 170000;
const MAX_DETAIL_ATTEMPTS = 3;
const DETAIL_RETRIES = 0;
const DETAIL_TIMEOUT_MS = 18000;

const LOCK_REF_NAME = "tags/cartopia-inventory-update-lock";
const LOCK_TTL_MS = 12 * 60 * 1000;

function json(data, status = 200) {
  return new Response(
    JSON.stringify({ ...data, revision: CODE_REVISION }, null, 2),
    {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    },
  );
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function createRunId() {
  return [
    new Date().toISOString().replace(/[-:.TZ]/g, ""),
    Math.random().toString(36).slice(2, 10),
  ].join("-");
}

function isTimeoutError(error) {
  const text = `${error?.name || ""} ${error?.message || ""}`.toLowerCase();
  return text.includes("timeout") || text.includes("abort");
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });

    // ヘッダーだけでなく本文の受信まで制限時間に含める。
    const bytes = await response.arrayBuffer();

    return {
      ok: response.ok,
      status: response.status,
      headers: response.headers,
      url: response.url,
      arrayBuffer: async () => bytes,
      text: async () => new TextDecoder().decode(bytes),
    };
  } catch (error) {
    const location = new URL(url);

    throw new Error(
      `${location.hostname}${location.pathname}: ${
        controller.signal.aborted
          ? "timeout"
          : error.message || String(error)
      }${error.cause?.code ? ` (${error.cause.code})` : ""}`,
    );
  } finally {
    clearTimeout(timer);
  }
}

function addCookies(jar, setCookieText) {
  if (!setCookieText) return jar;

  for (const piece of String(setCookieText).split(/,\s*(?=[^;,]+=)/)) {
    const first = piece.split(";")[0].trim();
    const equalIndex = first.indexOf("=");

    if (equalIndex <= 0) continue;

    const name = first.slice(0, equalIndex);
    const value = first.slice(equalIndex + 1);

    if (value === "deleted") {
      delete jar[name];
    } else {
      jar[name] = value;
    }
  }

  return jar;
}

function addResponseCookies(jar, response) {
  const values =
    typeof response?.headers?.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response?.headers?.get("set-cookie") || ""];

  for (const value of values) {
    addCookies(jar, value);
  }

  return jar;
}

function jarToCookie(jar) {
  return Object.entries(jar)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function normalizeCharset(value) {
  const text = String(value || "").toLowerCase();

  if (/shift[_-]?jis|sjis|windows-31j|ms932|cp932/.test(text)) {
    return "shift_jis";
  }

  if (text.includes("euc-jp")) {
    return "euc-jp";
  }

  return "utf-8";
}

async function readResponseText(response) {
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const contentType = response.headers.get("content-type") || "";

  let charset = contentType.match(/charset\s*=\s*([^;\s]+)/i)?.[1] || "";

  if (!charset) {
    const head = Buffer.from(bytes.slice(0, 4096)).toString("latin1");
    charset = head.match(/charset=["']?\s*([^\s"'/>]+)/i)?.[1] || "utf-8";
  }

  try {
    return new TextDecoder(normalizeCharset(charset), {
      fatal: false,
    }).decode(bytes);
  } catch {
    return new TextDecoder("utf-8", {
      fatal: false,
    }).decode(bytes);
  }
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, number) =>
      String.fromCodePoint(parseInt(number, 10)),
    );
}

function cleanHtmlToText(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|td|th|tr|dt|dd)>/gi, "\n")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+|[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function compactText(text) {
  return String(text || "")
    .replace(/\u3000/g, " ")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toHalfWidthAscii(text) {
  return String(text || "").replace(/[！-～]/g, (character) =>
    String.fromCharCode(character.charCodeAt(0) - 0xfee0),
  );
}

function absoluteUrl(source, baseUrl = BASE_URL) {
  const value = decodeHtmlEntities(String(source || "").trim());

  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return "";
  }
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractAttribute(tagHtml, attributeName) {
  const quoted = String(tagHtml || "").match(
    new RegExp(`${escapeRegExp(attributeName)}\\s*=\\s*["']([^"']*)["']`, "i"),
  );

  if (quoted) {
    return decodeHtmlEntities(quoted[1]);
  }

  const unquoted = String(tagHtml || "").match(
    new RegExp(`${escapeRegExp(attributeName)}\\s*=\\s*([^\\s>]+)`, "i"),
  );

  return decodeHtmlEntities(unquoted?.[1] || "");
}

function extractRawHrefValues(html) {
  return Array.from(
    String(html || "").matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi),
  )
    .map((match) => decodeHtmlEntities(match[1]))
    .filter(Boolean);
}

function extractHrefValues(html, baseUrl) {
  return extractRawHrefValues(html)
    .map((href) => absoluteUrl(href, baseUrl))
    .filter(Boolean);
}

function extractCells(rowHtml, tagName = "td") {
  const regex = new RegExp(
    `<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "gi",
  );

  return Array.from(String(rowHtml || "").matchAll(regex)).map((match) => ({
    html: match[1],
    text: compactText(cleanHtmlToText(match[1])),
  }));
}

function extractAllTableRows(html) {
  return Array.from(
    String(html || "").matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi),
  ).map((match) => match[0]);
}

function extractTdByClass(rowHtml, className) {
  const regex = new RegExp(
    `<td\\b[^>]*class=["'][^"']*${escapeRegExp(
      className,
    )}[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
    "i",
  );

  return String(rowHtml || "").match(regex)?.[1] || "";
}

function extractLiTexts(html) {
  return Array.from(
    String(html || "").matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi),
  )
    .map((match) => compactText(cleanHtmlToText(match[1])))
    .filter(Boolean);
}

function extractSpanById(html, idPart) {
  const regex = new RegExp(
    `<span\\b[^>]*id=["'][^"']*${escapeRegExp(
      idPart,
    )}[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`,
    "i",
  );

  return compactText(
    cleanHtmlToText(String(html || "").match(regex)?.[1] || ""),
  );
}

function getQueryParamDecoded(urlText, name) {
  const match = decodeHtmlEntities(String(urlText || "")).match(
    new RegExp(`[?&]${escapeRegExp(name)}=([^&#"']*)`, "i"),
  );

  if (!match) return "";

  try {
    return compactText(decodeURIComponent(match[1].replace(/\+/g, "%20")));
  } catch {
    return compactText(match[1]);
  }
}

function extractStockId(text) {
  const decoded = decodeHtmlEntities(String(text || ""));

  return (
    decoded.match(/[?&]StockId=([A-Za-z0-9]+)/i)?.[1] ||
    decoded.match(/StockId%3D([A-Za-z0-9]+)/i)?.[1] ||
    decoded.match(
      /name=["']StockId["'][^>]*value=["']([A-Za-z0-9]+)["']/i,
    )?.[1] ||
    ""
  );
}

function extractVehicleRows(html) {
  const rows = [];
  const source = String(html || "");

  const idRegex =
    /<tr\b[^>]*id=["']tr_([A-Za-z0-9]+)["'][^>]*>([\s\S]*?)(?=<tr\b[^>]*id=["']tr_[A-Za-z0-9]+["']|<\/tbody>|<\/table>)/gi;

  let match;

  while ((match = idRegex.exec(source)) !== null) {
    rows.push({
      stockId: match[1],
      rowHtml: match[0],
    });
  }

  if (rows.length > 0) {
    return rows;
  }

  for (const rowHtml of extractAllTableRows(source)) {
    const stockId = extractStockId(rowHtml);

    if (stockId) {
      rows.push({
        stockId,
        rowHtml,
      });
    }
  }

  return rows;
}

function extractQualityImageMap(html, baseUrl) {
  const map = {};

  const inputs =
    String(html || "").match(
      /<input\b[^>]*name=["']quality_img_url\[\]["'][^>]*>/gi,
    ) || [];

  for (const input of inputs) {
    const id =
      extractAttribute(input, "data-quality-img-url-id") ||
      extractAttribute(input, "id").replace(/^quality_img_url_/, "");

    const value = extractAttribute(input, "value");

    if (id && value) {
      map[id] = absoluteUrl(value, baseUrl);
    }
  }

  return map;
}

function extractImageCandidates(html, baseUrl = BASE_URL) {
  const urls = [];

  const source = String(html || "")
    .replace(/\\\//g, "/")
    .replace(/\\u002F/gi, "/");

  for (const match of source.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = match[1] || "";

    for (const attribute of [
      "src",
      "data-src",
      "data-original",
      "data-lazy-src",
      "data-image",
    ]) {
      const value = extractAttribute(attributes, attribute);

      if (value) {
        urls.push(absoluteUrl(value, baseUrl));
      }
    }

    const srcset = extractAttribute(attributes, "srcset");

    if (srcset) {
      for (const item of srcset.split(",")) {
        const value = item.trim().split(/\s+/)[0];

        if (value) {
          urls.push(absoluteUrl(value, baseUrl));
        }
      }
    }
  }

  for (const match of source.matchAll(/<input\b([^>]*)>/gi)) {
    const attributes = match[1] || "";
    const name = extractAttribute(attributes, "name");
    const value = extractAttribute(attributes, "value");

    if (/quality_img_url|image|photo|picture/i.test(name) && value) {
      urls.push(absoluteUrl(value, baseUrl));
    }
  }

  for (const match of source.matchAll(
    /https?:\/\/[^"'\\\s>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi,
  )) {
    urls.push(decodeHtmlEntities(match[0]));
  }

  return Array.from(new Set(urls.filter(Boolean)))
    .map(upgradeImageUrl)
    .filter((url) => !/logo|noimage|nophoto|car_nophoto|\/common\//i.test(url));
}

function upgradeImageUrl(url) {
  let value = String(url || "");

  if (!value) return "";

  value = value
    .replace(/\/(?:S|M|L|P|Q|T)\//i, "/H/")
    .replace(/([?&](?:w|width)=)\d+/i, "$11200")
    .replace(/([?&](?:h|height)=)\d+/i, "$1900")
    .replace(/([?&](?:size)=)(?:small|thumb|thumbnail)/i, "$1large");

  if (/secure\.goo-net\.com/i.test(value)) {
    value = value.replace(
      /^https?:\/\/secure\.goo-net\.com/i,
      "https://picture1.goo-net.com",
    );
  }

  return value;
}

function imageScore(url) {
  const value = String(url || "").toLowerCase();

  if (!value) return -10000;

  let score = 0;

  if (value.includes("goo-net.com")) score += 100;
  if (/\/h\//i.test(value)) score += 80;
  if (value.includes("quality")) score += 40;
  if (value.includes("original")) score += 30;
  if (value.includes("large")) score += 20;
  if (/thumb|thumbnail|small|\/s\//i.test(value)) score -= 60;
  if (/logo|noimage|nophoto|common/.test(value)) score -= 1000;

  return score;
}

function chooseBestImage(...groups) {
  const candidates = groups.flat().filter(Boolean).map(upgradeImageUrl);

  return (
    Array.from(new Set(candidates)).sort(
      (first, second) => imageScore(second) - imageScore(first),
    )[0] || ""
  );
}

function normalizePrice(value) {
  const text = compactText(toHalfWidthAscii(value)).replace(/,/g, "").trim();

  if (!text) return "";

  const number = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
  return number ? `${number}万円` : "";
}

function priceToNumber(value) {
  const normalized = normalizePrice(value);

  if (!normalized) return NaN;

  const number = Number(normalized.match(/[0-9]+(?:\.[0-9]+)?/)?.[0]);
  return Number.isFinite(number) ? number : NaN;
}

function formatPriceNumber(value) {
  if (!Number.isFinite(value)) return "";

  const rounded = Math.round(value * 10) / 10;
  return `${rounded.toFixed(1)}万円`;
}

function extractPriceCandidates(text) {
  const normalized = toHalfWidthAscii(decodeHtmlEntities(String(text || "")))
    .replace(/,/g, "")
    .replace(/\s+/g, " ");

  const numbers = Array.from(
    normalized.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*万円/g),
  )
    .map((match) => Number(match[1]))
    .filter((value) => Number.isFinite(value) && value >= 0);

  return Array.from(
    new Set(numbers.map((value) => Math.round(value * 10) / 10)),
  ).sort((first, second) => second - first);
}

function resolveSavedPricePair({
  rowHtml,
  explicitBodyPrice,
  explicitTotalPrice,
}) {
  const candidates = extractPriceCandidates(cleanHtmlToText(rowHtml));

  let bodyNumber = priceToNumber(explicitBodyPrice);
  let totalNumber = priceToNumber(explicitTotalPrice);

  const inferredTotal = candidates[0];

  const inferredBody = candidates.find(
    (value) => !Number.isFinite(inferredTotal) || value < inferredTotal - 0.05,
  );

  const currentPairInvalid =
    !Number.isFinite(bodyNumber) ||
    !Number.isFinite(totalNumber) ||
    totalNumber < bodyNumber - 0.05;

  const samePrice =
    Number.isFinite(bodyNumber) &&
    Number.isFinite(totalNumber) &&
    Math.abs(bodyNumber - totalNumber) < 0.05;

  const bodyLooksLikeExpenses =
    Number.isFinite(bodyNumber) &&
    Number.isFinite(inferredBody) &&
    bodyNumber < inferredBody * 0.5;

  const totalLooksTooSmall =
    Number.isFinite(totalNumber) &&
    Number.isFinite(inferredTotal) &&
    totalNumber < inferredTotal * 0.9;

  if (
    candidates.length >= 2 &&
    (currentPairInvalid ||
      samePrice ||
      bodyLooksLikeExpenses ||
      totalLooksTooSmall)
  ) {
    totalNumber = inferredTotal;
    bodyNumber = inferredBody;
  } else {
    if (!Number.isFinite(totalNumber) && Number.isFinite(inferredTotal)) {
      totalNumber = inferredTotal;
    }

    if (!Number.isFinite(bodyNumber) && Number.isFinite(inferredBody)) {
      bodyNumber = inferredBody;
    }
  }

  if (!Number.isFinite(bodyNumber) && Number.isFinite(totalNumber)) {
    bodyNumber = totalNumber;
  }

  if (!Number.isFinite(totalNumber) && Number.isFinite(bodyNumber)) {
    totalNumber = bodyNumber;
  }

  return {
    bodyPrice: formatPriceNumber(bodyNumber),
    totalPrice: formatPriceNumber(totalNumber),
    candidates: candidates.map(formatPriceNumber),
  };
}

function repairSavedPricePair(
  bodyPrice,
  totalPrice,
  previousBodyPrice,
  previousTotalPrice,
) {
  const bodyNumber = priceToNumber(bodyPrice);
  const totalNumber = priceToNumber(totalPrice);
  const previousBodyNumber = priceToNumber(previousBodyPrice);
  const previousTotalNumber = priceToNumber(previousTotalPrice);

  const currentInvalid =
    !Number.isFinite(bodyNumber) ||
    !Number.isFinite(totalNumber) ||
    totalNumber < bodyNumber - 0.05;

  const currentSame =
    Number.isFinite(bodyNumber) &&
    Number.isFinite(totalNumber) &&
    Math.abs(bodyNumber - totalNumber) < 0.05;

  const previousValid =
    Number.isFinite(previousBodyNumber) &&
    Number.isFinite(previousTotalNumber) &&
    previousTotalNumber >= previousBodyNumber;

  const currentLooksLikeExpense =
    currentSame && previousValid && previousBodyNumber > bodyNumber * 2;

  if (previousValid && (currentInvalid || currentLooksLikeExpense)) {
    return {
      bodyPrice: previousBodyPrice,
      totalPrice: previousTotalPrice,
    };
  }

  return {
    bodyPrice,
    totalPrice,
  };
}

function normalizeMileage(value) {
  const text = compactText(toHalfWidthAscii(value))
    .replace(/,/g, "")
    .replace(/\s+/g, "");

  if (!text) return "";
  if (/走不明|不明/.test(text)) return "走不明";

  const man = text.match(/([0-9]+(?:\.[0-9]+)?)万[ＫKk]?/);

  if (man) {
    return `${Number(man[1])}万K`;
  }

  const kilometers = text.match(/([0-9]+(?:\.[0-9]+)?)(?:km|ＫＭ|ｋｍ)/i);

  if (kilometers) {
    const number = Number(kilometers[1]);

    if (Number.isFinite(number)) {
      return `${(Math.floor(number / 1000) / 10).toFixed(1)}万K`;
    }
  }

  const plainNumber = text.match(/^\d+$/)?.[0];

  if (plainNumber) {
    const number = Number(plainNumber);

    if (Number.isFinite(number) && number >= 1000) {
      return `${(Math.floor(number / 1000) / 10).toFixed(1)}万K`;
    }
  }

  return "";
}

function normalizeYear(value) {
  const text = compactText(toHalfWidthAscii(value));
  const western = text.match(/((?:19|20)\d{2})\s*年?/);

  if (western) return `${western[1]}年`;

  const era = text.match(/(令和|平成|昭和)\s*(元|\d+)\s*年?/);

  if (!era) return "";

  const year = era[2] === "元" ? 1 : Number(era[2]);
  const base = era[1] === "令和" ? 2018 : era[1] === "平成" ? 1988 : 1925;

  return `${base + year}年`;
}

function normalizeDisplacement(value) {
  const text = compactText(toHalfWidthAscii(value));

  if (!text) return "";

  if (/cc|ＣＣ/i.test(text)) {
    const number = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
    return number ? `${number}cc` : "";
  }

  if (/L|Ｌ/i.test(text)) {
    const number = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
    return number ? `${number}L` : "";
  }

  const number = Number(text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || NaN);

  if (!Number.isFinite(number)) return "";

  return number >= 100 ? `${number}cc` : `${number}L`;
}

function cleanVehicleText(value) {
  return compactText(value)
    .replace(/^車両情報を編集\s*/g, "")
    .replace(/\s*車両情報を編集$/g, "")
    .trim();
}

function normalizeHeaderText(value) {
  return compactText(value)
    .replace(/[\s\u3000]+/g, "")
    .replace(/[：:]/g, "")
    .trim();
}

function findSavedHeaderMap(html) {
  for (const rowHtml of extractAllTableRows(html)) {
    let headers = extractCells(rowHtml, "th").map((cell) => cell.text);

    if (!headers.length) {
      headers = extractCells(rowHtml, "td").map((cell) => cell.text);
    }

    if (!headers.length) continue;

    const joined = headers.map(normalizeHeaderText).join("");

    if (
      joined.includes("車種") &&
      joined.includes("年式") &&
      joined.includes("走行")
    ) {
      return headers;
    }
  }

  return [];
}

function headerIndex(headers, aliases) {
  const normalizedAliases = aliases.map(normalizeHeaderText);

  const exactIndex = headers.findIndex((header) =>
    normalizedAliases.includes(normalizeHeaderText(header)),
  );

  if (exactIndex >= 0) return exactIndex;

  return headers.findIndex((header) => {
    const normalizedHeader = normalizeHeaderText(header);
    return normalizedAliases.some((alias) => normalizedHeader.includes(alias));
  });
}

function cellTextByHeader(cells, headers, aliases) {
  const index = headerIndex(headers, aliases);
  return index >= 0 ? cells[index]?.text || "" : "";
}

function cellHtmlByHeader(cells, headers, aliases) {
  const index = headerIndex(headers, aliases);
  return index >= 0 ? cells[index]?.html || "" : "";
}

function parsePublicVehicleRow(row, baseUrl, qualityImageMap) {
  const { stockId, rowHtml } = row;
  const rawHrefs = extractRawHrefValues(rowHtml);
  const urls = extractHrefValues(rowHtml, baseUrl);

  const rawTireHref =
    rawHrefs.find((href) => href.includes("get_tire_from_car_model")) || "";

  const carName = getQueryParamDecoded(rawTireHref, "car_name");
  const gradeName = getQueryParamDecoded(rawTireHref, "grade_name");

  const classificationName = getQueryParamDecoded(
    rawTireHref,
    "classification_name",
  );

  const nameCell = extractTdByClass(rowHtml, "item__name");

  const visibleTitle = compactText(
    cleanHtmlToText(
      nameCell.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1] || nameCell,
    ),
  );

  const infoItems = extractLiTexts(extractTdByClass(rowHtml, "item__info"));
  const costCell = extractTdByClass(rowHtml, "item__cost");
  const bodyPrice = extractSpanById(costCell, `kakaku_display_${stockId}`);
  const totalPrice = extractSpanById(costCell, `total_display_${stockId}`);

  const title =
    [carName, gradeName].filter(Boolean).join(" ").trim() || visibleTitle;

  const imageUrl = chooseBestImage(
    qualityImageMap[stockId],
    extractImageCandidates(rowHtml, baseUrl),
  );

  return {
    stockId,
    title,
    description: visibleTitle || title,
    carName: carName || visibleTitle,
    gradeName,
    gradeExtraInfo: "",
    classificationName,
    makerName: "",
    seatCapacity: null,
    year: normalizeYear(infoItems[0] || "") || infoItems[0] || "",
    mileage: normalizeMileage(infoItems[1] || "") || infoItems[1] || "",
    color: infoItems[2] || "",
    inspection: infoItems[3] || "",
    displacement: infoItems[4] || "",
    bodyPrice: normalizePrice(bodyPrice),
    totalPrice: normalizePrice(totalPrice),
    imageUrl,
    detailUrl: urls.find((url) => url.includes("/stock/detail")) || "",
    editUrl: urls.find((url) => url.includes("/car/edit/new")) || "",
    editUrls: urls.filter((url) => url.includes("/car/edit/new")),
    gooUrl: urls.find((url) => url.includes("goo-net.com")) || "",
    sourceStatus: "掲載在庫",
    sourcePageUrl: "",
    types: [],
    typeKeys: [],
    listResult: null,
  };
}

function parseSavedVehicleRow(rowHtml, headers, pageUrl) {
  const stockId = extractStockId(rowHtml);

  if (!stockId) return null;

  const cells = extractCells(rowHtml, "td");

  if (!cells.length) return null;

  const urls = extractHrefValues(rowHtml, pageUrl);
  const clientId = process.env.MOTORGATE_CLIENT_ID || "0902332";

  const editUrls = Array.from(
    new Set(
      [
        ...urls.filter(
          (url) =>
            url.includes("/car/newregist/register") ||
            url.includes("/car/edit/new"),
        ),
        `${BASE_URL}/car/newregist/register?kbn=1&client_id=${encodeURIComponent(
          clientId,
        )}&StockStatus=00180002&StockId=${stockId}&ScreenId=SIH_001`,
        `${BASE_URL}/car/edit/new?kbn=1&ClientId=${encodeURIComponent(
          clientId,
        )}&StockId=${stockId}&StockStatus=00180002&ScreenId=CB101GR`,
      ].filter(Boolean),
    ),
  );

  let carName = cleanVehicleText(
    cellTextByHeader(cells, headers, ["車種", "車名"]),
  );

  let gradeName =
    normalizeGradeNameCandidate(
      cellTextByHeader(cells, headers, ["グレード", "グレード名"]),
      carName,
    ) || extractGradeName(rowHtml, carName);

  let year = normalizeYear(cellTextByHeader(cells, headers, ["年式"]));

  let displacement = normalizeDisplacement(
    cellTextByHeader(cells, headers, ["排気量"]),
  );

  let color = cleanVehicleText(
    cellTextByHeader(cells, headers, ["車体色", "色"]),
  );

  let mileage = normalizeMileage(
    cellTextByHeader(cells, headers, ["走行距離", "走行"]),
  );

  const explicitBodyPrice = cellTextByHeader(cells, headers, [
    "車両本体価格",
    "本体価格",
  ]);

  const explicitTotalPrice = cellTextByHeader(cells, headers, ["支払総額"]);

  const resolvedPrices = resolveSavedPricePair({
    rowHtml,
    explicitBodyPrice,
    explicitTotalPrice,
  });

  let bodyPrice = resolvedPrices.bodyPrice;
  let totalPrice = resolvedPrices.totalPrice;

  const cellTexts = cells.map((cell) => cleanVehicleText(cell.text));

  const yearIndex = cellTexts.findIndex((value) =>
    Boolean(normalizeYear(value)),
  );

  const mileageIndex = cellTexts.findIndex((value) =>
    Boolean(normalizeMileage(value)),
  );

  if (!year && yearIndex >= 0) {
    year = normalizeYear(cellTexts[yearIndex]);
  }

  if (!mileage && mileageIndex >= 0) {
    mileage = normalizeMileage(cellTexts[mileageIndex]);
  }

  if (!displacement && yearIndex >= 0) {
    displacement = normalizeDisplacement(cellTexts[yearIndex + 1] || "");
  }

  if (!color && yearIndex >= 0 && mileageIndex > yearIndex) {
    const possible = cellTexts
      .slice(yearIndex + 1, mileageIndex)
      .filter(Boolean);

    color =
      possible.length > 1 ? possible[possible.length - 1] : possible[0] || "";
  }

  if (!carName || !gradeName) {
    const candidates = cellTexts
      .slice(0, yearIndex >= 0 ? yearIndex : Math.min(cells.length, 7))
      .filter(Boolean)
      .filter((value) => !/車両情報を編集|選択|写真/.test(value))
      .filter((value) => !/^[0-9A-Za-z_-]+$/.test(value));

    if (!carName) {
      carName = candidates[0] || "";
    }

    if (!gradeName) {
      gradeName =
        candidates
          .map((value) => normalizeGradeNameCandidate(value, carName))
          .find(Boolean) || "";
    }
  }

  gradeName = normalizeGradeNameCandidate(gradeName, carName);

  const imageHtml = cellHtmlByHeader(cells, headers, ["写真"]) || rowHtml;

  const imageUrl = chooseBestImage(
    extractImageCandidates(imageHtml, pageUrl),
    extractImageCandidates(rowHtml, pageUrl),
  );

  const title = [carName, gradeName].filter(Boolean).join(" ").trim();

  const detailUrl =
    urls.find(
      (url) =>
        url.includes("/stock/detail") && url.includes(`StockId=${stockId}`),
    ) ||
    `${BASE_URL}/stock/detail?ClientId=${encodeURIComponent(
      clientId,
    )}&StockId=${stockId}`;

  const listResult = {
    carName: Boolean(carName),
    gradeName: Boolean(gradeName),
    year: Boolean(year),
    displacement: Boolean(displacement),
    color: Boolean(color),
    mileage: Boolean(mileage),
    bodyPrice: Boolean(bodyPrice),
    totalPrice: Boolean(totalPrice),
    imageUrl: Boolean(imageUrl),
    priceCandidates: resolvedPrices.candidates,
  };

  return {
    stockId,
    title,
    description: title,
    carName,
    gradeName,
    gradeExtraInfo: "",
    classificationName: "",
    makerName: "",
    seatCapacity: null,
    year,
    mileage,
    color,
    inspection: "",
    displacement,
    bodyPrice,
    totalPrice,
    imageUrl,
    detailUrl,
    editUrl: editUrls[0] || "",
    editUrls,
    gooUrl: urls.find((url) => url.includes("goo-net.com")) || "",
    sourceStatus: "一時保存",
    sourcePageUrl: pageUrl,
    types: [],
    typeKeys: [],
    listResult,
  };
}

function extractSavedVehicles(html, pageUrl) {
  const headers = findSavedHeaderMap(html);
  const vehicles = [];

  for (const rowHtml of extractAllTableRows(html)) {
    if (!/StockId=/i.test(decodeHtmlEntities(rowHtml))) {
      continue;
    }

    const vehicle = parseSavedVehicleRow(rowHtml, headers, pageUrl);

    if (vehicle) {
      vehicles.push(vehicle);
    }
  }

  return uniqueByStockId(vehicles);
}

function uniqueByStockId(vehicles) {
  const map = new Map();

  for (const vehicle of vehicles || []) {
    if (vehicle?.stockId) {
      map.set(vehicle.stockId, vehicle);
    }
  }

  return Array.from(map.values());
}

function normalizeTypeKey(type) {
  const value = compactText(toHalfWidthAscii(type));

  if (/^suv$/i.test(value)) return "SUV";
  if (/^ev[・･\/]?hv$/i.test(value)) return "EV・HV";

  return value;
}

function extractTypesFromText(text) {
  const source = toHalfWidthAscii(decodeHtmlEntities(String(text || "")))
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\n")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(?:textarea|div|p|li|td|th|tr|dt|dd)>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\r/g, "\n");

  const types = [];

  for (const match of source.matchAll(
    /TYPE\s*:\s*([\s\S]*?)(?=TYPE\s*:|\n|$)/gi,
  )) {
    const value = compactText(match[1])
      .replace(/^[\s、,。;；:_＿・･|｜/\\-]+/, "")
      .replace(/[\s、,。;；:_＿|｜/\\-]+$/, "");

    if (value && !types.includes(value)) {
      types.push(value);
    }
  }

  return types;
}

function buildTypeKeys(types) {
  return Array.from(
    new Set((types || []).map(normalizeTypeKey).filter(Boolean)),
  );
}

function extractSelectedOption(selectHtml) {
  const options = Array.from(
    String(selectHtml || "").matchAll(
      /<option\b([^>]*)>([\s\S]*?)<\/option>/gi,
    ),
  );

  const selected = options.find((option) =>
    /\bselected\b/i.test(option[1] || ""),
  );

  if (!selected) {
    return {
      value: "",
      text: "",
    };
  }

  return {
    value: extractAttribute(selected[1], "value"),
    text: compactText(cleanHtmlToText(selected[2])),
  };
}

function extractControls(html) {
  const controls = [];
  const source = String(html || "");

  for (const match of source.matchAll(/<input\b([^>]*)>/gi)) {
    const attributes = match[1] || "";
    const type = extractAttribute(attributes, "type").toLowerCase();

    if (
      (type === "radio" || type === "checkbox") &&
      !/\bchecked\b/i.test(attributes)
    ) {
      continue;
    }

    controls.push({
      name: extractAttribute(attributes, "name"),
      id: extractAttribute(attributes, "id"),
      className: extractAttribute(attributes, "class"),
      value: compactText(extractAttribute(attributes, "value")),
      text: "",
    });
  }

  for (const match of source.matchAll(
    /<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi,
  )) {
    const attributes = match[1] || "";

    controls.push({
      name: extractAttribute(attributes, "name"),
      id: extractAttribute(attributes, "id"),
      className: extractAttribute(attributes, "class"),
      value: compactText(cleanHtmlToText(match[2])),
      text: "",
    });
  }

  for (const match of source.matchAll(
    /<select\b([^>]*)>([\s\S]*?)<\/select>/gi,
  )) {
    const attributes = match[1] || "";
    const selected = extractSelectedOption(match[2]);

    controls.push({
      name: extractAttribute(attributes, "name"),
      id: extractAttribute(attributes, "id"),
      className: extractAttribute(attributes, "class"),
      value: selected.value,
      text: selected.text,
    });
  }

  return controls;
}

function normalizeControlKey(value) {
  return toHalfWidthAscii(String(value || ""))
    .toLowerCase()
    .replace(/[\s_\-:[\]（）()]/g, "");
}

function isMeaningfulValue(value) {
  const text = compactText(value);

  return Boolean(
    text &&
      !/^(選択|選択してください|未選択|なし|無し|--|---|0|null|undefined)$/i.test(
        text,
      ),
  );
}

function findControlValue(html, names) {
  const targets = names.map(normalizeControlKey).filter(Boolean);
  const controls = extractControls(html);

  for (const control of controls) {
    const key = normalizeControlKey(
      `${control.name} ${control.id} ${control.className}`,
    );

    if (!targets.some((target) => key === target || key.includes(target))) {
      continue;
    }

    const value = compactText(control.text || control.value);

    if (isMeaningfulValue(value)) return value;
  }

  return "";
}

function findControlValueByPatterns(html, patterns) {
  const controls = extractControls(html);

  for (const control of controls) {
    const key = normalizeControlKey(
      `${control.name} ${control.id} ${control.className}`,
    );

    if (!patterns.some((pattern) => pattern.test(key))) {
      continue;
    }

    const value = compactText(control.text || control.value);

    if (isMeaningfulValue(value)) return value;
  }

  return "";
}

function normalizeGradeNameCandidate(value, carName = "") {
  const text = cleanVehicleText(value)
    .replace(/^(?:グレード名?|grade(?:\s*name)?)\s*[：:]?\s*/i, "")
    .trim();

  if (!isMeaningfulValue(text)) return "";

  if (/^[0-9０-９]+(?:\.[0-9０-９]+)?$/.test(text)) return "";

  if (/^(?:グレード名?|grade(?:\s*name)?)$/i.test(text)) return "";

  if (text.length > 120) return "";

  const normalizedCarName = compactText(carName);

  if (normalizedCarName && compactText(text) === normalizedCarName) {
    return "";
  }

  return text;
}

function isGradeAdditionalFieldKey(value) {
  const key = normalizeControlKey(value);

  return /(?:grade|gurade).*(?:extra|info|note|addition|additional)|(?:extra|info|note|addition|additional).*(?:grade|gurade)/.test(
    key,
  );
}

function findDescriptiveControlValue(html, names, patterns = [], carName = "") {
  const targets = names.map(normalizeControlKey).filter(Boolean);
  const controls = extractControls(html);
  const candidates = [];

  for (const control of controls) {
    const identifiers = [control.name, control.id, control.className]
      .map(normalizeControlKey)
      .filter(Boolean);

    const key = identifiers.join(" ");

    if (isGradeAdditionalFieldKey(key)) continue;

    const exactMatch = identifiers.some((identifier) =>
      targets.includes(identifier),
    );

    const specificMatch = identifiers.some((identifier) =>
      targets.some(
        (target) => target !== "grade" && identifier.includes(target),
      ),
    );

    const matches =
      exactMatch ||
      specificMatch ||
      patterns.some((pattern) => pattern.test(key));

    if (!matches) continue;

    for (const [candidateIndex, candidate] of [
      control.text,
      control.value,
    ].entries()) {
      const value = normalizeGradeNameCandidate(candidate, carName);

      if (!value) continue;

      const nameField = identifiers.some(
        (identifier) =>
          identifier.includes("gradename") ||
          identifier.includes("guradename") ||
          identifier.includes("gradenm"),
      );

      const idLikeField = identifiers.some((identifier) =>
        /(?:grade|gurade).*(?:id|code|no|kbn|flag|flg|status)$/.test(
          identifier,
        ),
      );

      if (idLikeField && candidateIndex === 1) continue;

      candidates.push({
        value,
        score:
          (exactMatch ? 400 : specificMatch ? 300 : 200) +
          (nameField ? 100 : 0) +
          (candidateIndex === 0 ? 80 : 0) -
          (idLikeField ? 250 : 0),
      });
    }
  }

  candidates.sort((first, second) => second.score - first.score);
  return candidates[0]?.value || "";
}

function findGradeNameFromPairs(html, carName = "") {
  const allowedLabels = new Set([
    normalizeHeaderText("グレード"),
    normalizeHeaderText("グレード名"),
    normalizeHeaderText("Grade"),
    normalizeHeaderText("GradeName"),
  ]);

  for (const pair of extractLabelValuePairs(html)) {
    const label = normalizeHeaderText(pair.label);

    if (!allowedLabels.has(label)) continue;

    const value = normalizeGradeNameCandidate(pair.value, carName);

    if (value) return value;
  }

  return "";
}

function findGradeNameFromLinks(html, carName = "") {
  const parameterNames = ["grade_name", "GradeName", "gradeName", "grade_nm"];

  for (const href of extractRawHrefValues(html)) {
    for (const parameterName of parameterNames) {
      const value = normalizeGradeNameCandidate(
        getQueryParamDecoded(href, parameterName),
        carName,
      );

      if (value) return value;
    }
  }

  return "";
}

function findEmbeddedGradeName(html, carName = "") {
  const source = decodeHtmlEntities(String(html || ""));

  const patterns = [
    /\bdata-grade-name\s*=\s*["']([^"']+)["']/gi,
    /["'](?:grade_name|gradeName|GradeName|grade_nm)["']\s*[:=]\s*["']([^"']+)["']/gi,
    /\b(?:grade_name|gradeName|GradeName|grade_nm)\s*[:=]\s*["']([^"']+)["']/gi,
  ];

  for (const pattern of patterns) {
    for (const match of source.matchAll(pattern)) {
      const value = normalizeGradeNameCandidate(match[1], carName);

      if (value) return value;
    }
  }

  return "";
}

function extractGradeName(html, carName = "") {
  return (
    findDescriptiveControlValue(
      html,
      ["GradeName", "Grade", "grade_name", "Gurade", "grade_nm", "grade"],
      [/grade/, /gurade/],
      carName,
    ) ||
    findGradeNameFromLinks(html, carName) ||
    findGradeNameFromPairs(html, carName) ||
    findEmbeddedGradeName(html, carName)
  );
}

function extractLabelValuePairs(html) {
  const pairs = [];
  const source = String(html || "");

  for (const rowHtml of extractAllTableRows(source)) {
    const headers = extractCells(rowHtml, "th");
    const cells = extractCells(rowHtml, "td");

    if (headers.length && cells.length) {
      for (
        let index = 0;
        index < Math.min(headers.length, cells.length);
        index += 1
      ) {
        pairs.push({
          label: compactText(headers[index].text),
          value: compactText(cells[index].text),
        });
      }
    } else if (cells.length >= 2) {
      for (let index = 0; index + 1 < cells.length; index += 2) {
        pairs.push({
          label: compactText(cells[index].text),
          value: compactText(cells[index + 1].text),
        });
      }
    }
  }

  for (const match of source.matchAll(
    /<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi,
  )) {
    pairs.push({
      label: compactText(cleanHtmlToText(match[1])),
      value: compactText(cleanHtmlToText(match[2])),
    });
  }

  return pairs;
}

function findPairValue(html, labels) {
  const normalizedLabels = labels.map(normalizeHeaderText);

  for (const pair of extractLabelValuePairs(html)) {
    const label = normalizeHeaderText(pair.label);

    if (
      normalizedLabels.some(
        (target) =>
          label === target || label.includes(target) || target.includes(label),
      ) &&
      isMeaningfulValue(pair.value)
    ) {
      return pair.value;
    }
  }

  return "";
}

function findRegionNearLabel(html, labels) {
  const source = String(html || "");

  for (const label of labels) {
    const index = source.indexOf(label);

    if (index < 0) continue;

    for (const [startTag, endTag] of [
      ["<tr", "</tr>"],
      ["<li", "</li>"],
      ["<dl", "</dl>"],
      ["<fieldset", "</fieldset>"],
      ["<div", "</div>"],
    ]) {
      const start = source.lastIndexOf(startTag, index);
      const end = source.indexOf(endTag, index);

      if (start >= 0 && end >= 0 && end - start <= 20000) {
        return source.slice(start, end + endTag.length);
      }
    }
  }

  return "";
}

function findValueNearLabel(html, labels) {
  const pairValue = findPairValue(html, labels);

  if (pairValue) return pairValue;

  const region = findRegionNearLabel(html, labels);

  if (!region) return "";

  const controls = extractControls(region);

  for (const control of controls) {
    const value = compactText(control.text || control.value);

    if (isMeaningfulValue(value)) return value;
  }

  let text = compactText(cleanHtmlToText(region));

  for (const label of labels) {
    text = text.replace(
      new RegExp(`^.*?${escapeRegExp(label)}\\s*[：:]?\\s*`, "i"),
      "",
    );
  }

  return isMeaningfulValue(text) ? text : "";
}

function extractRegistrationYear(html) {
  const direct =
    findControlValue(html, [
      "nenshiki",
      "syodo",
      "shodo",
      "firstregistration",
      "firstregist",
      "registrationyear",
      "registyear",
      "modelyear",
      "first_year",
      "registration_year",
      "syodo_year",
      "shodo_year",
    ]) ||
    findControlValueByPatterns(html, [
      /(?:syodo|shodo|firstreg|registration).*year/,
      /year.*(?:syodo|shodo|firstreg|registration)/,
      /(?:nenshiki|modelyear|registyear)/,
    ]) ||
    findValueNearLabel(html, [
      "初度登録年月",
      "初年度登録年月",
      "初度登録",
      "初年度登録",
      "初度検査年月",
      "年式",
    ]);

  const normalized = normalizeYear(direct);

  if (normalized) return normalized;

  const controls = extractControls(html);

  for (const control of controls) {
    const key = normalizeControlKey(
      `${control.name} ${control.id} ${control.className}`,
    );

    if (
      !/(?:syodo|shodo|firstreg|registration|nenshiki|modelyear|registyear)/.test(
        key,
      )
    ) {
      continue;
    }

    const value = compactText(control.text || control.value);
    const year = normalizeYear(value);

    if (year) return year;
  }

  return "";
}

function extractBodyColor(html) {
  const value =
    findControlValue(html, [
      "bodycolor",
      "carcolor",
      "exteriorcolor",
      "colorname",
      "bodyiro",
      "car_iro",
      "body_color",
      "car_color",
      "color_name",
      "syatai_color",
      "shatai_color",
      "syataiiro",
      "shataiiro",
    ]) ||
    findControlValueByPatterns(html, [
      /(?:body|car|exterior|syatai|shatai).*(?:color|iro)/,
      /(?:color|iro).*(?:body|car|exterior|syatai|shatai)/,
    ]) ||
    findValueNearLabel(html, [
      "車体色",
      "ボディカラー",
      "外装色",
      "カラー",
      "色",
    ]);

  return compactText(value)
    .replace(/^(車体色|ボディカラー|外装色|カラー|色)\s*[：:]?\s*/, "")
    .replace(/(カラーコード|色コード)[\s\S]*$/, "")
    .slice(0, 100)
    .trim();
}

function normalizeMakerSearchText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[\s　・･ー―‐\-_/／,，.。()（）\[\]「」『』:：]/g, "");
}

const MODEL_MAKER_RULES = [
  ["レクサス", /^(LS|ES|IS|GS|LC|RC|RX|NX|UX|LX|GX|LBX)/],
  [
    "トヨタ",
    /^(アクア|アルファード|ヴェルファイア|ヴォクシー|エスティマ|カムリ|カローラ|クラウン|シエンタ|タンク|ノア|ハイエース|ハリアー|プリウス|プロボックス|ポルテ|ヤリス|ライズ|ランドクルーザー|ルーミー|レジアスエース)/,
  ],
  [
    "日産",
    /^(NT100クリッパートラック|NV100クリッパーリオ|エクストレイル|エルグランド|オーラ|キックス|キャラバン|クリッパー|サクラ|セレナ|デイズ|ノート|フーガ|リーフ|ルークス)/,
  ],
  [
    "ホンダ",
    /^(NBOX|NONE|NVAN|NWGN|オデッセイ|シビック|ステップワゴン|フィット|フリード|ヴェゼル)/,
  ],
  [
    "マツダ",
    /^(CX3|CX30|CX5|CX60|CX8|CX80|MAZDA2|MAZDA3|MAZDA6|アテンザ|デミオ|ロードスター)/,
  ],
  [
    "スバル",
    /^(BRZ|WRX|XV|インプレッサ|クロストレック|ステラ|フォレスター|レガシィ|レヴォーグ)/,
  ],
  [
    "三菱",
    /^(EKクロス|アウトランダー|エクリプスクロス|デリカ|パジェロ|ミニキャブ)/,
  ],
  [
    "スズキ",
    /^(アルト|エブリイ|キャリイ|クロスビー|ジムニー|スイフト|スペーシア|ソリオ|ハスラー|ラパン|ワゴンR)/,
  ],
  [
    "ダイハツ",
    /^(アトレー|ウェイク|キャスト|コペン|タフト|タント|トール|ハイゼット|ミライース|ムーヴ|ロッキー)/,
  ],
  ["三菱ふそう", /^キャンター/],
  ["いすゞ", /^(エルフ|フォワード)/],
  ["日野", /^(デュトロ|レンジャー|プロフィア)/],
];

function normalizeMakerName(value) {
  const text = normalizeMakerSearchText(value);

  if (!text) return "";

  const aliases = [
    ["トヨタ", ["トヨタ", "TOYOTA"]],
    ["レクサス", ["レクサス", "LEXUS"]],
    ["日産", ["日産", "ニッサン", "NISSAN"]],
    ["ホンダ", ["ホンダ", "HONDA"]],
    ["マツダ", ["マツダ", "MAZDA"]],
    ["スバル", ["スバル", "SUBARU"]],
    ["三菱ふそう", ["三菱ふそう", "ふそう", "FUSO"]],
    ["三菱", ["三菱", "ミツビシ", "MITSUBISHI"]],
    ["スズキ", ["スズキ", "SUZUKI"]],
    ["ダイハツ", ["ダイハツ", "DAIHATSU"]],
    ["いすゞ", ["いすゞ", "イスズ", "ISUZU"]],
    ["日野", ["日野", "HINO"]],
    ["UDトラックス", ["UDトラックス", "UDTRUCKS"]],
    ["BMW", ["BMW"]],
    [
      "メルセデス・ベンツ",
      [
        "メルセデスベンツ",
        "メルセデス",
        "ベンツ",
        "MERCEDESBENZ",
        "MERCEDES",
        "BENZ",
      ],
    ],
    ["アウディ", ["アウディ", "AUDI"]],
    ["フォルクスワーゲン", ["フォルクスワーゲン", "VOLKSWAGEN"]],
    ["ボルボ", ["ボルボ", "VOLVO"]],
    ["MINI", ["MINI"]],
    ["ジープ", ["ジープ", "JEEP"]],
    ["プジョー", ["プジョー", "PEUGEOT"]],
    ["シトロエン", ["シトロエン", "CITROEN"]],
    ["ルノー", ["ルノー", "RENAULT"]],
    ["フィアット", ["フィアット", "FIAT"]],
    ["アバルト", ["アバルト", "ABARTH"]],
    ["ポルシェ", ["ポルシェ", "PORSCHE"]],
    ["ジャガー", ["ジャガー", "JAGUAR"]],
    [
      "ランドローバー",
      ["ランドローバー", "LANDROVER", "レンジローバー", "RANGEROVER"],
    ],
    ["テスラ", ["テスラ", "TESLA"]],
  ];

  for (const [makerName, values] of aliases) {
    if (
      values.some((alias) => text.includes(normalizeMakerSearchText(alias)))
    ) {
      return makerName;
    }
  }

  return "";
}

function inferMakerName(carName) {
  const text = normalizeMakerSearchText(carName);

  if (!text) return "";

  for (const [makerName, pattern] of MODEL_MAKER_RULES) {
    if (pattern.test(text)) return makerName;
  }

  return "";
}

function extractMakerName(html, carName) {
  const value =
    findControlValue(html, [
      "MakerName",
      "Maker",
      "Manufacturer",
      "BrandName",
      "maker_name",
      "manufacturer_name",
      "brand_name",
      "car_maker",
      "vehicle_maker",
    ]) ||
    findControlValueByPatterns(html, [/maker/, /manufacturer/, /brandname/]) ||
    findValueNearLabel(html, [
      "メーカー名",
      "メーカー",
      "自動車メーカー",
      "ブランド",
    ]);

  return normalizeMakerName(value) || inferMakerName(carName);
}

function normalizeSeatCapacity(value) {
  const text = toHalfWidthAscii(decodeHtmlEntities(String(value || "")))
    .normalize("NFKC")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!text) return null;

  const matched =
    text.match(
      /(?:乗車定員|乗員定員|乗車人数|定員|seatingcapacity|seatcapacity|passengercapacity)\s*[：:=]?\s*(\d{1,2})\s*(?:人|名)?/i,
    ) ||
    text.match(/(\d{1,2})\s*(?:人|名)(?:乗り|乗車)?/) ||
    text.match(/^(\d{1,2})$/);

  const number = Number(matched?.[1] || NaN);

  return Number.isInteger(number) && number >= 1 && number <= 20
    ? number
    : null;
}

function extractSeatCapacity(html) {
  const value =
    findControlValue(html, [
      "Teiin",
      "JoushaTeiin",
      "JyosyaTeiin",
      "PassengerCapacity",
      "SeatingCapacity",
      "SeatCapacity",
      "teiin",
      "jousha_teiin",
      "jyosya_teiin",
      "passenger_capacity",
      "seating_capacity",
      "seat_capacity",
    ]) ||
    findControlValueByPatterns(html, [
      /(?:jousha|jyosya|josha).*teiin/,
      /teiin/,
      /passengercapacity/,
      /seatingcapacity/,
      /seatcapacity/,
    ]) ||
    findValueNearLabel(html, ["乗車定員", "乗員定員", "乗車人数", "定員"]);

  const direct = normalizeSeatCapacity(value);

  if (direct) return direct;

  const text = cleanHtmlToText(html);

  return normalizeSeatCapacity(
    text.match(
      /(?:乗車定員|乗員定員|乗車人数|定員)\s*[：:]?\s*\d{1,2}\s*(?:人|名)?/,
    )?.[0] ||
      text.match(/\d{1,2}\s*人乗り/)?.[0] ||
      "",
  );
}

function extractCommonVehicleDetails(html, pageUrl) {
  const text = cleanHtmlToText(html);

  const carName =
    findControlValue(html, [
      "CarName",
      "Syamei",
      "Shamei",
      "VehicleName",
      "car_name",
      "syamei_name",
      "shamei_name",
      "vehicle_name",
      "model_name",
    ]) ||
    findControlValueByPatterns(html, [
      /(?:car|vehicle|syamei|shamei).*name/,
      /name.*(?:car|vehicle|syamei|shamei)/,
    ]) ||
    findValueNearLabel(html, ["車名", "車種"]);

  const gradeName = extractGradeName(html, carName);

  const classificationName =
    findControlValue(html, [
      "Katashiki",
      "ClassificationName",
      "ModelCode",
      "classification_name",
      "model_code",
      "katashiki",
    ]) ||
    findControlValueByPatterns(html, [
      /katashiki/,
      /classification/,
      /modelcode/,
    ]) ||
    findValueNearLabel(html, ["型式"]);

  const mileage =
    normalizeMileage(
      findControlValue(html, [
        "Soukou",
        "SoukouKyori",
        "Mileage",
        "MileageDistance",
        "RunDistance",
        "soukou_kyori",
        "run_distance",
      ]) ||
        findControlValueByPatterns(html, [
          /soukou/,
          /mileage/,
          /rundistance/,
        ]) ||
        findValueNearLabel(html, ["走行距離", "走行"]) ||
        text.match(/\d+(?:\.\d+)?万[ＫKk]/)?.[0] ||
        text.match(/\d{1,7}(?:,\d{3})*\s*(?:km|ＫＭ|ｋｍ)/i)?.[0] ||
        "",
    ) || "";

  const inspection =
    findControlValue(html, [
      "Shaken",
      "Inspection",
      "InspectionDate",
      "Syaken",
      "shaken_date",
      "inspection_date",
    ]) ||
    findControlValueByPatterns(html, [/shaken/, /syaken/, /inspection/]) ||
    findValueNearLabel(html, ["車検", "車検有効期限"]);

  const displacement =
    normalizeDisplacement(
      findControlValue(html, [
        "Haikiryo",
        "Displacement",
        "EngineDisplacement",
        "haiki_ryo",
        "engine_displacement",
      ]) ||
        findControlValueByPatterns(html, [/haikiryo/, /displacement/]) ||
        findValueNearLabel(html, ["排気量"]),
    ) || "";

  const bodyPrice = normalizePrice(
    findControlValue(html, [
      "Kakaku",
      "BodyPrice",
      "VehiclePrice",
      "CarPrice",
      "body_price",
      "vehicle_price",
      "car_price",
    ]) ||
      findControlValueByPatterns(html, [
        /bodyprice/,
        /vehicleprice/,
        /carprice/,
        /kakaku/,
      ]) ||
      findValueNearLabel(html, ["車両本体価格", "本体価格"]),
  );

  const totalPrice = normalizePrice(
    findControlValue(html, [
      "TotalPrice",
      "SiharaiTotal",
      "ShiharaiTotal",
      "PaymentTotal",
      "total_price",
      "payment_total",
    ]) ||
      findControlValueByPatterns(html, [
        /totalprice/,
        /paymenttotal/,
        /siharaitotal/,
        /shiharaitotal/,
      ]) ||
      findValueNearLabel(html, ["支払総額", "総額"]),
  );

  const gradeExtraInfo =
    findControlValue(html, [
      "grade_additional_info",
      "grade_info",
      "GradeAddition",
      "grade_extra_info",
      "grade_note",
    ]) ||
    findControlValueByPatterns(html, [/grade.*(?:info|addition|extra|note)/]) ||
    findValueNearLabel(html, ["グレード付加情報", "グレード情報"]);

  return {
    carName: cleanVehicleText(carName),
    makerName: extractMakerName(html, carName),
    seatCapacity: extractSeatCapacity(html),
    gradeName: normalizeGradeNameCandidate(gradeName, carName),
    classificationName: compactText(classificationName),
    year: extractRegistrationYear(html),
    mileage,
    color: extractBodyColor(html),
    inspection: compactText(inspection),
    displacement,
    bodyPrice,
    totalPrice,
    gradeExtraInfo: compactText(gradeExtraInfo),
    imageUrl: chooseBestImage(extractImageCandidates(html, pageUrl)),
  };
}

async function loginMotorgate() {
  const loginUrl = `${BASE_URL}/login/index`;
  const jar = {};

  const loginPage = await fetchWithTimeout(
    loginUrl,
    {
      headers: {
        "User-Agent": USER_AGENT,
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    },
    30000,
  );

  addResponseCookies(jar, loginPage);

  const html = await readResponseText(loginPage);

  const csrf = html.match(
    /name=["']fuel_csrf_token["'][^>]*value=["']([^"']+)/i,
  )?.[1];

  const sessionId = html.match(
    /name=["']session_id["'][^>]*value=["']([^"']+)/i,
  )?.[1];

  const login = await fetchWithTimeout(
    loginUrl,
    {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: BASE_URL,
        Referer: loginUrl,
        Cookie: jarToCookie(jar),
        "User-Agent": USER_AGENT,
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
      body: new URLSearchParams({
        fuel_csrf_token: csrf || "",
        session_id: sessionId || "",
        client_id: process.env.MOTORGATE_CLIENT_ID || "",
        user_id: "",
        client_pw: process.env.MOTORGATE_PASSWORD || "",
      }),
    },
    30000,
  );

  addResponseCookies(jar, login);

  return {
    jar,
    loginStatus: login.status,
  };
}

function mergePreviousVehicle(vehicle, previousVehicle) {
  if (!previousVehicle) return vehicle;

  const result = {
    ...vehicle,
  };

  for (const key of [
    "title",
    "description",
    "carName",
    "gradeName",
    "gradeExtraInfo",
    "classificationName",
    "makerName",
    "seatCapacity",
    "year",
    "mileage",
    "color",
    "inspection",
    "displacement",
    "bodyPrice",
    "totalPrice",
    "imageUrl",
    "detailUrl",
    "gooUrl",
  ]) {
    const previousValue = previousVehicle[key];

    if (key === "gradeName") {
      result[key] = normalizeGradeNameCandidate(
        result[key],
        result.carName || previousVehicle.carName,
      );

      const previousGradeName = normalizeGradeNameCandidate(
        previousValue,
        previousVehicle.carName || result.carName,
      );

      if (!result[key] && previousGradeName) {
        result[key] = previousGradeName;
      }

      continue;
    }

    if (!result[key] && previousValue) {
      result[key] = previousValue;
    }
  }

  if ((!result.types || result.types.length === 0) && previousVehicle.types) {
    result.types = previousVehicle.types;
  }

  if (
    (!result.typeKeys || result.typeKeys.length === 0) &&
    previousVehicle.typeKeys
  ) {
    result.typeKeys = previousVehicle.typeKeys;
  }

  return result;
}

function buildDetailUrlCandidates(vehicle) {
  return Array.from(
    new Set(
      [...(vehicle.editUrls || []), vehicle.editUrl, vehicle.detailUrl].filter(
        Boolean,
      ),
    ),
  );
}

function detailScore(details, types, sourceStatus = "") {
  const savedGradeBonus =
    sourceStatus === "一時保存" &&
    normalizeGradeNameCandidate(details.gradeName, details.carName)
      ? 20
      : 0;

  return (
    [
      details.carName,
      details.gradeName,
      details.classificationName,
      details.makerName,
      details.seatCapacity,
      details.year,
      details.mileage,
      details.color,
      details.inspection,
      details.displacement,
      details.bodyPrice,
      details.totalPrice,
      details.gradeExtraInfo,
      details.imageUrl,
    ].filter(Boolean).length +
    (types || []).length +
    savedGradeBonus
  );
}

function chooseMergedValue(vehicle, previous, details, key) {
  const currentValue = vehicle[key] || "";
  const previousValue = previous?.[key] || "";
  const detailValue = details?.[key] || "";

  if (key === "imageUrl") {
    return chooseBestImage(detailValue, currentValue, previousValue);
  }

  if (key === "gradeName") {
    const carName =
      details?.carName || vehicle.carName || previous?.carName || "";

    const values =
      vehicle.sourceStatus === "一時保存"
        ? [detailValue, currentValue, previousValue]
        : [currentValue, detailValue, previousValue];

    for (const value of values) {
      const gradeName = normalizeGradeNameCandidate(value, carName);

      if (gradeName) return gradeName;
    }

    return "";
  }

  if (vehicle.sourceStatus === "一時保存") {
    const detailPriority = new Set([
      "carName",
      "gradeName",
      "gradeExtraInfo",
      "classificationName",
      "makerName",
      "seatCapacity",
      "year",
      "color",
      "inspection",
      "displacement",
    ]);

    if (detailPriority.has(key)) {
      return detailValue || currentValue || previousValue;
    }

    const listPriority = new Set(["mileage", "bodyPrice", "totalPrice"]);

    if (listPriority.has(key)) {
      return currentValue || detailValue || previousValue;
    }

    return detailValue || currentValue || previousValue;
  }

  return currentValue || detailValue || previousValue;
}

async function fetchVehicleDetail(jar, vehicle, previousVehicle = null) {
  const deadline = Date.now() + VEHICLE_BUDGET_MS;
  const candidates = buildDetailUrlCandidates(vehicle);

  if (!candidates.length) {
    const fallback = mergePreviousVehicle(vehicle, previousVehicle);

    return {
      ...fallback,
      typeResult: {
        status: null,
        success: Boolean(fallback.types?.length),
        timeout: false,
        error: "detail URL not found",
      },
      detailResult: {
        success: false,
        url: "",
        attempts: 0,
        gradeName: Boolean(fallback.gradeName),
        year: Boolean(fallback.year),
        mileage: Boolean(fallback.mileage),
        color: Boolean(fallback.color),
        imageUrl: Boolean(fallback.imageUrl),
      },
    };
  }

  let best = null;
  let collectedTypes = [];
  const errors = [];
  let attempts = 0;

  candidateLoop: for (const candidateUrl of candidates) {
    for (let retry = 0; retry <= DETAIL_RETRIES; retry += 1) {
      if (Date.now() >= deadline) {
        errors.push("vehicle detail timeout");
        break candidateLoop;
      }

      attempts += 1;

      try {
        const response = await fetchWithTimeout(
          candidateUrl,
          {
            headers: {
              Cookie: jarToCookie(jar),
              Referer:
                vehicle.sourceStatus === "一時保存"
                  ? `${BASE_URL}/stock/savelist`
                  : `${BASE_URL}/top`,
              "User-Agent": USER_AGENT,
              "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
              "Cache-Control": "no-store",
            },
          },
          Math.min(DETAIL_TIMEOUT_MS, Math.max(1, deadline - Date.now())),
        );

        const html = await readResponseText(response);

        const containsLoginForm =
          html.includes('name="client_pw"') ||
          html.includes("name='client_pw'");

        if (
          !response.ok ||
          containsLoginForm ||
          /FatalError|Fatal error/i.test(html)
        ) {
          errors.push(
            `${candidateUrl}: HTTP ${response.status}${
              containsLoginForm ? " login form" : ""
            }`,
          );
          continue;
        }

        const pageTypes = Array.from(
          new Set([
            ...extractTypesFromText(html),
            ...extractTypesFromText(cleanHtmlToText(html)),
          ]),
        );

        const details = extractCommonVehicleDetails(html, candidateUrl);

        if (
          ![
            details.carName,
            details.gradeName,
            details.classificationName,
            details.year,
            details.mileage,
            details.color,
          ].some(Boolean) &&
          !pageTypes.length
        ) {
          errors.push(`${candidateUrl}: vehicle fields not found`);
          continue;
        }

        // ページ先頭の別車両リンクを、この車のIDと誤認して拒否しない。
        collectedTypes = Array.from(new Set([...collectedTypes, ...pageTypes]));

        const score = detailScore(details, pageTypes, vehicle.sourceStatus);

        if (!best || score > best.score) {
          best = {
            url: candidateUrl,
            status: response.status,
            html,
            details,
            types: pageTypes,
            score,
          };
        }

        const savedEnough =
          vehicle.sourceStatus === "一時保存" &&
          Boolean(
            collectedTypes.length &&
              (normalizeGradeNameCandidate(
                details.gradeName,
                details.carName || vehicle.carName,
              ) ||
                normalizeGradeNameCandidate(
                  vehicle.gradeName,
                  vehicle.carName,
                )) &&
              (details.year || vehicle.year) &&
              (details.color || vehicle.color) &&
              (details.imageUrl || vehicle.imageUrl) &&
              (details.carName || vehicle.carName),
          );

        const publicEnough =
          vehicle.sourceStatus === "掲載在庫" &&
          Boolean(
            collectedTypes.length && (details.imageUrl || vehicle.imageUrl),
          );

        if (savedEnough || publicEnough) {
          break candidateLoop;
        }
      } catch (error) {
        errors.push(`${candidateUrl}: ${error.message || String(error)}`);
      }
    }
  }

  if (!best) {
    const fallback = mergePreviousVehicle(vehicle, previousVehicle);

    return {
      ...fallback,
      typeResult: {
        status: null,
        success: Boolean(fallback.types?.length),
        timeout: errors.some((value) => /timeout|abort/i.test(value)),
        error: errors.join(" / "),
      },
      detailResult: {
        success: false,
        url: "",
        attempts,
        gradeName: Boolean(fallback.gradeName),
        year: Boolean(fallback.year),
        mileage: Boolean(fallback.mileage),
        color: Boolean(fallback.color),
        imageUrl: Boolean(fallback.imageUrl),
      },
    };
  }

  const previous = previousVehicle || {};
  const details = best.details;

  const types =
    collectedTypes.length > 0
      ? collectedTypes
      : best.types.length > 0
        ? best.types
        : vehicle.types?.length
          ? vehicle.types
          : previous.types || [];

  const typeKeys =
    types.length > 0
      ? buildTypeKeys(types)
      : vehicle.typeKeys?.length
        ? vehicle.typeKeys
        : previous.typeKeys || [];

  const carName = chooseMergedValue(vehicle, previous, details, "carName");

  const makerName =
    normalizeMakerName(
      chooseMergedValue(vehicle, previous, details, "makerName"),
    ) || inferMakerName(carName);

  const seatCapacity = normalizeSeatCapacity(
    chooseMergedValue(vehicle, previous, details, "seatCapacity"),
  );

  const gradeName = normalizeGradeNameCandidate(
    chooseMergedValue(vehicle, previous, details, "gradeName"),
    carName,
  );

  const title =
    [carName, gradeName].filter(Boolean).join(" ").trim() ||
    vehicle.title ||
    previous.title ||
    "";

  let bodyPrice = chooseMergedValue(vehicle, previous, details, "bodyPrice");
  let totalPrice = chooseMergedValue(vehicle, previous, details, "totalPrice");

  if (vehicle.sourceStatus === "一時保存") {
    const repaired = repairSavedPricePair(
      bodyPrice,
      totalPrice,
      previous.bodyPrice,
      previous.totalPrice,
    );

    bodyPrice = repaired.bodyPrice;
    totalPrice = repaired.totalPrice;
  }

  return mergePreviousVehicle(
    {
      ...vehicle,
      title,
      description: vehicle.description || previous.description || title,
      carName,
      makerName,
      seatCapacity,
      gradeName,
      gradeExtraInfo: chooseMergedValue(
        vehicle,
        previous,
        details,
        "gradeExtraInfo",
      ),
      classificationName: chooseMergedValue(
        vehicle,
        previous,
        details,
        "classificationName",
      ),
      year: chooseMergedValue(vehicle, previous, details, "year"),
      mileage: chooseMergedValue(vehicle, previous, details, "mileage"),
      color: chooseMergedValue(vehicle, previous, details, "color"),
      inspection: chooseMergedValue(vehicle, previous, details, "inspection"),
      displacement: chooseMergedValue(
        vehicle,
        previous,
        details,
        "displacement",
      ),
      bodyPrice,
      totalPrice,
      imageUrl: chooseMergedValue(vehicle, previous, details, "imageUrl"),
      editUrl: best.url.includes("/stock/detail") ? vehicle.editUrl : best.url,
      types,
      typeKeys,
      typeResult: {
        status: best.status,
        success: types.length > 0,
        containsFatalError: best.html.includes("FatalError"),
        timeout: false,
        error: errors.join(" / "),
      },
      detailResult: {
        success: true,
        freshTypes: collectedTypes.length > 0,
        url: best.url,
        attempts,
        makerName: Boolean(details.makerName),
        seatCapacity: Boolean(details.seatCapacity),
        gradeName: Boolean(
          normalizeGradeNameCandidate(details.gradeName, details.carName),
        ),
        year: Boolean(details.year),
        mileage: Boolean(details.mileage),
        color: Boolean(details.color),
        imageUrl: Boolean(details.imageUrl),
      },
    },
    previousVehicle,
  );
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
    makerName:
      normalizeMakerName(vehicle.makerName) ||
      inferMakerName(vehicle.carName || vehicle.title),
    seatCapacity: normalizeSeatCapacity(vehicle.seatCapacity),
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
    editUrls: vehicle.editUrls || [],
    types: vehicle.types || [],
    typeKeys: vehicle.typeKeys || [],
    listResult: vehicle.listResult || null,
    updatedAt: new Date().toISOString(),
    typeResult: vehicle.typeResult || null,
    detailResult: vehicle.detailResult || null,
  };
}

async function fetchPublicVehicles(jar) {
  const response = await fetchWithTimeout(
    PUBLIC_LIST_URL,
    {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: `${BASE_URL}/top`,
        "User-Agent": USER_AGENT,
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    },
    30000,
  );

  const html = await readResponseText(response);

  const containsLoginForm =
    html.includes('name="client_pw"') || html.includes("name='client_pw'");

  const imageMap = extractQualityImageMap(html, PUBLIC_LIST_URL);
  const rows = extractVehicleRows(html);

  const vehicles = rows.map((row) =>
    parsePublicVehicleRow(row, PUBLIC_LIST_URL, imageMap),
  );

  if (
    response.status !== 200 ||
    containsLoginForm ||
    /FatalError|Fatal error/i.test(html)
  ) {
    throw new Error(`掲載在庫一覧の取得失敗: HTTP ${response.status}`);
  }

  if (!rows.length || rows.length >= 100) {
    throw new Error(
      "掲載在庫一覧が0件、または100件上限です。全件確認できないため既存在庫を保持します。",
    );
  }

  return {
    status: response.status,
    containsLoginForm,
    foundRows: rows.length,
    imageMapCount: Object.keys(imageMap).length,
    vehicles,
  };
}

function summarizeSavedListFields(vehicles) {
  const saved = (vehicles || []).filter(
    (vehicle) => vehicle.sourceStatus === "一時保存",
  );

  const count = (key) =>
    saved.filter((vehicle) => vehicle.listResult?.[key]).length;

  return {
    total: saved.length,
    carNameFound: count("carName"),
    gradeNameFound: count("gradeName"),
    yearFound: count("year"),
    displacementFound: count("displacement"),
    colorFound: count("color"),
    mileageFound: count("mileage"),
    bodyPriceFound: count("bodyPrice"),
    totalPriceFound: count("totalPrice"),
    imageFound: count("imageUrl"),
  };
}

async function fetchSavedPage(jar, pageUrl) {
  const response = await fetchWithTimeout(
    pageUrl,
    {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: `${BASE_URL}/top`,
        "User-Agent": USER_AGENT,
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    },
    30000,
  );

  const html = await readResponseText(response);

  const containsLoginForm =
    html.includes('name="client_pw"') || html.includes("name='client_pw'");

  const vehicles = extractSavedVehicles(html, pageUrl);

  if (
    response.status !== 200 ||
    containsLoginForm ||
    /FatalError|Fatal error/i.test(html)
  ) {
    throw new Error(`一時保存一覧の取得失敗: HTTP ${response.status}`);
  }

  const emptyMessage =
    /(?:該当|在庫|車両|データ)[^。\n]{0,50}(?:ありません|ございません|0\s*件)|(?:全|合計|検索結果)[^。\n]{0,20}0\s*件/.test(
      cleanHtmlToText(html),
    );

  if (!vehicles.length && !/<table\b/i.test(html) && !emptyMessage) {
    throw new Error(
      "一時保存一覧の形式を確認できません。既存在庫を保持します。",
    );
  }

  return {
    pageUrl,
    status: response.status,
    containsLoginForm,
    count: vehicles.length,
    listFields: summarizeSavedListFields(vehicles),
    vehicles,
  };
}

function getGitHubConfig() {
  return {
    token: process.env.GITHUB_TOKEN || "",
    owner: process.env.GITHUB_OWNER || "CARTOPIA0319",
    repo: process.env.GITHUB_REPO || "cartopia-car-diagnosis",
    branch: process.env.GITHUB_BRANCH || "main",
    path: "data/inventory.json",
  };
}

function getGitHubHeaders(includeJson = false) {
  const { token } = getGitHubConfig();

  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "cartopia-inventory-updater",
    "Cache-Control": "no-store",
    ...(includeJson
      ? {
          "Content-Type": "application/json",
        }
      : {}),
  };
}

async function githubApi(url, options = {}) {
  const response = await fetchWithTimeout(
    url,
    {
      ...options,
      headers: {
        ...getGitHubHeaders(Boolean(options.body)),
        ...(options.headers || {}),
      },
    },
    30000,
  );

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {
      raw: text,
    };
  }

  return {
    response,
    data,
  };
}

async function fetchGitHubInventoryFile() {
  const { token, owner, repo, branch, path } = getGitHubConfig();

  if (!token) {
    return {
      success: false,
      status: null,
      sha: null,
      inventory: {
        vehicles: [],
      },
      error: "GITHUB_TOKEN is not set",
    };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const { response, data } = await githubApi(
    `${apiUrl}?ref=${encodeURIComponent(branch)}&t=${Date.now()}`,
  );

  if (!response.ok) {
    return {
      success: false,
      status: response.status,
      sha: null,
      inventory: {
        vehicles: [],
      },
      error: data,
    };
  }

  try {
    if (!data.content || !data.sha) {
      throw new Error("GitHub file content/SHA missing");
    }

    const inventory = JSON.parse(
      Buffer.from(
        String(data.content).replace(/\n/g, ""),
        "base64",
      ).toString("utf8"),
    );

    if (!Array.isArray(inventory.vehicles) || inventory.readError) {
      throw new Error("inventory.vehicles is invalid");
    }

    return {
      success: true,
      status: response.status,
      sha: data.sha,
      inventory,
      error: "",
    };
  } catch (error) {
    return {
      success: false,
      status: response.status,
      sha: null,
      inventory: null,
      error: error.message || String(error),
    };
  }
}

async function fetchCurrentInventoryFromGitHub() {
  const result = await fetchGitHubInventoryFile();

  if (!result.success) {
    throw new Error(
      `既存在庫の読込失敗: ${JSON.stringify(result.error)}`,
    );
  }

  return {
    sha: result.sha,
    inventory: result.inventory,
    readStatus: result.status,
    readError: "",
  };
}

async function commitInventoryToGitHub(inventoryData, existingSha, message) {
  const { owner, repo, branch, path } = getGitHubConfig();

  if (!existingSha) {
    throw new Error("SHA未確認のため保存を中止しました");
  }

  const { response, data } = await githubApi(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        branch,
        sha: existingSha,
        content: Buffer.from(
          JSON.stringify(inventoryData, null, 2),
          "utf8",
        ).toString("base64"),
      }),
    },
  );

  // 競合時に最新SHAだけ取り直して古い内容を上書きしない。
  return {
    saved: response.ok,
    status: response.status,
    contentSha: data.content?.sha || "",
    commit: data.commit?.html_url || "",
    error: response.ok ? "" : data.message || "GitHub save failed",
  };
}

async function readUpdateLock() {
  const { token, owner, repo } = getGitHubConfig();

  if (!token) {
    return {
      locked: false,
      available: false,
      error: "GITHUB_TOKEN is not set",
    };
  }

  const refUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/${LOCK_REF_NAME}`;
  const { response, data } = await githubApi(refUrl);

  if (response.status === 404) {
    return {
      locked: false,
      available: true,
      error: "",
    };
  }

  if (!response.ok) {
    return {
      locked: false,
      available: false,
      error: data,
    };
  }

  const refSha = data.object?.sha || "";
  let createdAt = "";
  let runId = "";
  let trigger = "";

  if (data.object?.type === "tag" && refSha) {
    const tagUrl = `https://api.github.com/repos/${owner}/${repo}/git/tags/${refSha}`;
    const tagResult = await githubApi(tagUrl);

    if (tagResult.response.ok) {
      createdAt = tagResult.data.tagger?.date || "";

      try {
        const parsed = JSON.parse(tagResult.data.message || "{}");
        runId = parsed.runId || "";
        trigger = parsed.trigger || "";
      } catch {
        runId = "";
      }
    }
  }

  const createdTime = createdAt ? new Date(createdAt).getTime() : 0;
  const ageMs = createdTime ? Date.now() - createdTime : 0;

  return {
    locked: true,
    available: true,
    refSha,
    createdAt,
    ageMs,
    stale: Boolean(createdTime && ageMs > LOCK_TTL_MS),
    runId,
    trigger,
    error: "",
  };
}

async function deleteUpdateLock(expectedRefSha = "") {
  const { owner, repo } = getGitHubConfig();
  const current = await readUpdateLock();

  if (!current.locked) {
    return {
      deleted: true,
      reason: "lock already absent",
    };
  }

  if (expectedRefSha && current.refSha !== expectedRefSha) {
    return {
      deleted: false,
      reason: "lock belongs to another run",
    };
  }

  const deleteUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs/${LOCK_REF_NAME}`;

  const { response, data } = await githubApi(deleteUrl, {
    method: "DELETE",
  });

  return {
    deleted: response.ok || response.status === 404,
    status: response.status,
    error: response.ok ? "" : data,
  };
}

async function acquireUpdateLock(runId, trigger) {
  const { token, owner, repo, branch } = getGitHubConfig();

  if (!token) {
    return {
      acquired: false,
      error: "GITHUB_TOKEN is not set",
    };
  }

  const current = await readUpdateLock();

  if (!current.available) {
    return {
      acquired: false,
      running: false,
      error: current.error || "ロック確認失敗",
    };
  }

  if (current.locked && !current.stale) {
    return {
      acquired: false,
      running: true,
      current,
      error: "",
    };
  }

  if (current.locked && current.stale) {
    await deleteUpdateLock(current.refSha);
  }

  const branchRefUrl = `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(
    branch,
  )}`;

  const branchResult = await githubApi(branchRefUrl);

  if (!branchResult.response.ok) {
    return {
      acquired: false,
      running: false,
      error: branchResult.data,
    };
  }

  const commitSha = branchResult.data.object?.sha;

  if (!commitSha) {
    return {
      acquired: false,
      running: false,
      error: "main commit SHA not found",
    };
  }

  const createdAt = new Date().toISOString();
  const tagObjectUrl = `https://api.github.com/repos/${owner}/${repo}/git/tags`;

  const tagResult = await githubApi(tagObjectUrl, {
    method: "POST",
    body: JSON.stringify({
      tag: `cartopia-inventory-update-${runId}`,
      message: JSON.stringify({
        runId,
        trigger,
        createdAt,
      }),
      object: commitSha,
      type: "commit",
      tagger: {
        name: "CARTOPIA Inventory Updater",
        email: "cartopia@example.invalid",
        date: createdAt,
      },
    }),
  });

  if (!tagResult.response.ok) {
    return {
      acquired: false,
      running: false,
      error: tagResult.data,
    };
  }

  const tagObjectSha = tagResult.data.sha;
  const createRefUrl = `https://api.github.com/repos/${owner}/${repo}/git/refs`;

  const refResult = await githubApi(createRefUrl, {
    method: "POST",
    body: JSON.stringify({
      ref: `refs/${LOCK_REF_NAME}`,
      sha: tagObjectSha,
    }),
  });

  if (refResult.response.ok) {
    return {
      acquired: true,
      running: true,
      runId,
      trigger,
      createdAt,
      refSha: tagObjectSha,
      error: "",
    };
  }

  if (refResult.response.status === 409 || refResult.response.status === 422) {
    const existing = await readUpdateLock();

    return {
      acquired: false,
      running: true,
      current: existing,
      error: "",
    };
  }

  return {
    acquired: false,
    running: false,
    error: refResult.data,
  };
}

function mergeVehicles(publicVehicles, savedVehicles) {
  return uniqueByStockId([...(publicVehicles || []), ...(savedVehicles || [])]);
}

function summarizeTypeResults(vehicles) {
  return {
    success: vehicles.filter((vehicle) => vehicle.typeResult?.success).length,
    failed: vehicles.filter((vehicle) => !vehicle.typeResult?.success).length,
    timeout: vehicles.filter((vehicle) => vehicle.typeResult?.timeout).length,
  };
}

function summarizeGradeExtraInfo(vehicles) {
  return {
    found: vehicles.filter((vehicle) => vehicle.gradeExtraInfo).length,
    missing: vehicles.filter((vehicle) => !vehicle.gradeExtraInfo).length,
  };
}

function summarizeSavedDetailFields(vehicles) {
  const saved = vehicles.filter(
    (vehicle) => vehicle.sourceStatus === "一時保存",
  );

  return {
    total: saved.length,
    gradeNameFound: saved.filter((vehicle) => vehicle.gradeName).length,
    gradeNameMissing: saved.filter((vehicle) => !vehicle.gradeName).length,
    yearFound: saved.filter((vehicle) => vehicle.year).length,
    yearMissing: saved.filter((vehicle) => !vehicle.year).length,
    colorFound: saved.filter((vehicle) => vehicle.color).length,
    colorMissing: saved.filter((vehicle) => !vehicle.color).length,
    mileageFound: saved.filter((vehicle) => vehicle.mileage).length,
    mileageMissing: saved.filter((vehicle) => !vehicle.mileage).length,
    imageFound: saved.filter((vehicle) => vehicle.imageUrl).length,
    imageMissing: saved.filter((vehicle) => !vehicle.imageUrl).length,
    bodyPriceFound: saved.filter((vehicle) => vehicle.bodyPrice).length,
    totalPriceFound: saved.filter((vehicle) => vehicle.totalPrice).length,
    detailFetchFailed: saved.filter(
      (vehicle) => vehicle.detailResult?.success === false,
    ).length,
  };
}

function getTriggerLabel(request) {
  const url = new URL(request.url);
  const source = url.searchParams.get("source") || "";

  if (source === "github-actions") return "GitHub Actions自動更新";

  const cronHeader = request.headers.get("x-vercel-cron");
  const userAgent = request.headers.get("user-agent") || "";

  if (cronHeader || userAgent.toLowerCase().includes("vercel-cron")) {
    return "Vercel Cron自動更新";
  }

  return "URL手動更新";
}

function progressOf(state) {
  if (!state) return null;

  return {
    cycleId: state.cycleId,
    phase: state.phase,
    total: state.total || 0,
    completed: state.completed || 0,
    remaining: state.queue?.length || 0,
    failed: state.failed?.length || 0,
    failedStockIds: (state.failed || []).map((item) => item.stockId),
    savedPagesRead: state.nextSavedPage || 0,
    finishedAt: state.finishedAt || "",
  };
}

function inventoryWithProgress(
  inventory,
  state,
  vehicles,
  runId,
  trigger,
  startedAt,
) {
  const now = new Date().toISOString();
  const finished = state.phase === "complete";
  const failed = state.failed.length;

  const publicVehicles = vehicles.filter(
    (v) => v.sourceStatus === "掲載在庫",
  );

  const savedVehicles = vehicles.filter(
    (v) => v.sourceStatus === "一時保存",
  );

  return {
    ...inventory,
    codeVersion: CODE_VERSION,
    revision: CODE_REVISION,
    source: "motorgate",
    updateMode: "resumable-batch",
    syncState: state,

    // 一覧収集中は従来のデータ更新日時を維持する。
    updatedAt: state.phase === "listing" ? inventory.updatedAt : now,

    lastUpdateStatus: {
      success: finished && !failed,
      statusText: finished
        ? failed
          ? "更新終了・一部取得失敗"
          : "全件更新完了"
        : "分割更新中",
      runId,
      trigger,
      startedAt,
      finishedAt: now,
      durationSeconds: Math.round(
        (Date.now() - Date.parse(startedAt)) / 1000,
      ),
      error: failed
        ? `${failed}台の詳細取得に失敗。既存情報を保持しています。`
        : "",
      timeout: false,
      progress: progressOf(state),
      typeFailed: summarizeTypeResults(vehicles).failed,
      typeTimeout: summarizeTypeResults(vehicles).timeout,
    },

    counts: {
      publicVehicles: publicVehicles.length,
      savedVehicles: savedVehicles.length,
      vehicles: vehicles.length,
      publicFoundRows: state.publicCount || 0,
    },

    checks: {
      savedPages: state.pages,
      typeResults: summarizeTypeResults(vehicles),
      gradeExtraInfo: summarizeGradeExtraInfo(vehicles),
      savedListFields: summarizeSavedListFields(vehicles),
      savedDetailFields: summarizeSavedDetailFields(vehicles),
    },

    vehicles,
  };
}

async function runInventoryUpdate({
  runId,
  trigger,
  requestStartedAt = Date.now(),
}) {
  const startedAt = new Date().toISOString();
  const stopAt = requestStartedAt + WORK_BUDGET_MS;

  let current = null;
  let stage = "GitHub既存在庫読込";
  let processed = 0;
  let github = { saved: false };
  let writeUncertain = false;

  try {
    current = await fetchCurrentInventoryFromGitHub();

    let state = current.inventory.syncState;

    // 前回版の進捗はそのまま使わず、既存在庫を保持して一覧から作り直す。
    if (!state || state.version !== 2 || state.phase === "complete") {
      state = {
        version: 2,
        cycleId: runId,
        startedAt,
        phase: "listing",
        publicLoaded: false,
        publicCount: 0,
        nextSavedPage: 0,
        pages: [],
        listed: [],
        queue: [],
        completed: 0,
        total: 0,
        failed: [],
      };
    } else {
      state = structuredClone(state);
    }

    let vehicles = current.inventory.vehicles;

    async function checkpoint() {
      const next = structuredClone(
        inventoryWithProgress(
          current.inventory,
          state,
          vehicles,
          runId,
          trigger,
          startedAt,
        ),
      );

      stage = "GitHub途中保存";
      writeUncertain = true;

      github = await commitInventoryToGitHub(
        next,
        current.sha,
        `在庫分割更新 ${state.completed}/${state.total} ${runId}`,
      );

      if (!github.saved || !github.contentSha) {
        throw new Error(`保存失敗: ${github.status} ${github.error}`);
      }

      current = {
        ...current,
        sha: github.contentSha,
        inventory: next,
      };

      writeUncertain = false;
    }

    stage = "MOTOR GATEログイン";

    console.log(
      JSON.stringify({
        event: "inventory-stage",
        runId,
        stage,
        revision: CODE_REVISION,
      }),
    );

    const { jar, loginStatus } = await loginMotorgate();

    if (loginStatus !== 302) {
      throw new Error(`ログイン異常: HTTP ${loginStatus}`);
    }

    // 一覧もページ単位で確定保存。途中失敗時は同じページから再開。
    while (state.phase === "listing" && Date.now() + 65000 < stopAt) {
      if (!state.publicLoaded) {
        stage = "掲載在庫一覧取得";

        const result = await fetchPublicVehicles(jar);

        state.listed = result.vehicles;
        state.publicCount = result.vehicles.length;
        state.publicLoaded = true;
      } else {
        stage = `一時保存一覧${state.nextSavedPage + 1}ページ取得`;

        const pageUrl = SAVED_LIST_URLS[state.nextSavedPage];

        if (!pageUrl) {
          throw new Error(
            "一時保存一覧のページ上限に到達しました。全件確認まで既存在庫を保持します。",
          );
        }

        const page = await fetchSavedPage(jar, pageUrl);

        const previousIds = new Set(
          state.listed
            .filter((v) => v.sourceStatus === "一時保存")
            .map((v) => v.stockId),
        );

        const newVehicles = page.vehicles.filter(
          (v) => !previousIds.has(v.stockId),
        );

        if (
          !page.count &&
          state.nextSavedPage === 0 &&
          vehicles.some((v) => v.sourceStatus === "一時保存")
        ) {
          throw new Error(
            "一時保存が突然0件になりました。誤削除防止のため停止します。",
          );
        }

        // ページ範囲外で直前のページが返る挙動に対応。
        // 最終ページが25台でも、同じ車両一覧なら終了と判断する。
        const repeated = page.count > 0 && !newVehicles.length;

        if (repeated) {
          const previousPage = state.pages.at(-1);

          const ids = page.vehicles
            .map((v) => v.stockId)
            .sort()
            .join(",");

          if (!previousPage || previousPage.ids !== ids) {
            throw new Error(
              "一時保存のページ送りを確認できません。誤削除防止のため停止します。",
            );
          }
        }

        state.pages.push({
          pageUrl,
          count: page.count,
          newCount: newVehicles.length,
          ids: page.vehicles
            .map((v) => v.stockId)
            .sort()
            .join(","),
        });

        state.listed = mergeVehicles(state.listed, page.vehicles);
        state.nextSavedPage += 1;

        if (!page.count || repeated) {
          const oldMap = new Map(
            vehicles.map((v) => [v.stockId, v]),
          );

          // 両一覧が揃った時だけ消えた車を除外する。
          // 失敗ページではここに到達しない。
          vehicles = state.listed.map((v) => {
            const old = oldMap.get(v.stockId);

            return {
              ...old,
              ...mergePreviousVehicle(v, old),
              updatedAt: old?.updatedAt || null,
              detailResult: old?.detailResult || null,
              typeResult: old?.typeResult || null,
              listUpdatedAt: new Date().toISOString(),
            };
          });

          state.queue = state.listed.map((vehicle) => ({
            vehicle,
            attempts: 0,
          }));

          state.total = state.queue.length;
          state.phase = state.queue.length ? "details" : "complete";

          // 同じ一覧を二重保存しない。
          state.listed = [];
        }
      }

      await checkpoint();
    }

    // 今回の最大10台を固定する。
    // 失敗車は末尾へ回し、同じ呼出しでは再試行しない。
    const batch =
      state.phase === "details"
        ? state.queue.slice(0, BATCH_SIZE)
        : [];

    for (
      let offset = 0;
      offset < batch.length;
      offset += DETAIL_CONCURRENCY
    ) {
      if (Date.now() + VEHICLE_BUDGET_MS + 35000 >= stopAt) {
        break;
      }

      const wave = batch.slice(offset, offset + DETAIL_CONCURRENCY);
      stage = "車両詳細取得";

      const oldMap = new Map(
        vehicles.map((v) => [v.stockId, v]),
      );

      const results = await Promise.all(
        wave.map(async (item) => {
          try {
            return await fetchVehicleDetail(
              jar,
              item.vehicle,
              oldMap.get(item.vehicle.stockId),
            );
          } catch (error) {
            return {
              ...item.vehicle,
              detailResult: {
                success: false,
                error: error.message,
              },
            };
          }
        }),
      );

      for (let i = 0; i < wave.length; i += 1) {
        const item = wave[i];
        const result = results[i];
        const id = item.vehicle.stockId;

        state.queue = state.queue.filter(
          (queued) => queued.vehicle.stockId !== id,
        );

        // TYPE未設定でも、取得できた車両詳細は保存する。
        // 分類が取れなかった場合は既存の分類を引き継ぐ。
        const ok = result.detailResult?.success === true;

        if (ok) {
          oldMap.set(id, toInventoryVehicle(result));
          state.completed += 1;
        } else {
          const attempts = item.attempts + 1;

          const error =
            result.typeResult?.error ||
            result.detailResult?.error ||
            "今回の車両詳細を取得できませんでした";

          if (attempts < MAX_DETAIL_ATTEMPTS) {
            state.queue.push({
              ...item,
              attempts,
              lastError: error,
            });
          } else {
            state.failed.push({
              stockId: id,
              attempts,
              error,
            });
          }
        }

        processed += 1;
      }

      vehicles = vehicles.map((v) => oldMap.get(v.stockId));

      if (!state.queue.length) {
        state.phase = "complete";
        state.finishedAt = new Date().toISOString();
      }

      await checkpoint();
    }

    return {
      success: true,
      codeVersion: CODE_VERSION,
      runId,
      trigger,
      processed,
      batchLimit: BATCH_SIZE,
      hasMore: state.phase !== "complete",
      cycleSuccess:
        state.phase === "complete" && !state.failed.length,
      progress: progressOf(state),
      github,
      counts: current.inventory.counts,
      lastUpdateStatus: current.inventory.lastUpdateStatus,
      message:
        state.phase === "complete"
          ? "今回の巡回終了"
          : "続きは次の呼び出しで再開します",
    };
  } catch (error) {
    const failure = {
      success: false,
      statusText: "更新失敗・保存済み分を保持",
      runId,
      trigger,
      startedAt,
      finishedAt: new Date().toISOString(),
      error: `${stage}: ${error.message || String(error)}`,
      timeout: isTimeoutError(error),
    };

    // 保存結果不明・SHA競合時には書き戻さない。
    // 成功済みデータの巻き戻しを防止する。
    if (current && !writeUncertain) {
      try {
        github = await commitInventoryToGitHub(
          {
            ...current.inventory,
            lastFailedAt: failure.finishedAt,
            lastUpdateStatus: failure,
          },
          current.sha,
          `在庫更新の通信失敗を記録 ${runId}`,
        );
      } catch {
        // 次回はGitHubの確定済み内容から再開する。
      }
    }

    console.error(
      JSON.stringify({
        event: "inventory-update-failed",
        ...failure,
      }),
    );

    return {
      success: false,
      hasMore: true,
      codeVersion: CODE_VERSION,
      runId,
      processed,
      github,
      lastUpdateStatus: failure,
      error: failure.error,
    };
  }
}

async function buildStatusResponse() {
  const current = await fetchCurrentInventoryFromGitHub();
  const lock = await readUpdateLock();

  const savedPriceSamples = (current.inventory?.vehicles || [])
    .filter((vehicle) => vehicle.sourceStatus === "一時保存")
    .slice(0, 5)
    .map((vehicle) => ({
      stockId: vehicle.stockId,
      carName: vehicle.carName,
      gradeName: vehicle.gradeName,
      bodyPrice: vehicle.bodyPrice,
      totalPrice: vehicle.totalPrice,
    }));

  return {
    success: true,
    codeVersion: CODE_VERSION,
    running: Boolean(lock.locked && !lock.stale),
    lock: {
      locked: Boolean(lock.locked),
      stale: Boolean(lock.stale),
      runId: lock.runId || "",
      trigger: lock.trigger || "",
      createdAt: lock.createdAt || "",
      ageSeconds: lock.ageMs ? Math.round(lock.ageMs / 1000) : 0,
    },
    inventory: {
      codeVersion: current.inventory?.codeVersion || "",
      updatedAt: current.inventory?.updatedAt || "",
      counts: current.inventory?.counts || {},
      lastUpdateStatus: current.inventory?.lastUpdateStatus || null,
      checks: current.inventory?.checks || {},
      revision: current.inventory?.revision || "",
      progress: progressOf(current.inventory?.syncState),
      savedPriceSamples,
    },
  };
}

async function handleGet(request) {
  const requestStartedAt = Date.now();
  const url = new URL(request.url);
  const statusOnly = url.searchParams.get("status") === "1";

  if (statusOnly) {
    return json(await buildStatusResponse());
  }

  const save = url.searchParams.get("save") === "1";

  if (!save) {
    return json({
      success: true,
      codeVersion: CODE_VERSION,
      message:
        "在庫更新を開始する場合は ?save=1、状態確認は ?status=1 を付けてください。",
      startPath: "/api/inventory/update?save=1",
      statusPath: "/api/inventory/update?status=1",
    });
  }

  const wait = url.searchParams.get("wait") === "1";
  const runId = createRunId();
  const trigger = getTriggerLabel(request);
  const lock = await acquireUpdateLock(runId, trigger);

  if (!lock.acquired && lock.running) {
    return json(
      {
        success: true,
        accepted: false,
        running: true,
        codeVersion: CODE_VERSION,
        message: "すでに在庫更新が実行中です。二重実行は停止しました。",
        currentRunId: lock.current?.runId || "",
        currentTrigger: lock.current?.trigger || "",
        currentStartedAt: lock.current?.createdAt || "",
        statusPath: "/api/inventory/update?status=1",
      },
      202,
    );
  }

  if (!lock.acquired) {
    return json(
      {
        success: false,
        accepted: false,
        running: false,
        codeVersion: CODE_VERSION,
        message: "更新ロックの取得に失敗しました。",
        error: lock.error || "",
      },
      500,
    );
  }

  const execute = async () => {
    try {
      return await runInventoryUpdate({
        runId,
        trigger,
        requestStartedAt,
      });
    } finally {
      try {
        await deleteUpdateLock(lock.refSha);
      } catch (error) {
        console.error(
          "ロック解除失敗（有効期限後に再試行）",
          error.message,
        );
      }
    }
  };

  if (wait) {
    const result = await execute();
    return json(result, result.success ? 200 : 500);
  }

  after(async () => {
    await execute();
  });

  return json(
    {
      success: true,
      accepted: true,
      running: true,
      codeVersion: CODE_VERSION,
      runId,
      trigger,
      message:
        "最大10台の分割更新を開始しました。残りは次の更新呼び出しで再開します。",
      statusPath: "/api/inventory/update?status=1",
    },
    202,
  );
}

export async function GET(request) {
  try {
    return await handleGet(request);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "inventory-request-failed",
        revision: CODE_REVISION,
        error: error.message || String(error),
      }),
    );

    return json(
      {
        success: false,
        codeVersion: CODE_VERSION,
        error: error.message || String(error),
        message:
          "更新開始前または状態確認中に失敗しました。エラー内容を確認してください。",
      },
      500,
    );
  }
}
