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

function hasType(vehicle, type) {
  if (!type) return true;
  const types = vehicle.types || [];
  const typeKeys = vehicle.typeKeys || [];
  return types.includes(type) || typeKeys.includes(type);
}

function makeCard(vehicle) {
  return {
    stockId: vehicle.stockId,
    title: vehicle.title,
    description: vehicle.description,
    totalPrice: vehicle.totalPrice,
    bodyPrice: vehicle.bodyPrice,
    year: vehicle.year,
    mileage: vehicle.mileage,
    color: vehicle.color,
    imageUrl: vehicle.imageUrl,
    detailUrl: vehicle.detailUrl,
    gooUrl: vehicle.gooUrl,
    types: vehicle.types || [],
    typeKeys: vehicle.typeKeys || [],
  };
}

export async function GET(request) {
  try {
    const url = new URL(request.url);

    const type = url.searchParams.get("type") || "";
    const type1 = url.searchParams.get("type1") || "";
    const type2 = url.searchParams.get("type2") || "";
    const limit = Number(url.searchParams.get("limit") || "10");

    const vehicles = inventory.vehicles || [];

    const results = vehicles
      .filter((vehicle) => {
        if (type) return hasType(vehicle, type);
        return hasType(vehicle, type1) && hasType(vehicle, type2);
      })
      .slice(0, limit);

    return json({
      success: true,
      updatedAt: inventory.updatedAt || "",
      count: results.length,
      query: {
        type,
        type1,
        type2,
        limit,
      },
      vehicles: results.map(makeCard),
    });
  } catch (e) {
    return json({
      success: false,
      error: e.message,
    });
  }
}
