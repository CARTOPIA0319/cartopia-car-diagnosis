// lib/dictionaryMatcher.js

import makers from "./dictionary/makers";
import brands from "./dictionary/brands";
import models from "./dictionary/models";
import categories from "./dictionary/categories";
import purposes from "./dictionary/purposes";

const ALL_DICTIONARIES = [
  ...makers,
  ...brands,
  ...models,
  ...categories,
  ...purposes,
];

function normalize(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/\s+/g, "")
    .trim();
}

function createCandidate(entry, keyword, score) {
  return {
    id: entry.id,
    type: entry.type,
    name: entry.name,
    score,
    keyword,

    parent: entry.parent ?? null,
    category: entry.category ?? null,

    tags: entry.tags ?? [],
    priority: entry.priority ?? 100,

    raw: entry,
  };
}

function calcScore(text, keyword, priority) {
  if (text === keyword) {
    return 100000 - priority;
  }

  if (text.startsWith(keyword)) {
    return 90000 + keyword.length - priority;
  }

  if (text.endsWith(keyword)) {
    return 85000 + keyword.length - priority;
  }

  if (text.includes(keyword)) {
    return 80000 + keyword.length - priority;
  }

  return 0;
}

export function dictionaryMatcher(input) {
  const normalized = normalize(input);

  if (!normalized) {
    return {
      matched: false,
      results: [],
    };
  }

  const results = [];

  for (const entry of ALL_DICTIONARIES) {
    const keywords = entry.keywords ?? [];

    for (const word of keywords) {
      const keyword = normalize(word);

      if (!keyword) continue;

      const score = calcScore(
        normalized,
        keyword,
        entry.priority ?? 100,
      );

      if (!score) continue;

      results.push(
        createCandidate(
          entry,
          keyword,
          score,
        ),
      );
    }
  }

  results.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }

    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }

    return a.name.localeCompare(b.name);
  });

  const unique = [];
  const used = new Set();

  for (const item of results) {
    if (used.has(item.id)) continue;

    used.add(item.id);
    unique.push(item);
  }

  return {
    matched: unique.length > 0,
    best: unique[0] ?? null,
    results: unique,
  };
}

export default dictionaryMatcher;
