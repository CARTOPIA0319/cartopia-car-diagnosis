// app/api/direct-input/classify.js

function normalizeText(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const RESERVATION_WORDS = [
  "予約",
  "車検",
  "点検",
  "整備",
  "修理",
  "故障",
  "異音",
  "オイル",
  "オイル交換",
  "タイヤ",
  "タイヤ交換",
  "バッテリー",
  "鈑金",
  "板金",
];

const SELL_WORDS = [
  "買取",
  "査定",
  "売却",
  "売りたい",
  "手放したい",
];

const PURCHASE_WORDS = [
  "購入",
  "買いたい",
  "注文車",
  "乗り換え",
  "在庫",
];

const DIAGNOSIS_WORDS = [
  "診断",
  "おすすめ",
  "ぴったり",
  "どの車",
  "自分に合う",
];

function containsAny(text, words) {
  return words.some((word) =>
    text.includes(word),
  );
}

export function classifyDirectInput(rawText) {
  const text = normalizeText(rawText);

  if (!text) {
    return {
      type: "empty",
      confidence: "high",
      useAi: false,
    };
  }

  if (
    containsAny(
      text,
      RESERVATION_WORDS,
    )
  ) {
    return {
      type: "reservation",
      confidence: "high",
      useAi: false,
    };
  }

  if (
    containsAny(
      text,
      SELL_WORDS,
    )
  ) {
    return {
      type: "sell",
      confidence: "high",
      useAi: false,
    };
  }

  if (
    containsAny(
      text,
      PURCHASE_WORDS,
    )
  ) {
    return {
      type: "purchase",
      confidence: "high",
      useAi: false,
    };
  }

  if (
    containsAny(
      text,
      DIAGNOSIS_WORDS,
    )
  ) {
    return {
      type: "diagnosis",
      confidence: "high",
      useAi: false,
    };
  }

  return {
    type: "vehicle-search",
    confidence: "low",
    useAi: true,
  };
}

export default classifyDirectInput;
