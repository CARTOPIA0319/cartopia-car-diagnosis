export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
      .replace(/ｔ/g, "t")
      .replace(/ｙ/g, "y")
      .replace(/ｐ/g, "p")
      .replace(/ｅ/g, "e")
      .replace(/ｖ/g, "v")
      .replace(/ｈ/g, "h")
      .replace(/Ｓ/g, "S")
      .replace(/Ｕ/g, "U")
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
    .replace(/Ｅ/g, "E")
    .replace(/Ｖ/g, "V")
    .replace(/Ｈ/g, "H")
    .replace(/Ｓ/g, "S")
    .replace(/Ｕ/g, "U")
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

function cleanText(text) {
  return cleanHtmlToText(text);
}

function uniqueByStockId(vehicles) {
  const map = new Map();

  for (const vehicle of vehicles || []) {
    if (vehicle.stockId) map.set(vehicle.stockId, vehicle);
  }

  return Array.from(map.values());
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

  return { jar, loginStatus: login.status };
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
    .map((m) => cleanText(m[1]))
    .filter(Boolean);

  return stockIds.map((stockId, index) => ({
    stockId,
    title: titles[index] || "",
    description: titles[index] || "",
    carName: titles[index] || "",
    gradeName: "",
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

async function fetchSavedPage(jar, pageUrl) {
  const res = await fetch(pageUrl, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/top",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

  const html = await readUtf8Text(res);
  const vehicles = extractSavedVehicles(html, pageUrl);

  return {
    pageUrl,
    status: res.status,
    count: vehicles.length,
    vehicles,
  };
}

async function fetchVehicleTypesFromEditPage(jar, vehicle) {
  const res = await fetch(vehicle.editUrl, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/stock/savelist",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
      "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
    },
  });

  const html = await readUtf8Text(res);
  const text = cleanHtmlToText(html);

  const typesFromHtml = extractTypesFromText(html);
  const typesFromText = extractTypesFromText(text);
  const types = Array.from(new Set([...typesFromHtml, ...typesFromText]));
  const typeKeys = buildTypeKeys(types);

  return {
    types,
    typeKeys,
    status: res.status,
    success: typeKeys.length > 0,
    containsFatalError: html.includes("FatalError"),
  };
}

async function attachSavedVehicleTypes(jar, vehicles) {
  const result = [];

  for (const vehicle of vehicles) {
    const typeResult = await fetchVehicleTypesFromEditPage(jar, vehicle);

    result.push({
      ...vehicle,
      types: typeResult.types,
      typeKeys: typeResult.typeKeys,
      typeResult,
    });
  }

  return result;
}

async function fetchSavedVehiclesWithTypes() {
  const { jar, loginStatus } = await loginMotorgate();

  const pages = [];

  pages.push(await fetchSavedPage(jar, "https://motorgate.jp/stock/savelist"));
  pages.push(
    await fetchSavedPage(jar, "https://motorgate.jp/stock/savelist/index/2")
  );

  const vehicles = uniqueByStockId(pages.flatMap((page) => page.vehicles));
  const vehiclesWithTypes = await attachSavedVehicleTypes(jar, vehicles);

  return {
    loginStatus,
    pages,
    vehicles,
    vehiclesWithTypes,
  };
}

async function fetchCurrentInventoryFromGitHub() {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER || "CARTOPIA0319";
  const repo = process.env.GITHUB_REPO || "cartopia-car-diagnosis";
  const branch = process.env.GITHUB_BRANCH || "main";
  const path = "data/inventory.json";

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
      inventory: {
        updatedAt: "",
        source: "motorgate",
        counts: {},
        vehicles: [],
      },
      sha: null,
    };
  }

  const currentJson = await current.json();
  const text = Buffer.from(currentJson.content || "", "base64").toString("utf8");

  return {
    inventory: JSON.parse(text),
    sha: currentJson.sha || null,
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
      message: "merge saved inventory with types",
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

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const save = url.searchParams.get("save") === "1";

    const current = await fetchCurrentInventoryFromGitHub();
    const savedResult = await fetchSavedVehiclesWithTypes();

    const currentVehicles = current.inventory.vehicles || [];
    const publicVehicles = currentVehicles.filter(
      (vehicle) => vehicle.sourceStatus !== "一時保存"
    );

    const savedVehicles = savedResult.vehiclesWithTypes || [];

    const mergedVehicles = uniqueByStockId([
      ...publicVehicles.map((vehicle) => ({
        ...vehicle,
        sourceStatus: vehicle.sourceStatus || "掲載在庫",
      })),
      ...savedVehicles,
    ]);

    const inventoryData = {
      updatedAt: new Date().toISOString(),
      source: "motorgate",
      updateMode: save
        ? "saved-merge-with-types"
        : "preview-saved-merge-with-types",
      counts: {
        publicVehicles: publicVehicles.length,
        savedVehiclesFound: savedResult.vehicles.length,
        savedVehiclesWithTypes: savedVehicles.length,
        vehicles: mergedVehicles.length,
      },
      savedPages: savedResult.pages.map((page) => ({
        pageUrl: page.pageUrl,
        status: page.status,
        count: page.count,
      })),
      vehicles: mergedVehicles,
    };

    const github = save
      ? await commitInventoryToGitHub(inventoryData, current.sha)
      : {
          saved: false,
          reason: "preview only. add ?save=1 to save data/inventory.json",
        };

    return json({
      success: true,
      mode: save ? "save" : "preview",
      loginStatus: savedResult.loginStatus,
      counts: inventoryData.counts,
      github,
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
