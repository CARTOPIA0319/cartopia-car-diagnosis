// app/api/direct-input/aiJudge.js
// ===== Part 1 / 2 =====

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const MODEL =
  process.env.OPENAI_MODEL ??
  "gpt-5-mini";

const ALLOWED_TYPES = [
  "maker",
  "brand",
  "model",
  "category",
  "purpose",
  "unknown",
];

const ALLOWED_CONFIDENCE = [
  "high",
  "medium",
  "low",
];

function createErrorResult(
  input,
  message,
) {
  return {
    success: false,
    matched: false,

    input,

    confidence: "low",

    type: "unknown",

    id: null,
    makerId: null,
    brandId: null,

    keyword: "",
    normalized: "",

    reason: message,
  };
}

function createEmptyResult() {
  return {
    success: true,
    matched: false,

    input: "",

    confidence: "high",

    type: "unknown",

    id: null,
    makerId: null,
    brandId: null,

    keyword: "",
    normalized: "",

    reason: "empty input",
  };
}

function buildInstructions() {
  return `
あなたは中古車販売店「カーとぴあ」の入力補完AIです。

役割は辞書で判定できなかった入力だけを推測することです。

絶対ルール

・存在しないメーカーを作らない
・存在しないブランドを作らない
・存在しない車種を作らない
・推測できなければ unknown
・JSON以外は返さない
・説明文を書かない

type は

maker
brand
model
category
purpose
unknown

のみ。

confidence は

high
medium
low

のみ。

normalized は

検索しやすい形へ補正してください。

例

ランクル
→ランドクルーザー

ヴォクシ
→ヴォクシー

ハリヤー
→ハリアー

NBOX
→N-BOX

スペシア
→スペーシア

など。

category は

SUV
軽自動車
ミニバン
セダン
スポーツカー
コンパクトカー
など。

purpose は

子育て
アウトドア
雪道
燃費重視
仕事
など。

推測不能なら

type=unknown

matched=false

としてください。
`;
}

function buildSchema() {
  return {
    type: "object",

    additionalProperties: false,

    properties: {
      matched: {
        type: "boolean",
      },

      type: {
        type: "string",

        enum: ALLOWED_TYPES,
      },

      confidence: {
        type: "string",

        enum:
          ALLOWED_CONFIDENCE,
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
  };
}

async function requestAI(
  input,
) {
  return openai.responses.create({
    model: MODEL,

    store: false,

    reasoning: {
      effort: "low",
    },

    instructions:
      buildInstructions(),

    input,

    text: {
      format: {
        type: "json_schema",

        name:
          "vehicle_ai_judge",

        strict: true,

        schema:
          buildSchema(),
      },
    },
  });
}
// ===== Part 2 / 2 =====

export async function judgeByAI(
  rawInput,
) {
  const input = String(
    rawInput ?? "",
  ).trim();

  if (!input) {
    return createEmptyResult();
  }

  if (
    !process.env.OPENAI_API_KEY
  ) {
    return createErrorResult(
      input,
      "OPENAI_API_KEY is not configured.",
    );
  }

  try {
    const response =
      await requestAI(input);

    const parsed = JSON.parse(
      response.output_text,
    );

    return {
      success: true,

      matched:
        parsed.matched,

      input,

      type:
        parsed.type ??
        "unknown",

      confidence:
        parsed.confidence ??
        "low",

      id:
        parsed.id || null,

      makerId:
        parsed.makerId ||
        null,

      brandId:
        parsed.brandId ||
        null,

      keyword:
        parsed.keyword ??
        "",

      normalized:
        parsed.normalized ??
        "",

      reason: "AI matched",
    };
  } catch (error) {
    console.error(
      "[AI Judge]",
      error,
    );

    return createErrorResult(
      input,
      error?.message ??
        "Unknown AI error",
    );
  }
}

export default judgeByAI;
