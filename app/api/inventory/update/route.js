export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const BASE_URL = "https://motorgate.jp";
const PUBLIC_LIST_URL =
  "https://motorgate.jp/stock/newsearch/stocklist/index/1/100";

const SAVED_LIST_URLS = [
  "https://motorgate.jp/stock/savelist",
  "https://motorgate.jp/stock/savelist/index/2",
  "https://motorgate.jp/stock/savelist/index/3",
];

function json(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
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

function normalizeTypeKey(type) {
  const value = toHalfWidthAscii(String(type || ""))
    .replace(/：/g, ":")
    .replace(/　/g, " ")
    .trim();

  if (/^suv$/i.test(value)) return "SUV";
  if (/^ev・hv$/i.test(value)) return "EV・HV";
  if (value === "ＳＵＶ") return "SUV";
  if (value === "ＥＶ・ＨＶ") return "EV・HV";

  return value;
}

function normalizeTypeText(text) {
  return fixBasicMojibake(
    decodeHtmlEntities(String(text || ""))
      .replace(/Ｔ/g, "T")
      .replace(/Ｙ/g, "Y")
      .replace(/Ｐ/g, "P")
      .replace(/Ｅ/g, "E")
      .replace(/ｔ/g, "t")
      .replace(/ｙ/g, "y")
      .replace(/ｐ/g, "p")
      .replace(/ｅ/g, "e")
      .replace(/：/g, ":")
      .replace(/\r/g, " ")
      .replace(/\n/g, " ")
      .replace(/　/g, " ")
  );
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

function extractValueNearLabel(html, label) {
  const text = String(html || "");

  const patterns = [
    new RegExp(
      `${label}[\\s\\S]{0,800}?<input\\b[^>]*value=["']([^"']*)["'][^>]*>`,
      "i"
    ),
    new RegExp(
      `${label}[\\s\\S]{0,800}?<textarea\\b[^>]*>([\\s\\S]*?)<\\/textarea>`,
      "i"
    ),
    new RegExp(
      `${label}[\\s\\S]{0,800}?<td\\b[^>]*>([\\s\\S]*?)<\\/td>`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return compactText(cleanHtmlToText(decodeHtmlEntities(match[1])));
    }
  }

  return "";
}

function extractInputValueByNameLike(html, nameLike) {
  const regex = new RegExp(
    `<input\\b[^>]*name=["'][^"']*${nameLike}[^"']*["'][^>]*value=["']([^"']*)["'][^>]*>`,
    "i"
  );

  return compactText(cleanHtmlToText(decodeHtmlEntities(html.match(regex)?.[1] || "")));
}

function extractTextareaValueByNameLike(html, nameLike) {
  const regex = new RegExp(
    `<textarea\\b[^>]*name=["'][^"']*${nameLike}[^"']*["'][^>]*>([\\s\\S]*?)<\\/textarea>`,
    "i"
  );

  return compactText(cleanHtmlToText(decodeHtmlEntities(html.match(regex)?.[1] || "")));
}

function extractGradeExtraInfo(html) {
  return (
    extractValueNearLabel(html, "グレード付加情報") ||
    extractTextareaValueByNameLike(html, "grade") ||
    extractInputValueByNameLike(html, "grade")
  );
}

function parseVehicleRow(row, baseUrl, qualityImageMap, sourceStatus) {
  const { stockId, rowHtml } = row;

  const rawHrefs = extractRawHrefValues(rowHtml);
  const urls = extractHrefValues(rowHtml, baseUrl);
  const rowImages = extractImageValues(rowHtml, baseUrl);

  const rawTireHref =
    rawHrefs.find((href) => href.includes("get_tire_from_car_model")) || "";

  const detailUrl = findFirstUrl(urls, "/stock/detail");
  const editUrl =
    findFirstUrl(urls, "/car/edit/new") ||
    findFirstUrl(urls, "/car/newregist/register");

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

  const realRowImages = rowImages.filter(
    (imageUrl) =>
      !imageUrl.includes("car_nophoto") &&
      !imageUrl.includes("total_price_unset") &&
      !imageUrl.includes("/common/")
  );

  const imageUrl = qualityImageMap[stockId] || realRowImages[0] || "";

  const title = [carName, gradeName].filter(Boolean).join(" ").trim();

  const description =
    visibleTitleFixed && !visibleTitleFixed.includes("�")
      ? visibleTitleFixed
      : title;

  return {
    stockId,
    title,
    description,
    carName,
    gradeName,
    gradeExtraInfo: "",
    classificationName,
    year,
    mileage,
    color,
    inspection,
    displacement,
    bodyPrice,
    totalPrice,
    imageUrl,
    detailUrl,
    editUrl,
    gooUrl,
    sourceStatus,
    types: [],
    typeKeys: [],
  };
}
async function fetchVehicleDetailFromEditPage(jar, vehicle) {
  if (!vehicle.editUrl) {
    return {
      ...vehicle,
      gradeExtraInfo: "",
      types: [],
      typeKeys: [],
      typeResult: {
        status: null,
        success: false,
        reason: "editUrl not found",
      },
    };
  }

  const res = await fetch(vehicle.editUrl, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/top",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

  const html = await readUtf8Text(res);
  const cleanText = cleanHtmlToText(html);

  const typesFromHtml = extractTypesFromText(html);
  const typesFromText = extractTypesFromText(cleanText);
  const types = Array.from(new Set([...typesFromHtml, ...typesFromText]));
  const typeKeys = buildTypeKeys(types);

  const gradeExtraInfo = extractGradeExtraInfo(html);

  return {
    ...vehicle,
    gradeExtraInfo,
    types,
    typeKeys,
    typeResult: {
      status: res.status,
      success: types.length > 0,
      reason: types.length > 0 ? "" : "TYPE not found",
    },
  };
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

  const workers = Array.from(
    { length: Math.min(limit, items.length) },
    () => worker()
  );

  await Promise.all(workers);
  return results;
}

async function attachVehicleDetails(jar, vehicles) {
  return await mapWithConcurrency(vehicles, 5, async (vehicle) => {
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
    types: vehicle.types || [],
    typeKeys: vehicle.typeKeys || [],
    updatedAt: new Date().toISOString(),
    typeResult: vehicle.typeResult || null,
  };
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

async function fetchVehicleListPage(jar, url, sourceStatus) {
  const res = await fetch(url, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/top",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

  const html = await readUtf8Text(res);
  const qualityImageMap = extractQualityImageMap(html, url);
  const vehicleRows = extractVehicleRows(html);

  const parsedVehicles = vehicleRows.map((row) =>
    parseVehicleRow(row, url, qualityImageMap, sourceStatus)
  );

  return {
    url,
    status: res.status,
    containsLoginForm: html.includes('name="client_pw"'),
    foundRows: vehicleRows.length,
    imageMapCount: Object.keys(qualityImageMap).length,
    vehicles: parsedVehicles,
  };
}

async function fetchPublishedVehicles(jar) {
  const page = await fetchVehicleListPage(
    jar,
    PUBLIC_LIST_URL,
    "掲載在庫"
  );

  const vehiclesWithDetails = await attachVehicleDetails(jar, page.vehicles);

  return {
    ...page,
    vehicles: vehiclesWithDetails.map(toInventoryVehicle),
  };
}

async function fetchSavedVehicles(jar) {
  const pages = [];
  const allVehicles = [];

  for (const url of SAVED_LIST_URLS) {
    const page = await fetchVehicleListPage(
      jar,
      url,
      "一時保存"
    );

    pages.push({
      url,
      status: page.status,
      foundRows: page.foundRows,
      imageMapCount: page.imageMapCount,
      containsLoginForm: page.containsLoginForm,
    });

    allVehicles.push(...page.vehicles);

    if (page.foundRows === 0) break;
  }

  const uniqueMap = new Map();

  for (const vehicle of allVehicles) {
    if (vehicle.stockId) uniqueMap.set(vehicle.stockId, vehicle);
  }

  const uniqueVehicles = Array.from(uniqueMap.values());
  const vehiclesWithDetails = await attachVehicleDetails(jar, uniqueVehicles);

  return {
    pages,
    vehicles: vehiclesWithDetails.map(toInventoryVehicle),
  };
}

function mergeVehicles(publishedVehicles, savedVehicles) {
  const map = new Map();

  for (const vehicle of publishedVehicles || []) {
    if (vehicle.stockId) map.set(vehicle.stockId, vehicle);
  }

  for (const vehicle of savedVehicles || []) {
    if (vehicle.stockId) map.set(vehicle.stockId, vehicle);
  }

  return Array.from(map.values());
}
async function fetchCurrentInventoryFromGitHub() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "CARTOPIA0319";
  const repo = process.env.GITHUB_REPO || "cartopia-car-diagnosis";
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = "data/inventory.json";

  if (!token) {
    return {
      sha: null,
      inventory: {
        vehicles: [],
      },
    };
  }

  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;

  const current = await fetch(`${apiUrl}?ref=${branch}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "cartopia-inventory-updater",
    },
  });

  if (!current.ok) {
    return {
      sha: null,
      inventory: {
        vehicles: [],
      },
    };
  }

  const currentJson = await current.json();
  const text = Buffer.from(currentJson.content || "", "base64").toString("utf8");

  return {
    sha: currentJson.sha || null,
    inventory: JSON.parse(text),
  };
}

async function commitInventoryToGitHub(inventoryData, existingSha) {
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

  const save = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "cartopia-inventory-updater",
    },
    body: JSON.stringify({
      message: "refresh inventory data",
      content,
      branch,
      ...(existingSha ? { sha: existingSha } : {}),
    }),
  });

  const saveJson = await save.json();

  return {
    saved: save.ok,
    status: save.status,
    path,
    branch,
    commit: saveJson.commit?.html_url || "",
    error: save.ok ? "" : saveJson,
  };
}

function summarizeTypeResults(vehicles) {
  const success = vehicles.filter((vehicle) => vehicle.typeResult?.success).length;
  const failed = vehicles.length - success;

  return {
    success,
    failed,
  };
}

function summarizeGradeExtraInfo(vehicles) {
  const found = vehicles.filter((vehicle) => vehicle.gradeExtraInfo).length;
  const missing = vehicles.length - found;

  return {
    found,
    missing,
  };
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const save = url.searchParams.get("save") === "1";

    const current = await fetchCurrentInventoryFromGitHub();
    const { jar, loginStatus } = await loginMotorgate();

    const published = await fetchPublishedVehicles(jar);
    const saved = await fetchSavedVehicles(jar);

    const vehicles = mergeVehicles(published.vehicles, saved.vehicles);

    const inventoryData = {
      updatedAt: new Date().toISOString(),
      source: "motorgate",
      updateMode: save ? "full-public-and-saved-refresh" : "preview",
      counts: {
        publicVehicles: published.vehicles.length,
        savedVehicles: saved.vehicles.length,
        vehicles: vehicles.length,
        publicFoundRows: published.foundRows,
        savedFoundRows: saved.pages.reduce((sum, page) => sum + page.foundRows, 0),
        publicImageMapCount: published.imageMapCount,
        savedImageMapCount: saved.pages.reduce(
          (sum, page) => sum + page.imageMapCount,
          0
        ),
      },
      checks: {
        loginStatus,
        publicListStatus: published.status,
        publicContainsLoginForm: published.containsLoginForm,
        savedPages: saved.pages,
        typeResults: summarizeTypeResults(vehicles),
        gradeExtraInfo: summarizeGradeExtraInfo(vehicles),
      },
      vehicles,
    };

    const github = save
      ? await commitInventoryToGitHub(inventoryData, current.sha)
      : {
          saved: false,
          reason: "preview only. add ?save=1 to save data/inventory.json",
        };

    return json({
      success: true,
      mode: inventoryData.updateMode,
      github,
      counts: inventoryData.counts,
      checks: inventoryData.checks,
      inventory: inventoryData,
    });
  } catch (e) {
    return json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
