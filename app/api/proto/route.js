export async function GET() {
  try {
    const response = await fetch("https://motorgate.jp/login/index");
    const html = await response.text();

    const passwordIndex = html.indexOf('type="password"');
    const aroundPassword =
      passwordIndex >= 0
        ? html.slice(Math.max(0, passwordIndex - 800), passwordIndex + 1200)
        : "password input not found";

    return Response.json({
      success: true,
      status: response.status,
      url: response.url,
      passwordIndex,
      aroundPassword,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}
