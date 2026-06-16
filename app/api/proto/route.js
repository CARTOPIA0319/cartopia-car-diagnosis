export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginUrl = "https://motorgate.jp/login/index";

    const page = await fetch(loginUrl);

    const html = await page.text();

    const csrf =
      html.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];

    const sessionId =
      html.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

    const beforeCookie = page.headers.get("set-cookie") || "";

    const cookie = beforeCookie
      .split(",")
      .map((x) => x.split(";")[0].trim())
      .join("; ");

    const login = await fetch(loginUrl, {
      method: "POST",
      redirect: "manual",
      headers: {
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
      }),
    });

    const afterCookie = login.headers.get("set-cookie") || "";

    return Response.json({
      success: true,
      loginStatus: login.status,
      location: login.headers.get("location"),
      beforeCookie,
      afterCookie,
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
