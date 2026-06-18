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
  return await response.text();
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

function pickImages(html) {
  return Array.from(
    html.matchAll(/(?:src|href)=["']([^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?)["']/gi)
  ).map((m) => m[1]).slice(0, 50);
}

function pickLinks(html) {
  return Array.from(
    html.matchAll(/href=["']([^"']+)["']/gi)
  ).map((m) => m[1]).filter((url) =>
    url.includes("stock") ||
    url.includes("detail") ||
    url.includes("register") ||
    url.includes("StockId")
  ).slice(0, 100);
}

async function loginMotorgate() {
  const clientId = process.env.MOTORGATE_CLIENT_ID;
  const password = process.env.MOTORGATE_PASSWORD;

  const loginUrl = "https://motorgate.jp/login/index";
  const jar = {};

  const loginPage = await fetch(loginUrl);
  addCookies(jar, loginPage.headers.get("set-cookie") || "");

  const loginHtml = await readText(loginPage);

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

  return {
    clientId,
    jar,
    loginStatus: login.status,
  };
}

export async function GET(request) {
  try {
    const { clientId, jar, loginStatus } = await loginMotorgate();

    const url = new URL(request.url);

    const mode = url.searchParams.get("mode") || "map";

    const stockId =
      url.searchParams.get("stockId") ||
      "0902332A30260610W001";

    const source =
      url.searchParams.get("source") || "public";

    const pages = {
      publicList:
        "https://motorgate.jp/stock/newsearch/stocklist/index/1/100",

      saveList:
        "https://motorgate.jp/stock/savelist/index/1/100",

      publicDetail:
        `https://motorgate.jp/stock/detail?ClientId=${clientId}&StockId=${stockId}`,

      saveDetail:
        `https://motorgate.jp/stock/detail?ClientId=${clientId}&StockId=${stockId}&ScreenId=SIH_001`,
    };

    let targetUrl;

    if (mode === "publicList") {
      targetUrl = pages.publicList;
    } else if (mode === "saveList") {
      targetUrl = pages.saveList;
    } else if (mode === "detail") {
      targetUrl =
        source === "save"
          ? pages.saveDetail
          : pages.publicDetail;
    } else {
      return Response.json({
        success: true,
        note: "Motorgate page map debug API.",
        loginStatus,
        clientId,
        usage: {
          publicList:
            "/api/proto?mode=publicList",
          saveList:
            "/api/proto?mode=saveList",
          publicDetail:
            `/api/proto?mode=detail&source=public&stockId=${stockId}`,
          saveDetail:
            `/api/proto?mode=detail&source=save&stockId=${stockId}`,
        },
        pages,
      });
    }

    const res = await fetch(targetUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
      },
    });

    const html = await readText(res);

    return Response.json({
      success: true,
      mode,
      source,
      stockId,
      targetUrl,
      status: res.status,
      containsLoginForm: html.includes('name="client_pw"'),

      checks: {
        hasTable: html.includes("<table"),
        hasStockDetail: html.includes("stock/detail"),
        hasStockId: html.includes(stockId),
        hasMakerLabel:
          html.includes("メーカー") ||
          html.includes("繝｡繝ｼ繧ｫ繝ｼ"),
        hasCarLabel:
          html.includes("車種") ||
          html.includes("霆顔ｨｮ"),
        hasGradeLabel:
          html.includes("グレード") ||
          html.includes("繧ｰ繝ｬ繝ｼ繝�"),
      },

      aroundStockId: pickAround(html, stockId),
      aroundTable: pickAround(html, "<table"),
      aroundMaker:
        pickAround(html, "メーカー") ||
        pickAround(html, "繝｡繝ｼ繧ｫ繝ｼ"),
      aroundCar:
        pickAround(html, "車種") ||
        pickAround(html, "霆顔ｨｮ"),
      aroundGrade:
        pickAround(html, "グレード") ||
        pickAround(html, "繧ｰ繝ｬ繝ｼ繝�"),

      links: pickLinks(html),
      images: pickImages(html),

      htmlHead: html.substring(0, 30000),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
