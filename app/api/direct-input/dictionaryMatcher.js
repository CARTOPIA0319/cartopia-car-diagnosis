// app/api/direct-input/dictionaryMatcher.js

import * as makerDictionary from "./dictionary/makers.js";
import * as brandDictionary from "./dictionary/brands.js";
import * as modelDictionary from "./dictionary/models.js";
import * as categoryDictionary from "./dictionary/categories.js";
import * as purposeDictionary from "./dictionary/purposes.js";

const DICTIONARY_SOURCES = Object.freeze([
  {
    name: "maker",
    module: makerDictionary,
    exportNames: [
      "makers",
      "vehicleMakers",
    ],
  },
  {
    name: "brand",
    module: brandDictionary,
    exportNames: [
      "brands",
      "vehicleBrands",
    ],
  },
  {
    name: "model",
    module: modelDictionary,
    exportNames: [
      "models",
      "vehicleModels",
    ],
  },
  {
    name: "category",
    module: categoryDictionary,
    exportNames: [
      "categories",
      "vehicleCategories",
    ],
  },
  {
    name: "purpose",
    module: purposeDictionary,
    exportNames: [
      "purposes",
      "vehiclePurposes",
    ],
  },
]);

const TYPE_ORDER = Object.freeze({
  model: 0,
  maker: 1,
  brand: 2,
  category: 3,
  purpose: 4,
});

function isDictionaryEntry(value) {
  return Boolean(
    value &&
      typeof value === "object" &&
      typeof value.id === "string" &&
      typeof value.type === "string" &&
      Array.isArray(value.keywords),
  );
}

function resolveDictionaryArray(source) {
  for (
    const exportName of
    source.exportNames
  ) {
    const value =
      source.module[exportName];

    if (Array.isArray(value)) {
      return value;
    }
  }

  for (
    const value of
    Object.values(source.module)
  ) {
    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every(
        isDictionaryEntry,
      )
    ) {
      return value;
    }
  }

  return [];
}

const ALL_DICTIONARIES =
  Object.freeze(
    DICTIONARY_SOURCES.flatMap(
      (source) =>
        resolveDictionaryArray(
          source,
        ),
    ),
  );

