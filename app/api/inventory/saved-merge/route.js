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

function cleanText(text) {
  return String(text || "")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
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

  const loginPage = await fetch(loginUrl);
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
      Cookie: jarToCookie(jar),
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
    editUrl: `https://motorgate.jp/car/edit/new?kbn=1&ClientId=0902332&StockId=${stockId}&ScreenId=CB101GR`,
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

async function fetchSavedVehicles() {
  const { jar, loginStatus } = await loginMotorgate();

  const pages = [];

  pages.push(await fetchSavedPage(jar, "https://motorgate.jp/stock/savelist"));
  pages.push(
    await fetchSavedPage(jar, "https://motorgate.jp/stock/savelist/index/2")
  );

  const vehicles = uniqueByStockId(pages.flatMap((page) => page.vehicles));

  return {
    loginStatus,
    pages,
    vehicles,
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
      message: "merge saved inventory data",
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
    const savedResult = await fetchSavedVehicles();

    const publicVehicles = current.inventory.vehicles || [];
    const savedVehicles = savedResult.vehicles || [];

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
      updateMode: save ? "saved-merge" : "preview-saved-merge",
      counts: {
        publicVehicles: publicVehicles.length,
        savedVehicles: savedVehicles.length,
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
