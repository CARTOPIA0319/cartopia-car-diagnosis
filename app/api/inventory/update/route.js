import { after } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const CODE_VERSION = "saved-list-direct-v7-background-lock";

const BASE_URL = "https://motorgate.jp";
const PUBLIC_LIST_URL =
  `${BASE_URL}/stock/newsearch/stocklist/index/1/100`;

const SAVED_LIST_URLS = Array.from(
  { length: 10 },
  (_, index) =>
    index === 0
      ? `${BASE_URL}/stock/savelist`
      : `${BASE_URL}/stock/savelist/index/${index + 1}`
);

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

const DETAIL_CONCURRENCY = 6;
const DETAIL_RETRIES = 0;
const DETAIL_TIMEOUT_MS = 18000;

const LOCK_REF_NAME =
  "tags/cartopia-inventory-update-lock";

const LOCK_TTL_MS = 12 * 60 * 1000;
const GITHUB_SAVE_RETRIES = 5;

function json(data, status = 200) {
  return new Response(
    JSON.stringify(data, null, 2),
    {
      status,
      headers: {
        "Content-Type":
          "application/json; charset=utf-8",
        "Cache-Control":
          "no-store, no-cache, must-revalidate",
      },
    }
  );
}

function sleep(milliseconds) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );
}

function createRunId() {
  return [
    new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, ""),
    Math.random()
      .toString(36)
      .slice(2, 10),
  ].join("-");
}

function isTimeoutError(error) {
  const text =
    `${error?.name || ""} ${
      error?.message || ""
    }`.toLowerCase();

  return (
    text.includes("timeout") ||
    text.includes("abort")
  );
}

async function fetchWithTimeout(
  url,
  options = {},
  timeoutMs = 30000
) {
  const controller = new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
      cache: "no-store",
    });
  } finally {
    clearTimeout(timer);
  }
}

