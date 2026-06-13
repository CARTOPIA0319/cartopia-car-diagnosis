export async function GET() {
  return Response.json({
    status: "ok",
    message: "inventory api ready"
  });
}
