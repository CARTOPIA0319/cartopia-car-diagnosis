export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function scoreDecodedText(text) {
  const goodWords = [
    "ハスラー",
    "ルークス",
    "インプレッサ",
    "車両情報を編集",
    "価格",
    "総額",
    "年式",
    "車種",
    "グレード",
    "掲載中",
  ];

  const badWords = [
    "繝",
    "繧",
    "郢",
    "陜",
    "髴",
    "邵",
    "驍",
    "隰",
    "鬮",
    "蟷",
    "荳",
    "譁",
    "�",
  ];

  let score = 0;

  for (const word of goodWords) {
    if (text.includes(word)) score += 100;
  }

  for (const word of badWords) {
    const count = (text.match(new RegExp(word, "g")) || []).length;
    score -= count * 20;
  }

  const japaneseCount =
    (text.match(/[ぁ-んァ-ヶ一-龠々ーＡ-Ｚａ-ｚ０-９]/g) || []).length;

  score += Math.min(japaneseCount, 500);

  return score;
}

async function readBestText(response) {
  const buffer = await response.arrayBuffer();

  const utf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const shiftJis = new TextDecoder("shift_jis", { fatal: false }).decode(buffer);

  const utf8Score = scoreDecodedText(utf8);
  const shiftJisScore = scoreDecodedText(shiftJis);

  if (shiftJisScore > utf8Score) {
    return {
      text: shiftJis,
      encoding: "shift_jis",
      scores: {
        utf8: utf8Score,
        shift_jis: shiftJisScore,
      },
    };
  }

  return {
    text: utf8,
    encoding: "utf-8",
    scores: {
      utf8: utf8Score,
      shift_jis: shiftJisScore,
    },
  };
}

