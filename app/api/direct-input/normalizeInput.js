import { normalizeInputWithSynonyms } from "./dictionary/synonyms";

function normalizeWhitespace(text) {
  return text.replace(/\s+/g, " ").trim();
}

export function normalizeInput(rawInput) {
  const original = String(rawInput ?? "");

  const trimmed = normalizeWhitespace(original);

  if (!trimmed) {
    return {
      original,
      normalized: "",
    };
  }

  // Unicode正規化
  let normalized = trimmed.normalize("NFKC");

  // よくある全角記号を半角へ
  normalized = normalized
    .replace(/　/g, " ")
    .replace(/：/g, ":")
    .replace(/／/g, "/")
    .replace(/－/g, "-");

  // 表記ゆれ・略称を正規化
  normalized = normalizeInputWithSynonyms(normalized);

  // 空白整理
  normalized = normalizeWhitespace(normalized);

  return {
    original: trimmed,
    normalized,
  };
}

export default normalizeInput;
