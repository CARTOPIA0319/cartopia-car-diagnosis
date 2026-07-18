function normalizeText(text) {
  return String(text ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();
}

const RESERVATION_WORDS = [
  "予約",
  "車検",
  "オイル交換",
  "点検",
  "整備",
  "修理",
  "異音",
  "タイヤ交換",
  "鈑金",
  "板金",
];

const SELL_WORDS = [
  "売りたい",
  "売却",
  "買取",
  "買い取り",
  "査定",
  "手放したい",
];

const PURCHASE_WORDS = [
  "買いたい",
  "購入したい",
  "車を探して",
  "車探して",
  "乗り換え",
  "注文車",
];

const DIAGNOSIS_WORDS = [
  "ぴったり診断",
  "車種診断",
  "おすすめの車",
  "どの車がいい",
  "自分に合う車",
];

function containsAny(text, words) {
  return words.some((word) => text.includes(word));
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

  if (containsAny(text, RESERVATION_WORDS)) {
    return {
      type: "reservation",
      confidence: "high",
      useAi: false,
    };
  }

  if (containsAny(text, SELL_WORDS)) {
    return {
      type: "sell",
      confidence: "high",
      useAi: false,
    };
  }

  if (containsAny(text, PURCHASE_WORDS)) {
    return {
      type: "purchase",
      confidence: "high",
      useAi: false,
    };
  }

  if (containsAny(text, DIAGNOSIS_WORDS)) {
    return {
      type: "diagnosis",
      confidence: "high",
      useAi: false,
    };
  }

  return {
    type: "unknown",
    confidence: "low",
    useAi: true,
  };
}