function decodeHtmlEntities(text) {
  return text
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

function cleanText(html) {
  return decodeHtmlEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<\/div>/gi, "\n")
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
  return text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function absoluteUrl(src, baseUrl) {
  if (!src) return "";
  if (src.startsWith("http://") || src.startsWith("https://")) return src;
  if (src.startsWith("//")) return `https:${src}`;
  if (src.startsWith("/")) return new URL(src, baseUrl).toString();
  return new URL(src, baseUrl).toString();
}

function extractImagesFromHtml(html, baseUrl) {
  return Array.from(
    html.matchAll(/<img[^>]+src=["']([^"']+)["'][^>]*>/gi)
  )
    .map((m) => absoluteUrl(m[1], baseUrl))
    .filter(Boolean);
}

function extractLinksFromHtml(html, baseUrl) {
  return Array.from(
    html.matchAll(/<a[^>]+href=["']([^"']+)["'][^>]*>/gi)
  )
    .map((m) => absoluteUrl(m[1], baseUrl))
    .filter(Boolean);
}

function extractCells(rowHtml) {
  return Array.from(
    rowHtml.matchAll(/<(td|th)\b[^>]*>([\s\S]*?)<\/\1>/gi)
  )
    .map((m) => cleanText(m[2]))
    .map((text) => text.trim())
    .filter(Boolean);
}

function removeActionText(text) {
  const stopWords = [
    "車両情報を編集",
    "タイヤを探す",
    "その他を選択",
    "実行",
    "コピーして新規登録",
    "成約・削除",
    "在庫診断",
    "小売相場",
    "AA相場",
  ];

  let result = text;

  for (const word of stopWords) {
    const index = result.indexOf(word);
    if (index >= 0) {
      result = result.slice(0, index);
    }
  }

  return result.trim();
}

function pickVehicleDescription(cells) {
  const candidates = cells
    .map(removeActionText)
    .map(compactText)
    .filter((text) => text.length >= 10)
    .filter((text) => !text.includes("価格 "))
    .filter((text) => !text.includes("総額 "))
    .filter((text) => !text.includes("車台番号/"))
    .filter((text) => !text.includes("管理用番号/"))
    .sort((a, b) => b.length - a.length);

  return candidates[0] || "";
}

function pickFirstMatch(text, regex) {
  const match = text.match(regex);
  return match ? match[1] || match[0] : "";
}

function parseVehicleRow(rowHtml, rowIndex, baseUrl) {
  const cells = extractCells(rowHtml);
  const rowText = compactText(cleanText(rowHtml));

  const vehicleDescription = pickVehicleDescription(cells);

  const images = extractImagesFromHtml(rowHtml, baseUrl);
  const links = extractLinksFromHtml(rowHtml, baseUrl);

  const detailUrl =
    links.find((url) => url.includes("/stock/detail")) ||
    links.find((url) => url.includes("StockId=")) ||
    "";

  const editUrl =
    links.find((url) => url.includes("/stock/") && url.includes("register")) ||
    links.find((url) => rowText.includes("車両情報を編集") && url.includes("stock")) ||
    "";

  const stockId =
    pickFirstMatch(rowHtml, /StockId=([A-Za-z0-9]+)/) ||
    pickFirstMatch(rowHtml, /stock_id["']?\s*[:=]\s*["']?([A-Za-z0-9]+)/i);

  return {
    rowIndex,
    stockId,
    vehicleDescription,
    year: pickFirstMatch(rowText, /((?:19|20)\d{2}年)/),
    mileage: pickFirstMatch(rowText, /(\d+(?:\.\d+)?万[ＫK])/),
    color: "",
    inspection:
      pickFirstMatch(rowText, /(検(?:19|20)\d{2}年\d{2}月)/) ||
      (rowText.includes("車検整備付") ? "車検整備付" : ""),
    displacement: pickFirstMatch(rowText, /(\d+(?:\.\d+)?(?:cc|L))/i),
    bodyPrice: pickFirstMatch(rowText, /価格\s*([0-9.]+万円)/),
    totalPrice: pickFirstMatch(rowText, /総額\s*([0-9.]+万円)/),
    firstImage: images[0] || "",
    images,
    detailUrl,
    editUrl,
    cells,
    rawText: rowText,
  };
}

function extractVehicleRows(html, baseUrl, limit = 3) {
  const rowMatches = Array.from(
    html.matchAll(/<tr\b[^>]*>[\s\S]*?<\/tr>/gi)
  );

  const vehicles = [];

  for (let i = 0; i < rowMatches.length; i++) {
    const rowHtml = rowMatches[i][0];
    const rowText = cleanText(rowHtml);

    const looksLikeVehicleRow =
      rowText.includes("車両情報を編集") ||
      rowText.includes("コピーして新規登録") ||
      rowText.includes("在庫診断");

    if (!looksLikeVehicleRow) continue;

    const parsed = parseVehicleRow(rowHtml, i, baseUrl);

    if (!parsed.vehicleDescription) continue;

    vehicles.push(parsed);

    if (vehicles.length >= limit) break;
  }

  return vehicles;
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

  const loginRead = await readBestText(loginPage);
  const loginHtml = loginRead.text;

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
    clientId,
    jar,
    loginStatus: login.status,
    loginEncoding: loginRead.encoding,
    loginScores: loginRead.scores,
  };
}

export async function GET(request) {
  try {
    const { clientId, jar, loginStatus, loginEncoding, loginScores } =
      await loginMotorgate();

    const url = new URL(request.url);

    const mode = url.searchParams.get("mode") || "list3";
    const limit = Number(url.searchParams.get("limit") || "3");

    const publicListUrl =
      "https://motorgate.jp/stock/newsearch/stocklist/index/1/100";

    if (mode !== "list3") {
      return Response.json({
        success: true,
        note: "Motorgate list page extraction test.",
        loginStatus,
        loginEncoding,
        loginScores,
        usage: {
          list3: "/api/proto?mode=list3&limit=3",
        },
        targetUrl: publicListUrl,
      });
    }

    const res = await fetch(publicListUrl, {
      headers: {
        Cookie: jarToCookie(jar),
        Referer: "https://motorgate.jp/top",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        "Accept-Language": "ja,en-US;q=0.9,en;q=0.8",
      },
    });

    const read = await readBestText(res);
    const html = read.text;

    const vehicles = extractVehicleRows(html, publicListUrl, limit);

    const allImages = extractImagesFromHtml(html, publicListUrl).slice(0, 80);
    const allStockLinks = extractLinksFromHtml(html, publicListUrl)
      .filter((link) => link.includes("stock") || link.includes("StockId"))
      .slice(0, 80);

    return Response.json({
      success: true,
      mode,
      targetUrl: publicListUrl,
      status: res.status,
      contentType: res.headers.get("content-type"),
      loginStatus,
      loginEncoding,
      loginScores,
      listEncoding: read.encoding,
      listScores: read.scores,
      containsLoginForm: html.includes('name="client_pw"'),
      checks: {
        hasHustler: html.includes("ハスラー"),
        hasVehicleEdit: html.includes("車両情報を編集"),
        hasPrice: html.includes("価格"),
        hasTotalPrice: html.includes("総額"),
        hasTable: html.includes("<table"),
        vehicleCountExtracted: vehicles.length,
        imageCount: allImages.length,
        stockLinkCount: allStockLinks.length,
      },
      vehicles,
      allImages,
      allStockLinks,
      aroundHustler: pickAround(html, "ハスラー"),
      aroundVehicleEdit: pickAround(html, "車両情報を編集"),
      htmlTextHead: cleanText(html).substring(0, 12000),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
      stack: e.stack,
    });
  }
}
