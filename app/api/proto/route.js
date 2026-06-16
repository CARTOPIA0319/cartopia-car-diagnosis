export async function GET() {
  const response = await fetch("https://motorgate.jp/login/index");
  const html = await response.text();

  return Response.json({
    success: true,
    html: html.substring(0, 5000),
  });
}
