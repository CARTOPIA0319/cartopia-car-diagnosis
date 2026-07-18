export const runtime = "nodejs";

export async function GET() {
  return Response.json({
    ok: true,
    department: "direct-input",
    status: "ready",
    message: "直接入力部門が正常に稼働しています。",
  });
}
