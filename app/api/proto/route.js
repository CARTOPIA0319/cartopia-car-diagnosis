export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const loginPageResponse = await fetch("https://motorgate.jp/login/index");
    const loginHtml = await loginPageResponse.text();

    const tokenMatch = loginHtml.match(
      /name="fuel_csrf_token"\s+value="([^"]+)"/
    );

    if (!tokenMatch) {
      return Response.json({
        success: false,
        step: "get csrf token",
        error: "CSRF token not found",
      });
    }

    const csrfToken = tokenMatch[1];

    const cookie = loginPageResponse.headers.get("set-cookie") || "";

    const loginResponse = await fetch("https://motorgate.jp/login/index", {
      method: "POST",
      redirect: "manual",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Cookie: cookie,
      },
      body: new URLSearchParams({
        fuel_csrf_token: csrfToken,
        client_id: clientId,
        user_id: "",
        client_pw: password,
        autologin: "",
        visit_new_search: "",
        visit_new_register: "",
        visit_new_est: "",
        visit_new_messenger: "",
      }),
    });

    return Response.json({
      success: true,
      loginStatus: loginResponse.status,
      location: loginResponse.headers.get("location"),
      setCookieExists: !!loginResponse.headers.get("set-cookie"),
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}
