export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    department: "direct-input",
    status: "ready",
    message: "Direct Input API Ready",
  });
}
