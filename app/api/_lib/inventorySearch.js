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
  const similarSelection =
    result.similarSelection
      ? Object.freeze({
          ...result.similarSelection,
          options: freezeArray(
            result.similarSelection.options || []
          ),
        })
      : null;

  return Object.freeze({
    ...result,
    vehicles: freezeArray(result.vehicles || []),
    similarVehicles: freezeArray(result.similarVehicles || []),
    candidates: freezeArray(result.candidates || []),
    similarSelection,
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

const VEHICLE_CLASS_OPTIONS = Object.freeze([
  Object.freeze({
    key: "kei",
    label: "軽自動車",
  }),
  Object.freeze({
    key: "standard",
    label: "普通車",
  }),
]);

const MODEL_TYPE_OPTIONS_BY_CLASS = Object.freeze({
  kei: Object.freeze([
    "slide-door",
    "standard",
    "suv",
    "truck",
    "sporty",
  ]),
  standard: Object.freeze([
    "compact",
    "minivan",
    "suv",
    "sedan",
    "station-wagon",
    "sporty",
    "van-truck",
  ]),
});

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
  ]);

function keepDirectInputCandidates(candidates) {
  const exactCandidates =
    candidates.filter(
      (candidate) =>
        candidate.matchType === "exact"
    );

  if (exactCandidates.length) {
    const exactMakerKeys =
      new Set(
        exactCandidates.map(
          (candidate) =>
            candidate.makerKey
        )
      );

    return candidates.filter(
      (candidate) =>
        (
          candidate.matchType === "exact" ||
          candidate.matchType === "prefix"
        ) &&
        exactMakerKeys.has(
          candidate.makerKey
        )
    );
  }

  const hasExactOrPrefix =
    candidates.some(
      (candidate) =>
        candidate.matchType === "prefix"
    );

  if (!hasExactOrPrefix) {
    return candidates;
  }

  return candidates.filter(
    (candidate) =>
      candidate.matchType === "prefix"
  );
}

function uniqueValues(values) {
  return Array.from(new Set(values));
}

function getAllowedModelTypeKeys(model) {
  const allowedTypeKeys =
    MODEL_TYPE_OPTIONS_BY_CLASS[
      model.vehicleClass
    ] || [];

  return model.types.filter(
    (typeKey) =>
      allowedTypeKeys.includes(typeKey) &&
      MODEL_TYPE_INVENTORY_KEYS[typeKey]
  );
}

function makeSimilarSelection(
  models,
  requestedSelection = {}
) {
  const vehicleClassKeys =
    uniqueValues(
      models
        .map(
          (model) =>
            model.vehicleClass
        )
        .filter(
          (key) =>
            VEHICLE_CLASS_INVENTORY_KEYS[key]
        )
    );

  const requestedVehicleClass =
    requestedSelection.vehicleClass || "";

  if (
    requestedVehicleClass &&
    !vehicleClassKeys.includes(
      requestedVehicleClass
    )
  ) {
    return Object.freeze({
      valid: false,
      axis: null,
      vehicleClass: null,
      modelType: null,
      options: Object.freeze([]),
    });
  }

  if (
    vehicleClassKeys.length > 1 &&
    !requestedVehicleClass
  ) {
    const availableKeys =
      new Set(vehicleClassKeys);

    return Object.freeze({
      valid: true,
      axis: "vehicleClass",
      vehicleClass: null,
      modelType: null,
      options: Object.freeze(
        VEHICLE_CLASS_OPTIONS
          .filter(
            (option) =>
              availableKeys.has(
                option.key
              )
          )
      ),
    });
  }

  const vehicleClass =
    requestedVehicleClass ||
    vehicleClassKeys[0] ||
    null;

  const selectedModels =
    models.filter(
      (model) =>
        !vehicleClass ||
        model.vehicleClass ===
          vehicleClass
    );

  const modelTypeKeys =
    uniqueValues(
      selectedModels.flatMap(
        getAllowedModelTypeKeys
      )
    );

  const requestedModelType =
    requestedSelection.modelType || "";

  if (
    requestedModelType &&
    !modelTypeKeys.includes(
      requestedModelType
    )
  ) {
    return Object.freeze({
      valid: false,
      axis: null,
      vehicleClass,
      modelType: null,
      options: Object.freeze([]),
    });
  }

  if (
    modelTypeKeys.length > 1 &&
    !requestedModelType
  ) {
    const availableKeys =
      new Set(modelTypeKeys);

    const orderedTypeKeys =
      MODEL_TYPE_OPTIONS_BY_CLASS[
        vehicleClass
      ] || [];

    return Object.freeze({
      valid: true,
      axis: "modelType",
      vehicleClass,
      modelType: null,
      options: Object.freeze(
        orderedTypeKeys
          .filter(
            (typeKey) =>
              availableKeys.has(
                typeKey
              )
          )
          .map(
            (typeKey) =>
              Object.freeze({
                key: typeKey,
                label:
                  MODEL_TYPE_INVENTORY_KEYS[
                    typeKey
                  ],
              })
          )
      ),
    });
  }

  return Object.freeze({
    valid:
      Boolean(vehicleClass) &&
      Boolean(
        requestedModelType ||
        modelTypeKeys[0]
      ),
    axis: null,
    vehicleClass,
    modelType:
      requestedModelType ||
      modelTypeKeys[0] ||
      null,
    options: Object.freeze([]),
  });
}

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

