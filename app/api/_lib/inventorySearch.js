import {
  filterInventoryByMaker,
  resolveMaker,
} from "./makerDictionary.js";

import {
  findDomesticInventoryModelCandidates,
  findDomesticModelCandidates,
  normalizeDomesticModelText,
} from "./domesticModelDictionary.js";

export const INVENTORY_SEARCH_RESULT_TYPES = Object.freeze({
  MAKER: "maker",
  MODEL: "model",
  AMBIGUOUS: "ambiguous",
  NO_STOCK: "no-stock",
  UNKNOWN: "unknown",
});

function freezeArray(values) {
  return Object.freeze([...values]);
}

function freezeResult(result) {
  return Object.freeze({
    ...result,
    vehicles: freezeArray(result.vehicles || []),
    similarVehicles: freezeArray(result.similarVehicles || []),
    candidates: freezeArray(result.candidates || []),
  });
}

function matchPriority(matchType) {
  if (matchType === "exact") return 0;
  if (matchType === "prefix") return 1;
  return 2;
}

function keepHighestPriorityCandidates(candidates) {
  if (!candidates.length) {
    return [];
  }

  const highestPriority = Math.min(
    ...candidates.map((candidate) => matchPriority(candidate.matchType))
  );

  return candidates.filter(
    (candidate) => matchPriority(candidate.matchType) === highestPriority
  );
}

const VEHICLE_CLASS_INVENTORY_KEYS = Object.freeze({
  kei: "軽自動車",
  standard: "普通車",
});

const MODEL_TYPE_INVENTORY_KEYS = Object.freeze({
  "slide-door": "スライドドア",
  standard: "スタンダード",
  suv: "SUV",
  truck: "トラック",
  sporty: "スポーティ",
  compact: "コンパクトカー",
  minivan: "ミニバン",
  sedan: "セダン",
  "station-wagon": "ステーションワゴン",
  "van-truck": "バン・トラック",
});

const EXCLUDED_SIMILAR_TYPE_KEYS = new Set([
  "EV・HV",
  "特にこだわりはない",
]);

function findVehiclesByModels(inventory, models) {
  const modelKeys = new Set(
    models.map((model) => model.key)
  );

  return inventory.filter((vehicle) =>
    findDomesticInventoryModelCandidates(vehicle).some(
      (model) => modelKeys.has(model.key)
    )
  );
}

function findVehiclesByModel(inventory, modelKey) {
  return findVehiclesByModels(
    inventory,
    [
      {
        key: modelKey,
      },
    ]
  );
}

function getRequiredInventoryTypeKeys(model) {
  const vehicleClassKey =
    VEHICLE_CLASS_INVENTORY_KEYS[model.vehicleClass];

  const typeKeys = model.types
    .map(
      (type) =>
        MODEL_TYPE_INVENTORY_KEYS[type]
    )
    .filter(
      (type) =>
        type &&
        !EXCLUDED_SIMILAR_TYPE_KEYS.has(type)
    );

  return [
    vehicleClassKey,
    ...typeKeys,
  ].filter(Boolean);
}

function getInventoryTypeKeySet(vehicle) {
  return new Set([
    ...(vehicle?.types || []),
    ...(vehicle?.typeKeys || []),
  ]);
}

function findSimilarVehiclesByModel(
  inventory,
  model
) {
  const requiredTypeKeys =
    getRequiredInventoryTypeKeys(model);

  if (!requiredTypeKeys.length) {
    return [];
  }

  const vehicleClassKey =
    VEHICLE_CLASS_INVENTORY_KEYS[model.vehicleClass];

  const modelTypeKeys =
    requiredTypeKeys.filter(
      (typeKey) =>
        typeKey !== vehicleClassKey
    );

  return inventory.filter((vehicle) => {
    const isSearchedModel =
      findDomesticInventoryModelCandidates(
        vehicle
      ).some(
        (candidate) =>
          candidate.key === model.key
      );

    if (isSearchedModel) {
      return false;
    }

    const inventoryTypeKeys =
      getInventoryTypeKeySet(vehicle);

    const matchesVehicleClass =
      !vehicleClassKey ||
      inventoryTypeKeys.has(
        vehicleClassKey
      );

    const matchesModelType =
      !modelTypeKeys.length ||
      modelTypeKeys.some(
        (typeKey) =>
          inventoryTypeKeys.has(
            typeKey
          )
      );

    return (
      matchesVehicleClass &&
      matchesModelType
    );
  });
}

function makeUnknownResult(query) {
  return freezeResult({
    type: INVENTORY_SEARCH_RESULT_TYPES.UNKNOWN,
    query,
  });
}

export function searchInventory(inventory, input) {
  const vehicles = Array.isArray(inventory) ? inventory : [];
  const query = String(input ?? "").trim();
  const normalizedQuery = normalizeDomesticModelText(query);

  if (!query || normalizedQuery.length < 2) {
    return makeUnknownResult(query);
  }

  const allModelCandidates = findDomesticModelCandidates(query);
  const exactModelCandidates = allModelCandidates.filter(
    (candidate) => candidate.matchType === "exact"
  );
  const maker = resolveMaker(query);

  if (maker && !exactModelCandidates.length) {
    const matchedVehicles = filterInventoryByMaker(vehicles, maker);

    if (!matchedVehicles.length) {
      return freezeResult({
        type: INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        query,
        targetType: INVENTORY_SEARCH_RESULT_TYPES.MAKER,
        maker,
      });
    }

    return freezeResult({
      type: INVENTORY_SEARCH_RESULT_TYPES.MAKER,
      query,
      maker,
      vehicles: matchedVehicles,
    });
  }

  const highestPriorityModelCandidates = keepHighestPriorityCandidates(
    findDomesticModelCandidates(query)
  );

  if (highestPriorityModelCandidates.length > 1) {
    const matchedVehicles =
      findVehiclesByModels(
        vehicles,
        highestPriorityModelCandidates
      );

    if (!matchedVehicles.length) {
      return freezeResult({
        type: INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        query,
        targetType: INVENTORY_SEARCH_RESULT_TYPES.MODEL,
        displayName: query,
        candidates:
          highestPriorityModelCandidates,
      });
    }

    return freezeResult({
      type: INVENTORY_SEARCH_RESULT_TYPES.MODEL,
      query,
      displayName: query,
      candidates: highestPriorityModelCandidates,
      vehicles: matchedVehicles,
    });
  }

  if (highestPriorityModelCandidates.length === 1) {
    const model = highestPriorityModelCandidates[0];
    const matchedVehicles = findVehiclesByModel(vehicles, model.key);

    if (!matchedVehicles.length) {
      return freezeResult({
        type: INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        query,
        targetType: INVENTORY_SEARCH_RESULT_TYPES.MODEL,
        model,
      });
    }

    return freezeResult({
      type: INVENTORY_SEARCH_RESULT_TYPES.MODEL,
      query,
      model,
      vehicles: matchedVehicles,
      similarVehicles:
        findSimilarVehiclesByModel(
          vehicles,
          model
        ),
    });
  }

  return makeUnknownResult(query);
}

export function searchInventoryData(inventoryData, input) {
  return searchInventory(inventoryData?.vehicles, input);
}
