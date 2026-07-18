export function buildConfirmation(rawText, classification) {
  const text = String(rawText ?? "").trim();

  if (!text) {
    return {
      type: "error",
      message:
        "\u5185\u5bb9\u3092\u5165\u529b\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    };
  }

  if (classification.type === "reservation") {
    return {
      type: "reservation",
      message:
        "\u3054\u4e88\u7d04\u3067\u3059\u306d\u3002\u3054\u5e0c\u671b\u306e\u5185\u5bb9\u3092\u9078\u3093\u3067\u304f\u3060\u3055\u3044\u3002",
      actions: [
        "\u8eca\u691c",
        "\u30aa\u30a4\u30eb\u4ea4\u63db",
        "\u70b9\u691c\u30fb\u6574\u5099",
        "\u305d\u306e\u4ed6",
      ],
    };
  }

  if (classification.type === "sell") {
    return {
      type: "sell",
      message:
        "\u304a\u8eca\u306e\u58f2\u5374\u30fb\u67fb\u5b9a\u306b\u3064\u3044\u3066\u304a\u4f3a\u3044\u3057\u307e\u3059\u3002",
      actions: [
        "\u67fb\u5b9a\u3092\u4f9d\u983c\u3059\u308b",
        "\u307e\u305a\u76f8\u8ac7\u3059\u308b",
      ],
    };
  }

  if (classification.type === "purchase") {
    return {
      type: "purchase",
      message:
        "\u304a\u8eca\u63a2\u3057\u306b\u3064\u3044\u3066\u304a\u4f3a\u3044\u3057\u307e\u3059\u3002",
      actions: [
        "\u5728\u5eab\u8eca\u3092\u63a2\u3059",
        "\u6ce8\u6587\u8eca\u3092\u76f8\u8ac7\u3059\u308b",
        "\u3074\u3063\u305f\u308a\u8a3a\u65ad",
      ],
    };
  }

  if (classification.type === "diagnosis") {
    return {
      type: "diagnosis",
      message:
        "\u3074\u3063\u305f\u308a\u8eca\u7a2e\u8a3a\u65ad\u3092\u958b\u59cb\u3057\u307e\u3059\u304b\uff1f",
      actions: [
        "\u8a3a\u65ad\u3092\u958b\u59cb\u3059\u308b",
        "\u30ad\u30e3\u30f3\u30bb\u30eb",
      ],
    };
  }

  if (classification.useAi === true) {
    return {
      type: "ai-confirmation",
      message:
        "\u5165\u529b\u5185\u5bb9\u3092\u3082\u3068\u306b\u3001\u5728\u5eab\u8eca\u3084\u8fd1\u3044\u8eca\u7a2e\u3092\u63a2\u3057\u307e\u3059\u304b\uff1f",
      actions: [
        "\u8eca\u3092\u63a2\u3059",
        "\u30ad\u30e3\u30f3\u30bb\u30eb",
      ],
      originalText: text,
    };
  }

  return {
    type: "unknown",
    message:
      "\u5185\u5bb9\u3092\u7406\u89e3\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002",
  };
}