function matchesSimilarSelection(
  vehicle,
  similarSelection
) {
  if (
    !similarSelection?.valid ||
    similarSelection.axis ||
    !similarSelection.vehicleClass ||
    !similarSelection.modelType
  ) {
    return false;
  }

  const vehicleClassKey =
    VEHICLE_CLASS_INVENTORY_KEYS[
      similarSelection.vehicleClass
    ];

  const modelTypeKey =
    MODEL_TYPE_INVENTORY_KEYS[
      similarSelection.modelType
    ];

  const inventoryTypeKeys =
    getInventoryTypeKeySet(
      vehicle
    );

  return (
    Boolean(vehicleClassKey) &&
    Boolean(modelTypeKey) &&
    inventoryTypeKeys.has(
      vehicleClassKey
    ) &&
    inventoryTypeKeys.has(
      modelTypeKey
    )
  );
}

function findSimilarVehiclesByModels(
  inventory,
  searchedModels,
  similarSelection
) {
  const searchedModelKeys =
    new Set(
      searchedModels.map(
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

      return matchesSimilarSelection(
        vehicle,
        similarSelection
      );
    }
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

  const allModelCandidates =
    findDomesticModelCandidates(query);
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
    keepDirectInputCandidates(
      allModelCandidates
    );

  if (modelCandidates.length) {
    const model =
      modelCandidates.length === 1
        ? modelCandidates[0]
        : null;

    const matchedVehicles =
      findVehiclesByModels(
        vehicles,
        modelCandidates
      );

    const similarSelection =
      makeSimilarSelection(
        modelCandidates
      );

    const similarVehicles =
      similarSelection.valid &&
      !similarSelection.axis
        ? findSimilarVehiclesByModels(
            vehicles,
            modelCandidates,
            similarSelection
          )
        : [];

    const commonResult = {
      query,
      displayName:
        modelCandidates.length > 1
          ? query
          : undefined,
      model,
      candidates:
        modelCandidates,
      similarSelection,
      similarVehicles,
    };

    if (!matchedVehicles.length) {
      return freezeResult({
        ...commonResult,
        type:
          INVENTORY_SEARCH_RESULT_TYPES.NO_STOCK,
        targetType:
          INVENTORY_SEARCH_RESULT_TYPES.MODEL,
      });
    }

    return freezeResult({
      ...commonResult,
      type:
        INVENTORY_SEARCH_RESULT_TYPES.MODEL,
      vehicles:
        matchedVehicles,
    });
  }

  return makeUnknownResult(query);
}

export function searchInventoryData(inventoryData, input) {
  return searchInventory(inventoryData?.vehicles, input);
}

export function selectSimilarInventory(
  inventory,
  input,
  requestedSelection = {}
) {
  const vehicles =
    Array.isArray(inventory)
      ? inventory
      : [];

  const query =
    String(input ?? "").trim();

  const normalizedQuery =
    normalizeDomesticModelText(
      query
    );

  if (
    !query ||
    normalizedQuery.length < 2
  ) {
    return makeUnknownResult(query);
  }

  const modelCandidates =
    keepDirectInputCandidates(
      findDomesticModelCandidates(
        query
      )
    );

  if (!modelCandidates.length) {
    return makeUnknownResult(query);
  }

  const similarSelection =
    makeSimilarSelection(
      modelCandidates,
      requestedSelection
    );

  if (!similarSelection.valid) {
    return makeUnknownResult(query);
  }

  const commonResult = {
    query,
    displayName:
      modelCandidates.length > 1
        ? query
        : undefined,
    model:
      modelCandidates.length === 1
        ? modelCandidates[0]
        : null,
    candidates:
      modelCandidates,
    similarSelection,
  };

  if (similarSelection.axis) {
    return freezeResult({
      ...commonResult,
      type:
        INVENTORY_SEARCH_RESULT_TYPES.AMBIGUOUS,
    });
  }

  return freezeResult({
    ...commonResult,
    type:
      INVENTORY_SEARCH_RESULT_TYPES.MODEL,
    similarVehicles:
      findSimilarVehiclesByModels(
        vehicles,
        modelCandidates,
        similarSelection
      ),
  });
}

export function selectSimilarInventoryData(
  inventoryData,
  input,
  requestedSelection = {}
) {
  return selectSimilarInventory(
    inventoryData?.vehicles,
    input,
    requestedSelection
  );
}
