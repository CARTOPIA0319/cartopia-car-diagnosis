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
    ...candidates.map((candidate) =>
      matchPriority(candidate.matchType)
    )
  );

  return candidates.filter(
    (candidate) =>
      matchPriority(candidate.matchType) === highestPriority
  );
}

function findVehiclesByModel(inventory, modelKey) {
  return inventory.filter((vehicle) =>
    findDomesticInventoryModelCandidates(vehicle).some(
      (model) => model.key === modelKey
    )
  );
}

function makeUnknownResult(query) {
  return freezeResult({
    type: INVENTORY_SEARCH_RESULT_TYPES.UNKNOWN,
    query,
  });
}

export function searchInventory(inventory, input) {
  const vehicles = Array.isArray(inventory)
    ? inventory
    : [];

  const query = String(input ?? "").trim();
  const normalizedQuery =
    normalizeDomesticModelText(query);

  if (!query || normalizedQuery.length < 2) {
    return makeUnknownResult(query);
  }

  const allModelCandidates =
    findDomesticModelCandidates(query);

  const exactModelCandidates =
    allModelCandidates.filter(
      (candidate) =>
        candidate.matchType === "exact"
    );

  const maker = resolveMaker(query);

  /*
   * 車種の完全一致がない場合は、
   * メーカー判定を車種の前方一致・部分一致より優先する。
   *
   * これにより、
   * 「トヨタ」が「トヨタ86」に部分一致したり、
   * 「MINI」が「ミニキャブ」に部分一致したりする
   * 誤判定を防ぐ。
   */
  if (maker && !exactModelCandidates.length) {
    const matchedVehicles =
      filterInventoryByMaker(vehicles, maker);

    if (!matchedVehicles.length) {
      return freezeResult({
        type:
          INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        query,
        targetType:
          INVENTORY_SEARCH_RESULT_TYPES.MAKER,
        maker,
      });
    }

    return freezeResult({
      type:
        INVENTORY_SEARCH_RESULT_TYPES.MAKER,
      query,
      maker,
      vehicles: matchedVehicles,
    });
  }

  const highestPriorityModelCandidates =
    keepHighestPriorityCandidates(
      allModelCandidates
    );

  if (
    highestPriorityModelCandidates.length > 1
  ) {
    return freezeResult({
      type:
        INVENTORY_SEARCH_RESULT_TYPES.AMBIGUOUS,
      query,
      candidates:
        highestPriorityModelCandidates,
    });
  }

  if (
    highestPriorityModelCandidates.length === 1
  ) {
    const model =
      highestPriorityModelCandidates[0];

    const matchedVehicles =
      findVehiclesByModel(
        vehicles,
        model.key
      );

    if (!matchedVehicles.length) {
      return freezeResult({
        type:
          INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        query,
        targetType:
          INVENTORY_SEARCH_RESULT_TYPES.MODEL,
        model,
      });
    }

    return freezeResult({
      type:
        INVENTORY_SEARCH_RESULT_TYPES.MODEL,
      query,
      model,
      vehicles: matchedVehicles,
    });
  }

  return makeUnknownResult(query);
}

export function searchInventoryData(
  inventoryData,
  input
) {
  return searchInventory(
    inventoryData?.vehicles,
    input
  );
}
