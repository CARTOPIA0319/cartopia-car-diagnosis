export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";

    const page = await fetch(loginUrl, {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await page.text();

    const csrf =
      html.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];

    const sessionId =
      html.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

    const beforeCookie = page.headers.get("set-cookie") || "";

    const beforeCookieText = beforeCookie
      .split(",")
      .map((part) => part.split(";")[0].trim())
      .join("; ");

    const login = await fetch(loginUrl, {
      method: "POST",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        Origin: "https://motorgate.jp",
        Referer: loginUrl,
        Cookie: beforeCookieText,
      },
      body: new URLSearchParams({
        fuel_csrf_token: csrf,
        session_id: sessionId,
        client_id: clientId,
        user_id: "",
        client_pw: password,
        autologin: "",
        visit_new_search: "",
        visit_new_register: "",
        visit_new_est: "",
        visit_new_messenger: "",
        visit_new_call: "",
        group_stock_search: "",
      }),
    });

    const afterCookie = login.headers.get("set-cookie") || "";

    const afterCookieText = afterCookie
      .split(",")
      .map((part) => part.split(";")[0].trim())
      .join("; ");

    const mergedCookie = `${beforeCookieText}; ${afterCookieText}`;

    const top = await fetch("https://motorgate.jp/top", {
      method: "GET",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        Referer: loginUrl,
        Cookie: mergedCookie,
      },
    });

    const topHtml = await top.text();

    return Response.json({
      success: true,
      loginStatus: login.status,
      loginLocation: login.headers.get("location"),
      topStatus: top.status,
      containsLoginForm: topHtml.includes('name="client_pw"'),
      htmlPreview: topHtml.substring(0, 1500),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
