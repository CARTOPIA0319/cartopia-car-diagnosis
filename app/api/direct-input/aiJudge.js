import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ALLOWED_CATEGORIES = [
  "vehicle-search",
  "reservation",
  "sell",
  "purchase",
  "faq",
  "casual",
  "nonsense",
];

function createFallbackResult(input, errorMessage) {
  return {
    success: false,
    useAi: true,
    category: "nonsense",
    confidence: "low",
    keyword: input,
    normalizedQuery: "",
    message: errorMessage,
  };
}

export async function judgeByAI(rawInput) {
  const input = String(rawInput ?? "").trim();

  if (!input) {
    return {
      success: true,
      useAi: false,
      category: "nonsense",
      confidence: "high",
      keyword: "",
      normalizedQuery: "",
      message: "入力内容がありません。",
    };
  }

  if (!process.env.OPENAI_API_KEY) {
    return createFallbackResult(
      input,
      "OPENAI_API_KEYが設定されていません。"
    );
  }

  try {
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      store: false,
      reasoning: {
        effort: "low",
      },
      instructions: `
あなたは日本の自動車販売店「カーとぴあ」の自由入力受付担当です。

ユーザーの入力を、必ず次のどれか1つに分類してください。

- vehicle-search
  車種名、車の種類、用途、希望条件、近い車種を探す依頼
- reservation
  車検、整備、修理、点検、オイル交換、鈑金などの予約や相談
- sell
  買取、査定、売却、手放す相談
- purchase
  車の購入、注文車、乗り換えの相談
- faq
  営業時間、住所、電話番号、定休日など店舗情報の質問
- casual
  挨拶、雑談、車と無関係だが意味のある文章
- nonsense
  意味不明な文字列、悪ふざけ、判読不能な入力

判定ルール：
- 「スーパーカー」「雪に強い車」「子育て向け」などは vehicle-search
- 実在する車種名は vehicle-search
- 下品な単語や悪ふざけだけなら nonsense
- 無理に車両検索へ分類しない
- normalizedQuery は検索に使える場合だけ簡潔に整える
- nonsense、casual、reservation、sell、purchase、faq の場合は normalizedQuery を空文字にする
`,
      input,
      text: {
        format: {
          type: "json_schema",
          name: "direct_input_judgement",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              category: {
                type: "string",
                enum: ALLOWED_CATEGORIES,
              },
              confidence: {
                type: "string",
                enum: ["high", "medium", "low"],
              },
              normalizedQuery: {
                type: "string",
              },
            },
            required: [
              "category",
              "confidence",
              "normalizedQuery",
            ],
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text);

    return {
      success: true,
      useAi: true,
      category: parsed.category,
      confidence: parsed.confidence,
      keyword: input,
      normalizedQuery: parsed.normalizedQuery,
      message: "AI判定が完了しました。",
    };
  } catch (error) {
    console.error("direct-input aiJudge error:", error);

    return createFallbackResult(
      input,
      "AI判定中にエラーが発生しました。"
    );
  }
}
