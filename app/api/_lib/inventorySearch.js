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
  CATEGORY: "category",
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

function defineInventorySearchCategories(rows) {
  return Object.freeze(
    rows.map(
      ([
        key,
        displayName,
        aliases,
        vehicleClassKey,
        typeKeys,
        modelKeys,
        carNameParts,
      ]) =>
        Object.freeze({
          key,
          displayName,
          aliases: Object.freeze(
            Array.from(
              new Set([
                displayName,
                ...aliases,
              ])
            )
          ),
          normalizedAliases:
            Object.freeze(
              Array.from(
                new Set(
                  [
                    displayName,
                    ...aliases,
                  ]
                    .map(
                      normalizeDomesticModelText
                    )
                    .filter(Boolean)
                )
              )
            ),
          vehicleClassKey,
          typeKeys:
            Object.freeze([
              ...typeKeys,
            ]),
          modelKeys:
            Object.freeze([
              ...modelKeys,
            ]),
          normalizedCarNameParts:
            Object.freeze(
              carNameParts
                .map(
                  normalizeDomesticModelText
                )
                .filter(Boolean)
            ),
        })
    )
  );
}

const INVENTORY_SEARCH_CATEGORIES =
  defineInventorySearchCategories([
    [
      "kei-truck",
      "軽トラック",
      [
        "軽トラ",
      ],
      "軽自動車",
      [
        "トラック",
      ],
      [
        "nissan:clipper-truck",
        "mazda:scrum-truck",
        "subaru:sambar-truck",
        "suzuki:carry",
        "daihatsu:hijet-truck",
        "mitsubishi:minicab-truck",
      ],
      [
        "クリッパートラック",
        "スクラムトラック",
        "サンバートラック",
        "キャリイ",
        "スーパーキャリイ",
        "ハイゼットトラック",
        "ミニキャブトラック",
        "アクティトラック",
        "ピクシストラック",
      ],
    ],
    [
      "kei-bus",
      "軽バス",
      [
        "軽バン",
        "軽箱バン",
        "箱バン",
        "軽ワンボックス",
      ],
      "軽自動車",
      [],
      [
        "nissan:clipper-rio",
        "nissan:clipper-van",
        "honda:n-van",
        "honda:vamos",
        "mazda:scrum-wagon",
        "subaru:sambar-van",
        "suzuki:every-wagon",
        "suzuki:every-van",
        "daihatsu:atrai",
        "daihatsu:hijet-cargo",
        "mitsubishi:minicab-van",
      ],
      [
        "NV100クリッパー",
        "クリッパーリオ",
        "クリッパーバン",
        "N-VAN",
        "バモス",
        "ホビオ",
        "スクラムワゴン",
        "スクラムバン",
        "サンバーバン",
        "サンバーディアス",
        "ディアスワゴン",
        "エブリイ",
        "アトレー",
        "ハイゼットカーゴ",
        "ミニキャブバン",
        "タウンボックス",
        "ピクシスバン",
        "アクティバン",
      ],
    ],
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
    ...(
      Array.isArray(
        vehicle?.types
      )
        ? vehicle.types
        : []
    ),
    ...(
      Array.isArray(
        vehicle?.typeKeys
      )
        ? vehicle.typeKeys
        : []
    ),
  ]);
}

function resolveInventorySearchCategory(
  input
) {
  const normalizedInput =
    normalizeDomesticModelText(
      input
    );

  if (!normalizedInput) {
    return null;
  }

  return (
    INVENTORY_SEARCH_CATEGORIES.find(
      (category) =>
        category.normalizedAliases.includes(
          normalizedInput
        )
    ) || null
  );
}