function normalizeForMatch(value) {
  return String(value ?? "")
    .normalize("NFKC")
    .toLocaleLowerCase("ja-JP")
    .replace(/[®™©]/g, "")
    .replace(
      /[\s\u3000]/g,
      "",
    )
    .replace(
      /[・･.,，。'’"`´:：;+＋!！?？]/g,
      "",
    )
    .replace(
      /[()[\]{}【】「」『』〈〉《》]/g,
      "",
    )
    .replace(
      /[\/\\|]/g,
      "",
    )
    .replace(
      /[-‐-‒–—―ー]/g,
      "",
    )
    .trim();
}

function getInputText(input) {
  if (
    typeof input === "string"
  ) {
    return input;
  }

  if (
    input &&
    typeof input === "object"
  ) {
    if (
      typeof input.normalized ===
      "string"
    ) {
      return input.normalized;
    }

    if (
      typeof input.original ===
      "string"
    ) {
      return input.original;
    }
  }

  return String(input ?? "");
}

function uniqueStrings(values) {
  return [
    ...new Set(
      values
        .filter(
          (value) =>
            typeof value ===
            "string",
        )
        .map(
          (value) =>
            value.trim(),
        )
        .filter(Boolean),
    ),
  ];
}

function collectKeywords(entry) {
  return uniqueStrings([
    entry.name,
    entry.nameEn,

    ...(
      Array.isArray(
        entry.aliases,
      )
        ? entry.aliases
        : []
    ),

    ...(
      Array.isArray(
        entry.keywords,
      )
        ? entry.keywords
        : []
    ),
  ]);
}

function calculateMatch(
  normalizedInput,
  normalizedKeyword,
) {
  if (
    !normalizedInput ||
    !normalizedKeyword
  ) {
    return null;
  }

  if (
    normalizedInput ===
    normalizedKeyword
  ) {
    return {
      kind: "exact",
      baseScore: 100000,
    };
  }

  const keywordLength =
    normalizedKeyword.length;

  /*
   * 「軽」など1文字の語は、
   * 完全一致以外では誤検出しやすいため
   * 部分一致を行わない。
   */
  if (keywordLength < 2) {
    return null;
  }

  if (
    normalizedInput.startsWith(
      normalizedKeyword,
    )
  ) {
    return {
      kind: "prefix",
      baseScore: 90000,
    };
  }

  if (
    normalizedInput.endsWith(
      normalizedKeyword,
    )
  ) {
    return {
      kind: "suffix",
      baseScore: 85000,
    };
  }

  if (
    normalizedInput.includes(
      normalizedKeyword,
    )
  ) {
    return {
      kind: "contains",
      baseScore: 80000,
    };
  }

  if (
    normalizedInput.length >= 2 &&
    normalizedKeyword.startsWith(
      normalizedInput,
    )
  ) {
    return {
      kind: "partial",
      baseScore: 70000,
    };
  }

  return null;
}

function createCandidate(
  entry,
  keyword,
  normalizedKeyword,
  match,
) {
  const parsedPriority =
    Number(entry.priority);

  const priority =
    Number.isFinite(
      parsedPriority,
    )
      ? parsedPriority
      : 100;

  const score =
    match.baseScore +
    normalizedKeyword.length *
      10 -
    priority;

  return {
    id: entry.id,
    type: entry.type,

    name:
      entry.name ?? "",

    nameEn:
      entry.nameEn ?? null,

    matchedKeyword:
      keyword,

    matchKind:
      match.kind,

    score,
    priority,

    parent:
      entry.parent ?? null,

    category:
      entry.category ?? null,

    tags:
      Array.isArray(
        entry.tags,
      )
        ? [...entry.tags]
        : [],

    makerId:
      entry.makerId ?? null,

    brandId:
      entry.brandId ?? null,

    group:
      entry.group ?? null,

    key:
      entry.key ?? null,

    bodyTypes:
      Array.isArray(
        entry.bodyTypes,
      )
        ? [...entry.bodyTypes]
        : [],

    entry,
  };
}

function compareCandidates(
  first,
  second,
) {
  if (
    first.score !==
    second.score
  ) {
    return (
      second.score -
      first.score
    );
  }

  if (
    first.priority !==
    second.priority
  ) {
    return (
      first.priority -
      second.priority
    );
  }

  const firstTypeOrder =
    TYPE_ORDER[first.type] ?? 99;

  const secondTypeOrder =
    TYPE_ORDER[second.type] ?? 99;

  if (
    firstTypeOrder !==
    secondTypeOrder
  ) {
    return (
      firstTypeOrder -
      secondTypeOrder
    );
  }

  return String(
    first.name ?? "",
  ).localeCompare(
    String(
      second.name ?? "",
    ),
    "ja",
  );
}

function deduplicateCandidates(
  candidates,
) {
  const bestByEntry =
    new Map();

  for (
    const candidate of
    candidates
  ) {
    const candidateKey =
      `${candidate.type}:${candidate.id}`;

    const current =
      bestByEntry.get(
        candidateKey,
      );

    if (
      !current ||
      compareCandidates(
        candidate,
        current,
      ) < 0
    ) {
      bestByEntry.set(
        candidateKey,
        candidate,
      );
    }
  }

  return [
    ...bestByEntry.values(),
  ].sort(compareCandidates);
}

export function dictionaryMatcher(
  input,
  {
    types = null,
    limit = 20,
  } = {},
) {
  const sourceText =
    getInputText(input);

  const normalizedInput =
    normalizeForMatch(
      sourceText,
    );

  const allowedTypes =
    Array.isArray(types) &&
    types.length > 0
      ? new Set(types)
      : null;

  const safeLimit =
    Math.max(
      1,
      Math.min(
        Number(limit) || 20,
        100,
      ),
    );

  if (!normalizedInput) {
    return {
      matched: false,
      normalizedInput: "",
      best: null,
      results: [],
    };
  }

  const candidates = [];

  for (
    const entry of
    ALL_DICTIONARIES
  ) {
    if (
      !isDictionaryEntry(
        entry,
      )
    ) {
      continue;
    }

    if (
      allowedTypes &&
      !allowedTypes.has(
        entry.type,
      )
    ) {
      continue;
    }

    const keywords =
      collectKeywords(entry);

    for (
      const keyword of
      keywords
    ) {
      const normalizedKeyword =
        normalizeForMatch(
          keyword,
        );

      const match =
        calculateMatch(
          normalizedInput,
          normalizedKeyword,
        );

      if (!match) {
        continue;
      }

      candidates.push(
        createCandidate(
          entry,
          keyword,
          normalizedKeyword,
          match,
        ),
      );
    }
  }

  const results =
    deduplicateCandidates(
      candidates,
    ).slice(
      0,
      safeLimit,
    );

  return {
    matched:
      results.length > 0,

    normalizedInput,

    best:
      results[0] ?? null,

    results,
  };
}

export default dictionaryMatcher;
