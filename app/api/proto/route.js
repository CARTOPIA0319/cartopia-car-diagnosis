export async function GET() {
  return Response.json({
    success: true,
    clientId: process.env.MOTORGATE_CLIENT_ID,
    passwordLength: process.env.MOTORGATE_PASSWORD?.length || 0,
  });
}
