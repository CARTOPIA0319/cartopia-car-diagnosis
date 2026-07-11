export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BASE_URL = "https://motorgate.jp";
const PUBLIC_LIST_URL = `${BASE_URL}/stock/newsearch/stocklist/index/1/100`;
const SAVED_LIST_URLS = Array.from({ length: 10 }, (_, index) =>
  index === 0
    ? `${BASE_URL}/stock/savelist`
    : `${BASE_URL}/stock/savelist/index/${index + 1}`
);
const SAVED_DETAIL_CONCURRENCY = 4;
const SAVED_DETAIL_RETRIES = 2;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

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
  return text.includes("timeout") || text.includes("abort");
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}


function addCookies(jar, setCookieText) {
  if (!setCookieText) return jar;

  for (const piece of String(setCookieText).split(/,\s*(?=[^;,]+=)/)) {
    const first = piece.split(";")[0].trim();
    const eq = first.indexOf("=");
    if (eq <= 0) continue;

    const name = first.slice(0, eq);
    const value = first.slice(eq + 1);
    if (value === "deleted") delete jar[name];
    else jar[name] = value;
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
  if (text.includes("euc-jp")) return "euc-jp";
  return "utf-8";
}

async function readResponseText(response) {
  const buffer = await response.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  const contentType = response.headers.get("content-type") || "";
  let charset = contentType.match(/charset\s*=\s*([^;\s]+)/i)?.[1] || "";

  if (!charset) {
    const head = Buffer.from(bytes.slice(0, 4096)).toString("latin1");
    charset =
      head.match(/charset=["']?\s*([^\s"'/>]+)/i)?.[1] || "utf-8";
  }

  try {
    return new TextDecoder(normalizeCharset(charset), { fatal: false }).decode(
      bytes
    );
  } catch {
    return new TextDecoder("utf-8", { fatal: false }).decode(bytes);
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
      String.fromCodePoint(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCodePoint(parseInt(num, 10)));
}

function cleanHtmlToText(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|li|td|th|tr|dt|dd)>/gi, "\n")
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n[ \t]+|[ \t]+\n/g, "\n")
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
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith("//")) return `https:${src}`;
  return new URL(src, baseUrl).toString();
}

function fixBasicMojibake(text) {
  return String(text || "")
    .replace(/è·ï½´/g, "å¹´")
    .replace(/è­ï¿½/g, "æ")
    .replace(/è³â«/g, "ä¸K")
    .replace(/è³ï¿½ï¿½/g, "ä¸å")
    .replace(/è®ï¿½/g, "æ¤")
    .replace(/éé ï½¤æç´è¯å©ï½»ï¿½/g, "è»æ¤æ´åä»")
    .replace(/èï½¡è­¬ï½¼/g, "ä¾¡æ ¼")
    .replace(/é±åï½¡ï¿½/g, "ç·é¡")
    .trim();
}

function toHalfWidthAscii(text) {
  return String(text || "").replace(/[ï¼-ï½]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
}

function normalizeTypeText(text) {
  return fixBasicMojibake(
    decodeHtmlEntities(String(text || ""))
      .replace(/[ï¼´ï¼¹ï¼°ï¼¥ï¼¶ï¼¨ï¼³ï¼µ]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0xfee0)
      )
      .replace(/[ï½ï½ï½ï½ï½ï½ï½ï½]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0xfee0)
      )
      .replace(/ï¼/g, ":")
      .replace(/[\r\nã]/g, " ")
  );
}

function normalizeTypeKey(type) {
  const value = toHalfWidthAscii(String(type || ""))
    .replace(/ï¼/g, ":")
    .replace(/ã/g, " ")
    .trim();

  if (/^suv$/i.test(value)) return "SUV";
  if (/^e[vï½]ã»h[vï½]$/i.test(value)) return "EVã»HV";
  return value;
}

