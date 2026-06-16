export async function GET() {
  try {
    const clientId = process.env.MOTORGATE_CLIENT_ID;
    const password = process.env.MOTORGATE_PASSWORD;

    const page = await fetch(
      "https://motorgate.jp/login/index"
    );

    const html = await page.text();

    const csrf =
      html.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];

    const sessionId =
      html.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

    const cookie =
      page.headers.get("set-cookie") || "";

    const login = await fetch(
      "https://motorgate.jp/login/index",
      {
        method: "POST",
        redirect: "manual",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
          Cookie: cookie,
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
      }
    );

    return Response.json({
      success: true,
      status: login.status,
      location: login.headers.get("location"),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
