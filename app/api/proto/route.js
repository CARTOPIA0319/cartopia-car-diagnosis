export async function GET() {
  try {
    const response = await fetch("https://motorgate.jp/login/index");
    const html = await response.text();

    return Response.json({
      success: true,
      status: response.status,
      url: response.url,
      htmlPreview: html.slice(0, 3000),
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}
