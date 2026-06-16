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

    const cookie =
      page.headers.get("set-cookie") || "";

    const login = await fetch(loginUrl, {
      method: "POST",
      redirect: "follow",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Origin: "https://motorgate.jp",
        Referer: loginUrl,
        Cookie: cookie,
      },
      body: new URLSearchParams({
        fuel_csrf_token: csrf,
        session_id: sessionId,
        client_id: clientId,
        user_id: "",
        client_pw: password,
      }),
    });

    const finalHtml = await login.text();

    return Response.json({
      success: true,
      finalUrl: login.url,
      status: login.status,
      containsLoginForm:
        finalHtml.includes('name="client_pw"'),
      preview: finalHtml.substring(0, 1200),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
