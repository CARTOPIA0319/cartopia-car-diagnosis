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

async function readText(response) {
  const buffer = await response.arrayBuffer();
  return new TextDecoder("utf-8").decode(buffer);
}

function unique(array) {
  return Array.from(new Set(array));
}

function extractStockIdsFromPublic(html) {
  return unique(
    Array.from(
      html.matchAll(/stock_ids\[\][^>]*value=['"]([A-Z0-9]+)['"]/gi)
    ).map((m) => m[1])
  );
}

function extractStockIdsFromSave(html) {
  return unique([
    ...Array.from(
      html.matchAll(/StockId=([A-Z0-9]+)/gi)
    ).map((m) => m[1]),

    ...Array.from(
      html.matchAll(/list_check_[A-Z0-9]+['"][^>]*value=['"]([A-Z0-9]+)['"]/gi)
    ).map((m) => m[1]),
  ]);
}

function normalizeImageUrl(url) {
  if (!url) return null;

  if (url.startsWith("//")) return `https:${url}`;
  if (url.startsWith("/")) return `https://motorgate.jp${url}`;

  return url;
}

function extractImages(html, stockId) {
  const urls = unique([
    ...Array.from(
      html.matchAll(/https?:\/\/[^"'\s<>]+?\.(?:jpg|jpeg|png|webp)(?:\?[^"'\s<>]*)?/gi)
    ).map((m) => m[0]),

    ...Array.from(
      html.matchAll(/src=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)
    ).map((m) => m[1]),
  ])
    .map(normalizeImageUrl)
    .filter(Boolean)
    .filter((url) =>
      !url.includes("car_nophoto") &&
      !url.includes("no_photo") &&
      !url.includes("nophoto") &&
      !url.includes("/assets/img/common/car") &&
      !url.includes("/assets/img/common/img-set")
    );

  const realVehicleImages = urls.filter((url) =>
    (
      url.includes("secure.goo-net.com") ||
      url.includes("picture-referrer.goo-net.com")
    ) &&
    (
      url.includes(stockId) ||
      /\/090\/0902332\/[QJ]\//.test(url) ||
      /\/7000902332\//.test(url)
    ) &&
    !url.includes("_NO") &&
    !url.includes("_MP")
  );

  const sortedRealVehicleImages = realVehicleImages.slice().sort((a, b) => {
    const score = (url) => {
      let value = 0;

      if (url.includes("/Q/")) value += 100;
      if (url.includes("01.jpg")) value += 50;
      if (url.includes("00.jpg")) value += 40;
      if (url.includes(stockId)) value += 20;
      if (url.includes("secure.goo-net.com")) value += 10;

      return value;
    };

    return score(b) - score(a);
  });

  const fallbackImages = urls.filter((url) =>
    url.includes("secure.goo-net.com") ||
    url.includes("picture-referrer.goo-net.com") ||
    url.includes("storage-motorgate")
  );

  const mainImageUrl =
    sortedRealVehicleImages[0] ||
    fallbackImages[0] ||
    null;

  return {
    mainImageUrl,
    imageCount: sortedRealVehicleImages.length || fallbackImages.length,
    imageUrls: sortedRealVehicleImages.slice(0, 5),
    fallbackImageUrls: fallbackImages.slice(0, 5),
    allCandidateUrls: urls.slice(0, 20),
  };
}

function buildEditUrl({ clientId, stockId, stockStatus, source }) {
  if (source === "save") {
    return `https://motorgate.jp/car/newregist/register?kbn=1&client_id=${clientId}&StockStatus=${stockStatus}&StockId=${stockId}&ScreenId=SIH_001`;
  }

  return `https://motorgate.jp/car/newregist/register?kbn=1&ClientId=${clientId}&StockId=${stockId}&StockStatus=${stockStatus}&ScreenId=CB101GR`;
}

async function fetchVehicleImages({ clientId, jar, stockId, stockStatus, source }) {
  const editUrl = buildEditUrl({
    clientId,
    stockId,
    stockStatus,
    source,
  });

  const edit = await fetch(editUrl, {
    headers: {
      Cookie: jarToCookie(jar),
      Referer: "https://motorgate.jp/top",
    },
  });

  const editHtml = await readText(edit);
  const images = extractImages(editHtml, stockId);

  return {
    stockId,
    source,
    editStatus: edit.status,
    containsLoginForm: editHtml.includes('name="client_pw"'),
    ...images,
  };
}

export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";
    const jar = {};

    const page = await fetch(loginUrl);
    addCookies(jar, page.headers.get("set-cookie") || "");

    const html = await readText(page);

    const csrf =
      html.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];

    const sessionId =
      html.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

    const login = await fetch(loginUrl, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://motorgate.jp",
        Referer: loginUrl,
        Cookie: jarToCookie(jar),
      },
      body: new URLSearchParams({
        fuel_csrf_token: csrf,
        session_id: sessionId,
        client_id: clientId,
        user_id: "",
        client_pw: password,
      }),
    });

    addCookies(jar, login.headers.get("set-cookie") || "");

    const publicUrl =
      "https://motorgate.jp/stock/newsearch/stocklist/index/1/100";

    const publicRes = await fetch(publicUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
      },
    });

    const publicHtml = await readText(publicRes);
    const publicStockIds = extractStockIdsFromPublic(publicHtml);

    const saveUrl =
      "https://motorgate.jp/stock/savelist/index/1/100";

    const saveRes = await fetch(saveUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: publicUrl,
      },
    });

    const saveHtml = await readText(saveRes);
    const saveStockIds = extractStockIdsFromSave(saveHtml);

    const targets = [
      ...publicStockIds.slice(0, 5).map((stockId) => ({
        stockId,
        stockStatus: "00180002",
        source: "public",
      })),

      ...saveStockIds.slice(0, 3).map((stockId) => ({
        stockId,
        stockStatus: "00180002",
        source: "save",
      })),
    ];

    const vehicles = [];

    for (const target of targets) {
      const vehicle = await fetchVehicleImages({
        clientId,
        jar,
        ...target,
      });

      vehicles.push(vehicle);
    }

    return Response.json({
      success: true,

      counts: {
        public: publicStockIds.length,
        save: saveStockIds.length,
        total: publicStockIds.length + saveStockIds.length,
        checked: vehicles.length,
      },

      note:
        "Image test: real vehicle image preferred. First 5 public vehicles and first 3 save vehicles checked.",

      vehicles,
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