function extractTypesFromText(text) {
  const fixed = normalizeTypeText(text);
  const types = [];
  const regex = /TYPE\s*:\s*([^\s<>"'&]+)/gi;
  let match;

  while ((match = regex.exec(fixed)) !== null) {
    const value = compactText(match[1]).replace(/[ã,ã]/g, "");
    if (
      value &&
      !/[._â¦]/.test(value) &&
      !types.includes(value)
    ) {
      types.push(value);
    }
  }

  return types;
}

function buildTypeKeys(types) {
  return Array.from(
    new Set((types || []).map(normalizeTypeKey).filter(Boolean))
  );
}

function uniqueByStockId(vehicles) {
  const map = new Map();
  for (const vehicle of vehicles || []) {
    if (vehicle?.stockId) map.set(vehicle.stockId, vehicle);
  }
  return Array.from(map.values());
}

function escapeRegExp(value) {
  return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractAttribute(tagHtml, attributeName) {
  const regex = new RegExp(
    `${escapeRegExp(attributeName)}\\s*=\\s*["']([^"']*)["']`,
    "i"
  );
  return decodeHtmlEntities(String(tagHtml || "").match(regex)?.[1] || "");
}

function extractRawHrefValues(html) {
  return Array.from(
    String(html || "").matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi)
  )
    .map((match) => decodeHtmlEntities(match[1]))
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
    .map((match) => absoluteUrl(decodeHtmlEntities(match[1]), baseUrl))
    .filter(Boolean);
}

function findFirstUrl(urls, text) {
  return (urls || []).find((url) => url.includes(text)) || "";
}

function extractTdByClass(rowHtml, className) {
  const regex = new RegExp(
    `<td\\b[^>]*class=["'][^"']*${escapeRegExp(className)}[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
    "i"
  );
  return String(rowHtml || "").match(regex)?.[1] || "";
}

function extractLiTexts(html) {
  return Array.from(String(html || "").matchAll(/<li\b[^>]*>([\s\S]*?)<\/li>/gi))
    .map((match) => compactText(cleanHtmlToText(match[1])))
    .filter(Boolean);
}

function extractSpanById(html, idPart) {
  const regex = new RegExp(
    `<span\\b[^>]*id=["'][^"']*${escapeRegExp(idPart)}[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`,
    "i"
  );
  return compactText(cleanHtmlToText(String(html || "").match(regex)?.[1] || ""));
}

function extractQualityImageMap(html, baseUrl) {
  const map = {};
  const inputs =
    String(html || "").match(
      /<input\b[^>]*name=["']quality_img_url\[\]["'][^>]*>/gi
    ) || [];

  for (const input of inputs) {
    const id =
      input.match(/data-quality-img-url-id=["']([^"']+)["']/i)?.[1] ||
      input.match(/id=["']quality_img_url_([^"']+)["']/i)?.[1] ||
      "";
    const value = input.match(/value=["']([^"']+)["']/i)?.[1] || "";
    if (id && value) map[id] = absoluteUrl(decodeHtmlEntities(value), baseUrl);
  }

  return map;
}

function getQueryParamDecoded(urlText, name) {
  const match = decodeHtmlEntities(String(urlText || "")).match(
    new RegExp(`[?&]${escapeRegExp(name)}=([^&#"']*)`, "i")
  );

  if (!match) return "";
  try {
    return fixBasicMojibake(decodeURIComponent(match[1].replace(/\+/g, "%20")));
  } catch {
    return fixBasicMojibake(match[1]);
  }
}

function extractVehicleRows(html) {
  const rows = [];
  const regex =
    /<tr\b[^>]*id=["']tr_([A-Za-z0-9]+)["'][^>]*>([\s\S]*?)(?=<tr\b[^>]*id=["']tr_[A-Za-z0-9]+["']|<\/tbody>|<\/table>)/gi;
  let match;

  while ((match = regex.exec(String(html || ""))) !== null) {
    rows.push({ stockId: match[1], rowHtml: match[0] });
  }

  return rows;
}

function normalizeLooseKey(value) {
  return toHalfWidthAscii(String(value || ""))
    .toLowerCase()
    .replace(/[\s_\-:[\]ï¼ï¼()]/g, "");
}

function extractSelectedOption(selectHtml) {
  const options = Array.from(
    String(selectHtml || "").matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/gi)
  );
  const selected = options.find((option) => /\bselected\b/i.test(option[1] || ""));
  if (!selected) return { value: "", text: "" };

  return {
    value: extractAttribute(selected[1], "value"),
    text: compactText(cleanHtmlToText(selected[2])),
  };
}

function extractControls(html) {
  const source = String(html || "");
  const controls = [];

  for (const match of source.matchAll(/<input\b([^>]*)>/gi)) {
    const attrs = match[1] || "";
    const type = extractAttribute(attrs, "type").toLowerCase();
    if ((type === "radio" || type === "checkbox") && !/\bchecked\b/i.test(attrs)) {
      continue;
    }

    controls.push({
      name: extractAttribute(attrs, "name"),
      id: extractAttribute(attrs, "id"),
      className: extractAttribute(attrs, "class"),
      value: compactText(cleanHtmlToText(extractAttribute(attrs, "value"))),
      text: "",
    });
  }

  for (const match of source.matchAll(/<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi)) {
    const attrs = match[1] || "";
    controls.push({
      name: extractAttribute(attrs, "name"),
      id: extractAttribute(attrs, "id"),
      className: extractAttribute(attrs, "class"),
      value: compactText(cleanHtmlToText(match[2])),
      text: "",
    });
  }

  for (const match of source.matchAll(/<select\b([^>]*)>([\s\S]*?)<\/select>/gi)) {
    const attrs = match[1] || "";
    const selected = extractSelectedOption(match[2]);
    controls.push({
      name: extractAttribute(attrs, "name"),
      id: extractAttribute(attrs, "id"),
      className: extractAttribute(attrs, "class"),
      value: selected.value,
      text: selected.text,
    });
  }

  return controls;
}

function findFieldRegion(html, labels) {
  const source = String(html || "");

  for (const label of labels) {
    const index = source.indexOf(label);
    if (index < 0) continue;

    for (const [startTag, endTag] of [
      ["<tr", "</tr>"],
      ["<li", "</li>"],
      ["<dl", "</dl>"],
      ["<fieldset", "</fieldset>"],
    ]) {
      const start = source.lastIndexOf(startTag, index);
      const end = source.indexOf(endTag, index);
      if (start >= 0 && end >= 0 && end + endTag.length - start <= 12000) {
        return source.slice(start, end + endTag.length);
      }
    }

    return source.slice(Math.max(0, index - 500), Math.min(source.length, index + 5000));
  }

  return "";
}

function controlsByKeys(html, keys) {
  const targets = keys.map(normalizeLooseKey).filter(Boolean);
  return extractControls(html).filter((control) => {
    const key = normalizeLooseKey(`${control.name} ${control.id} ${control.className}`);
    return targets.some((target) => key.includes(target));
  });
}

function controlValues(controls) {
  const values = [];

  for (const control of controls || []) {
    for (const raw of [control.text, control.value]) {
      const value = compactText(raw);
      if (
        value &&
        !/^(é¸æ|é¸æãã¦ãã ãã|æªé¸æ|ãªã|--|---|0)$/i.test(value) &&
        !values.includes(value)
      ) {
        values.push(value);
      }
    }
  }

  return values;
}

function extractValueByNames(html, names) {
  const controls = extractControls(html);
  const targets = names.map(normalizeLooseKey).filter(Boolean);

  for (const control of controls) {
    const name = normalizeLooseKey(control.name);
    const id = normalizeLooseKey(control.id);
    if (!targets.some((target) => name === target || id === target)) continue;

    const value = compactText(control.text || control.value);
    if (value) return value;
  }

  for (const control of controls) {
    const name = normalizeLooseKey(control.name);
    const id = normalizeLooseKey(control.id);
    if (
      !targets.some(
        (target) =>
          target.length >= 5 && (name.includes(target) || id.includes(target))
      )
    ) {
      continue;
    }

    const value = compactText(control.text || control.value);
    if (value) return value;
  }

  return "";
}

function extractValueNearLabels(html, labels) {
  const region = findFieldRegion(html, labels);
  const values = controlValues(extractControls(region));
  if (values.length) return values[0];

  let text = compactText(cleanHtmlToText(region));
  for (const label of labels) {
    text = text.replace(
      new RegExp(`^.*?${escapeRegExp(label)}\\s*[ï¼:]?\\s*`, "i"),
      ""
    );
  }
  return text;
}

function parseYear(value) {
  const text = compactText(value);
  const western = text.match(/((?:19|20)\d{2})\s*(?:å¹´|[\/-])?\s*([01]?\d)?/);
  if (western) {
    const month = Number(western[2] || 0);
    return {
      year: Number(western[1]),
      month: month >= 1 && month <= 12 ? month : null,
    };
  }

  const era = text.match(/(ä»¤å|å¹³æ|æ­å)\s*(å|\d+)\s*å¹´?\s*([01]?\d)?/);
  if (!era) return null;

  const eraYear = era[2] === "å" ? 1 : Number(era[2]);
  const base = era[1] === "ä»¤å" ? 2018 : era[1] === "å¹³æ" ? 1988 : 1925;
  const month = Number(era[3] || 0);

  return {
    year: base + eraYear,
    month: month >= 1 && month <= 12 ? month : null,
  };
}


function extractRegistrationYear(html) {
  const labels = [
    "ååº¦ç»é²å¹´æ",
    "åå¹´åº¦ç»é²å¹´æ",
    "ååº¦ç»é²",
    "åå¹´åº¦ç»é²",
    "ååº¦æ¤æ»å¹´æ",
    "å¹´å¼",
  ];
  const keys = [
    "nenshiki",
    "syodo",
    "shodo",
    "firstregistration",
    "firstregist",
    "registrationyear",
    "registyear",
    "modelyear",
    "year",
  ];

  const region = findFieldRegion(html, labels);
  const controls = [
    ...extractControls(region),
    ...controlsByKeys(html, keys),
  ];
  const values = controlValues(controls);

  for (const value of values) {
    const parsed = parseYear(value);
    if (parsed) {
      return parsed.month
        ? `${parsed.year}å¹´${String(parsed.month).padStart(2, "0")}æ`
        : `${parsed.year}å¹´`;
    }
  }

  const joined = values.join(" ");
  const eraName = joined.match(/ä»¤å|å¹³æ|æ­å/)?.[0] || "";
  if (eraName) {
    const numericValues = values
      .map((value) =>
        value.includes("å")
          ? 1
          : Number(toHalfWidthAscii(value).replace(/[^0-9]/g, ""))
      )
      .filter((value) => Number.isFinite(value) && value >= 1);

    const eraYear = numericValues.find((value) => value <= 99);
    const month = numericValues.find(
      (value, index) => index > 0 && value >= 1 && value <= 12
    );

    if (eraYear) {
      const base =
        eraName === "ä»¤å" ? 2018 : eraName === "å¹³æ" ? 1988 : 1925;
      const westernYear = base + eraYear;
      return month
        ? `${westernYear}å¹´${String(month).padStart(2, "0")}æ`
        : `${westernYear}å¹´`;
    }
  }

  const numericValues = values
    .map((value) => Number(toHalfWidthAscii(value).replace(/[^0-9]/g, "")))
    .filter(Number.isFinite);
  const year = numericValues.find((value) => value >= 1920 && value <= 2035);
  const month = numericValues.find(
    (value) => value >= 1 && value <= 12 && value !== year
  );

  if (year) {
    return month
      ? `${year}å¹´${String(month).padStart(2, "0")}æ`
      : `${year}å¹´`;
  }

  const parsed = parseYear(cleanHtmlToText(region));
  if (!parsed) return "";

  return parsed.month
    ? `${parsed.year}å¹´${String(parsed.month).padStart(2, "0")}æ`
    : `${parsed.year}å¹´`;
}

function cleanColor(value) {
  let text = compactText(fixBasicMojibake(value))
    .replace(
      /^(è»ä½è²|ããã£ã«ã©ã¼|ããã£ã¼ã«ã©ã¼|å¤è£è²|ã«ã©ã¼|è²)\s*[ï¼:]?\s*/,
      ""
    )
    .replace(/(ã«ã©ã¼ã³ã¼ã|è²ã³ã¼ã)[\s\S]*$/, "")
    .trim();

  for (const stop of [
    "ååº¦ç»é²",
    "åå¹´åº¦ç»é²",
    "å¹´å¼",
    "èµ°è¡è·é¢",
    "èµ°è¡",
    "è»æ¤",
    "ææ°é",
    "ä¾¡æ ¼",
    "æ¯æç·é¡",
    "åå¼",
    "ã°ã¬ã¼ã",
    "ä¿®å¾©æ­´",
  ]) {
    const index = text.indexOf(stop);
    if (index > 0) text = text.slice(0, index).trim();
  }

  return text.slice(0, 100);
}

function colorScore(value, control = null) {
  const text = compactText(value);
  if (!text || /^(é¸æ|é¸æãã¦ãã ãã|æªé¸æ|ãªã|ãã®ä»|--|---)$/i.test(text)) {
    return -999;
  }
  if (/^#[0-9a-f]{3,8}$/i.test(text) || /^\d+$/.test(text)) return -999;

  let score = Math.min(text.length, 40);
  if (/[ã-ãã¡-ã¶ä¸-é¾ ]/.test(text)) score += 40;
  if (
    /(ãã¼ã«|ã¡ã¿ãªãã¯|ãã©ãã¯|ãã¯ã¤ã|ã·ã«ãã¼|ã°ã¬ã¼|ãã«ã¼|ã¬ãã|ãã©ã¦ã³|ãã¼ã¸ã¥|ãã¤ã«|ã¯ãªã¹ã¿ã«|ã¢ã¤ããªã¼|ã°ãªã¼ã³|ãªã¬ã³ã¸|ã¤ã¨ã­ã¼|ãã³ã¯|ãã¼ãã«|ã´ã¼ã«ã|ã«ã¼ã­|ãã­ã³ãº)/.test(
      text
    )
  ) {
    score += 35;
  }

  if (control) {
    const key = normalizeLooseKey(`${control.name} ${control.id}`);
    if (key.includes("name")) score += 10;
    if (key.includes("color") || key.includes("iro")) score += 10;
    if (key.includes("code")) score -= 30;
  }

  return score;
}

function extractBodyColor(html) {
  const labels = [
    "è»ä½è²",
    "ããã£ã«ã©ã¼",
    "ããã£ã¼ã«ã©ã¼",
    "å¤è£è²",
    "ã«ã©ã¼",
  ];
  const keys = [
    "bodycolor",
    "carcolor",
    "exteriorcolor",
    "colorname",
    "bodyiro",
    "car_iro",
  ];

  const region = findFieldRegion(html, labels);
  const controls = [
    ...extractControls(region),
    ...controlsByKeys(html, keys),
  ];
  const candidates = [];

  for (const control of controls) {
    for (const raw of [control.text, control.value]) {
      const value = cleanColor(raw);
      const score = colorScore(value, control);
      if (score > -999) candidates.push({ value, score });
    }
  }

  const regionText = cleanColor(cleanHtmlToText(region));
  const regionScore = colorScore(regionText);
  if (regionScore > -999) candidates.push({ value: regionText, score: regionScore });

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.value || "";
}

function normalizePrice(value) {
  const text = compactText(value);
  if (!text) return "";
  if (text.includes("ä¸å")) return text;

  const number = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
  return number ? `${number}ä¸å` : text;
}


function normalizeMileage(value) {
  const text = compactText(toHalfWidthAscii(value))
    .replace(/,/g, "")
    .replace(/\s+/g, "");

  if (!text) return "";
  if (text.includes("èµ°ä¸æ")) return "èµ°ä¸æ";

  const manMatch = text.match(/([0-9]+(?:\.[0-9]+)?)ä¸[ï¼«Kk]?/);
  if (manMatch) {
    const man = Number(manMatch[1]);
    return Number.isFinite(man) ? `${man}ä¸K` : text;
  }

  const numberText = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
  if (!numberText) return text;

  const number = Number(numberText);
  if (!Number.isFinite(number)) return text;

  const looksLikeKm =
    /km|ï¼«ï¼­|ï½ï½/i.test(text) ||
    /èµ°è¡è·é¢|èµ°è¡/.test(text) ||
    number >= 1000;

  if (looksLikeKm) {
    const truncated = Math.floor(number / 1000) / 10;
    return `${truncated.toFixed(1)}ä¸K`;
  }

  return `${number}ä¸K`;
}

function extractFirstMatch(text, regex) {
  const match = String(text || "").match(regex);
  return match ? match[1] || match[0] : "";
}

function extractImageCandidates(html) {
  const urls = [];
  const source = String(html || "");

  for (const match of source.matchAll(
    /https?:\/\/[^"'\\\s>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi
  )) {
    urls.push(decodeHtmlEntities(match[0]));
  }

  for (const match of source.matchAll(
    /value=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi
  )) {
    urls.push(absoluteUrl(decodeHtmlEntities(match[1])));
  }

  return Array.from(new Set(urls))
    .filter((url) => !url.includes("/common/"))
    .filter((url) => !/logo|noimage|nophoto/i.test(url));
}

function extractFirstImageUrl(html) {
  const images = extractImageCandidates(html);
  return chooseBestVehicleImage(images);
}


function extractCommonVehicleDetails(html) {
  const text = cleanHtmlToText(html);

  const mileage = normalizeMileage(
    extractValueByNames(html, [
      "Soukou",
      "SoukouKyori",
      "Mileage",
      "MileageDistance",
      "RunDistance",
    ]) ||
      extractValueNearLabels(html, ["èµ°è¡è·é¢", "èµ°è¡"]) ||
      extractFirstMatch(text, /(\d+(?:\.\d+)?ä¸[ï¼«Kk])/) ||
      extractFirstMatch(
        text,
        /(\d{1,7}(?:,\d{3})*\s*(?:km|ï¼«ï¼­|ï½ï½))/i
      ) ||
      (text.includes("èµ°ä¸æ") ? "èµ°ä¸æ" : "")
  );

  const bodyPrice = normalizePrice(
    extractValueByNames(html, [
      "Kakaku",
      "BodyPrice",
      "VehiclePrice",
      "CarPrice",
    ]) ||
      extractValueNearLabels(html, ["è»ä¸¡æ¬ä½ä¾¡æ ¼", "æ¬ä½ä¾¡æ ¼"]) ||
      extractFirstMatch(
        text,
        /(?:è»ä¸¡æ¬ä½ä¾¡æ ¼|æ¬ä½ä¾¡æ ¼|ä¾¡æ ¼)\s*([0-9]+(?:\.[0-9]+)?ä¸å)/
      )
  );

  const totalPrice = normalizePrice(
    extractValueByNames(html, [
      "TotalPrice",
      "SiharaiTotal",
      "ShiharaiTotal",
      "PaymentTotal",
    ]) ||
      extractValueNearLabels(html, ["æ¯æç·é¡", "ç·é¡"]) ||
      extractFirstMatch(
        text,
        /(?:æ¯æç·é¡|ç·é¡)\s*([0-9]+(?:\.[0-9]+)?ä¸å)/
      )
  );

  const carName =
    extractValueByNames(html, [
      "CarName",
      "Syamei",
      "Shamei",
      "VehicleName",
      "car_name",
    ]) ||
    extractValueNearLabels(html, ["è»å"]) ||
    "";

  const gradeName =
    extractValueByNames(html, [
      "GradeName",
      "Grade",
      "grade_name",
      "Gurade",
    ]) ||
    extractValueNearLabels(html, ["ã°ã¬ã¼ã"]) ||
    "";

  const classificationName =
    extractValueByNames(html, [
      "Katashiki",
      "ClassificationName",
      "ModelCode",
      "classification_name",
    ]) ||
    extractValueNearLabels(html, ["åå¼"]) ||
    "";

  const inspection =
    extractValueByNames(html, [
      "Shaken",
      "Inspection",
      "InspectionDate",
      "Syaken",
    ]) ||
    extractValueNearLabels(html, ["è»æ¤"]) ||
    "";

  const displacement =
    extractValueByNames(html, [
      "Haikiryo",
      "Displacement",
      "EngineDisplacement",
    ]) ||
    extractValueNearLabels(html, ["ææ°é"]) ||
    "";

  return {
    carName,
    gradeName,
    classificationName,
    year: extractRegistrationYear(html),
    mileage,
    color: extractBodyColor(html),
    inspection,
    displacement,
    bodyPrice,
    totalPrice,
    gradeExtraInfo:
      extractValueNearLabels(html, ["ã°ã¬ã¼ãä»å æå ±"]) ||
      extractValueByNames(html, [
        "grade_additional_info",
        "grade_info",
        "GradeAddition",
      ]) ||
      "",
    imageUrl: extractFirstImageUrl(html),
  };
}

function parsePublicVehicleRow(row, baseUrl, qualityImageMap) {
  const { stockId, rowHtml } = row;
  const rawHrefs = extractRawHrefValues(rowHtml);
  const urls = extractHrefValues(rowHtml, baseUrl);
  const rowImages = extractImageValues(rowHtml, baseUrl);
  const rawTireHref =
    rawHrefs.find((href) => href.includes("get_tire_from_car_model")) || "";

  const carName = getQueryParamDecoded(rawTireHref, "car_name");
  const gradeName = getQueryParamDecoded(rawTireHref, "grade_name");
  const classificationName = getQueryParamDecoded(
    rawTireHref,
    "classification_name"
  );

  const nameCell = extractTdByClass(rowHtml, "item__name");
  const visibleTitle = fixBasicMojibake(
    compactText(
      cleanHtmlToText(
        nameCell.match(/<a\b[^>]*>([\s\S]*?)<\/a>/i)?.[1] || nameCell
      )
    )
  );
  const infoItems = extractLiTexts(extractTdByClass(rowHtml, "item__info")).map(
    fixBasicMojibake
  );
  const costCell = extractTdByClass(rowHtml, "item__cost");
  const bodyPrice = extractSpanById(costCell, `kakaku_display_${stockId}`);
  const totalPrice = extractSpanById(costCell, `total_display_${stockId}`);
  const realImages = rowImages.filter(
    (url) =>
      !url.includes("car_nophoto") &&
      !url.includes("total_price_unset") &&
      !url.includes("/common/")
  );
  const title = [carName, gradeName].filter(Boolean).join(" ").trim();

  return {
    stockId,
    title,
    description:
      visibleTitle && !visibleTitle.includes("ï¿½") ? visibleTitle : title,
    carName,
    gradeName,
    gradeExtraInfo: "",
    classificationName,
    year: infoItems[0] || "",
    mileage: infoItems[1] || "",
    color: infoItems[2] || "",
    inspection: infoItems[3] || "",
    displacement: infoItems[4] || "",
    bodyPrice: bodyPrice ? `${bodyPrice}ä¸å` : "",
    totalPrice: totalPrice ? `${totalPrice}ä¸å` : "",
    imageUrl: qualityImageMap[stockId] || realImages[0] || "",
    detailUrl: findFirstUrl(urls, "/stock/detail"),
    editUrl: findFirstUrl(urls, "/car/edit/new"),
    gooUrl: findFirstUrl(urls, "goo-net.com"),
    sourceStatus: "æ²è¼å¨åº«",
    sourcePageUrl: "",
    types: [],
    typeKeys: [],
  };
}


function extractTableCells(rowHtml) {
  return Array.from(
    String(rowHtml || "").matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)
  ).map((match) => match[1]);
}

function normalizeDisplacement(value) {
  const text = compactText(toHalfWidthAscii(value))
    .replace(/,/g, "")
    .replace(/\s+/g, "");

  if (!text) return "";
  if (/cc$/i.test(text)) return text.replace(/cc$/i, "cc");
  if (/l$/i.test(text)) return text.replace(/l$/i, "L");

  const numberText = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
  if (!numberText) return text;

  const number = Number(numberText);
  if (!Number.isFinite(number)) return text;
  return number >= 100 ? `${numberText}cc` : `${numberText}L`;
}

function extractPricesFromCell(cellHtml) {
  const text = compactText(cleanHtmlToText(cellHtml));
  const prices = Array.from(
    text.matchAll(/([0-9]+(?:\.[0-9]+)?)\s*ä¸å/g)
  ).map((match) => `${match[1]}ä¸å`);

  if (prices.length >= 2) {
    return { bodyPrice: prices[0], totalPrice: prices[1] };
  }

  const numbers = Array.from(
    text.matchAll(/([0-9]+(?:\.[0-9]+)?)/g)
  ).map((match) => match[1]);

  return {
    bodyPrice: numbers[0] ? `${numbers[0]}ä¸å` : "",
    totalPrice: numbers[1] ? `${numbers[1]}ä¸å` : "",
  };
}

function upgradeGooImageUrl(url) {
  let value = absoluteUrl(decodeHtmlEntities(url || ""));
  if (!value || /noimage|nophoto|car_nophoto/i.test(value)) return "";

  value = value
    .replace(/^http:/i, "https:")
    .replace(/secure\.goo-net\.com/i, "picture1.goo-net.com")
    .replace(/\/Q\//i, "/H/")
    .replace(/\/S\//i, "/H/")
    .replace(/\/M\//i, "/H/")
    .replace(/\/T\//i, "/H/");

  if (/goo-net\.com/i.test(value) && /\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(value)) {
    value = value.replace(/\?.*$/, "");
  }

  return value;
}

function extractExtendedImageValues(html, baseUrl) {
  const values = [];

  for (const match of String(html || "").matchAll(/<img\b([^>]*)>/gi)) {
    const attrs = match[1] || "";
    for (const attribute of ["src", "data-src", "data-original", "data-lazy-src"]) {
      const raw = extractAttribute(attrs, attribute);
      if (raw) values.push(absoluteUrl(raw, baseUrl));
    }
  }

  for (const href of extractRawHrefValues(html)) {
    if (/\.(?:jpg|jpeg|png|webp)(?:\?|$)/i.test(href)) {
      values.push(absoluteUrl(href, baseUrl));
    }
  }

  return Array.from(new Set(values)).filter(Boolean);
}

function chooseBestVehicleImage(urls, stockId = "") {
  const candidates = Array.from(
    new Set((urls || []).map(upgradeGooImageUrl).filter(Boolean))
  ).filter((url) => !url.includes("/common/"));

  const withStockId = candidates.filter((url) =>
    stockId ? url.toLowerCase().includes(stockId.toLowerCase()) : false
  );
  const pool = withStockId.length ? withStockId : candidates;

  return (
    pool.find((url) => /picture1\.goo-net\.com/i.test(url) && /\/H\//i.test(url)) ||
    pool.find((url) => /picture1\.goo-net\.com/i.test(url)) ||
    pool.find((url) => /\/H\//i.test(url)) ||
    pool[0] ||
    ""
  );
}

function extractSavedVehicleRows(html) {
  return Array.from(
    String(html || "").matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)
  )
    .map((match) => match[0])
    .filter((rowHtml) => /StockId=[A-Za-z0-9]+/i.test(rowHtml));
}

function extractSavedVehicles(html, pageUrl) {
  const rows = extractSavedVehicleRows(html);
  const vehicles = [];

  for (const rowHtml of rows) {
    const stockId =
      rowHtml.match(/StockId=([A-Za-z0-9]+)/i)?.[1] ||
      extractAttribute(
        rowHtml.match(/<input\b[^>]*name=["'][^"']*StockId[^"']*["'][^>]*>/i)?.[0] || "",
        "value"
      );

    if (!stockId) continue;

    const cells = extractTableCells(rowHtml);
    const cellTexts = cells.map((cell) => compactText(cleanHtmlToText(cell)));
    const yearIndex = cellTexts.findIndex((text) =>
      /^(?:19|20)\d{2}å¹´?$/.test(toHalfWidthAscii(text).replace(/\s+/g, ""))
    );

    if (yearIndex < 3) continue;

    const carName = cellTexts[yearIndex - 3] || "";
    const gradeName = cellTexts[yearIndex - 2] || "";
    const yearText = toHalfWidthAscii(cellTexts[yearIndex] || "").replace(/\s+/g, "");
    const year = yearText.match(/((?:19|20)\d{2})/)?.[1]
      ? `${yearText.match(/((?:19|20)\d{2})/)?.[1]}å¹´`
      : yearText;
    const displacement = normalizeDisplacement(cellTexts[yearIndex + 1] || "");
    const color = compactText(cellTexts[yearIndex + 2] || "");
    const mileage = normalizeMileage(cellTexts[yearIndex + 3] || "");
    const prices = extractPricesFromCell(cells[yearIndex + 4] || "");

    const rawHrefs = extractRawHrefValues(rowHtml);
    const urls = rawHrefs
      .map((href) => absoluteUrl(href, pageUrl))
      .filter(Boolean);
    const rowImages = extractExtendedImageValues(rowHtml, pageUrl);
    const imageUrl = chooseBestVehicleImage(rowImages, stockId);

    const discoveredEditUrls = urls.filter(
      (url) =>
        url.includes("/car/newregist/register") ||
        url.includes("/car/edit/new")
    );

    const editUrls = Array.from(
      new Set([
        ...discoveredEditUrls,
        `${BASE_URL}/car/newregist/register?kbn=1&client_id=0902332&StockStatus=00180002&StockId=${stockId}&ScreenId=SIH_001`,
        `${BASE_URL}/car/edit/new?kbn=1&ClientId=0902332&StockId=${stockId}&StockStatus=00180002&ScreenId=CB101GR`,
      ])
    );

    const detailUrl =
      urls.find(
        (url) =>
          url.includes("/stock/detail") &&
          url.toLowerCase().includes(`stockid=${stockId}`.toLowerCase())
      ) || `${BASE_URL}/stock/detail?ClientId=0902332&StockId=${stockId}`;

    const title = [carName, gradeName].filter(Boolean).join(" ").trim();

    vehicles.push({
      stockId,
      title,
      description: title,
      carName,
      gradeName,
      gradeExtraInfo: "",
      classificationName: "",
      year,
      mileage,
      color,
      inspection: "",
      displacement,
      bodyPrice: prices.bodyPrice,
      totalPrice: prices.totalPrice,
      imageUrl,
      gooUrl: "",
      sourceStatus: "ä¸æä¿å­",
      sourcePageUrl: pageUrl,
      editUrl: editUrls[0] || "",
      editUrls,
      detailUrl,
      types: [],
      typeKeys: [],
    });
  }

  return uniqueByStockId(vehicles);
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
    30000
  );
  addResponseCookies(jar, loginPage);

  const html = await readResponseText(loginPage);
  const csrf = html.match(/name=["']fuel_csrf_token["'][^>]*value=["']([^"']+)/i)?.[1];
  const sessionId = html.match(/name=["']session_id["'][^>]*value=["']([^"']+)/i)?.[1];

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
    30000
  );
  addResponseCookies(jar, login);

  return { jar, loginStatus: login.status };
}


function chooseDetailValue(vehicle, detailValue, currentValue, previousValue = "") {
  if (vehicle.sourceStatus === "ä¸æä¿å­") {
    return currentValue || detailValue || previousValue || "";
  }

  return currentValue || detailValue || previousValue || "";
}

function mergePreviousVehicle(vehicle, previousVehicle) {
  if (!previousVehicle) return vehicle;

  const result = { ...vehicle };
  for (const key of [
    "title",
    "description",
    "carName",
    "gradeName",
    "gradeExtraInfo",
    "classificationName",
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
    if (!result[key] && previousVehicle[key]) {
      result[key] = previousVehicle[key];
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
      [
        ...(vehicle.editUrls || []),
        vehicle.editUrl,
        vehicle.detailUrl,
      ].filter(Boolean)
    )
  );
}

function countUsefulDetails(details) {
  return [
    details.carName,
    details.gradeName,
    details.classificationName,
    details.year,
    details.mileage,
    details.color,
    details.inspection,
    details.displacement,
    details.bodyPrice,
    details.totalPrice,
    details.gradeExtraInfo,
    details.imageUrl,
  ].filter(Boolean).length;
}

async function fetchVehicleDetailFromEditPage(
  jar,
  vehicle,
  previousVehicle = null
) {
  const candidates = buildDetailUrlCandidates(vehicle);

  if (candidates.length === 0) {
    const fallback = mergePreviousVehicle(vehicle, previousVehicle);
    return {
      ...fallback,
      typeResult: {
        status: null,
        success: false,
        reason: "detail URL not found",
        timeout: false,
        error: "",
      },
      detailResult: {
        success: false,
        url: "",
        attempts: 0,
        usedPrevious: Boolean(previousVehicle),
        year: Boolean(fallback.year),
        mileage: Boolean(fallback.mileage),
        color: Boolean(fallback.color),
      },
    };
  }

  let best = null;
  const attemptErrors = [];
  let attemptCount = 0;

  for (const candidateUrl of candidates) {
    for (let retry = 0; retry <= SAVED_DETAIL_RETRIES; retry += 1) {
      attemptCount += 1;

      try {
        const response = await fetchWithTimeout(
          candidateUrl,
          {
            cache: "no-store",
            headers: {
              Cookie: jarToCookie(jar),
              Referer:
                vehicle.sourceStatus === "ä¸æä¿å­"
                  ? `${BASE_URL}/stock/savelist`
                  : `${BASE_URL}/top`,
              "User-Agent": USER_AGENT,
              "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
              "Cache-Control": "no-store",
            },
          },
          30000
        );

        const html = await readResponseText(response);
        const containsLoginForm =
          html.includes('name="client_pw"') ||
          html.includes("name='client_pw'");

        if (!response.ok || containsLoginForm) {
          attemptErrors.push(
            `${candidateUrl}: HTTP ${response.status}${
              containsLoginForm ? " login form" : ""
            }`
          );
          continue;
        }

        const text = cleanHtmlToText(html);
        const types = Array.from(
          new Set([
            ...extractTypesFromText(html),
            ...extractTypesFromText(text),
          ])
        );
        const details = extractCommonVehicleDetails(html);
        const score = countUsefulDetails(details) + types.length;

        if (!best || score > best.score) {
          best = {
            url: candidateUrl,
            status: response.status,
            html,
            details,
            types,
            score,
          };
        }

        if (
          details.year &&
          details.mileage &&
          details.color &&
          (details.carName || vehicle.carName)
        ) {
          break;
        }
      } catch (error) {
        attemptErrors.push(
          `${candidateUrl}: ${error.message || String(error)}`
        );
      }
    }

    if (
      best?.details?.year &&
      best?.details?.mileage &&
      best?.details?.color
    ) {
      break;
    }
  }

  if (!best) {
    const fallback = mergePreviousVehicle(vehicle, previousVehicle);
    return {
      ...fallback,
      typeResult: {
        status: null,
        success: Boolean(fallback.types?.length),
        containsFatalError: false,
        timeout: attemptErrors.some((text) =>
          /timeout|abort/i.test(text)
        ),
        error: attemptErrors.join(" / "),
      },
      detailResult: {
        success: false,
        url: "",
        attempts: attemptCount,
        usedPrevious: Boolean(previousVehicle),
        year: Boolean(fallback.year),
        mileage: Boolean(fallback.mileage),
        color: Boolean(fallback.color),
      },
    };
  }

  const details = best.details;
  const previous = previousVehicle || {};
  const types =
    best.types.length > 0
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

  const carName = chooseDetailValue(
    vehicle,
    details.carName,
    vehicle.carName,
    previous.carName
  );
  const gradeName = chooseDetailValue(
    vehicle,
    details.gradeName,
    vehicle.gradeName,
    previous.gradeName
  );
  const title =
    [carName, gradeName].filter(Boolean).join(" ").trim() ||
    vehicle.title ||
    previous.title ||
    "";

  const result = {
    ...vehicle,
    title,
    description:
      vehicle.description || previous.description || title,
    carName,
    gradeName,
    classificationName: chooseDetailValue(
      vehicle,
      details.classificationName,
      vehicle.classificationName,
      previous.classificationName
    ),
    year: chooseDetailValue(
      vehicle,
      details.year,
      vehicle.year,
      previous.year
    ),
    mileage: chooseDetailValue(
      vehicle,
      details.mileage,
      vehicle.mileage,
      previous.mileage
    ),
    color: chooseDetailValue(
      vehicle,
      details.color,
      vehicle.color,
      previous.color
    ),
    inspection: chooseDetailValue(
      vehicle,
      details.inspection,
      vehicle.inspection,
      previous.inspection
    ),
    displacement: chooseDetailValue(
      vehicle,
      details.displacement,
      vehicle.displacement,
      previous.displacement
    ),
    bodyPrice: chooseDetailValue(
      vehicle,
      details.bodyPrice,
      vehicle.bodyPrice,
      previous.bodyPrice
    ),
    totalPrice: chooseDetailValue(
      vehicle,
      details.totalPrice,
      vehicle.totalPrice,
      previous.totalPrice
    ),
    imageUrl: chooseDetailValue(
      vehicle,
      details.imageUrl,
      vehicle.imageUrl,
      previous.imageUrl
    ),
    gradeExtraInfo:
      details.gradeExtraInfo ||
      vehicle.gradeExtraInfo ||
      previous.gradeExtraInfo ||
      "",
    editUrl: best.url.includes("/stock/detail")
      ? vehicle.editUrl
      : best.url,
    types,
    typeKeys,
    typeResult: {
      status: best.status,
      success: types.length > 0,
      containsFatalError: best.html.includes("FatalError"),
      timeout: false,
      error: attemptErrors.join(" / "),
    },
    detailResult: {
      success: true,
      url: best.url,
      attempts: attemptCount,
      usedPrevious: Boolean(
        previousVehicle &&
          (!details.year || !details.mileage || !details.color)
      ),
      year: Boolean(details.year),
      mileage: Boolean(details.mileage),
      color: Boolean(details.color),
    },
  };

  return mergePreviousVehicle(result, previousVehicle);
}

async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker())
  );
  return results;
}


async function attachVehicleDetails(jar, vehicles, previousMap = new Map()) {
  const isSavedBatch = vehicles.some(
    (vehicle) => vehicle.sourceStatus === "ä¸æä¿å­"
  );
  const concurrency = isSavedBatch ? SAVED_DETAIL_CONCURRENCY : 10;

  return mapWithConcurrency(vehicles, concurrency, (vehicle) =>
    fetchVehicleDetailFromEditPage(
      jar,
      vehicle,
      previousMap.get(vehicle.stockId) || null
    )
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
    30000
  );

  const html = await readResponseText(response);
  const imageMap = extractQualityImageMap(html, PUBLIC_LIST_URL);
  const rows = extractVehicleRows(html);
  const vehicles = rows.map((row) =>
    parsePublicVehicleRow(row, PUBLIC_LIST_URL, imageMap)
  );
  const detailed = await attachVehicleDetails(jar, vehicles);

  return {
    status: response.status,
    containsLoginForm:
      html.includes('name="client_pw"') || html.includes("name='client_pw'"),
    foundRows: rows.length,
    imageMapCount: Object.keys(imageMap).length,
    vehicles: detailed.map(toInventoryVehicle),
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
    30000
  );

  const html = await readResponseText(response);
  const vehicles = extractSavedVehicles(html, pageUrl);

  return {
    pageUrl,
    status: response.status,
    count: vehicles.length,
    vehicles,
  };
}


async function fetchSavedVehicles(jar, currentVehicles = []) {
  const pages = [];
  const allVehicles = [];
  const seenStockIds = new Set();

  for (const pageUrl of SAVED_LIST_URLS) {
    const page = await fetchSavedPage(jar, pageUrl);
    const newVehicles = page.vehicles.filter(
      (vehicle) => !seenStockIds.has(vehicle.stockId)
    );

    for (const vehicle of newVehicles) {
      seenStockIds.add(vehicle.stockId);
      allVehicles.push(vehicle);
    }

    pages.push({
      ...page,
      newCount: newVehicles.length,
    });

    if (page.count === 0 || newVehicles.length === 0) {
      break;
    }
  }

  const previousMap = new Map(
    (currentVehicles || [])
      .filter((vehicle) => vehicle?.stockId)
      .map((vehicle) => [vehicle.stockId, vehicle])
  );

  const detailed = await attachVehicleDetails(
    jar,
    uniqueByStockId(allVehicles),
    previousMap
  );

  return {
    pages: pages.map(({ pageUrl, status, count, newCount }) => ({
      pageUrl,
      status,
      count,
      newCount,
    })),
    vehicles: detailed.map(toInventoryVehicle),
  };
}

async function fetchCurrentInventoryFromGitHub() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "CARTOPIA0319";
  const repo = process.env.GITHUB_REPO || "cartopia-car-diagnosis";
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = "data/inventory.json";

  if (!token) return { sha: null, inventory: { vehicles: [] } };

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const response = await fetchWithTimeout(
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

  if (!response.ok) return { sha: null, inventory: { vehicles: [] } };

  const data = await response.json();
  return {
    sha: data.sha || null,
    inventory: JSON.parse(
      Buffer.from(data.content || "", "base64").toString("utf8")
    ),
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

  if (!token) return { saved: false, reason: "GITHUB_TOKEN is not set" };

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
  const content = Buffer.from(
    JSON.stringify(inventoryData, null, 2),
    "utf8"
  ).toString("base64");

  async function put(sha) {
    const response = await fetchWithTimeout(
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
          ...(sha ? { sha } : {}),
        }),
      },
      30000
    );

    return {
      response,
      data: await response.json(),
    };
  }

  let result = await put(existingSha);

  if (result.response.status === 409) {
    const latest = await fetchCurrentInventoryFromGitHub();
    result = await put(latest.sha);
  }

  return {
    saved: result.response.ok,
    status: result.response.status,
    path,
    branch,
    commit: result.data.commit?.html_url || "",
    commitSha: result.data.commit?.sha || "",
    error: result.response.ok ? "" : result.data,
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
    (vehicle) => vehicle.sourceStatus === "ä¸æä¿å­"
  );
  return {
    total: saved.length,
    yearFound: saved.filter((vehicle) => vehicle.year).length,
    yearMissing: saved.filter((vehicle) => !vehicle.year).length,
    colorFound: saved.filter((vehicle) => vehicle.color).length,
    colorMissing: saved.filter((vehicle) => !vehicle.color).length,
    mileageFound: saved.filter((vehicle) => vehicle.mileage).length,
    mileageMissing: saved.filter((vehicle) => !vehicle.mileage).length,
    detailFetchFailed: saved.filter(
      (vehicle) => vehicle.detailResult?.success === false
    ).length,
  };
}

function getTriggerLabel(request, save) {
  const cronHeader = request.headers.get("x-vercel-cron");
  const userAgent = request.headers.get("user-agent") || "";
  if (cronHeader || userAgent.toLowerCase().includes("vercel")) {
    return "èªåæ´æ°";
  }
  return save ? "URLä¿å­æ´æ°" : "URLãã¬ãã¥ã¼";
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
  const summary = url.searchParams.get("summary") === "1";
  const trigger = getTriggerLabel(request, save);
  let current = { sha: null, inventory: { vehicles: [] } };

  try {
    current = await fetchCurrentInventoryFromGitHub();
    const { jar, loginStatus } = await loginMotorgate();
    const publicResult = await fetchPublicVehicles(jar);
    const savedResult = await fetchSavedVehicles(
      jar,
      current.inventory?.vehicles || []
    );
    const vehicles = mergeVehicles(publicResult.vehicles, savedResult.vehicles);
    const finishedAt = new Date();
    const durationSeconds = Math.round(
      (finishedAt.getTime() - startedAt.getTime()) / 1000
    );
    const typeResults = summarizeTypeResults(vehicles);
    const savedDetailFields = summarizeSavedDetailFields(vehicles);

    const success =
      loginStatus === 302 &&
      publicResult.status === 200 &&
      !publicResult.containsLoginForm &&
      savedResult.pages.every((page) => page.status === 200) &&
      vehicles.length > 0;

    const error = success
      ? ""
      : [
          loginStatus !== 302 ? `ã­ã°ã¤ã³ç°å¸¸: ${loginStatus}` : "",
          publicResult.status !== 200
            ? `æ²è¼å¨åº«åå¾ç°å¸¸: ${publicResult.status}`
            : "",
          publicResult.containsLoginForm
            ? "ã­ã°ã¤ã³ãã©ã¼ã ãè¡¨ç¤ºããã¦ãã¾ã"
            : "",
          savedResult.pages.some((page) => page.status !== 200)
            ? "ä¸æä¿å­å¨åº«ãã¼ã¸ã®åå¾ã«å¤±æãã¦ãã¾ã"
            : "",
          vehicles.length === 0 ? "å¨åº«åå¾ä»¶æ°ã0ä»¶ã§ã" : "",
        ]
          .filter(Boolean)
          .join(" / ");

    const lastUpdateStatus = {
      success,
      statusText: success ? "æ­£å¸¸æ´æ°" : "æ´æ°ç¢ºèªãå¿è¦",
      trigger,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationSeconds,
      error,
      timeout: false,
      typeFailed: typeResults.failed,
      typeTimeout: typeResults.timeout,
      savedYearMissing: savedDetailFields.yearMissing,
      savedColorMissing: savedDetailFields.colorMissing,
      savedMileageMissing: savedDetailFields.mileageMissing,
      savedDetailFetchFailed: savedDetailFields.detailFetchFailed,
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
        savedDetailFields,
      },
      vehicles,
    };

    const github = save
      ? await commitInventoryToGitHub(inventoryData, current.sha)
      : {
          saved: false,
          reason: "preview only. add ?save=1 to save data/inventory.json",
        };

    if (summary) {
      return json({
        success,
        mode: inventoryData.updateMode,
        github,
        counts: inventoryData.counts,
        savedDetailFields,
        lastUpdateStatus,
      });
    }

    return json({
      success,
      mode: inventoryData.updateMode,
      github,
      counts: inventoryData.counts,
      checks: inventoryData.checks,
      lastUpdateStatus,
      inventory: inventoryData,
    });
  } catch (error) {
    const finishedAt = new Date();
    const failureStatus = {
      success: false,
      statusText: "æ´æ°å¤±æ",
      trigger,
      startedAt: startedAt.toISOString(),
      finishedAt: finishedAt.toISOString(),
      durationSeconds: Math.round(
        (finishedAt.getTime() - startedAt.getTime()) / 1000
      ),
      error: error.message || String(error),
      timeout: isTimeoutError(error),
      typeFailed: null,
      typeTimeout: null,
      savedYearMissing: null,
      savedColorMissing: null,
      savedMileageMissing: null,
      savedDetailFetchFailed: null,
    };

    let github = { saved: false, reason: "failure status was not saved" };

    if (save) {
      try {
        github = await commitInventoryToGitHub(
          buildFailureInventoryData(current.inventory, failureStatus),
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

    const failureResponse = {
      success: false,
      mode: save
        ? "full-public-and-saved-refresh"
        : "preview-full-public-and-saved-refresh",
      github,
      lastUpdateStatus: failureStatus,
      error: error.message || String(error),
    };

    if (summary) {
      return json(failureResponse);
    }

    return json({
      ...failureResponse,
      stack: error.stack || "",
    });
  }
}
