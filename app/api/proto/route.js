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

function extractSelectHtml(html, key) {
  const regex = new RegExp(
    `<select[^>]*(?:id|name)=["']${key}["'][\\s\\S]*?<\\/select>`,
    "i"
  );

  return html.match(regex)?.[0] || "";
}

function extractOptions(selectHtml) {
  const options = [];

  for (const match of selectHtml.matchAll(
    /<option[^>]*value=["']([^"']*)["'][^>]*>(.*?)<\/option>/gi
  )) {
    const value = match[1];
    const text = match[2]
      .replace(/<[^>]+>/g, "")
      .replace(/\s+/g, " ")
      .trim();

    if (value !== "") {
      options.push({
        value,
        text,
      });
    }
  }

  return options;
}

function extractSelectedValue(html, key) {
  const selectHtml = extractSelectHtml(html, key);

  return selectHtml.match(
    /<option[^>]*value=["']([^"']*)["'][^>]*selected[^>]*>/i
  )?.[1] || null;
}

function extractInput(html, key) {
  const regex = new RegExp(
    `(?:id|name)=["']${key}["'][^>]*value=["']([^"']*)["']`,
    "i"
  );

  return html.match(regex)?.[1] || null;
}

function toDict(options) {
  const dict = {};

  for (const option of options) {
    dict[option.value] = option.text;
  }

  return dict;
}

export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";
    const stockUrl =
      "https://motorgate.jp/stock/newsearch/stocklist/index/1/100";

    const jar = {};

    const page = await fetch(loginUrl);
    addCookies(jar, page.headers.get("set-cookie") || "");

    const html = await page.text();

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

    const stockRes = await fetch(stockUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
      },
    });

    const stockHtml = await stockRes.text();

    const firstStockId =
      stockHtml.match(/stock_ids\[\][^>]*value=['"]([A-Z0-9]+)['"]/i)?.[1];

    const editUrl =
      `https://motorgate.jp/car/newregist/register?kbn=1&ClientId=${clientId}&StockId=${firstStockId}&StockStatus=00180002&ScreenId=CB101GR`;

    const editRes = await fetch(editUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: stockUrl,
      },
    });

    const editHtml = await editRes.text();

    const brandOptions =
      extractOptions(extractSelectHtml(editHtml, "BrandName"));

    const modelOptions =
      extractOptions(extractSelectHtml(editHtml, "ModelName"));

    const gradeOptions =
      extractOptions(extractSelectHtml(editHtml, "Grade"));

    const kataOptions =
      extractOptions(extractSelectHtml(editHtml, "Kata"));

    const colorOptions =
      extractOptions(extractSelectHtml(editHtml, "SelColorCode"));

    const bodyColorOptions =
      extractOptions(extractSelectHtml(editHtml, "ColorBody"));

    return Response.json({
      success: true,

      firstStockId,

      selected: {
        brandCode: extractSelectedValue(editHtml, "BrandName"),
        modelCode: extractSelectedValue(editHtml, "ModelName"),
        gradeCode: extractSelectedValue(editHtml, "Grade"),
        kataCode: extractSelectedValue(editHtml, "Kata"),
        colorCode: extractInput(editHtml, "ColorCodeSerch"),
        bodyColorCode: extractSelectedValue(editHtml, "ColorBody"),
      },

      dictionaries: {
        brandCount: brandOptions.length,
        modelCount: modelOptions.length,
        gradeCount: gradeOptions.length,
        kataCount: kataOptions.length,
        colorCount: colorOptions.length,
        bodyColorCount: bodyColorOptions.length,

        brand: toDict(brandOptions),
        model: toDict(modelOptions),
        grade: toDict(gradeOptions),
        kata: toDict(kataOptions),
        color: toDict(colorOptions),
        bodyColor: toDict(bodyColorOptions),
      },
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
