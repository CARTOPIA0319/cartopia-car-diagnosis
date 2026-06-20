import inventory from "../../../../data/inventory.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function json(data) {
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);

    const type = url.searchParams.get("type") || "";

    const vehicles = inventory.vehicles || [];

    const results = type
      ? vehicles.filter(
          (vehicle) =>
            Array.isArray(vehicle.types) &&
            vehicle.types.includes(type)
        )
      : vehicles;

    return json({
      success: true,
      updatedAt: inventory.updatedAt || "",
      count: results.length,

      vehicles: results.map((vehicle) => ({
        stockId: vehicle.stockId,
        title: vehicle.title,
        totalPrice: vehicle.totalPrice,
        imageUrl: vehicle.imageUrl,
        types: vehicle.types || [],
      })),
    });
  } catch (e) {
    return json({
      success: false,
      error: e.message,
    });
  }
}
