export async function GET() {
  const response = await fetch("https://motorgate.jp/login/index");

  const html = await response.text();

  const csrf =
    html.match(/name="fuel_csrf_token"\s+value="([^"]+)"/)?.[1];

  const sessionId =
    html.match(/name="session_id"\s+value="([^"]+)"/)?.[1];

  return Response.json({
    success: true,
    csrf,
    sessionId,
  });
}
