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

function extractSelect(html, key) {
  const regex = new RegExp(
    `<select[^>]*(?:id|name)=["']${key}["'][\\s\\S]*?<\\/select>`,
    "i"
  );

  const match = html.match(regex);
  if (!match) return null;

  const selected = match[0].match(
    /<option[^>]*selected[^>]*>(.*?)<\/option>/i
  );

  return selected?.[1]
    ?.replace(/<[^>]+>/g, "")
    ?.trim() || null;
}

function extractInput(html, key) {
  const regex = new RegExp(
    `(?:id|name)=["']${key}["'][^>]*value=["']([^"']*)["']`,
    "i"
  );

  return html.match(regex)?.[1] || null;
}

export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";
    const stockUrl = "https://motorgate.jp/stock/search";

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
        "Content-Type":
          "application/x-www-form-urlencoded",
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

    const stock = await fetch(stockUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
      },
    });

    const stockHtml = await stock.text();

    const stockId =
      stockHtml.match(/StockId=([A-Z0-9]+)/i)?.[1];

    const stockStatus =
      stockHtml.match(/StockStatus=([0-9]+)/i)?.[1]
      || "00180002";

    const editUrl =
      `https://motorgate.jp/car/newregist/register?kbn=1&ClientId=${clientId}&StockId=${stockId}&StockStatus=${stockStatus}&ScreenId=CB101GR`;

    const edit = await fetch(editUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: stockUrl,
      },
    });

    const editHtml = await edit.text();

    return Response.json({
      success: true,

      stockId,

      brand:
        extractSelect(editHtml, "BrandName"),

      car:
        extractSelect(editHtml, "CarName"),

      model:
        extractSelect(editHtml, "ModelName"),

      grade:
        extractSelect(editHtml, "Grade"),

      kata:
        extractSelect(editHtml, "Kata"),

      colorCode:
        extractInput(editHtml, "ColorCode"),

      bodyColor:
        extractSelect(editHtml, "BodyColor"),

      year:
        extractSelect(editHtml, "AdY"),

      month:
        extractSelect(editHtml, "AdM"),

      mileage:
        extractInput(editHtml, "Soukou"),

      price:
        extractInput(editHtml, "Kakaku"),

      totalPrice:
        extractInput(editHtml, "TotalPrice"),

      chassisNumber:
        extractInput(editHtml, "temp_syadai_num"),

      snippets: {
        BrandName:
          editHtml.includes("BrandName"),

        CarName:
          editHtml.includes("CarName"),

        ModelName:
          editHtml.includes("ModelName"),

        Grade:
          editHtml.includes("Grade"),

        BodyColor:
          editHtml.includes("BodyColor"),

        ColorCode:
          editHtml.includes("ColorCode"),

        Kata:
          editHtml.includes("Kata"),

        AdY:
          editHtml.includes("AdY"),

        AdM:
          editHtml.includes("AdM"),

        Soukou:
          editHtml.includes("Soukou"),

        Kakaku:
          editHtml.includes("Kakaku"),

        TotalPrice:
          editHtml.includes("TotalPrice")
      }
    });

  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