function findVehiclesByCategory(
  inventory,
  category
) {
  const categoryModelKeys =
    new Set(
      category.modelKeys
    );

  return inventory.filter(
    (vehicle) => {
      const inventoryTypeKeys =
        getInventoryTypeKeySet(
          vehicle
        );

      if (
        category.vehicleClassKey &&
        !inventoryTypeKeys.has(
          category.vehicleClassKey
        )
      ) {
        return false;
      }

      const matchesType =
        category.typeKeys.some(
          (typeKey) =>
            inventoryTypeKeys.has(
              typeKey
            )
        );

      const matchesModel =
        findDomesticInventoryModelCandidates(
          vehicle
        ).some(
          (candidate) =>
            categoryModelKeys.has(
              candidate.key
            )
        );

      const normalizedCarName =
        normalizeDomesticModelText(
          vehicle?.carName
        );

      const matchesCarName =
        normalizedCarName &&
        category.normalizedCarNameParts.some(
          (part) =>
            normalizedCarName.includes(
              part
            )
        );

      return (
        matchesType ||
        matchesModel ||
        matchesCarName
      );
    }
  );
}

function matchesSimilarModelType(
  vehicle,
  model
) {
  const requiredTypeKeys =
    getRequiredInventoryTypeKeys(
      model
    );

  if (!requiredTypeKeys.length) {
    return false;
  }

  const vehicleClassKey =
    VEHICLE_CLASS_INVENTORY_KEYS[
      model.vehicleClass
    ];

  const modelTypeKeys =
    requiredTypeKeys.filter(
      (typeKey) =>
        typeKey !==
        vehicleClassKey
    );

  const inventoryTypeKeys =
    getInventoryTypeKeySet(
      vehicle
    );

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
}

function findSimilarVehiclesByModels(
  inventory,
  models
) {
  const searchedModelKeys =
    new Set(
      models.map(
        (model) =>
          model.key
      )
    );

  return inventory.filter(
    (vehicle) => {
      const isSearchedModel =
        findDomesticInventoryModelCandidates(
          vehicle
        ).some(
          (candidate) =>
            searchedModelKeys.has(
              candidate.key
            )
        );

      if (isSearchedModel) {
        return false;
      }

      return models.some(
        (model) =>
          matchesSimilarModelType(
            vehicle,
            model
          )
      );
    }
  );
}

function findSimilarVehiclesByModel(
  inventory,
  model
) {
  return findSimilarVehiclesByModels(
    inventory,
    [
      model,
    ]
  );
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

  const category =
    resolveInventorySearchCategory(
      query
    );

  if (category) {
    const matchedVehicles =
      findVehiclesByCategory(
        vehicles,
        category
      );

    if (!matchedVehicles.length) {
      return freezeResult({
        type:
          INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        query,
        targetType:
          INVENTORY_SEARCH_RESULT_TYPES.CATEGORY,
        category,
      });
    }

    return freezeResult({
      type:
        INVENTORY_SEARCH_RESULT_TYPES.CATEGORY,
      query,
      category,
      vehicles:
        matchedVehicles,
    });
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

  const modelCandidates =
    allModelCandidates;

  if (modelCandidates.length > 1) {
    const matchedVehicles =
      findVehiclesByModels(
        vehicles,
        modelCandidates
      );

    if (!matchedVehicles.length) {
      return freezeResult({
        type: INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        query,
        targetType: INVENTORY_SEARCH_RESULT_TYPES.MODEL,
        displayName: query,
        candidates:
          modelCandidates,
        similarVehicles:
          findSimilarVehiclesByModels(
            vehicles,
            modelCandidates
          ),
      });
    }

    return freezeResult({
      type: INVENTORY_SEARCH_RESULT_TYPES.MODEL,
      query,
      displayName: query,
      candidates: modelCandidates,
      vehicles: matchedVehicles,
    });
  }

  if (modelCandidates.length === 1) {
    const model =
      modelCandidates[0];
    const matchedVehicles = findVehiclesByModel(vehicles, model.key);

    if (!matchedVehicles.length) {
      return freezeResult({
        type: INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        query,
        targetType: INVENTORY_SEARCH_RESULT_TYPES.MODEL,
        model,
        similarVehicles:
          findSimilarVehiclesByModel(
            vehicles,
            model
          ),
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
