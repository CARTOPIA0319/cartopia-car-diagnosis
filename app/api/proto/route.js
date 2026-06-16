export async function GET() {
  return Response.json({
    success: true,
    clientIdExists: !!process.env.MOTORGATE_CLIENT_ID,
    passwordExists: !!process.env.MOTORGATE_PASSWORD,
  });
}
