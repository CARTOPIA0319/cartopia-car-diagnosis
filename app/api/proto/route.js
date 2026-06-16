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

    const beforeCookie =
      page.headers.get("set-cookie") || "";

    const login = await fetch(loginUrl, {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Origin: "https://motorgate.jp",
        Referer: loginUrl,
        Cookie: beforeCookie,
      },
      body: new URLSearchParams({
        fuel_csrf_token: csrf,
        session_id: sessionId,
        client_id: clientId,
        user_id: "",
        client_pw: password,
      }),
    });

    const afterCookie =
      login.headers.get("set-cookie") || "";

    const top = await fetch(
      "https://motorgate.jp/top",
      {
        headers: {
          Cookie: afterCookie,
          Referer: loginUrl,
        },
      }
    );

    const topHtml = await top.text();

    return Response.json({
      success: true,
      topStatus: top.status,
      containsLoginForm:
        topHtml.includes('name="client_pw"'),
      html: topHtml.substring(0, 2000),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
