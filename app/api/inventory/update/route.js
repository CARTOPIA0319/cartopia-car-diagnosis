export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BASE_URL = "https://motorgate.jp";
const STATUS_PUBLIC = "\u63b2\u8f09\u5728\u5eab";
const STATUS_SAVED = "\u4e00\u6642\u4fdd\u5b58";
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
    .replace(/Ã¨ÂÂ·Ã¯Â½Â´/g, "Ã¥Â¹Â´")
    .replace(/Ã¨Â­ÂÃ¯Â¿Â½/g, "Ã¦ÂÂ")
    .replace(/Ã¨ÂÂ³Ã¢ÂÂ«/g, "Ã¤Â¸ÂK")
    .replace(/Ã¨ÂÂ³Ã¯Â¿Â½Ã¯Â¿Â½/g, "Ã¤Â¸ÂÃ¥ÂÂ")
    .replace(/Ã¨Â®ÂÃ¯Â¿Â½/g, "Ã¦Â¤Â")
    .replace(/Ã©ÂÂÃ©Â ÂÃ¯Â½Â¤Ã¦ÂÂÃ§Â´ÂÃ¨ÂÂ¯Ã¥ÂÂ©Ã¯Â½Â»Ã¯Â¿Â½/g, "Ã¨Â»ÂÃ¦Â¤ÂÃ¦ÂÂ´Ã¥ÂÂÃ¤Â»Â")
    .replace(/Ã¨ÂÂÃ¯Â½Â¡Ã¨Â­Â¬Ã¯Â½Â¼/g, "Ã¤Â¾Â¡Ã¦Â Â¼")
    .replace(/Ã©ÂÂ±Ã¥ÂÂÃ¯Â½Â¡Ã¯Â¿Â½/g, "Ã§Â·ÂÃ©Â¡Â")
    .trim();
}

function toHalfWidthAscii(text) {
  return String(text || "").replace(/[Ã¯Â¼Â-Ã¯Â½Â]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0)
  );
}

function normalizeTypeText(text) {
  return fixBasicMojibake(
    decodeHtmlEntities(String(text || ""))
      .replace(/[Ã¯Â¼Â´Ã¯Â¼Â¹Ã¯Â¼Â°Ã¯Â¼Â¥Ã¯Â¼Â¶Ã¯Â¼Â¨Ã¯Â¼Â³Ã¯Â¼Âµ]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0xfee0)
      )
      .replace(/[Ã¯Â½ÂÃ¯Â½ÂÃ¯Â½ÂÃ¯Â½ÂÃ¯Â½ÂÃ¯Â½ÂÃ¯Â½ÂÃ¯Â½Â]/g, (char) =>
        String.fromCharCode(char.charCodeAt(0) - 0xfee0)
      )
      .replace(/Ã¯Â¼Â/g, ":")
      .replace(/[\r\nÃ£ÂÂ]/g, " ")
  );
}

function normalizeTypeKey(type) {
  const value = toHalfWidthAscii(String(type || ""))
    .replace(/Ã¯Â¼Â/g, ":")
    .replace(/Ã£ÂÂ/g, " ")
    .trim();

  if (/^suv$/i.test(value)) return "SUV";
  if (/^e[vÃ¯Â½Â]Ã£ÂÂ»h[vÃ¯Â½Â]$/i.test(value)) return "EVÃ£ÂÂ»HV";
  return value;
}

