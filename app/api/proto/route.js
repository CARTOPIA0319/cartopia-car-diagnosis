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
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });

    const html = await page.text();

    const csrf =
      html.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];

    const sessionId =
      html.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

    const setCookie = page.headers.get("set-cookie") || "";

    const cookie = setCookie
      .split(",")
      .map((part) => part.split(";")[0].trim())
      .join("; ");

    const login = await fetch(loginUrl, {
      method: "POST",
      redirect: "manual",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Content-Type": "application/x-www-form-urlencoded",
        "Origin": "https://motorgate.jp",
        "Referer": loginUrl,
        "Cookie": cookie,
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

    return Response.json({
      success: true,
      status: login.status,
      location: login.headers.get("location"),
      cookieSent: cookie.length > 0,
      csrfExists: !!csrf,
      sessionIdExists: !!sessionId,
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
