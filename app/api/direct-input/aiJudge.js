// app/api/direct-input/aiJudge.js

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL =
  process.env.OPENAI_MODEL ??
  "gpt-5-mini";

const TYPES = [
  "maker",
  "brand",
  "model",
  "category",
  "purpose",
  "unknown",
];

const CONFIDENCE = [
  "high",
  "medium",
  "low",
];

function emptyResult() {
  return {
    success: true,
    matched: false,
    type: "unknown",
    confidence: "high",
    id: null,
    makerId: null,
    brandId: null,
    keyword: "",
    normalized: "",
  };
}

function errorResult(message) {
  return {
    success: false,
    matched: false,
    type: "unknown",
    confidence: "low",
    id: null,
    makerId: null,
    brandId: null,
    keyword: "",
    normalized: "",
    error: message,
  };
}

function prompt() {
  return `
あなたはカーとぴあ公式LINEの自由入力AIです。

辞書で判定できなかった入力のみ判定してください。

回答はJSONのみ。

typeは

maker
brand
model
category
purpose
unknown

のみ。

matchedは

一致できた=true
一致できない=false

confidenceは

high
medium
low

のみ。

normalizedには正式名称を返してください。

例

アル
→アルファード

ヴォクシ
→ヴォクシー

NBOX
→N-BOX

ランクル
→ランドクルーザー

スポーツカー
→スポーツカー

雪道
→雪道

子育て
→子育て

推測できない場合

matched=false
type=unknown

を返してください。
`;
}

export async function judgeByAI(rawInput) {
  const input = String(
    rawInput ?? "",
  ).trim();

  if (!input) {
    return emptyResult();
  }

  if (!process.env.OPENAI_API_KEY) {
    return errorResult(
      "OPENAI_API_KEY is missing",
    );
  }

  try {
    const response =
      await openai.responses.create({
        model: MODEL,

        store: false,

        reasoning: {
          effort: "low",
        },

        instructions: prompt(),

        input,

        text: {
          format: {
            type: "json_schema",

            name: "vehicle_ai",

            strict: true,

            schema: {
              type: "object",

              additionalProperties: false,

              properties: {
                matched: {
                  type: "boolean",
                },

                type: {
                  type: "string",
                  enum: TYPES,
                },

                confidence: {
                  type: "string",
                  enum: CONFIDENCE,
                },

                id: {
                  type: "string",
                },

                makerId: {
                  type: "string",
                },

                brandId: {
                  type: "string",
                },

                keyword: {
                  type: "string",
                },

                normalized: {
                  type: "string",
                },
              },

              required: [
                "matched",
                "type",
                "confidence",
                "id",
                "makerId",
                "brandId",
                "keyword",
                "normalized",
              ],
            },
          },
        },
      });

    const result = JSON.parse(
      response.output_text,
    );

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    console.error(
      "[aiJudge]",
      error,
    );

    return errorResult(
      error.message,
    );
  }
}

export default judgeByAI;
