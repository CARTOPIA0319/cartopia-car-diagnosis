export async function GET() {
  try {
    const response = await fetch("https://motorgate.jp/login/index");

    return Response.json({
      success: true,
      status: response.status,
      url: response.url,
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message,
    });
  }
}