function extractTypesFromText(text) {
  const fixed = normalizeTypeText(text);
  const types = [];
  const regex = /TYPE\s*:\s*([^\s<>"'&]+)/gi;
  let match;

  while ((match = regex.exec(fixed)) !== null) {
    const value = compactText(match[1]).replace(/[Ã£ÂÂ,Ã£ÂÂ]/g, "");
    if (
      value &&
      !/[._Ã¢ÂÂ¦]/.test(value) &&
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
    .replace(/[\s_\-:[\]Ã¯Â¼ÂÃ¯Â¼Â()]/g, "");
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
        !/^(Ã©ÂÂ¸Ã¦ÂÂ|Ã©ÂÂ¸Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ|Ã¦ÂÂªÃ©ÂÂ¸Ã¦ÂÂ|Ã£ÂÂªÃ£ÂÂ|--|---|0)$/i.test(value) &&
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
      new RegExp(`^.*?${escapeRegExp(label)}\\s*[Ã¯Â¼Â:]?\\s*`, "i"),
      ""
    );
  }
  return text;
}

function parseYear(value) {
  const text = compactText(value);
  const western = text.match(/((?:19|20)\d{2})\s*(?:Ã¥Â¹Â´|[\/-])?\s*([01]?\d)?/);
  if (western) {
    const month = Number(western[2] || 0);
    return {
      year: Number(western[1]),
      month: month >= 1 && month <= 12 ? month : null,
    };
  }

  const era = text.match(/(Ã¤Â»Â¤Ã¥ÂÂ|Ã¥Â¹Â³Ã¦ÂÂ|Ã¦ÂÂ­Ã¥ÂÂ)\s*(Ã¥ÂÂ|\d+)\s*Ã¥Â¹Â´?\s*([01]?\d)?/);
  if (!era) return null;

  const eraYear = era[2] === "Ã¥ÂÂ" ? 1 : Number(era[2]);
  const base = era[1] === "Ã¤Â»Â¤Ã¥ÂÂ" ? 2018 : era[1] === "Ã¥Â¹Â³Ã¦ÂÂ" ? 1988 : 1925;
  const month = Number(era[3] || 0);

  return {
    year: base + eraYear,
    month: month >= 1 && month <= 12 ? month : null,
  };
}


function extractRegistrationYear(html) {
  const labels = [
    "Ã¥ÂÂÃ¥ÂºÂ¦Ã§ÂÂ»Ã©ÂÂ²Ã¥Â¹Â´Ã¦ÂÂ",
    "Ã¥ÂÂÃ¥Â¹Â´Ã¥ÂºÂ¦Ã§ÂÂ»Ã©ÂÂ²Ã¥Â¹Â´Ã¦ÂÂ",
    "Ã¥ÂÂÃ¥ÂºÂ¦Ã§ÂÂ»Ã©ÂÂ²",
    "Ã¥ÂÂÃ¥Â¹Â´Ã¥ÂºÂ¦Ã§ÂÂ»Ã©ÂÂ²",
    "Ã¥ÂÂÃ¥ÂºÂ¦Ã¦Â¤ÂÃ¦ÂÂ»Ã¥Â¹Â´Ã¦ÂÂ",
    "Ã¥Â¹Â´Ã¥Â¼Â",
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
        ? `${parsed.year}Ã¥Â¹Â´${String(parsed.month).padStart(2, "0")}Ã¦ÂÂ`
        : `${parsed.year}Ã¥Â¹Â´`;
    }
  }

  const joined = values.join(" ");
  const eraName = joined.match(/Ã¤Â»Â¤Ã¥ÂÂ|Ã¥Â¹Â³Ã¦ÂÂ|Ã¦ÂÂ­Ã¥ÂÂ/)?.[0] || "";
  if (eraName) {
    const numericValues = values
      .map((value) =>
        value.includes("Ã¥ÂÂ")
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
        eraName === "Ã¤Â»Â¤Ã¥ÂÂ" ? 2018 : eraName === "Ã¥Â¹Â³Ã¦ÂÂ" ? 1988 : 1925;
      const westernYear = base + eraYear;
      return month
        ? `${westernYear}Ã¥Â¹Â´${String(month).padStart(2, "0")}Ã¦ÂÂ`
        : `${westernYear}Ã¥Â¹Â´`;
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
      ? `${year}Ã¥Â¹Â´${String(month).padStart(2, "0")}Ã¦ÂÂ`
      : `${year}Ã¥Â¹Â´`;
  }

  const parsed = parseYear(cleanHtmlToText(region));
  if (!parsed) return "";

  return parsed.month
    ? `${parsed.year}Ã¥Â¹Â´${String(parsed.month).padStart(2, "0")}Ã¦ÂÂ`
    : `${parsed.year}Ã¥Â¹Â´`;
}

function cleanColor(value) {
  let text = compactText(fixBasicMojibake(value))
    .replace(
      /^(Ã¨Â»ÂÃ¤Â½ÂÃ¨ÂÂ²|Ã£ÂÂÃ£ÂÂÃ£ÂÂ£Ã£ÂÂ«Ã£ÂÂ©Ã£ÂÂ¼|Ã£ÂÂÃ£ÂÂÃ£ÂÂ£Ã£ÂÂ¼Ã£ÂÂ«Ã£ÂÂ©Ã£ÂÂ¼|Ã¥Â¤ÂÃ¨Â£ÂÃ¨ÂÂ²|Ã£ÂÂ«Ã£ÂÂ©Ã£ÂÂ¼|Ã¨ÂÂ²)\s*[Ã¯Â¼Â:]?\s*/,
      ""
    )
    .replace(/(Ã£ÂÂ«Ã£ÂÂ©Ã£ÂÂ¼Ã£ÂÂ³Ã£ÂÂ¼Ã£ÂÂ|Ã¨ÂÂ²Ã£ÂÂ³Ã£ÂÂ¼Ã£ÂÂ)[\s\S]*$/, "")
    .trim();

  for (const stop of [
    "Ã¥ÂÂÃ¥ÂºÂ¦Ã§ÂÂ»Ã©ÂÂ²",
    "Ã¥ÂÂÃ¥Â¹Â´Ã¥ÂºÂ¦Ã§ÂÂ»Ã©ÂÂ²",
    "Ã¥Â¹Â´Ã¥Â¼Â",
    "Ã¨ÂµÂ°Ã¨Â¡ÂÃ¨Â·ÂÃ©ÂÂ¢",
    "Ã¨ÂµÂ°Ã¨Â¡Â",
    "Ã¨Â»ÂÃ¦Â¤Â",
    "Ã¦ÂÂÃ¦Â°ÂÃ©ÂÂ",
    "Ã¤Â¾Â¡Ã¦Â Â¼",
    "Ã¦ÂÂ¯Ã¦ÂÂÃ§Â·ÂÃ©Â¡Â",
    "Ã¥ÂÂÃ¥Â¼Â",
    "Ã£ÂÂ°Ã£ÂÂ¬Ã£ÂÂ¼Ã£ÂÂ",
    "Ã¤Â¿Â®Ã¥Â¾Â©Ã¦Â­Â´",
  ]) {
    const index = text.indexOf(stop);
    if (index > 0) text = text.slice(0, index).trim();
  }

  return text.slice(0, 100);
}

function colorScore(value, control = null) {
  const text = compactText(value);
  if (!text || /^(Ã©ÂÂ¸Ã¦ÂÂ|Ã©ÂÂ¸Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ Ã£ÂÂÃ£ÂÂ|Ã¦ÂÂªÃ©ÂÂ¸Ã¦ÂÂ|Ã£ÂÂªÃ£ÂÂ|Ã£ÂÂÃ£ÂÂ®Ã¤Â»Â|--|---)$/i.test(text)) {
    return -999;
  }
  if (/^#[0-9a-f]{3,8}$/i.test(text) || /^\d+$/.test(text)) return -999;

  let score = Math.min(text.length, 40);
  if (/[Ã£ÂÂ-Ã£ÂÂÃ£ÂÂ¡-Ã£ÂÂ¶Ã¤Â¸Â-Ã©Â¾Â ]/.test(text)) score += 40;
  if (
    /(Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂ«|Ã£ÂÂ¡Ã£ÂÂ¿Ã£ÂÂªÃ£ÂÂÃ£ÂÂ¯|Ã£ÂÂÃ£ÂÂ©Ã£ÂÂÃ£ÂÂ¯|Ã£ÂÂÃ£ÂÂ¯Ã£ÂÂ¤Ã£ÂÂ|Ã£ÂÂ·Ã£ÂÂ«Ã£ÂÂÃ£ÂÂ¼|Ã£ÂÂ°Ã£ÂÂ¬Ã£ÂÂ¼|Ã£ÂÂÃ£ÂÂ«Ã£ÂÂ¼|Ã£ÂÂ¬Ã£ÂÂÃ£ÂÂ|Ã£ÂÂÃ£ÂÂ©Ã£ÂÂ¦Ã£ÂÂ³|Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂ¸Ã£ÂÂ¥|Ã£ÂÂÃ£ÂÂ¤Ã£ÂÂ«|Ã£ÂÂ¯Ã£ÂÂªÃ£ÂÂ¹Ã£ÂÂ¿Ã£ÂÂ«|Ã£ÂÂ¢Ã£ÂÂ¤Ã£ÂÂÃ£ÂÂªÃ£ÂÂ¼|Ã£ÂÂ°Ã£ÂÂªÃ£ÂÂ¼Ã£ÂÂ³|Ã£ÂÂªÃ£ÂÂ¬Ã£ÂÂ³Ã£ÂÂ¸|Ã£ÂÂ¤Ã£ÂÂ¨Ã£ÂÂ­Ã£ÂÂ¼|Ã£ÂÂÃ£ÂÂ³Ã£ÂÂ¯|Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂÃ£ÂÂ«|Ã£ÂÂ´Ã£ÂÂ¼Ã£ÂÂ«Ã£ÂÂ|Ã£ÂÂ«Ã£ÂÂ¼Ã£ÂÂ­|Ã£ÂÂÃ£ÂÂ­Ã£ÂÂ³Ã£ÂÂº)/.test(
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
    "Ã¨Â»ÂÃ¤Â½ÂÃ¨ÂÂ²",
    "Ã£ÂÂÃ£ÂÂÃ£ÂÂ£Ã£ÂÂ«Ã£ÂÂ©Ã£ÂÂ¼",
    "Ã£ÂÂÃ£ÂÂÃ£ÂÂ£Ã£ÂÂ¼Ã£ÂÂ«Ã£ÂÂ©Ã£ÂÂ¼",
    "Ã¥Â¤ÂÃ¨Â£ÂÃ¨ÂÂ²",
    "Ã£ÂÂ«Ã£ÂÂ©Ã£ÂÂ¼",
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
  if (text.includes("Ã¤Â¸ÂÃ¥ÂÂ")) return text;

  const number = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
  return number ? `${number}Ã¤Â¸ÂÃ¥ÂÂ` : text;
}


function normalizeMileage(value) {
  const text = compactText(toHalfWidthAscii(value))
    .replace(/,/g, "")
    .replace(/\s+/g, "");

  if (!text) return "";
  if (text.includes("Ã¨ÂµÂ°Ã¤Â¸ÂÃ¦ÂÂ")) return "Ã¨ÂµÂ°Ã¤Â¸ÂÃ¦ÂÂ";

  const manMatch = text.match(/([0-9]+(?:\.[0-9]+)?)Ã¤Â¸Â[Ã¯Â¼Â«Kk]?/);
  if (manMatch) {
    const man = Number(manMatch[1]);
    return Number.isFinite(man) ? `${man}Ã¤Â¸ÂK` : text;
  }

  const numberText = text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "";
  if (!numberText) return text;

  const number = Number(numberText);
  if (!Number.isFinite(number)) return text;

  const looksLikeKm =
    /km|Ã¯Â¼Â«Ã¯Â¼Â­|Ã¯Â½ÂÃ¯Â½Â/i.test(text) ||
    /Ã¨ÂµÂ°Ã¨Â¡ÂÃ¨Â·ÂÃ©ÂÂ¢|Ã¨ÂµÂ°Ã¨Â¡Â/.test(text) ||
    number >= 1000;

  if (looksLikeKm) {
    const truncated = Math.floor(number / 1000) / 10;
    return `${truncated.toFixed(1)}Ã¤Â¸ÂK`;
  }

  return `${number}Ã¤Â¸ÂK`;
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
  return (
    images.find((url) => url.includes("picture") && url.includes("goo-net")) ||
    images.find((url) => url.includes("goo-net")) ||
    images[0] ||
    ""
  );
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
      extractValueNearLabels(html, ["Ã¨ÂµÂ°Ã¨Â¡ÂÃ¨Â·ÂÃ©ÂÂ¢", "Ã¨ÂµÂ°Ã¨Â¡Â"]) ||
      extractFirstMatch(text, /(\d+(?:\.\d+)?Ã¤Â¸Â[Ã¯Â¼Â«Kk])/) ||
      extractFirstMatch(
        text,
        /(\d{1,7}(?:,\d{3})*\s*(?:km|Ã¯Â¼Â«Ã¯Â¼Â­|Ã¯Â½ÂÃ¯Â½Â))/i
      ) ||
      (text.includes("Ã¨ÂµÂ°Ã¤Â¸ÂÃ¦ÂÂ") ? "Ã¨ÂµÂ°Ã¤Â¸ÂÃ¦ÂÂ" : "")
  );

  const bodyPrice = normalizePrice(
    extractValueByNames(html, [
      "Kakaku",
      "BodyPrice",
      "VehiclePrice",
      "CarPrice",
    ]) ||
      extractValueNearLabels(html, ["Ã¨Â»ÂÃ¤Â¸Â¡Ã¦ÂÂ¬Ã¤Â½ÂÃ¤Â¾Â¡Ã¦Â Â¼", "Ã¦ÂÂ¬Ã¤Â½ÂÃ¤Â¾Â¡Ã¦Â Â¼"]) ||
      extractFirstMatch(
        text,
        /(?:Ã¨Â»ÂÃ¤Â¸Â¡Ã¦ÂÂ¬Ã¤Â½ÂÃ¤Â¾Â¡Ã¦Â Â¼|Ã¦ÂÂ¬Ã¤Â½ÂÃ¤Â¾Â¡Ã¦Â Â¼|Ã¤Â¾Â¡Ã¦Â Â¼)\s*([0-9]+(?:\.[0-9]+)?Ã¤Â¸ÂÃ¥ÂÂ)/
      )
  );

  const totalPrice = normalizePrice(
    extractValueByNames(html, [
      "TotalPrice",
      "SiharaiTotal",
      "ShiharaiTotal",
      "PaymentTotal",
    ]) ||
      extractValueNearLabels(html, ["Ã¦ÂÂ¯Ã¦ÂÂÃ§Â·ÂÃ©Â¡Â", "Ã§Â·ÂÃ©Â¡Â"]) ||
      extractFirstMatch(
        text,
        /(?:Ã¦ÂÂ¯Ã¦ÂÂÃ§Â·ÂÃ©Â¡Â|Ã§Â·ÂÃ©Â¡Â)\s*([0-9]+(?:\.[0-9]+)?Ã¤Â¸ÂÃ¥ÂÂ)/
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
    extractValueNearLabels(html, ["Ã¨Â»ÂÃ¥ÂÂ"]) ||
    "";

  const gradeName =
    extractValueByNames(html, [
      "GradeName",
      "Grade",
      "grade_name",
      "Gurade",
    ]) ||
    extractValueNearLabels(html, ["Ã£ÂÂ°Ã£ÂÂ¬Ã£ÂÂ¼Ã£ÂÂ"]) ||
    "";

  const classificationName =
    extractValueByNames(html, [
      "Katashiki",
      "ClassificationName",
      "ModelCode",
      "classification_name",
    ]) ||
    extractValueNearLabels(html, ["Ã¥ÂÂÃ¥Â¼Â"]) ||
    "";

  const inspection =
    extractValueByNames(html, [
      "Shaken",
      "Inspection",
      "InspectionDate",
      "Syaken",
    ]) ||
    extractValueNearLabels(html, ["Ã¨Â»ÂÃ¦Â¤Â"]) ||
    "";

  const displacement =
    extractValueByNames(html, [
      "Haikiryo",
      "Displacement",
      "EngineDisplacement",
    ]) ||
    extractValueNearLabels(html, ["Ã¦ÂÂÃ¦Â°ÂÃ©ÂÂ"]) ||
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
      extractValueNearLabels(html, ["Ã£ÂÂ°Ã£ÂÂ¬Ã£ÂÂ¼Ã£ÂÂÃ¤Â»ÂÃ¥ÂÂ Ã¦ÂÂÃ¥Â Â±"]) ||
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
      visibleTitle && !visibleTitle.includes("Ã¯Â¿Â½") ? visibleTitle : title,
    carName,
    gradeName,
    gradeExtraInfo: "",
    classificationName,
    year: infoItems[0] || "",
    mileage: infoItems[1] || "",
    color: infoItems[2] || "",
    inspection: infoItems[3] || "",
    displacement: infoItems[4] || "",
    bodyPrice: bodyPrice ? `${bodyPrice}Ã¤Â¸ÂÃ¥ÂÂ` : "",
    totalPrice: totalPrice ? `${totalPrice}Ã¤Â¸ÂÃ¥ÂÂ` : "",
    imageUrl: qualityImageMap[stockId] || realImages[0] || "",
    detailUrl: findFirstUrl(urls, "/stock/detail"),
    editUrl: findFirstUrl(urls, "/car/edit/new"),
    gooUrl: findFirstUrl(urls, "goo-net.com"),
    sourceStatus: STATUS_PUBLIC,
    sourcePageUrl: "",
    types: [],
    typeKeys: [],
  };
}



function extractTableCells(rowHtml) {
  return Array.from(
    String(rowHtml || "").matchAll(/<(td|th)\b([^>]*)>([\s\S]*?)<\/\1>/gi)
  ).map((match) => ({
    tag: String(match[1] || "").toLowerCase(),
    attrs: match[2] || "",
    html: match[3] || "",
    text: compactText(cleanHtmlToText(match[3] || "")),
  }));
}

function normalizeSavedHeaderText(value) {
  return compactText(value)
    .replace(/\s+/g, "")
    .replace(/[ï¼:]/g, "")
    .toLowerCase();
}

function findSavedHeaderMap(html) {
  const rows = Array.from(
    String(html || "").matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)
  ).map((match) => match[0]);

  for (const rowHtml of rows) {
    const cells = extractTableCells(rowHtml);
    const labels = cells.map((cell) => normalizeSavedHeaderText(cell.text));
    const joined = labels.join("|");

    const hasYear = joined.includes("\u5e74\u5f0f");
    const hasMileage =
      joined.includes("\u8d70\u884c") ||
      joined.includes("\u8d70\u884c\u8ddd\u96e2");
    const hasColor =
      joined.includes("\u8272") ||
      joined.includes("\u8eca\u4f53\u8272");
    const hasBodyPrice =
      joined.includes("\u8eca\u4e21\u672c\u4f53\u4fa1\u683c") ||
      joined.includes("\u672c\u4f53\u4fa1\u683c");

    if (!hasYear || !hasMileage || !hasColor || !hasBodyPrice) continue;

    const findIndex = (...keywords) =>
      labels.findIndex((label) =>
        keywords.some((keyword) => label.includes(keyword))
      );

    return {
      selection: findIndex("\u9078\u629e"),
      photo: findIndex("\u5199\u771f"),
      carName: findIndex("\u8eca\u7a2e", "\u8eca\u540d"),
      gradeName: findIndex("\u30b0\u30ec\u30fc\u30c9"),
      managementNumber: findIndex("\u7ba1\u7406\u7528\u756a\u53f7"),
      year: findIndex("\u5e74\u5f0f"),
      displacement: findIndex("\u6392\u6c17\u91cf"),
      color: findIndex("\u8eca\u4f53\u8272", "\u8272"),
      mileage: findIndex("\u8d70\u884c\u8ddd\u96e2", "\u8d70\u884c"),
      bodyPrice: findIndex(
        "\u8eca\u4e21\u672c\u4f53\u4fa1\u683c",
        "\u672c\u4f53\u4fa1\u683c"
      ),
      totalPrice: findIndex("\u652f\u6255\u7dcf\u984d", "\u7dcf\u984d"),
      updatedAt: findIndex("\u66f4\u65b0\u65e5"),
    };
  }

  // ç»é¢ä¸ã®åé ã«åãããäºåè¨­å®
  return {
    selection: 0,
    photo: 1,
    carName: 2,
    gradeName: 3,
    managementNumber: 4,
    year: 5,
    displacement: 6,
    color: 7,
    mileage: 8,
    bodyPrice: 9,
    totalPrice: 10,
    updatedAt: 11,
  };
}

function savedCellText(cells, index) {
  if (!Number.isInteger(index) || index < 0 || index >= cells.length) return "";
  return compactText(cells[index]?.text || "");
}

function normalizeSavedYear(value) {
  const text = compactText(value);
  const match = text.match(/((?:19|20)\d{2})/);
  return match ? `${match[1]}\u5e74` : text;
}

function normalizeSavedDisplacement(value) {
  const text = compactText(toHalfWidthAscii(value)).replace(/\s+/g, "");
  if (!text) return "";
  if (/cc$/i.test(text) || /l$/i.test(text)) return text;

  const number = Number(text.match(/[0-9]+(?:\.[0-9]+)?/)?.[0] || "");
  if (!Number.isFinite(number)) return text;
  return number >= 100 ? `${number}cc` : `${number}L`;
}

function normalizeSavedImageUrl(url) {
  if (!url) return "";

  let value = absoluteUrl(decodeHtmlEntities(url), BASE_URL);

  // Goo-netç»åã¯ /S/ ãç¸®å°ç»åã/H/ ãé«è§£ååº¦ç»å
  value = value.replace(
    /(picture\d*\.goo-net\.com\/[^?#]+)\/S\//i,
    "$1/H/"
  );

  // ä¸è¬çãªãµã ãã¤ã«è¡¨è¨ãåå¯¸å´ã¸å¯ãã
  value = value
    .replace(/\/thumbnail\//gi, "/")
    .replace(/\/thumb\//gi, "/")
    .replace(/([_-])thumb(?=\.)/gi, "")
    .replace(/([_-])small(?=\.)/gi, "")
    .replace(/([_-])s(?=\.(?:jpe?g|png|webp))/gi, "");

  try {
    const parsed = new URL(value);
    for (const key of [
      "w",
      "width",
      "h",
      "height",
      "size",
      "resize",
      "thumbnail",
    ]) {
      parsed.searchParams.delete(key);
    }
    value = parsed.toString();
  } catch {
    // URLã¨ãã¦è§£æã§ããªãå ´åã¯åã®æå­åãä½¿ã
  }

  return value;
}

function extractSavedImageCandidates(rowHtml, pageUrl) {
  const values = [];
  const source = String(rowHtml || "");

  for (const match of source.matchAll(
    /\b(?:src|data-src|data-original|data-lazy|data-image|href)=["']([^"']+\.(?:jpe?g|png|webp)(?:\?[^"']*)?)["']/gi
  )) {
    values.push(absoluteUrl(decodeHtmlEntities(match[1]), pageUrl));
  }

  for (const match of source.matchAll(
    /https?:\/\/[^"'\\\s>]+?\.(?:jpe?g|png|webp)(?:\?[^"'\\\s>]*)?/gi
  )) {
    values.push(decodeHtmlEntities(match[0]));
  }

  const filtered = Array.from(new Set(values))
    .filter(Boolean)
    .filter((url) => !/logo|noimage|nophoto|loading/i.test(url))
    .filter((url) => !url.includes("/common/"));

  const scored = filtered.map((url) => {
    let score = 0;
    if (/picture\d*\.goo-net\.com/i.test(url)) score += 100;
    if (/\/H\//i.test(url)) score += 80;
    if (/original|large|full|quality/i.test(url)) score += 50;
    if (/\/S\/|thumb|small|thumbnail/i.test(url)) score -= 40;
    return { url: normalizeSavedImageUrl(url), score };
  });

  scored.sort((a, b) => b.score - a.score);
  return Array.from(new Set(scored.map((item) => item.url))).filter(Boolean);
}

function extractSavedRows(html) {
  return Array.from(
    String(html || "").matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)
  )
    .map((match) => match[0])
    .filter((rowHtml) => /StockId=[A-Za-z0-9]+/i.test(rowHtml));
}


function extractSavedVehicles(html, pageUrl) {
  const headerMap = findSavedHeaderMap(html);
  const rows = extractSavedRows(html);
  const vehicles = [];

  for (const rowHtml of rows) {
    const stockId =
      rowHtml.match(/StockId=([A-Za-z0-9]+)/i)?.[1] ||
      rowHtml.match(
        /<(?:input|button)\b[^>]*(?:name|id)=["'][^"']*StockId[^"']*["'][^>]*value=["']([A-Za-z0-9]+)["']/i
      )?.[1] ||
      "";

    if (!stockId) continue;

    const cells = extractTableCells(rowHtml);
    const rawHrefs = extractRawHrefValues(rowHtml);
    const urls = rawHrefs
      .map((href) => absoluteUrl(href, pageUrl))
      .filter(Boolean);

    const carName = savedCellText(cells, headerMap.carName);
    const gradeName = savedCellText(cells, headerMap.gradeName);
    const managementNumber = savedCellText(
      cells,
      headerMap.managementNumber
    );
    const year = normalizeSavedYear(savedCellText(cells, headerMap.year));
    const displacement = normalizeSavedDisplacement(
      savedCellText(cells, headerMap.displacement)
    );
    const color = savedCellText(cells, headerMap.color);
    const mileage = normalizeMileage(
      savedCellText(cells, headerMap.mileage)
    );
    const bodyPrice = normalizePrice(
      savedCellText(cells, headerMap.bodyPrice)
    );
    const totalPrice = normalizePrice(
      savedCellText(cells, headerMap.totalPrice)
    );
    const listUpdatedAt = savedCellText(cells, headerMap.updatedAt);

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
          url.includes(`StockId=${stockId}`)
      ) ||
      `${BASE_URL}/stock/detail?ClientId=0902332&StockId=${stockId}`;

    const imageCandidates = extractSavedImageCandidates(rowHtml, pageUrl);
    const imageUrl = imageCandidates[0] || "";
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
      bodyPrice,
      totalPrice,
      imageUrl,
      imageCandidates,
      gooUrl: "",
      managementNumber,
      listUpdatedAt,
      sourceStatus: STATUS_SAVED,
      sourcePageUrl: pageUrl,
      editUrl: editUrls[0] || "",
      editUrls,
      detailUrl,
      types: [],
      typeKeys: [],
      listResult: {
        parsedFromSavedList: true,
        carName: Boolean(carName),
        gradeName: Boolean(gradeName),
        year: Boolean(year),
        displacement: Boolean(displacement),
        color: Boolean(color),
        mileage: Boolean(mileage),
        bodyPrice: Boolean(bodyPrice),
        totalPrice: Boolean(totalPrice),
        image: Boolean(imageUrl),
        cellCount: cells.length,
      },
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


function chooseDetailValue(
  vehicle,
  detailValue,
  currentValue,
  previousValue = ""
) {
  if (vehicle.sourceStatus === STATUS_SAVED) {
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
                vehicle.sourceStatus === STATUS_SAVED
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
    (vehicle) => vehicle.sourceStatus === STATUS_SAVED
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
    imageCandidates: vehicle.imageCandidates || [],
    managementNumber: vehicle.managementNumber || "",
    listUpdatedAt: vehicle.listUpdatedAt || "",
    listResult: vehicle.listResult || null,
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
    (vehicle) => vehicle.sourceStatus === STATUS_SAVED
  );

  return {
    total: saved.length,
    parsedFromSavedList: saved.filter(
      (vehicle) => vehicle.listResult?.parsedFromSavedList
    ).length,
    yearFound: saved.filter((vehicle) => vehicle.year).length,
    yearMissing: saved.filter((vehicle) => !vehicle.year).length,
    colorFound: saved.filter((vehicle) => vehicle.color).length,
    colorMissing: saved.filter((vehicle) => !vehicle.color).length,
    mileageFound: saved.filter((vehicle) => vehicle.mileage).length,
    mileageMissing: saved.filter((vehicle) => !vehicle.mileage).length,
    bodyPriceFound: saved.filter((vehicle) => vehicle.bodyPrice).length,
    totalPriceFound: saved.filter((vehicle) => vehicle.totalPrice).length,
    imageFound: saved.filter((vehicle) => vehicle.imageUrl).length,
    imageMissing: saved.filter((vehicle) => !vehicle.imageUrl).length,
    detailFetchFailed: saved.filter(
      (vehicle) => vehicle.detailResult?.success === false
    ).length,
  };
}

function getTriggerLabel(request, save) {
  const cronHeader = request.headers.get("x-vercel-cron");
  const userAgent = request.headers.get("user-agent") || "";
  if (cronHeader || userAgent.toLowerCase().includes("vercel")) {
    return "Ã¨ÂÂªÃ¥ÂÂÃ¦ÂÂ´Ã¦ÂÂ°";
  }
  return save ? "URLÃ¤Â¿ÂÃ¥Â­ÂÃ¦ÂÂ´Ã¦ÂÂ°" : "URLÃ£ÂÂÃ£ÂÂ¬Ã£ÂÂÃ£ÂÂ¥Ã£ÂÂ¼";
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
          loginStatus !== 302 ? `Ã£ÂÂ­Ã£ÂÂ°Ã£ÂÂ¤Ã£ÂÂ³Ã§ÂÂ°Ã¥Â¸Â¸: ${loginStatus}` : "",
          publicResult.status !== 200
            ? `Ã¦ÂÂ²Ã¨Â¼ÂÃ¥ÂÂ¨Ã¥ÂºÂ«Ã¥ÂÂÃ¥Â¾ÂÃ§ÂÂ°Ã¥Â¸Â¸: ${publicResult.status}`
            : "",
          publicResult.containsLoginForm
            ? "Ã£ÂÂ­Ã£ÂÂ°Ã£ÂÂ¤Ã£ÂÂ³Ã£ÂÂÃ£ÂÂ©Ã£ÂÂ¼Ã£ÂÂ Ã£ÂÂÃ¨Â¡Â¨Ã§Â¤ÂºÃ£ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂ"
            : "",
          savedResult.pages.some((page) => page.status !== 200)
            ? "Ã¤Â¸ÂÃ¦ÂÂÃ¤Â¿ÂÃ¥Â­ÂÃ¥ÂÂ¨Ã¥ÂºÂ«Ã£ÂÂÃ£ÂÂ¼Ã£ÂÂ¸Ã£ÂÂ®Ã¥ÂÂÃ¥Â¾ÂÃ£ÂÂ«Ã¥Â¤Â±Ã¦ÂÂÃ£ÂÂÃ£ÂÂ¦Ã£ÂÂÃ£ÂÂ¾Ã£ÂÂ"
            : "",
          vehicles.length === 0 ? "Ã¥ÂÂ¨Ã¥ÂºÂ«Ã¥ÂÂÃ¥Â¾ÂÃ¤Â»Â¶Ã¦ÂÂ°Ã£ÂÂ0Ã¤Â»Â¶Ã£ÂÂ§Ã£ÂÂ" : "",
        ]
          .filter(Boolean)
          .join(" / ");

    const lastUpdateStatus = {
      success,
      statusText: success ? "Ã¦Â­Â£Ã¥Â¸Â¸Ã¦ÂÂ´Ã¦ÂÂ°" : "Ã¦ÂÂ´Ã¦ÂÂ°Ã§Â¢ÂºÃ¨ÂªÂÃ£ÂÂÃ¥Â¿ÂÃ¨Â¦Â",
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
      statusText: "Ã¦ÂÂ´Ã¦ÂÂ°Ã¥Â¤Â±Ã¦ÂÂ",
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
