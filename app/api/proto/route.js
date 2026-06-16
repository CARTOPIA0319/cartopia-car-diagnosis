export async function GET() {
  try {
    const jsUrl = "https://motorgate.jp/assets/js/stock/detail.js?1592811259";

    const response = await fetch(jsUrl);
    const js = await response.text();

    const urls = Array.from(
      js.matchAll(/["'`](\/[^"'`]+|https:\/\/motorgate\.jp\/[^"'`]+)["'`]/g)
    ).map((m) => m[1]);

    return Response.json({
      success: true,
      status: response.status,
      urls,
      preview: js.substring(0, 5000),
    });
  } catch (e) {
    return Response.json({
      success: false,
      error: e.message,
    });
  }
}