function addCookies(jar, setCookieText) {
  if (!setCookieText) return jar;

  for (
    const piece of String(
      setCookieText
    ).split(/,\s*(?=[^;,]+=)/)
  ) {
    const first =
      piece.split(";")[0].trim();

    const eq = first.indexOf("=");

    if (eq <= 0) continue;

    const name = first.slice(0, eq);
    const value = first.slice(eq + 1);

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
    typeof response?.headers?.getSetCookie ===
    "function"
      ? response.headers.getSetCookie()
      : [
          response?.headers?.get(
            "set-cookie"
          ) || "",
        ];

  for (const value of values) {
    addCookies(jar, value);
  }

  return jar;
}

function jarToCookie(jar) {
  return Object.entries(jar)
    .map(
      ([name, value]) =>
        `${name}=${value}`
    )
    .join("; ");
}

function normalizeCharset(value) {
  const text = String(
    value || ""
  ).toLowerCase();

  if (
    /shift[_-]?jis|sjis|windows-31j|ms932|cp932/.test(
      text
    )
  ) {
    return "shift_jis";
  }

  if (text.includes("euc-jp")) {
    return "euc-jp";
  }

  return "utf-8";
}

async function readResponseText(response) {
  const buffer =
    await response.arrayBuffer();

  const bytes = new Uint8Array(buffer);

  const contentType =
    response.headers.get(
      "content-type"
    ) || "";

  let charset =
    contentType.match(
      /charset\s*=\s*([^;\s]+)/i
    )?.[1] || "";

  if (!charset) {
    const head = Buffer.from(
      bytes.slice(0, 4096)
    ).toString("latin1");

    charset =
      head.match(
        /charset=["']?\s*([^\s"'/>]+)/i
      )?.[1] || "utf-8";
  }

  try {
    return new TextDecoder(
      normalizeCharset(charset),
      {
        fatal: false,
      }
    ).decode(bytes);
  } catch {
    return new TextDecoder(
      "utf-8",
      {
        fatal: false,
      }
    ).decode(bytes);
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
    .replace(
      /&#x([0-9a-f]+);/gi,
      (_, hex) =>
        String.fromCodePoint(
          parseInt(hex, 16)
        )
    )
    .replace(
      /&#(\d+);/g,
      (_, number) =>
        String.fromCodePoint(
          parseInt(number, 10)
        )
    );
}

function cleanHtmlToText(html) {
  return decodeHtmlEntities(
    String(html || "")
      .replace(
        /<script[\s\S]*?<\/script>/gi,
        " "
      )
      .replace(
        /<style[\s\S]*?<\/style>/gi,
        " "
      )
      .replace(
        /<br\s*\/?>/gi,
        "\n"
      )
      .replace(
        /<\/(p|div|li|td|th|tr|dt|dd)>/gi,
        "\n"
      )
      .replace(/<[^>]+>/g, " ")
  )
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(
      /\n[ \t]+|[ \t]+\n/g,
      "\n"
    )
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
  return String(text || "").replace(
    /[！-～]/g,
    (character) =>
      String.fromCharCode(
        character.charCodeAt(0) -
          0xfee0
      )
  );
}

function absoluteUrl(
  source,
  baseUrl = BASE_URL
) {
  const value = decodeHtmlEntities(
    String(source || "").trim()
  );

  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith("//")) {
    return `https:${value}`;
  }

  try {
    return new URL(
      value,
      baseUrl
    ).toString();
  } catch {
    return "";
  }
}

function escapeRegExp(value) {
  return String(value || "").replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function extractAttribute(
  tagHtml,
  attributeName
) {
  const quoted = String(
    tagHtml || ""
  ).match(
    new RegExp(
      `${escapeRegExp(
        attributeName
      )}\\s*=\\s*["']([^"']*)["']`,
      "i"
    )
  );

  if (quoted) {
    return decodeHtmlEntities(
      quoted[1]
    );
  }

  const unquoted = String(
    tagHtml || ""
  ).match(
    new RegExp(
      `${escapeRegExp(
        attributeName
      )}\\s*=\\s*([^\\s>]+)`,
      "i"
    )
  );

  return decodeHtmlEntities(
    unquoted?.[1] || ""
  );
}

function extractRawHrefValues(html) {
  return Array.from(
    String(html || "").matchAll(
      /<a\b[^>]*href=["']([^"']+)["'][^>]*>/gi
    )
  )
    .map((match) =>
      decodeHtmlEntities(match[1])
    )
    .filter(Boolean);
}

function extractHrefValues(
  html,
  baseUrl
) {
  return extractRawHrefValues(html)
    .map((href) =>
      absoluteUrl(href, baseUrl)
    )
    .filter(Boolean);
}

function extractCells(
  rowHtml,
  tagName = "td"
) {
  const regex = new RegExp(
    `<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`,
    "gi"
  );

  return Array.from(
    String(rowHtml || "").matchAll(
      regex
    )
  ).map((match) => ({
    html: match[1],
    text: compactText(
      cleanHtmlToText(match[1])
    ),
  }));
}

function extractAllTableRows(html) {
  return Array.from(
    String(html || "").matchAll(
      /<tr\b[^>]*>[\s\S]*?<\/tr>/gi
    )
  ).map((match) => match[0]);
}

function extractTdByClass(
  rowHtml,
  className
) {
  const regex = new RegExp(
    `<td\\b[^>]*class=["'][^"']*${escapeRegExp(
      className
    )}[^"']*["'][^>]*>([\\s\\S]*?)<\\/td>`,
    "i"
  );

  return (
    String(rowHtml || "").match(
      regex
    )?.[1] || ""
  );
}

function extractLiTexts(html) {
  return Array.from(
    String(html || "").matchAll(
      /<li\b[^>]*>([\s\S]*?)<\/li>/gi
    )
  )
    .map((match) =>
      compactText(
        cleanHtmlToText(match[1])
      )
    )
    .filter(Boolean);
}

function extractSpanById(
  html,
  idPart
) {
  const regex = new RegExp(
    `<span\\b[^>]*id=["'][^"']*${escapeRegExp(
      idPart
    )}[^"']*["'][^>]*>([\\s\\S]*?)<\\/span>`,
    "i"
  );

  return compactText(
    cleanHtmlToText(
      String(html || "").match(
        regex
      )?.[1] || ""
    )
  );
}

function getQueryParamDecoded(
  urlText,
  name
) {
  const match = decodeHtmlEntities(
    String(urlText || "")
  ).match(
    new RegExp(
      `[?&]${escapeRegExp(
        name
      )}=([^&#"']*)`,
      "i"
    )
  );

  if (!match) return "";

  try {
    return compactText(
      decodeURIComponent(
        match[1].replace(
          /\+/g,
          "%20"
        )
      )
    );
  } catch {
    return compactText(match[1]);
  }
}

function extractStockId(text) {
  const decoded =
    decodeHtmlEntities(
      String(text || "")
    );

  return (
    decoded.match(
      /[?&]StockId=([A-Za-z0-9]+)/i
    )?.[1] ||
    decoded.match(
      /StockId%3D([A-Za-z0-9]+)/i
    )?.[1] ||
    decoded.match(
      /name=["']StockId["'][^>]*value=["']([A-Za-z0-9]+)["']/i
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

  while (
    (match = idRegex.exec(source)) !==
    null
  ) {
    rows.push({
      stockId: match[1],
      rowHtml: match[0],
    });
  }

  if (rows.length > 0) {
    return rows;
  }

  for (
    const rowHtml of
    extractAllTableRows(source)
  ) {
    const stockId =
      extractStockId(rowHtml);

    if (stockId) {
      rows.push({
        stockId,
        rowHtml,
      });
    }
  }

  return rows;
}

function extractQualityImageMap(
  html,
  baseUrl
) {
  const map = {};

  const inputs =
    String(html || "").match(
      /<input\b[^>]*name=["']quality_img_url\[\]["'][^>]*>/gi
    ) || [];

  for (const input of inputs) {
    const id =
      extractAttribute(
        input,
        "data-quality-img-url-id"
      ) ||
      extractAttribute(
        input,
        "id"
      ).replace(
        /^quality_img_url_/,
        ""
      );

    const value =
      extractAttribute(
        input,
        "value"
      );

    if (id && value) {
      map[id] = absoluteUrl(
        value,
        baseUrl
      );
    }
  }

  return map;
}

function extractImageCandidates(
  html,
  baseUrl = BASE_URL
) {
  const urls = [];

  const source = String(
    html || ""
  )
    .replace(/\\\//g, "/")
    .replace(/\\u002F/gi, "/");

  for (
    const match of source.matchAll(
      /<img\b([^>]*)>/gi
    )
  ) {
    const attributes =
      match[1] || "";

    for (const attribute of [
      "src",
      "data-src",
      "data-original",
      "data-lazy-src",
      "data-image",
    ]) {
      const value =
        extractAttribute(
          attributes,
          attribute
        );

      if (value) {
        urls.push(
          absoluteUrl(
            value,
            baseUrl
          )
        );
      }
    }

    const srcset =
      extractAttribute(
        attributes,
        "srcset"
      );

    if (srcset) {
      for (
        const item of
        srcset.split(",")
      ) {
        const value =
          item
            .trim()
            .split(/\s+/)[0];

        if (value) {
          urls.push(
            absoluteUrl(
              value,
              baseUrl
            )
          );
        }
      }
    }
  }

  for (
    const match of source.matchAll(
      /<input\b([^>]*)>/gi
    )
  ) {
    const attributes =
      match[1] || "";

    const name =
      extractAttribute(
        attributes,
        "name"
      );

    const value =
      extractAttribute(
        attributes,
        "value"
      );

    if (
      /quality_img_url|image|photo|picture/i.test(
        name
      ) &&
      value
    ) {
      urls.push(
        absoluteUrl(
          value,
          baseUrl
        )
      );
    }
  }

  for (
    const match of source.matchAll(
      /https?:\/\/[^"'\\\s>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\\\s>]*)?/gi
    )
  ) {
    urls.push(
      decodeHtmlEntities(
        match[0]
      )
    );
  }

  return Array.from(
    new Set(
      urls.filter(Boolean)
    )
  )
    .map(upgradeImageUrl)
    .filter(
      (url) =>
        !/logo|noimage|nophoto|car_nophoto|\/common\//i.test(
          url
        )
    );
}

function upgradeImageUrl(url) {
  let value = String(url || "");

  if (!value) return "";

  value = value
    .replace(
      /\/(?:S|M|L|P|Q|T)\//i,
      "/H/"
    )
    .replace(
      /([?&](?:w|width)=)\d+/i,
      "$11200"
    )
    .replace(
      /([?&](?:h|height)=)\d+/i,
      "$1900"
    )
    .replace(
      /([?&](?:size)=)(?:small|thumb|thumbnail)/i,
      "$1large"
    );

  if (
    /secure\.goo-net\.com/i.test(
      value
    )
  ) {
    value = value.replace(
      /^https?:\/\/secure\.goo-net\.com/i,
      "https://picture1.goo-net.com"
    );
  }

  return value;
}

function imageScore(url) {
  const value = String(
    url || ""
  ).toLowerCase();

  if (!value) return -10000;

  let score = 0;

  if (
    value.includes(
      "goo-net.com"
    )
  ) {
    score += 100;
  }

  if (/\/h\//i.test(value)) {
    score += 80;
  }

  if (
    value.includes("quality")
  ) {
    score += 40;
  }

  if (
    value.includes("original")
  ) {
    score += 30;
  }

  if (
    value.includes("large")
  ) {
    score += 20;
  }

  if (
    /thumb|thumbnail|small|\/s\//i.test(
      value
    )
  ) {
    score -= 60;
  }

  if (
    /logo|noimage|nophoto|common/.test(
      value
    )
  ) {
    score -= 1000;
  }

  return score;
}

function chooseBestImage(...groups) {
  const candidates = groups
    .flat()
    .filter(Boolean)
    .map(upgradeImageUrl);

  return (
    Array.from(
      new Set(candidates)
    ).sort(
      (first, second) =>
        imageScore(second) -
        imageScore(first)
    )[0] || ""
  );
}

function normalizePrice(value) {
  const text = compactText(
    toHalfWidthAscii(value)
  );

  if (!text) return "";

  const number =
    text.match(
      /[0-9]+(?:\.[0-9]+)?/
    )?.[0] || "";

  return number
    ? `${number}万円`
    : "";
}

function normalizeMileage(value) {
  const text = compactText(
    toHalfWidthAscii(value)
  )
    .replace(/,/g, "")
    .replace(/\s+/g, "");

  if (!text) return "";

  if (
    /走不明|不明/.test(text)
  ) {
    return "走不明";
  }

  const man = text.match(
    /([0-9]+(?:\.[0-9]+)?)万[ＫKk]?/
  );

  if (man) {
    return `${Number(
      man[1]
    )}万K`;
  }

  const kilometers = text.match(
    /([0-9]+(?:\.[0-9]+)?)(?:km|ＫＭ|ｋｍ)/i
  );

  if (kilometers) {
    const number = Number(
      kilometers[1]
    );

    if (
      Number.isFinite(number)
    ) {
      return `${(
        Math.floor(
          number / 1000
        ) / 10
      ).toFixed(1)}万K`;
    }
  }

  const plainNumber =
    text.match(/^\d+$/)?.[0];

  if (plainNumber) {
    const number = Number(
      plainNumber
    );

    if (
      Number.isFinite(number) &&
      number >= 1000
    ) {
      return `${(
        Math.floor(
          number / 1000
        ) / 10
      ).toFixed(1)}万K`;
    }
  }

  return "";
}

function normalizeYear(value) {
  const text = compactText(
    toHalfWidthAscii(value)
  );

  const western = text.match(
    /((?:19|20)\d{2})\s*年?/
  );

  if (western) {
    return `${western[1]}年`;
  }

  const era = text.match(
    /(令和|平成|昭和)\s*(元|\d+)\s*年?/
  );

  if (!era) return "";

  const year =
    era[2] === "元"
      ? 1
      : Number(era[2]);

  const base =
    era[1] === "令和"
      ? 2018
      : era[1] === "平成"
        ? 1988
        : 1925;

  return `${base + year}年`;
}

function normalizeDisplacement(
  value
) {
  const text = compactText(
    toHalfWidthAscii(value)
  );

  if (!text) return "";

  if (/cc|ＣＣ/i.test(text)) {
    const number =
      text.match(
        /[0-9]+(?:\.[0-9]+)?/
      )?.[0] || "";

    return number
      ? `${number}cc`
      : "";
  }

  if (/L|Ｌ/i.test(text)) {
    const number =
      text.match(
        /[0-9]+(?:\.[0-9]+)?/
      )?.[0] || "";

    return number
      ? `${number}L`
      : "";
  }

  const number = Number(
    text.match(
      /[0-9]+(?:\.[0-9]+)?/
    )?.[0] || NaN
  );

  if (
    !Number.isFinite(number)
  ) {
    return "";
  }

  return number >= 100
    ? `${number}cc`
    : `${number}L`;
}

function cleanVehicleText(value) {
  return compactText(value)
    .replace(
      /^車両情報を編集\s*/g,
      ""
    )
    .replace(
      /\s*車両情報を編集$/g,
      ""
    )
    .trim();
}

function normalizeHeaderText(value) {
  return compactText(value)
    .replace(
      /[\s\u3000]+/g,
      ""
    )
    .replace(/[：:]/g, "")
    .trim();
}

function findSavedHeaderMap(html) {
  for (
    const rowHtml of
    extractAllTableRows(html)
  ) {
    let headers = extractCells(
      rowHtml,
      "th"
    ).map(
      (cell) => cell.text
    );

    if (!headers.length) {
      headers = extractCells(
        rowHtml,
        "td"
      ).map(
        (cell) => cell.text
      );
    }

    if (!headers.length) {
      continue;
    }

    const joined = headers
      .map(
        normalizeHeaderText
      )
      .join("");

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

function headerIndex(
  headers,
  aliases
) {
  const normalizedAliases =
    aliases.map(
      normalizeHeaderText
    );

  return headers.findIndex(
    (header) => {
      const normalizedHeader =
        normalizeHeaderText(header);

      return normalizedAliases.some(
        (alias) =>
          normalizedHeader ===
            alias ||
          normalizedHeader.includes(
            alias
          ) ||
          alias.includes(
            normalizedHeader
          )
      );
    }
  );
}

function cellTextByHeader(
  cells,
  headers,
  aliases
) {
  const index = headerIndex(
    headers,
    aliases
  );

  return index >= 0
    ? cells[index]?.text || ""
    : "";
}

function cellHtmlByHeader(
  cells,
  headers,
  aliases
) {
  const index = headerIndex(
    headers,
    aliases
  );

  return index >= 0
    ? cells[index]?.html || ""
    : "";
}

function parsePublicVehicleRow(
  row,
  baseUrl,
  qualityImageMap
) {
  const {
    stockId,
    rowHtml,
  } = row;

  const rawHrefs =
    extractRawHrefValues(
      rowHtml
    );

  const urls =
    extractHrefValues(
      rowHtml,
      baseUrl
    );

  const rawTireHref =
    rawHrefs.find((href) =>
      href.includes(
        "get_tire_from_car_model"
      )
    ) || "";

  const carName =
    getQueryParamDecoded(
      rawTireHref,
      "car_name"
    );

  const gradeName =
    getQueryParamDecoded(
      rawTireHref,
      "grade_name"
    );

  const classificationName =
    getQueryParamDecoded(
      rawTireHref,
      "classification_name"
    );

  const nameCell =
    extractTdByClass(
      rowHtml,
      "item__name"
    );

  const visibleTitle =
    compactText(
      cleanHtmlToText(
        nameCell.match(
          /<a\b[^>]*>([\s\S]*?)<\/a>/i
        )?.[1] || nameCell
      )
    );

  const infoItems =
    extractLiTexts(
      extractTdByClass(
        rowHtml,
        "item__info"
      )
    );

  const costCell =
    extractTdByClass(
      rowHtml,
      "item__cost"
    );

  const bodyPrice =
    extractSpanById(
      costCell,
      `kakaku_display_${stockId}`
    );

  const totalPrice =
    extractSpanById(
      costCell,
      `total_display_${stockId}`
    );

  const title =
    [
      carName,
      gradeName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    visibleTitle;

  const imageUrl =
    chooseBestImage(
      qualityImageMap[stockId],
      extractImageCandidates(
        rowHtml,
        baseUrl
      )
    );

  return {
    stockId,
    title,
    description:
      visibleTitle || title,
    carName:
      carName || visibleTitle,
    gradeName,
    gradeExtraInfo: "",
    classificationName,
    year:
      normalizeYear(
        infoItems[0] || ""
      ) ||
      infoItems[0] ||
      "",
    mileage:
      normalizeMileage(
        infoItems[1] || ""
      ) ||
      infoItems[1] ||
      "",
    color: infoItems[2] || "",
    inspection:
      infoItems[3] || "",
    displacement:
      infoItems[4] || "",
    bodyPrice:
      normalizePrice(bodyPrice),
    totalPrice:
      normalizePrice(totalPrice),
    imageUrl,
    detailUrl:
      urls.find((url) =>
        url.includes(
          "/stock/detail"
        )
      ) || "",
    editUrl:
      urls.find((url) =>
        url.includes(
          "/car/edit/new"
        )
      ) || "",
    editUrls:
      urls.filter((url) =>
        url.includes(
          "/car/edit/new"
        )
      ),
    gooUrl:
      urls.find((url) =>
        url.includes(
          "goo-net.com"
        )
      ) || "",
    sourceStatus: "掲載在庫",
    sourcePageUrl: "",
    types: [],
    typeKeys: [],
    listResult: null,
  };
}

function parseSavedVehicleRow(
  rowHtml,
  headers,
  pageUrl
) {
  const stockId =
    extractStockId(rowHtml);

  if (!stockId) return null;

  const cells =
    extractCells(
      rowHtml,
      "td"
    );

  if (!cells.length) {
    return null;
  }

  const urls =
    extractHrefValues(
      rowHtml,
      pageUrl
    );

  const clientId =
    process.env
      .MOTORGATE_CLIENT_ID ||
    "0902332";

  const editUrls = Array.from(
    new Set(
      [
        ...urls.filter(
          (url) =>
            url.includes(
              "/car/newregist/register"
            ) ||
            url.includes(
              "/car/edit/new"
            )
        ),
        `${BASE_URL}/car/newregist/register?kbn=1&client_id=${encodeURIComponent(
          clientId
        )}&StockStatus=00180002&StockId=${stockId}&ScreenId=SIH_001`,
        `${BASE_URL}/car/edit/new?kbn=1&ClientId=${encodeURIComponent(
          clientId
        )}&StockId=${stockId}&StockStatus=00180002&ScreenId=CB101GR`,
      ].filter(Boolean)
    )
  );

  let carName =
    cleanVehicleText(
      cellTextByHeader(
        cells,
        headers,
        [
          "車種",
          "車名",
        ]
      )
    );

  let gradeName =
    cleanVehicleText(
      cellTextByHeader(
        cells,
        headers,
        ["グレード"]
      )
    );

  let year = normalizeYear(
    cellTextByHeader(
      cells,
      headers,
      ["年式"]
    )
  );

  let displacement =
    normalizeDisplacement(
      cellTextByHeader(
        cells,
        headers,
        ["排気量"]
      )
    );

  let color =
    cleanVehicleText(
      cellTextByHeader(
        cells,
        headers,
        [
          "色",
          "車体色",
        ]
      )
    );

  let mileage =
    normalizeMileage(
      cellTextByHeader(
        cells,
        headers,
        ["走行"]
      )
    );

  let bodyPrice =
    normalizePrice(
      cellTextByHeader(
        cells,
        headers,
        ["車両本体価格"]
      )
    );

  let totalPrice =
    normalizePrice(
      cellTextByHeader(
        cells,
        headers,
        ["支払総額"]
      )
    );

  const cellTexts =
    cells.map((cell) =>
      cleanVehicleText(
        cell.text
      )
    );

  const yearIndex =
    cellTexts.findIndex(
      (value) =>
        Boolean(
          normalizeYear(value)
        )
    );

  const mileageIndex =
    cellTexts.findIndex(
      (value) =>
        Boolean(
          normalizeMileage(value)
        )
    );

  const priceValues =
    cellTexts.flatMap(
      (value) =>
        Array.from(
          value.matchAll(
            /([0-9]+(?:\.[0-9]+)?)\s*万円/g
          )
        ).map(
          (match) =>
            `${match[1]}万円`
        )
    );

  if (
    !year &&
    yearIndex >= 0
  ) {
    year = normalizeYear(
      cellTexts[yearIndex]
    );
  }

  if (
    !mileage &&
    mileageIndex >= 0
  ) {
    mileage =
      normalizeMileage(
        cellTexts[
          mileageIndex
        ]
      );
  }

  if (
    !bodyPrice &&
    priceValues.length >= 1
  ) {
    bodyPrice =
      priceValues[0];
  }

  if (
    !totalPrice &&
    priceValues.length >= 2
  ) {
    totalPrice =
      priceValues[1];
  }

  if (
    !displacement &&
    yearIndex >= 0
  ) {
    displacement =
      normalizeDisplacement(
        cellTexts[
          yearIndex + 1
        ] || ""
      );
  }

  if (
    !color &&
    yearIndex >= 0 &&
    mileageIndex > yearIndex
  ) {
    const possible =
      cellTexts
        .slice(
          yearIndex + 1,
          mileageIndex
        )
        .filter(Boolean);

    color =
      possible.length > 1
        ? possible[
            possible.length - 1
          ]
        : possible[0] || "";
  }

  if (
    !carName ||
    !gradeName
  ) {
    const candidates =
      cellTexts
        .slice(
          0,
          yearIndex >= 0
            ? yearIndex
            : Math.min(
                cells.length,
                7
              )
        )
        .filter(Boolean)
        .filter(
          (value) =>
            !/車両情報を編集|選択|写真/.test(
              value
            )
        )
        .filter(
          (value) =>
            !/^[0-9A-Za-z_-]+$/.test(
              value
            )
        );

    if (!carName) {
      carName =
        candidates[0] || "";
    }

    if (!gradeName) {
      gradeName =
        candidates.find(
          (value) =>
            value !== carName
        ) || "";
    }
  }

  if (
    gradeName &&
    carName &&
    compactText(gradeName) ===
      compactText(carName)
  ) {
    gradeName = "";
  }

  const imageHtml =
    cellHtmlByHeader(
      cells,
      headers,
      ["写真"]
    ) || rowHtml;

  const imageUrl =
    chooseBestImage(
      extractImageCandidates(
        imageHtml,
        pageUrl
      ),
      extractImageCandidates(
        rowHtml,
        pageUrl
      )
    );

  const title =
    [
      carName,
      gradeName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();

  const detailUrl =
    urls.find(
      (url) =>
        url.includes(
          "/stock/detail"
        ) &&
        url.includes(
          `StockId=${stockId}`
        )
    ) ||
    `${BASE_URL}/stock/detail?ClientId=${encodeURIComponent(
      clientId
    )}&StockId=${stockId}`;

  const listResult = {
    carName:
      Boolean(carName),
    gradeName:
      Boolean(gradeName),
    year: Boolean(year),
    displacement:
      Boolean(displacement),
    color: Boolean(color),
    mileage:
      Boolean(mileage),
    bodyPrice:
      Boolean(bodyPrice),
    totalPrice:
      Boolean(totalPrice),
    imageUrl:
      Boolean(imageUrl),
  };

  return {
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
    detailUrl,
    editUrl:
      editUrls[0] || "",
    editUrls,
    gooUrl:
      urls.find((url) =>
        url.includes(
          "goo-net.com"
        )
      ) || "",
    sourceStatus: "一時保存",
    sourcePageUrl: pageUrl,
    types: [],
    typeKeys: [],
    listResult,
  };
}

function extractSavedVehicles(
  html,
  pageUrl
) {
  const headers =
    findSavedHeaderMap(html);

  const vehicles = [];

  for (
    const rowHtml of
    extractAllTableRows(html)
  ) {
    if (
      !/StockId=/i.test(
        decodeHtmlEntities(
          rowHtml
        )
      )
    ) {
      continue;
    }

    const vehicle =
      parseSavedVehicleRow(
        rowHtml,
        headers,
        pageUrl
      );

    if (vehicle) {
      vehicles.push(vehicle);
    }
  }

  return uniqueByStockId(
    vehicles
  );
}

function uniqueByStockId(
  vehicles
) {
  const map = new Map();

  for (
    const vehicle of
    vehicles || []
  ) {
    if (vehicle?.stockId) {
      map.set(
        vehicle.stockId,
        vehicle
      );
    }
  }

  return Array.from(
    map.values()
  );
}

function normalizeTypeKey(type) {
  const value = compactText(
    toHalfWidthAscii(type)
  );

  if (/^suv$/i.test(value)) {
    return "SUV";
  }

  if (
    /^ev[・･\/]?hv$/i.test(
      value
    )
  ) {
    return "EV・HV";
  }

  return value;
}

function extractTypesFromText(
  text
) {
  const source =
    decodeHtmlEntities(
      String(text || "")
    );

  const types = [];

  for (
    const match of
    source.matchAll(
      /TYPE\s*:\s*([^\s<>"'&]+)/gi
    )
  ) {
    const value =
      compactText(
        match[1]
      ).replace(
        /[、,。]/g,
        ""
      );

    if (
      value &&
      !/[._…]/.test(value) &&
      !types.includes(value)
    ) {
      types.push(value);
    }
  }

  return types;
}

function buildTypeKeys(types) {
  return Array.from(
    new Set(
      (types || [])
        .map(normalizeTypeKey)
        .filter(Boolean)
    )
  );
}

function extractSelectedOption(
  selectHtml
) {
  const options = Array.from(
    String(
      selectHtml || ""
    ).matchAll(
      /<option\b([^>]*)>([\s\S]*?)<\/option>/gi
    )
  );

  const selected =
    options.find((option) =>
      /\bselected\b/i.test(
        option[1] || ""
      )
    );

  if (!selected) {
    return {
      value: "",
      text: "",
    };
  }

  return {
    value:
      extractAttribute(
        selected[1],
        "value"
      ),
    text: compactText(
      cleanHtmlToText(
        selected[2]
      )
    ),
  };
}

function extractControls(html) {
  const controls = [];
  const source = String(
    html || ""
  );

  for (
    const match of
    source.matchAll(
      /<input\b([^>]*)>/gi
    )
  ) {
    const attributes =
      match[1] || "";

    const type =
      extractAttribute(
        attributes,
        "type"
      ).toLowerCase();

    if (
      (
        type === "radio" ||
        type === "checkbox"
      ) &&
      !/\bchecked\b/i.test(
        attributes
      )
    ) {
      continue;
    }

    controls.push({
      name:
        extractAttribute(
          attributes,
          "name"
        ),
      id:
        extractAttribute(
          attributes,
          "id"
        ),
      className:
        extractAttribute(
          attributes,
          "class"
        ),
      value: compactText(
        extractAttribute(
          attributes,
          "value"
        )
      ),
      text: "",
    });
  }

  for (
    const match of
    source.matchAll(
      /<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/gi
    )
  ) {
    const attributes =
      match[1] || "";

    controls.push({
      name:
        extractAttribute(
          attributes,
          "name"
        ),
      id:
        extractAttribute(
          attributes,
          "id"
        ),
      className:
        extractAttribute(
          attributes,
          "class"
        ),
      value: compactText(
        cleanHtmlToText(
          match[2]
        )
      ),
      text: "",
    });
  }

  for (
    const match of
    source.matchAll(
      /<select\b([^>]*)>([\s\S]*?)<\/select>/gi
    )
  ) {
    const attributes =
      match[1] || "";

    const selected =
      extractSelectedOption(
        match[2]
      );

    controls.push({
      name:
        extractAttribute(
          attributes,
          "name"
        ),
      id:
        extractAttribute(
          attributes,
          "id"
        ),
      className:
        extractAttribute(
          attributes,
          "class"
        ),
      value:
        selected.value,
      text:
        selected.text,
    });
  }

  return controls;
}

function normalizeControlKey(
  value
) {
  return toHalfWidthAscii(
    String(value || "")
  )
    .toLowerCase()
    .replace(
      /[\s_\-:[\]（）()]/g,
      ""
    );
}

function findControlValue(
  html,
  names
) {
  const targets = names
    .map(normalizeControlKey)
    .filter(Boolean);

  const controls =
    extractControls(html);

  for (
    const control of controls
  ) {
    const key =
      normalizeControlKey(
        `${control.name} ${control.id} ${control.className}`
      );

    if (
      !targets.some(
        (target) =>
          key === target ||
          key.includes(target)
      )
    ) {
      continue;
    }

    const value =
      compactText(
        control.text ||
        control.value
      );

    if (
      value &&
      !/^(選択|選択してください|未選択|なし|--|---|0)$/.test(
        value
      )
    ) {
      return value;
    }
  }

  return "";
}

function isMeaningfulValue(
  value
) {
  const text =
    compactText(value);

  return Boolean(
    text &&
      !/^(選択|選択してください|未選択|なし|無し|--|---|0|null|undefined)$/i.test(
        text
      )
  );
}

function findControlValueByPatterns(
  html,
  patterns
) {
  const controls =
    extractControls(html);

  for (
    const control of controls
  ) {
    const key =
      normalizeControlKey(
        `${control.name} ${control.id} ${control.className}`
      );

    if (
      !patterns.some(
        (pattern) =>
          pattern.test(key)
      )
    ) {
      continue;
    }

    const value =
      compactText(
        control.text ||
        control.value
      );

    if (
      isMeaningfulValue(value)
    ) {
      return value;
    }
  }

  return "";
}

function extractLabelValuePairs(
  html
) {
  const pairs = [];

  const source = String(
    html || ""
  );

  for (
    const rowHtml of
    extractAllTableRows(source)
  ) {
    const headers =
      extractCells(
        rowHtml,
        "th"
      );

    const cells =
      extractCells(
        rowHtml,
        "td"
      );

    if (
      headers.length &&
      cells.length
    ) {
      for (
        let index = 0;
        index <
        Math.min(
          headers.length,
          cells.length
        );
        index += 1
      ) {
        pairs.push({
          label:
            compactText(
              headers[index].text
            ),
          value:
            compactText(
              cells[index].text
            ),
        });
      }
    } else if (
      cells.length >= 2
    ) {
      for (
        let index = 0;
        index + 1 <
        cells.length;
        index += 2
      ) {
        pairs.push({
          label:
            compactText(
              cells[index].text
            ),
          value:
            compactText(
              cells[
                index + 1
              ].text
            ),
        });
      }
    }
  }

  for (
    const match of
    source.matchAll(
      /<dt\b[^>]*>([\s\S]*?)<\/dt>\s*<dd\b[^>]*>([\s\S]*?)<\/dd>/gi
    )
  ) {
    pairs.push({
      label: compactText(
        cleanHtmlToText(
          match[1]
        )
      ),
      value: compactText(
        cleanHtmlToText(
          match[2]
        )
      ),
    });
  }

  return pairs;
}

function findPairValue(
  html,
  labels
) {
  const normalizedLabels =
    labels.map(
      normalizeHeaderText
    );

  for (
    const pair of
    extractLabelValuePairs(
      html
    )
  ) {
    const label =
      normalizeHeaderText(
        pair.label
      );

    if (
      normalizedLabels.some(
        (target) =>
          label === target ||
          label.includes(
            target
          ) ||
          target.includes(
            label
          )
      ) &&
      isMeaningfulValue(
        pair.value
      )
    ) {
      return pair.value;
    }
  }

  return "";
}

function findRegionNearLabel(
  html,
  labels
) {
  const source = String(
    html || ""
  );

  for (const label of labels) {
    const index =
      source.indexOf(label);

    if (index < 0) {
      continue;
    }

    for (
      const [
        startTag,
        endTag,
      ] of [
        ["<tr", "</tr>"],
        ["<li", "</li>"],
        ["<dl", "</dl>"],
        [
          "<fieldset",
          "</fieldset>",
        ],
        ["<div", "</div>"],
      ]
    ) {
      const start =
        source.lastIndexOf(
          startTag,
          index
        );

      const end =
        source.indexOf(
          endTag,
          index
        );

      if (
        start >= 0 &&
        end >= 0 &&
        end - start <= 20000
      ) {
        return source.slice(
          start,
          end +
            endTag.length
        );
      }
    }
  }

  return "";
}

function findValueNearLabel(
  html,
  labels
) {
  const pairValue =
    findPairValue(
      html,
      labels
    );

  if (pairValue) {
    return pairValue;
  }

  const region =
    findRegionNearLabel(
      html,
      labels
    );

  if (!region) return "";

  const controls =
    extractControls(region);

  for (
    const control of controls
  ) {
    const value =
      compactText(
        control.text ||
        control.value
      );

    if (
      isMeaningfulValue(value)
    ) {
      return value;
    }
  }

  let text = compactText(
    cleanHtmlToText(region)
  );

  for (const label of labels) {
    text = text.replace(
      new RegExp(
        `^.*?${escapeRegExp(
          label
        )}\\s*[：:]?\\s*`,
        "i"
      ),
      ""
    );
  }

  return isMeaningfulValue(
    text
  )
    ? text
    : "";
}

function extractRegistrationYear(
  html
) {
  const direct =
    findControlValue(
      html,
      [
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
      ]
    ) ||
    findControlValueByPatterns(
      html,
      [
        /(?:syodo|shodo|firstreg|registration).*year/,
        /year.*(?:syodo|shodo|firstreg|registration)/,
        /(?:nenshiki|modelyear|registyear)/,
      ]
    ) ||
    findValueNearLabel(
      html,
      [
        "初度登録年月",
        "初年度登録年月",
        "初度登録",
        "初年度登録",
        "初度検査年月",
        "年式",
      ]
    );

  const normalized =
    normalizeYear(direct);

  if (normalized) {
    return normalized;
  }

  const controls =
    extractControls(html);

  for (
    const control of controls
  ) {
    const key =
      normalizeControlKey(
        `${control.name} ${control.id} ${control.className}`
      );

    if (
      !/(?:syodo|shodo|firstreg|registration|nenshiki|modelyear|registyear)/.test(
        key
      )
    ) {
      continue;
    }

    const value =
      compactText(
        control.text ||
        control.value
      );

    const year =
      normalizeYear(value);

    if (year) {
      return year;
    }
  }

  return "";
}

function extractBodyColor(html) {
  const value =
    findControlValue(
      html,
      [
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
      ]
    ) ||
    findControlValueByPatterns(
      html,
      [
        /(?:body|car|exterior|syatai|shatai).*(?:color|iro)/,
        /(?:color|iro).*(?:body|car|exterior|syatai|shatai)/,
      ]
    ) ||
    findValueNearLabel(
      html,
      [
        "車体色",
        "ボディカラー",
        "外装色",
        "カラー",
        "色",
      ]
    );

  return compactText(value)
    .replace(
      /^(車体色|ボディカラー|外装色|カラー|色)\s*[：:]?\s*/,
      ""
    )
    .replace(
      /(カラーコード|色コード)[\s\S]*$/,
      ""
    )
    .slice(0, 100)
    .trim();
}

function extractCommonVehicleDetails(
  html,
  pageUrl
) {
  const text =
    cleanHtmlToText(html);

  const carName =
    findControlValue(
      html,
      [
        "CarName",
        "Syamei",
        "Shamei",
        "VehicleName",
        "car_name",
        "syamei_name",
        "shamei_name",
        "vehicle_name",
        "model_name",
      ]
    ) ||
    findControlValueByPatterns(
      html,
      [
        /(?:car|vehicle|syamei|shamei).*name/,
        /name.*(?:car|vehicle|syamei|shamei)/,
      ]
    ) ||
    findValueNearLabel(
      html,
      [
        "車名",
        "車種",
      ]
    );

  const gradeName =
    findControlValue(
      html,
      [
        "GradeName",
        "Grade",
        "grade_name",
        "Gurade",
        "grade_nm",
        "grade",
      ]
    ) ||
    findControlValueByPatterns(
      html,
      [
        /grade/,
        /gurade/,
      ]
    ) ||
    findValueNearLabel(
      html,
      ["グレード"]
    );

  const classificationName =
    findControlValue(
      html,
      [
        "Katashiki",
        "ClassificationName",
        "ModelCode",
        "classification_name",
        "model_code",
        "katashiki",
      ]
    ) ||
    findControlValueByPatterns(
      html,
      [
        /katashiki/,
        /classification/,
        /modelcode/,
      ]
    ) ||
    findValueNearLabel(
      html,
      ["型式"]
    );

  const mileage =
    normalizeMileage(
      findControlValue(
        html,
        [
          "Soukou",
          "SoukouKyori",
          "Mileage",
          "MileageDistance",
          "RunDistance",
          "soukou_kyori",
          "run_distance",
        ]
      ) ||
        findControlValueByPatterns(
          html,
          [
            /soukou/,
            /mileage/,
            /rundistance/,
          ]
        ) ||
        findValueNearLabel(
          html,
          [
            "走行距離",
            "走行",
          ]
        ) ||
        text.match(
          /\d+(?:\.\d+)?万[ＫKk]/
        )?.[0] ||
        text.match(
          /\d{1,7}(?:,\d{3})*\s*(?:km|ＫＭ|ｋｍ)/i
        )?.[0] ||
        ""
    ) || "";

  const inspection =
    findControlValue(
      html,
      [
        "Shaken",
        "Inspection",
        "InspectionDate",
        "Syaken",
        "shaken_date",
        "inspection_date",
      ]
    ) ||
    findControlValueByPatterns(
      html,
      [
        /shaken/,
        /syaken/,
        /inspection/,
      ]
    ) ||
    findValueNearLabel(
      html,
      [
        "車検",
        "車検有効期限",
      ]
    );

  const displacement =
    normalizeDisplacement(
      findControlValue(
        html,
        [
          "Haikiryo",
          "Displacement",
          "EngineDisplacement",
          "haiki_ryo",
          "engine_displacement",
        ]
      ) ||
        findControlValueByPatterns(
          html,
          [
            /haikiryo/,
            /displacement/,
          ]
        ) ||
        findValueNearLabel(
          html,
          ["排気量"]
        )
    ) || "";

  const bodyPrice =
    normalizePrice(
      findControlValue(
        html,
        [
          "Kakaku",
          "BodyPrice",
          "VehiclePrice",
          "CarPrice",
          "body_price",
          "vehicle_price",
          "car_price",
        ]
      ) ||
        findControlValueByPatterns(
          html,
          [
            /bodyprice/,
            /vehicleprice/,
            /carprice/,
            /kakaku/,
          ]
        ) ||
        findValueNearLabel(
          html,
          [
            "車両本体価格",
            "本体価格",
          ]
        )
    );

  const totalPrice =
    normalizePrice(
      findControlValue(
        html,
        [
          "TotalPrice",
          "SiharaiTotal",
          "ShiharaiTotal",
          "PaymentTotal",
          "total_price",
          "payment_total",
        ]
      ) ||
        findControlValueByPatterns(
          html,
          [
            /totalprice/,
            /paymenttotal/,
            /siharaitotal/,
            /shiharaitotal/,
          ]
        ) ||
        findValueNearLabel(
          html,
          [
            "支払総額",
            "総額",
          ]
        )
    );

  const gradeExtraInfo =
    findControlValue(
      html,
      [
        "grade_additional_info",
        "grade_info",
        "GradeAddition",
        "grade_extra_info",
        "grade_note",
      ]
    ) ||
    findControlValueByPatterns(
      html,
      [
        /grade.*(?:info|addition|extra|note)/,
      ]
    ) ||
    findValueNearLabel(
      html,
      [
        "グレード付加情報",
        "グレード情報",
      ]
    );

  return {
    carName:
      cleanVehicleText(carName),
    gradeName:
      cleanVehicleText(
        gradeName
      ),
    classificationName:
      compactText(
        classificationName
      ),
    year:
      extractRegistrationYear(
        html
      ),
    mileage,
    color:
      extractBodyColor(html),
    inspection:
      compactText(inspection),
    displacement,
    bodyPrice,
    totalPrice,
    gradeExtraInfo:
      compactText(
        gradeExtraInfo
      ),
    imageUrl:
      chooseBestImage(
        extractImageCandidates(
          html,
          pageUrl
        )
      ),
  };
}

async function loginMotorgate() {
  const loginUrl =
    `${BASE_URL}/login/index`;

  const jar = {};

  const loginPage =
    await fetchWithTimeout(
      loginUrl,
      {
        headers: {
          "User-Agent":
            USER_AGENT,
          "Accept-Language":
            "ja,en-US;q=0.9,en;q=0.8",
        },
      },
      30000
    );

  addResponseCookies(
    jar,
    loginPage
  );

  const html =
    await readResponseText(
      loginPage
    );

  const csrf =
    html.match(
      /name=["']fuel_csrf_token["'][^>]*value=["']([^"']+)/i
    )?.[1];

  const sessionId =
    html.match(
      /name=["']session_id["'][^>]*value=["']([^"']+)/i
    )?.[1];

  const login =
    await fetchWithTimeout(
      loginUrl,
      {
        method: "POST",
        redirect: "manual",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Origin: BASE_URL,
          Referer: loginUrl,
          Cookie:
            jarToCookie(jar),
          "User-Agent":
            USER_AGENT,
          "Accept-Language":
            "ja,en-US;q=0.9,en;q=0.8",
        },
        body: new URLSearchParams({
          fuel_csrf_token:
            csrf || "",
          session_id:
            sessionId || "",
          client_id:
            process.env
              .MOTORGATE_CLIENT_ID ||
            "",
          user_id: "",
          client_pw:
            process.env
              .MOTORGATE_PASSWORD ||
            "",
        }),
      },
      30000
    );

  addResponseCookies(
    jar,
    login
  );

  return {
    jar,
    loginStatus:
      login.status,
  };
}

function mergePreviousVehicle(
  vehicle,
  previousVehicle
) {
  if (!previousVehicle) {
    return vehicle;
  }

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
    if (
      !result[key] &&
      previousVehicle[key]
    ) {
      result[key] =
        previousVehicle[key];
    }
  }

  if (
    (
      !result.types ||
      result.types.length === 0
    ) &&
    previousVehicle.types
  ) {
    result.types =
      previousVehicle.types;
  }

  if (
    (
      !result.typeKeys ||
      result.typeKeys.length === 0
    ) &&
    previousVehicle.typeKeys
  ) {
    result.typeKeys =
      previousVehicle.typeKeys;
  }

  return result;
}

function buildDetailUrlCandidates(
  vehicle
) {
  return Array.from(
    new Set(
      [
        ...(vehicle.editUrls ||
          []),
        vehicle.editUrl,
        vehicle.detailUrl,
      ].filter(Boolean)
    )
  );
}

function detailScore(
  details,
  types
) {
  return (
    [
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
    ].filter(Boolean).length +
    (types || []).length
  );
}

function chooseMergedValue(
  vehicle,
  previous,
  details,
  key
) {
  const currentValue =
    vehicle[key] || "";

  const previousValue =
    previous?.[key] || "";

  const detailValue =
    details?.[key] || "";

  if (key === "imageUrl") {
    return chooseBestImage(
      detailValue,
      currentValue,
      previousValue
    );
  }

  if (
    vehicle.sourceStatus ===
    "一時保存"
  ) {
    const detailPriority =
      new Set([
        "carName",
        "gradeName",
        "gradeExtraInfo",
        "classificationName",
        "year",
        "color",
        "inspection",
        "displacement",
      ]);

    if (
      detailPriority.has(key)
    ) {
      return (
        detailValue ||
        currentValue ||
        previousValue
      );
    }

    const listPriority =
      new Set([
        "mileage",
        "bodyPrice",
        "totalPrice",
      ]);

    if (
      listPriority.has(key)
    ) {
      return (
        currentValue ||
        detailValue ||
        previousValue
      );
    }

    return (
      detailValue ||
      currentValue ||
      previousValue
    );
  }

  return (
    currentValue ||
    detailValue ||
    previousValue
  );
}

async function fetchVehicleDetail(
  jar,
  vehicle,
  previousVehicle = null
) {
  const candidates =
    buildDetailUrlCandidates(
      vehicle
    );

  if (!candidates.length) {
    const fallback =
      mergePreviousVehicle(
        vehicle,
        previousVehicle
      );

    return {
      ...fallback,
      typeResult: {
        status: null,
        success: Boolean(
          fallback.types?.length
        ),
        timeout: false,
        error:
          "detail URL not found",
      },
      detailResult: {
        success: false,
        url: "",
        attempts: 0,
        year: Boolean(
          fallback.year
        ),
        mileage: Boolean(
          fallback.mileage
        ),
        color: Boolean(
          fallback.color
        ),
        imageUrl: Boolean(
          fallback.imageUrl
        ),
      },
    };
  }

  let best = null;
  const errors = [];
  let attempts = 0;

  candidateLoop:
  for (
    const candidateUrl of
    candidates
  ) {
    for (
      let retry = 0;
      retry <= DETAIL_RETRIES;
      retry += 1
    ) {
      attempts += 1;

      try {
        const response =
          await fetchWithTimeout(
            candidateUrl,
            {
              headers: {
                Cookie:
                  jarToCookie(jar),
                Referer:
                  vehicle.sourceStatus ===
                  "一時保存"
                    ? `${BASE_URL}/stock/savelist`
                    : `${BASE_URL}/top`,
                "User-Agent":
                  USER_AGENT,
                "Accept-Language":
                  "ja,en-US;q=0.9,en;q=0.8",
                "Cache-Control":
                  "no-store",
              },
            },
            DETAIL_TIMEOUT_MS
          );

        const html =
          await readResponseText(
            response
          );

        const containsLoginForm =
          html.includes(
            'name="client_pw"'
          ) ||
          html.includes(
            "name='client_pw'"
          );

        if (
          !response.ok ||
          containsLoginForm
        ) {
          errors.push(
            `${candidateUrl}: HTTP ${
              response.status
            }${
              containsLoginForm
                ? " login form"
                : ""
            }`
          );

          continue;
        }

        const types =
          Array.from(
            new Set([
              ...extractTypesFromText(
                html
              ),
              ...extractTypesFromText(
                cleanHtmlToText(
                  html
                )
              ),
            ])
          );

        const details =
          extractCommonVehicleDetails(
            html,
            candidateUrl
          );

        const score =
          detailScore(
            details,
            types
          );

        if (
          !best ||
          score > best.score
        ) {
          best = {
            url: candidateUrl,
            status:
              response.status,
            html,
            details,
            types,
            score,
          };
        }

        const savedEnough =
          vehicle.sourceStatus ===
            "一時保存" &&
          Boolean(
            (
              details.year ||
              vehicle.year
            ) &&
            (
              details.color ||
              vehicle.color
            ) &&
            (
              details.imageUrl ||
              vehicle.imageUrl
            ) &&
            (
              details.carName ||
              vehicle.carName
            )
          );

        const publicEnough =
          vehicle.sourceStatus ===
            "掲載在庫" &&
          Boolean(
            types.length &&
            (
              details.imageUrl ||
              vehicle.imageUrl
            )
          );

        if (
          savedEnough ||
          publicEnough
        ) {
          break candidateLoop;
        }
      } catch (error) {
        errors.push(
          `${candidateUrl}: ${
            error.message ||
            String(error)
          }`
        );
      }
    }
  }

  if (!best) {
    const fallback =
      mergePreviousVehicle(
        vehicle,
        previousVehicle
      );

    return {
      ...fallback,
      typeResult: {
        status: null,
        success: Boolean(
          fallback.types?.length
        ),
        timeout:
          errors.some((value) =>
            /timeout|abort/i.test(
              value
            )
          ),
        error:
          errors.join(" / "),
      },
      detailResult: {
        success: false,
        url: "",
        attempts,
        year: Boolean(
          fallback.year
        ),
        mileage: Boolean(
          fallback.mileage
        ),
        color: Boolean(
          fallback.color
        ),
        imageUrl: Boolean(
          fallback.imageUrl
        ),
      },
    };
  }

  const previous =
    previousVehicle || {};

  const details =
    best.details;

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

  const carName =
    chooseMergedValue(
      vehicle,
      previous,
      details,
      "carName"
    );

  const gradeName =
    chooseMergedValue(
      vehicle,
      previous,
      details,
      "gradeName"
    );

  const title =
    [
      carName,
      gradeName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    vehicle.title ||
    previous.title ||
    "";

  return mergePreviousVehicle(
    {
      ...vehicle,
      title,
      description:
        vehicle.description ||
        previous.description ||
        title,
      carName,
      gradeName,
      gradeExtraInfo:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "gradeExtraInfo"
        ),
      classificationName:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "classificationName"
        ),
      year:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "year"
        ),
      mileage:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "mileage"
        ),
      color:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "color"
        ),
      inspection:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "inspection"
        ),
      displacement:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "displacement"
        ),
      bodyPrice:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "bodyPrice"
        ),
      totalPrice:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "totalPrice"
        ),
      imageUrl:
        chooseMergedValue(
          vehicle,
          previous,
          details,
          "imageUrl"
        ),
      editUrl:
        best.url.includes(
          "/stock/detail"
        )
          ? vehicle.editUrl
          : best.url,
      types,
      typeKeys,
      typeResult: {
        status:
          best.status,
        success:
          types.length > 0,
        containsFatalError:
          best.html.includes(
            "FatalError"
          ),
        timeout: false,
        error:
          errors.join(" / "),
      },
      detailResult: {
        success: true,
        url: best.url,
        attempts,
        year: Boolean(
          details.year
        ),
        mileage: Boolean(
          details.mileage
        ),
        color: Boolean(
          details.color
        ),
        imageUrl: Boolean(
          details.imageUrl
        ),
      },
    },
    previousVehicle
  );
}

async function mapWithConcurrency(
  items,
  limit,
  mapper
) {
  const results =
    new Array(items.length);

  let nextIndex = 0;

  async function worker() {
    while (true) {
      const index =
        nextIndex++;

      if (
        index >= items.length
      ) {
        return;
      }

      results[index] =
        await mapper(
          items[index],
          index
        );
    }
  }

  await Promise.all(
    Array.from(
      {
        length: Math.min(
          limit,
          Math.max(
            1,
            items.length
          )
        ),
      },
      () => worker()
    )
  );

  return results;
}

async function attachVehicleDetails(
  jar,
  vehicles,
  previousMap = new Map()
) {
  return mapWithConcurrency(
    vehicles,
    DETAIL_CONCURRENCY,
    (vehicle) =>
      fetchVehicleDetail(
        jar,
        vehicle,
        previousMap.get(
          vehicle.stockId
        ) || null
      )
  );
}

function toInventoryVehicle(
  vehicle
) {
  return {
    stockId:
      vehicle.stockId,
    title:
      vehicle.title,
    description:
      vehicle.description,
    carName:
      vehicle.carName,
    gradeName:
      vehicle.gradeName,
    gradeExtraInfo:
      vehicle.gradeExtraInfo ||
      "",
    classificationName:
      vehicle.classificationName,
    year:
      vehicle.year,
    mileage:
      vehicle.mileage,
    color:
      vehicle.color,
    inspection:
      vehicle.inspection,
    displacement:
      vehicle.displacement,
    bodyPrice:
      vehicle.bodyPrice,
    totalPrice:
      vehicle.totalPrice,
    imageUrl:
      vehicle.imageUrl,
    detailUrl:
      vehicle.detailUrl,
    gooUrl:
      vehicle.gooUrl,
    sourceStatus:
      vehicle.sourceStatus,
    sourcePageUrl:
      vehicle.sourcePageUrl ||
      "",
    editUrl:
      vehicle.editUrl || "",
    editUrls:
      vehicle.editUrls || [],
    types:
      vehicle.types || [],
    typeKeys:
      vehicle.typeKeys || [],
    listResult:
      vehicle.listResult ||
      null,
    updatedAt:
      new Date()
        .toISOString(),
    typeResult:
      vehicle.typeResult ||
      null,
    detailResult:
      vehicle.detailResult ||
      null,
  };
}

async function fetchPublicVehicles(
  jar,
  previousMap
) {
  const response =
    await fetchWithTimeout(
      PUBLIC_LIST_URL,
      {
        headers: {
          Cookie:
            jarToCookie(jar),
          Referer:
            `${BASE_URL}/top`,
          "User-Agent":
            USER_AGENT,
          "Accept-Language":
            "ja,en-US;q=0.9,en;q=0.8",
        },
      },
      30000
    );

  const html =
    await readResponseText(
      response
    );

  const containsLoginForm =
    html.includes(
      'name="client_pw"'
    ) ||
    html.includes(
      "name='client_pw'"
    );

  const imageMap =
    extractQualityImageMap(
      html,
      PUBLIC_LIST_URL
    );

  const rows =
    extractVehicleRows(html);

  const vehicles =
    rows.map((row) =>
      parsePublicVehicleRow(
        row,
        PUBLIC_LIST_URL,
        imageMap
      )
    );

  const detailed =
    await attachVehicleDetails(
      jar,
      vehicles,
      previousMap
    );

  return {
    status:
      response.status,
    containsLoginForm,
    foundRows:
      rows.length,
    imageMapCount:
      Object.keys(
        imageMap
      ).length,
    vehicles:
      detailed.map(
        toInventoryVehicle
      ),
  };
}

function summarizeSavedListFields(
  vehicles
) {
  const saved =
    (vehicles || []).filter(
      (vehicle) =>
        vehicle.sourceStatus ===
        "一時保存"
    );

  const count = (key) =>
    saved.filter(
      (vehicle) =>
        vehicle.listResult?.[
          key
        ]
    ).length;

  return {
    total:
      saved.length,
    carNameFound:
      count("carName"),
    gradeNameFound:
      count("gradeName"),
    yearFound:
      count("year"),
    displacementFound:
      count("displacement"),
    colorFound:
      count("color"),
    mileageFound:
      count("mileage"),
    bodyPriceFound:
      count("bodyPrice"),
    totalPriceFound:
      count("totalPrice"),
    imageFound:
      count("imageUrl"),
  };
}

async function fetchSavedPage(
  jar,
  pageUrl
) {
  const response =
    await fetchWithTimeout(
      pageUrl,
      {
        headers: {
          Cookie:
            jarToCookie(jar),
          Referer:
            `${BASE_URL}/top`,
          "User-Agent":
            USER_AGENT,
          "Accept-Language":
            "ja,en-US;q=0.9,en;q=0.8",
        },
      },
      30000
    );

  const html =
    await readResponseText(
      response
    );

  const containsLoginForm =
    html.includes(
      'name="client_pw"'
    ) ||
    html.includes(
      "name='client_pw'"
    );

  const vehicles =
    extractSavedVehicles(
      html,
      pageUrl
    );

  return {
    pageUrl,
    status:
      response.status,
    containsLoginForm,
    count:
      vehicles.length,
    listFields:
      summarizeSavedListFields(
        vehicles
      ),
    vehicles,
  };
}

async function fetchSavedVehicles(
  jar,
  previousMap
) {
  const pages = [];
  const allVehicles = [];
  const seenStockIds =
    new Set();

  for (
    const pageUrl of
    SAVED_LIST_URLS
  ) {
    const page =
      await fetchSavedPage(
        jar,
        pageUrl
      );

    const newVehicles =
      page.vehicles.filter(
        (vehicle) =>
          !seenStockIds.has(
            vehicle.stockId
          )
      );

    for (
      const vehicle of
      newVehicles
    ) {
      seenStockIds.add(
        vehicle.stockId
      );

      allVehicles.push(
        vehicle
      );
    }

    pages.push({
      pageUrl:
        page.pageUrl,
      status:
        page.status,
      containsLoginForm:
        page.containsLoginForm,
      count:
        page.count,
      newCount:
        newVehicles.length,
      listFields:
        page.listFields,
    });

    if (
      page.count === 0 ||
      newVehicles.length === 0
    ) {
      break;
    }
  }

  const unique =
    uniqueByStockId(
      allVehicles
    );

  const detailed =
    await attachVehicleDetails(
      jar,
      unique,
      previousMap
    );

  return {
    pages,
    vehicles:
      detailed.map(
        toInventoryVehicle
      ),
  };
}

function getGitHubConfig() {
  return {
    token:
      process.env
        .GITHUB_TOKEN || "",
    owner:
      process.env
        .GITHUB_OWNER ||
      "CARTOPIA0319",
    repo:
      process.env
        .GITHUB_REPO ||
      "cartopia-car-diagnosis",
    branch:
      process.env
        .GITHUB_BRANCH ||
      "main",
    path:
      "data/inventory.json",
  };
}

function getGitHubHeaders(
  includeJson = false
) {
  const {
    token,
  } = getGitHubConfig();

  return {
    Authorization:
      `Bearer ${token}`,
    Accept:
      "application/vnd.github+json",
    "X-GitHub-Api-Version":
      "2022-11-28",
    "User-Agent":
      "cartopia-inventory-updater",
    "Cache-Control":
      "no-store",
    ...(includeJson
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),
  };
}

async function githubApi(
  url,
  options = {}
) {
  const response =
    await fetchWithTimeout(
      url,
      {
        ...options,
        headers: {
          ...getGitHubHeaders(
            Boolean(
              options.body
            )
          ),
          ...(options.headers ||
            {}),
        },
      },
      30000
    );

  const text =
    await response.text();

  let data = {};

  try {
    data = text
      ? JSON.parse(text)
      : {};
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
  const {
    token,
    owner,
    repo,
    branch,
    path,
  } = getGitHubConfig();

  if (!token) {
    return {
      success: false,
      status: null,
      sha: null,
      inventory: {
        vehicles: [],
      },
      error:
        "GITHUB_TOKEN is not set",
    };
  }

  const apiUrl =
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const {
    response,
    data,
  } = await githubApi(
    `${apiUrl}?ref=${encodeURIComponent(
      branch
    )}&t=${Date.now()}`
  );

  if (!response.ok) {
    return {
      success: false,
      status:
        response.status,
      sha: null,
      inventory: {
        vehicles: [],
      },
      error: data,
    };
  }

  let inventory = {
    vehicles: [],
  };

  if (data.content) {
    try {
      const decoded =
        Buffer.from(
          String(
            data.content
          ).replace(
            /\n/g,
            ""
          ),
          "base64"
        ).toString("utf8");

      inventory =
        JSON.parse(decoded);
    } catch (error) {
      inventory = {
        vehicles: [],
        readError:
          error.message ||
          String(error),
      };
    }
  }

  return {
    success: true,
    status:
      response.status,
    sha:
      data.sha || null,
    inventory,
    error: "",
  };
}

async function fetchCurrentInventoryFromGitHub() {
  const result =
    await fetchGitHubInventoryFile();

  return {
    sha:
      result.sha,
    inventory:
      result.inventory || {
        vehicles: [],
      },
    readStatus:
      result.status,
    readError:
      result.error || "",
  };
}

async function commitInventoryToGitHub(
  inventoryData,
  existingSha,
  message =
    "refresh public and saved inventory data"
) {
  const {
    token,
    owner,
    repo,
    branch,
    path,
  } = getGitHubConfig();

  if (!token) {
    return {
      saved: false,
      reason:
        "GITHUB_TOKEN is not set",
    };
  }

  const apiUrl =
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const content =
    Buffer.from(
      JSON.stringify(
        inventoryData,
        null,
        2
      ),
      "utf8"
    ).toString("base64");

  async function put(sha) {
    const requestBody = {
      message,
      content,
      branch,
    };

    if (sha) {
      requestBody.sha = sha;
    }

    const {
      response,
      data,
    } = await githubApi(
      apiUrl,
      {
        method: "PUT",
        body:
          JSON.stringify(
            requestBody
          ),
      }
    );

    return {
      response,
      data,
      usedSha:
        sha || "",
    };
  }

  let lastResult = null;
  let lastSha =
    existingSha || null;

  for (
    let attempt = 1;
    attempt <=
      GITHUB_SAVE_RETRIES;
    attempt += 1
  ) {
    const latest =
      await fetchGitHubInventoryFile();

    lastSha =
      latest.sha ||
      lastSha ||
      null;

    lastResult =
      await put(lastSha);

    if (
      lastResult.response.ok
    ) {
      return {
        saved: true,
        status:
          lastResult
            .response.status,
        path,
        branch,
        attempt,
        usedSha:
          lastResult.usedSha,
        commit:
          lastResult.data
            .commit
            ?.html_url || "",
        commitSha:
          lastResult.data
            .commit?.sha ||
          "",
        contentSha:
          lastResult.data
            .content?.sha ||
          "",
        error: "",
      };
    }

    const errorMessage =
      String(
        lastResult.data
          ?.message || ""
      ).toLowerCase();

    const conflict =
      lastResult
        .response.status ===
        409 ||
      lastResult
        .response.status ===
        422 ||
      errorMessage.includes(
        "sha"
      ) ||
      errorMessage.includes(
        "conflict"
      ) ||
      errorMessage.includes(
        "does not match"
      );

    if (!conflict) {
      break;
    }

    await sleep(
      500 * attempt
    );
  }

  return {
    saved: false,
    status:
      lastResult?.response
        ?.status || null,
    path,
    branch,
    attempt:
      GITHUB_SAVE_RETRIES,
    usedSha:
      lastResult?.usedSha ||
      "",
    commit: "",
    commitSha: "",
    contentSha: "",
    error:
      lastResult?.data || {
        message:
          "GitHub save failed",
      },
  };
}

async function readUpdateLock() {
  const {
    token,
    owner,
    repo,
  } = getGitHubConfig();

  if (!token) {
    return {
      locked: false,
      available: false,
      error:
        "GITHUB_TOKEN is not set",
    };
  }

  const refUrl =
    `https://api.github.com/repos/${owner}/${repo}/git/ref/${LOCK_REF_NAME}`;

  const {
    response,
    data,
  } = await githubApi(
    refUrl
  );

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

  const refSha =
    data.object?.sha || "";

  let createdAt = "";
  let runId = "";
  let trigger = "";

  if (
    data.object?.type ===
      "tag" &&
    refSha
  ) {
    const tagUrl =
      `https://api.github.com/repos/${owner}/${repo}/git/tags/${refSha}`;

    const tagResult =
      await githubApi(tagUrl);

    if (
      tagResult.response.ok
    ) {
      createdAt =
        tagResult.data
          .tagger?.date ||
        "";

      try {
        const parsed =
          JSON.parse(
            tagResult.data
              .message || "{}"
          );

        runId =
          parsed.runId || "";

        trigger =
          parsed.trigger || "";
      } catch {
        runId = "";
      }
    }
  }

  const createdTime =
    createdAt
      ? new Date(
          createdAt
        ).getTime()
      : 0;

  const ageMs =
    createdTime
      ? Date.now() -
        createdTime
      : 0;

  return {
    locked: true,
    available: true,
    refSha,
    createdAt,
    ageMs,
    stale:
      Boolean(
        createdTime &&
        ageMs > LOCK_TTL_MS
      ),
    runId,
    trigger,
    error: "",
  };
}

async function deleteUpdateLock(
  expectedRefSha = ""
) {
  const {
    owner,
    repo,
  } = getGitHubConfig();

  const current =
    await readUpdateLock();

  if (!current.locked) {
    return {
      deleted: true,
      reason:
        "lock already absent",
    };
  }

  if (
    expectedRefSha &&
    current.refSha !==
      expectedRefSha
  ) {
    return {
      deleted: false,
      reason:
        "lock belongs to another run",
    };
  }

  const deleteUrl =
    `https://api.github.com/repos/${owner}/${repo}/git/refs/${LOCK_REF_NAME}`;

  const {
    response,
    data,
  } = await githubApi(
    deleteUrl,
    {
      method: "DELETE",
    }
  );

  return {
    deleted:
      response.ok ||
      response.status === 404,
    status:
      response.status,
    error:
      response.ok
        ? ""
        : data,
  };
}

async function acquireUpdateLock(
  runId,
  trigger
) {
  const {
    token,
    owner,
    repo,
    branch,
  } = getGitHubConfig();

  if (!token) {
    return {
      acquired: false,
      error:
        "GITHUB_TOKEN is not set",
    };
  }

  const current =
    await readUpdateLock();

  if (
    current.locked &&
    !current.stale
  ) {
    return {
      acquired: false,
      running: true,
      current,
      error: "",
    };
  }

  if (
    current.locked &&
    current.stale
  ) {
    await deleteUpdateLock(
      current.refSha
    );
  }

  const branchRefUrl =
    `https://api.github.com/repos/${owner}/${repo}/git/ref/heads/${encodeURIComponent(
      branch
    )}`;

  const branchResult =
    await githubApi(
      branchRefUrl
    );

  if (
    !branchResult.response.ok
  ) {
    return {
      acquired: false,
      running: false,
      error:
        branchResult.data,
    };
  }

  const commitSha =
    branchResult.data
      .object?.sha;

  if (!commitSha) {
    return {
      acquired: false,
      running: false,
      error:
        "main commit SHA not found",
    };
  }

  const createdAt =
    new Date()
      .toISOString();

  const tagObjectUrl =
    `https://api.github.com/repos/${owner}/${repo}/git/tags`;

  const tagResult =
    await githubApi(
      tagObjectUrl,
      {
        method: "POST",
        body:
          JSON.stringify({
            tag:
              `cartopia-inventory-update-${runId}`,
            message:
              JSON.stringify({
                runId,
                trigger,
                createdAt,
              }),
            object:
              commitSha,
            type: "commit",
            tagger: {
              name:
                "CARTOPIA Inventory Updater",
              email:
                "cartopia@example.invalid",
              date:
                createdAt,
            },
          }),
      }
    );

  if (
    !tagResult.response.ok
  ) {
    return {
      acquired: false,
      running: false,
      error:
        tagResult.data,
    };
  }

  const tagObjectSha =
    tagResult.data.sha;

  const createRefUrl =
    `https://api.github.com/repos/${owner}/${repo}/git/refs`;

  const refResult =
    await githubApi(
      createRefUrl,
      {
        method: "POST",
        body:
          JSON.stringify({
            ref:
              `refs/${LOCK_REF_NAME}`,
            sha:
              tagObjectSha,
          }),
      }
    );

  if (
    refResult.response.ok
  ) {
    return {
      acquired: true,
      running: true,
      runId,
      trigger,
      createdAt,
      refSha:
        tagObjectSha,
      error: "",
    };
  }

  if (
    refResult.response.status ===
      409 ||
    refResult.response.status ===
      422
  ) {
    const existing =
      await readUpdateLock();

    return {
      acquired: false,
      running: true,
      current:
        existing,
      error: "",
    };
  }

  return {
    acquired: false,
    running: false,
    error:
      refResult.data,
  };
}

function mergeVehicles(
  publicVehicles,
  savedVehicles
) {
  return uniqueByStockId([
    ...(publicVehicles || []),
    ...(savedVehicles || []),
  ]);
}

function summarizeTypeResults(
  vehicles
) {
  return {
    success:
      vehicles.filter(
        (vehicle) =>
          vehicle.typeResult
            ?.success
      ).length,
    failed:
      vehicles.filter(
        (vehicle) =>
          !vehicle.typeResult
            ?.success
      ).length,
    timeout:
      vehicles.filter(
        (vehicle) =>
          vehicle.typeResult
            ?.timeout
      ).length,
  };
}

function summarizeGradeExtraInfo(
  vehicles
) {
  return {
    found:
      vehicles.filter(
        (vehicle) =>
          vehicle.gradeExtraInfo
      ).length,
    missing:
      vehicles.filter(
        (vehicle) =>
          !vehicle.gradeExtraInfo
      ).length,
  };
}

function summarizeSavedDetailFields(
  vehicles
) {
  const saved =
    vehicles.filter(
      (vehicle) =>
        vehicle.sourceStatus ===
        "一時保存"
    );

  return {
    total:
      saved.length,
    yearFound:
      saved.filter(
        (vehicle) =>
          vehicle.year
      ).length,
    yearMissing:
      saved.filter(
        (vehicle) =>
          !vehicle.year
      ).length,
    colorFound:
      saved.filter(
        (vehicle) =>
          vehicle.color
      ).length,
    colorMissing:
      saved.filter(
        (vehicle) =>
          !vehicle.color
      ).length,
    mileageFound:
      saved.filter(
        (vehicle) =>
          vehicle.mileage
      ).length,
    mileageMissing:
      saved.filter(
        (vehicle) =>
          !vehicle.mileage
      ).length,
    imageFound:
      saved.filter(
        (vehicle) =>
          vehicle.imageUrl
      ).length,
    imageMissing:
      saved.filter(
        (vehicle) =>
          !vehicle.imageUrl
      ).length,
    bodyPriceFound:
      saved.filter(
        (vehicle) =>
          vehicle.bodyPrice
      ).length,
    totalPriceFound:
      saved.filter(
        (vehicle) =>
          vehicle.totalPrice
      ).length,
    detailFetchFailed:
      saved.filter(
        (vehicle) =>
          vehicle.detailResult
            ?.success === false
      ).length,
  };
}

function getTriggerLabel(
  request
) {
  const url =
    new URL(request.url);

  const source =
    url.searchParams.get(
      "source"
    ) || "";

  if (
    source ===
    "github-actions"
  ) {
    return "GitHub Actions自動更新";
  }

  const cronHeader =
    request.headers.get(
      "x-vercel-cron"
    );

  const userAgent =
    request.headers.get(
      "user-agent"
    ) || "";

  if (
    cronHeader ||
    userAgent
      .toLowerCase()
      .includes(
        "vercel-cron"
      )
  ) {
    return "Vercel Cron自動更新";
  }

  return "URL手動更新";
}

function buildFailureInventoryData(
  currentInventory,
  status
) {
  return {
    ...(currentInventory ||
      {}),
    lastFailedAt:
      status.finishedAt,
    lastUpdateStatus:
      status,
  };
}

async function runInventoryUpdate({
  runId,
  trigger,
}) {
  const startedAt =
    new Date();

  let current = {
    sha: null,
    inventory: {
      vehicles: [],
    },
    readStatus: null,
    readError: "",
  };

  try {
    current =
      await fetchCurrentInventoryFromGitHub();

    const previousMap =
      new Map(
        (
          current.inventory
            ?.vehicles || []
        )
          .filter(
            (vehicle) =>
              vehicle?.stockId
          )
          .map((vehicle) => [
            vehicle.stockId,
            vehicle,
          ])
      );

    const {
      jar,
      loginStatus,
    } =
      await loginMotorgate();

    const [
      publicResult,
      savedResult,
    ] = await Promise.all([
      fetchPublicVehicles(
        jar,
        previousMap
      ),
      fetchSavedVehicles(
        jar,
        previousMap
      ),
    ]);

    const vehicles =
      mergeVehicles(
        publicResult.vehicles,
        savedResult.vehicles
      );

    const finishedAt =
      new Date();

    const durationSeconds =
      Math.round(
        (
          finishedAt.getTime() -
          startedAt.getTime()
        ) / 1000
      );

    const typeResults =
      summarizeTypeResults(
        vehicles
      );

    const savedDetailFields =
      summarizeSavedDetailFields(
        vehicles
      );

    const savedListFields =
      summarizeSavedListFields(
        vehicles
      );

    const success =
      loginStatus === 302 &&
      publicResult.status ===
        200 &&
      !publicResult
        .containsLoginForm &&
      savedResult.pages.every(
        (page) =>
          page.status ===
            200 &&
          !page.containsLoginForm
      ) &&
      vehicles.length > 0;

    const errors = [
      loginStatus !== 302
        ? `ログイン異常: ${loginStatus}`
        : "",
      publicResult.status !==
      200
        ? `掲載在庫取得異常: ${publicResult.status}`
        : "",
      publicResult
        .containsLoginForm
        ? "掲載在庫取得時にログインフォームが表示されました"
        : "",
      savedResult.pages.some(
        (page) =>
          page.status !== 200
      )
        ? "一時保存一覧ページの取得に失敗しました"
        : "",
      savedResult.pages.some(
        (page) =>
          page.containsLoginForm
      )
        ? "一時保存一覧取得時にログインフォームが表示されました"
        : "",
      vehicles.length === 0
        ? "在庫取得件数が0件です"
        : "",
    ].filter(Boolean);

    const lastUpdateStatus = {
      success,
      statusText:
        success
          ? "正常更新"
          : "更新確認が必要",
      runId,
      trigger,
      startedAt:
        startedAt.toISOString(),
      finishedAt:
        finishedAt.toISOString(),
      durationSeconds,
      error:
        errors.join(" / "),
      timeout: false,
      typeFailed:
        typeResults.failed,
      typeTimeout:
        typeResults.timeout,
      savedYearMissing:
        savedDetailFields
          .yearMissing,
      savedColorMissing:
        savedDetailFields
          .colorMissing,
      savedMileageMissing:
        savedDetailFields
          .mileageMissing,
      savedImageMissing:
        savedDetailFields
          .imageMissing,
      savedDetailFetchFailed:
        savedDetailFields
          .detailFetchFailed,
    };

    const inventoryData = {
      codeVersion:
        CODE_VERSION,
      updatedAt:
        finishedAt.toISOString(),
      source: "motorgate",
      updateMode:
        "full-public-and-saved-refresh",
      lastUpdateStatus,
      counts: {
        publicVehicles:
          publicResult
            .vehicles.length,
        savedVehicles:
          savedResult
            .vehicles.length,
        vehicles:
          vehicles.length,
        publicFoundRows:
          publicResult
            .foundRows,
        publicImageMapCount:
          publicResult
            .imageMapCount,
      },
      checks: {
        githubRead: {
          status:
            current.readStatus,
          shaFound:
            Boolean(
              current.sha
            ),
          sha:
            current.sha || "",
          error:
            current.readError ||
            "",
        },
        loginStatus,
        publicListStatus:
          publicResult.status,
        publicContainsLoginForm:
          publicResult
            .containsLoginForm,
        savedPages:
          savedResult.pages,
        typeResults,
        gradeExtraInfo:
          summarizeGradeExtraInfo(
            vehicles
          ),
        savedListFields,
        savedDetailFields,
      },
      vehicles,
    };

    const github =
      await commitInventoryToGitHub(
        inventoryData,
        current.sha,
        `refresh inventory ${runId}`
      );

    console.log(
      JSON.stringify({
        event:
          "inventory-update-finished",
        runId,
        trigger,
        success,
        githubSaved:
          github.saved,
        counts:
          inventoryData.counts,
        durationSeconds,
      })
    );

    return {
      success:
        success &&
        github.saved,
      scrapingSuccess:
        success,
      codeVersion:
        CODE_VERSION,
      runId,
      trigger,
      github,
      counts:
        inventoryData.counts,
      savedListFields,
      savedDetailFields,
      lastUpdateStatus,
    };
  } catch (error) {
    const finishedAt =
      new Date();

    const failureStatus = {
      success: false,
      statusText:
        "更新失敗",
      runId,
      trigger,
      startedAt:
        startedAt.toISOString(),
      finishedAt:
        finishedAt.toISOString(),
      durationSeconds:
        Math.round(
          (
            finishedAt.getTime() -
            startedAt.getTime()
          ) / 1000
        ),
      error:
        error.message ||
        String(error),
      timeout:
        isTimeoutError(error),
      typeFailed: null,
      typeTimeout: null,
      savedYearMissing: null,
      savedColorMissing: null,
      savedMileageMissing: null,
      savedImageMissing: null,
      savedDetailFetchFailed:
        null,
    };

    let github = {
      saved: false,
      reason:
        "failure status was not saved",
    };

    try {
      github =
        await commitInventoryToGitHub(
          buildFailureInventoryData(
            current.inventory,
            failureStatus
          ),
          current.sha,
          `record failed inventory update ${runId}`
        );
    } catch (
      commitError
    ) {
      github = {
        saved: false,
        reason:
          "failed to save failure status",
        error:
          commitError.message ||
          String(commitError),
      };
    }

    console.error(
      JSON.stringify({
        event:
          "inventory-update-failed",
        runId,
        trigger,
        error:
          error.message ||
          String(error),
      })
    );

    return {
      success: false,
      codeVersion:
        CODE_VERSION,
      runId,
      trigger,
      github,
      lastUpdateStatus:
        failureStatus,
      error:
        error.message ||
        String(error),
    };
  }
}

async function buildStatusResponse() {
  const current =
    await fetchCurrentInventoryFromGitHub();

  const lock =
    await readUpdateLock();

  return {
    success: true,
    codeVersion:
      CODE_VERSION,
    running:
      Boolean(
        lock.locked &&
        !lock.stale
      ),
    lock: {
      locked:
        Boolean(
          lock.locked
        ),
      stale:
        Boolean(
          lock.stale
        ),
      runId:
        lock.runId || "",
      trigger:
        lock.trigger || "",
      createdAt:
        lock.createdAt || "",
      ageSeconds:
        lock.ageMs
          ? Math.round(
              lock.ageMs / 1000
            )
          : 0,
    },
    inventory: {
      codeVersion:
        current.inventory
          ?.codeVersion || "",
      updatedAt:
        current.inventory
          ?.updatedAt || "",
      counts:
        current.inventory
          ?.counts || {},
      lastUpdateStatus:
        current.inventory
          ?.lastUpdateStatus ||
        null,
      checks:
        current.inventory
          ?.checks || {},
    },
  };
}

export async function GET(request) {
  const url =
    new URL(request.url);

  const statusOnly =
    url.searchParams.get(
      "status"
    ) === "1";

  if (statusOnly) {
    return json(
      await buildStatusResponse()
    );
  }

  const save =
    url.searchParams.get(
      "save"
    ) === "1";

  if (!save) {
    return json({
      success: true,
      codeVersion:
        CODE_VERSION,
      message:
        "在庫更新を開始する場合は ?save=1、状態確認は ?status=1 を付けてください。",
      startPath:
        "/api/inventory/update?save=1",
      statusPath:
        "/api/inventory/update?status=1",
    });
  }

  const wait =
    url.searchParams.get(
      "wait"
    ) === "1";

  const runId =
    createRunId();

  const trigger =
    getTriggerLabel(request);

  const lock =
    await acquireUpdateLock(
      runId,
      trigger
    );

  if (
    !lock.acquired &&
    lock.running
  ) {
    return json(
      {
        success: true,
        accepted: false,
        running: true,
        codeVersion:
          CODE_VERSION,
        message:
          "すでに在庫更新が実行中です。二重実行は停止しました。",
        currentRunId:
          lock.current
            ?.runId || "",
        currentTrigger:
          lock.current
            ?.trigger || "",
        currentStartedAt:
          lock.current
            ?.createdAt || "",
        statusPath:
          "/api/inventory/update?status=1",
      },
      202
    );
  }

  if (!lock.acquired) {
    return json(
      {
        success: false,
        accepted: false,
        running: false,
        codeVersion:
          CODE_VERSION,
        message:
          "更新ロックの取得に失敗しました。",
        error:
          lock.error || "",
      },
      500
    );
  }

  const execute = async () => {
    try {
      return await runInventoryUpdate({
        runId,
        trigger,
      });
    } finally {
      await deleteUpdateLock(
        lock.refSha
      );
    }
  };

  if (wait) {
    const result =
      await execute();

    return json(
      result,
      result.success
        ? 200
        : 500
    );
  }

  after(async () => {
    await execute();
  });

  return json(
    {
      success: true,
      accepted: true,
      running: true,
      codeVersion:
        CODE_VERSION,
      runId,
      trigger,
      message:
        "在庫更新を開始しました。このページは閉じて構いません。",
      statusPath:
        "/api/inventory/update?status=1",
    },
    202
  );
}
