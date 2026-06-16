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

function unique(array) {
  return Array.from(new Set(array));
}

function cleanTag(tag) {
  return tag
    .replace(/\s+/g, " ")
    .trim();
}

function findForms(html) {
  return Array.from(html.matchAll(/<form[\s\S]*?<\/form>/gi))
    .map((m) => cleanTag(m[0]).substring(0, 4000))
    .slice(0, 5);
}

function findInputs(html) {
  return Array.from(html.matchAll(/<input[^>]+>/gi))
    .map((m) => cleanTag(m[0]))
    .filter((tag) =>
      /page|limit|count|display|disp|size|sort|stock|status|search|offset|start|rows|num/i.test(tag)
    )
    .slice(0, 100);
}

function findSelects(html) {
  return Array.from(html.matchAll(/<select[\s\S]*?<\/select>/gi))
    .map((m) => cleanTag(m[0]).substring(0, 2500))
    .filter((tag) =>
      /25|50|75|100|page|limit|count|display|disp|size|rows|num|sort/i.test(tag)
    )
    .slice(0, 20);
}

function findLinks(html) {
  return unique(
    Array.from(html.matchAll(/href=["']([^"']+)["']/gi))
      .map((m) => m[1])
      .filter((url) =>
        /stock|search|page|limit|count|display|disp|size|rows|num|temporary|temp|save|draft/i.test(url)
      )
  ).slice(0, 100);
}

function findScripts(html) {
  return Array.from(html.matchAll(/<script[\s\S]*?<\/script>/gi))
    .map((m) => cleanTag(m[0]).substring(0, 4000))
    .filter((tag) =>
      /25|50|75|100|page|limit|count|display|disp|size|rows|num|stock|temporary|temp|save|draft/i.test(tag)
    )
    .slice(0, 10);
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

    const stock = await fetch(stockUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
      },
    });

    const stockHtml = await stock.text();

    const stockIds = unique(
      Array.from(stockHtml.matchAll(/StockId=([A-Z0-9]+)/gi))
        .map((m) => m[1])
    );

    return Response.json({
      success: true,
      count: stockIds.length,
      stockIds,
      forms: findForms(stockHtml),
      inputs: findInputs(stockHtml),
      selects: findSelects(stockHtml),
      links: findLinks(stockHtml),
      scripts: findScripts(stockHtml),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
