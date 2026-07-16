const ALLOWED_TYPE_KEYS = [
  "軽自動車 スライドドア",
  "軽自動車 スタンダード",
  "軽自動車 SUV",
  "軽自動車 トラック",
  "軽自動車 スポーティ",
  "普通車 コンパクトカー",
  "普通車 ミニバン",
  "普通車 SUV",
  "普通車 セダン",
  "普通車 ステーションワゴン",
  "普通車 EV・HV",
  "普通車 スポーティ",
  "普通車 バン・トラック",
];

const MAKER_ALIASES = {
  トヨタ: ["トヨタ", "TOYOTA"],
  レクサス: ["レクサス", "LEXUS"],
  日産: ["日産", "ニッサン", "NISSAN"],
  ホンダ: ["ホンダ", "HONDA"],
  マツダ: ["マツダ", "MAZDA"],
  スバル: ["スバル", "SUBARU"],
  三菱: ["三菱", "ミツビシ", "MITSUBISHI"],
  スズキ: ["スズキ", "SUZUKI"],
  ダイハツ: ["ダイハツ", "DAIHATSU"],
  BMW: ["BMW"],
  メルセデスベンツ: [
    "メルセデス",
    "ベンツ",
    "MERCEDES",
    "BENZ",
  ],
  アウディ: ["アウディ", "AUDI"],
  フォルクスワーゲン: [
    "フォルクスワーゲン",
    "VOLKSWAGEN",
    "VW",
  ],
  ボルボ: ["ボルボ", "VOLVO"],
};

function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .toUpperCase()
    .replace(
      /[\s　・･―‐\-_/／,，.。()（）【】\[\]「」『』]/g,
      ""
    );
}

function includesNormalized(source, target) {
  const normalizedSource = normalizeText(source);
  const normalizedTarget = normalizeText(target);

  if (!normalizedSource || !normalizedTarget) {
    return false;
  }

  return (
    normalizedSource.includes(normalizedTarget) ||
    normalizedTarget.includes(normalizedSource)
  );
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function expandMakerTokens(tokens) {
  const expanded = [];

  for (const token of tokens || []) {
    expanded.push(token);

    for (const [maker, aliases] of Object.entries(
      MAKER_ALIASES
    )) {
      const matched =
        includesNormalized(maker, token) ||
        aliases.some((alias) =>
          includesNormalized(alias, token)
        );

      if (matched) {
        expanded.push(maker, ...aliases);
      }
    }
  }

  return unique(expanded);
}

function extractOutputText(data) {
  if (
    typeof data?.output_text === "string" &&
    data.output_text.trim()
  ) {
    return data.output_text.trim();
  }

  const collected = [];

  for (const outputItem of data?.output || []) {
    for (const contentItem of outputItem?.content || []) {
      if (typeof contentItem?.text === "string") {
        collected.push(contentItem.text);
      }
    }
  }

  return collected.join("\n").trim();
}

function parseJsonResponse(text) {
  const cleaned = String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (
      firstBrace >= 0 &&
      lastBrace > firstBrace
    ) {
      return JSON.parse(
        cleaned.slice(firstBrace, lastBrace + 1)
      );
    }

    throw new Error(
      "AIの診断結果をJSONとして読み取れませんでした。"
    );
  }
}

function normalizeRecommendation(item, index) {
  const score = Math.max(
    0,
    Math.min(100, Number(item?.score || 0))
  );

  const typeKey = ALLOWED_TYPE_KEYS.includes(
    item?.typeKey
  )
    ? item.typeKey
    : "";

  const aiMaxSeats = Number(
    item?.maxSeats || 0
  );

  const maxSeats =
    typeKey.startsWith(
      "軽自動車 "
    )
      ? 4
      : Number.isFinite(
          aiMaxSeats
        )
        ? aiMaxSeats
        : 0;

  return {
    rank: index + 1,
    maker: String(item?.maker || "").trim(),
    model: String(item?.model || "").trim(),
    score,
    maxSeats,
    typeKey,
    reason: String(item?.reason || "").trim(),
    futureFit: String(
      item?.futureFit || ""
    ).trim(),
    caution: String(item?.caution || "").trim(),
  };
}

function recommendationViolatesAvoidMaker(
  item,
  avoidedMakerTokens
) {
  const text = [
    item.maker,
    item.model,
  ].join(" ");

  return avoidedMakerTokens.some(
    (token) =>
      includesNormalized(item.maker, token) ||
      includesNormalized(text, token)
  );
}

function recommendationViolatesAvoidModel(
  item,
  avoidedModelTokens
) {
  const text = [
    item.maker,
    item.model,
  ].join(" ");

  return avoidedModelTokens.some((token) =>
    includesNormalized(text, token)
  );
}

function recommendationViolatesTypeRules(
  item,
  diagnosisInput
) {
  const desiredTypes =
    diagnosisInput.desired?.typeKeys || [];

  const avoidedTypes =
    diagnosisInput.avoid?.typeKeys || [];

  const retainedTypes = (
    diagnosisInput.household?.retainedCars || []
  )
    .map((car) => car.bodyType)
    .filter(
      (type) =>
        type &&
        type !== "その他・分からない"
    );

  if (
    desiredTypes.length > 0 &&
    !desiredTypes.includes(
      "特にこだわらない"
    ) &&
    !desiredTypes.includes(item.typeKey)
  ) {
    return true;
  }

  if (avoidedTypes.includes(item.typeKey)) {
    return true;
  }

  if (retainedTypes.includes(item.typeKey)) {
    return true;
  }

  return false;
}

function filterRecommendations(
  rawRecommendations,
  diagnosisInput
) {
  const avoidedMakerTokens =
    expandMakerTokens(
      diagnosisInput.avoid?.manufacturers || []
    );

  const avoidedModelTokens =
    diagnosisInput.avoid?.models || [];

  const requiredSeats = Number(
    diagnosisInput.requiredSeats || 0
  );

  const seen = new Set();
  const filtered = [];

  for (const rawItem of rawRecommendations || []) {
    const item = normalizeRecommendation(
      rawItem,
      filtered.length
    );

    if (
      !item.model ||
      !item.maker ||
      !item.typeKey
    ) {
      continue;
    }

    if (
      recommendationViolatesAvoidMaker(
        item,
        avoidedMakerTokens
      )
    ) {
      continue;
    }

    if (
      recommendationViolatesAvoidModel(
        item,
        avoidedModelTokens
      )
    ) {
      continue;
    }

    if (
      recommendationViolatesTypeRules(
        item,
        diagnosisInput
      )
    ) {
      continue;
    }

    if (
      requiredSeats >= 5 &&
      item.typeKey.startsWith(
        "軽自動車 "
      )
    ) {
      continue;
    }

    if (
      requiredSeats > 0 &&
      item.maxSeats > 0 &&
      item.maxSeats < requiredSeats
    ) {
      continue;
    }

    if (
      requiredSeats > 0 &&
      item.maxSeats <= 0
    ) {
      continue;
    }

    const dedupeKey = normalizeText(
      `${item.maker}${item.model}`
    );

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    filtered.push(item);

    if (filtered.length >= 10) {
      break;
    }
  }

  return filtered.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));
}

function buildPrompt(diagnosisInput) {
  const desiredTypeKeys =
    diagnosisInput.desired?.typeKeys || [];

  const avoidedMakerTokens =
    expandMakerTokens(
      diagnosisInput.avoid?.manufacturers || []
    );

  return `
あなたは青森県弘前市の中古車販売店「カーとぴあ」の車種診断AIです。

この診断の本命は、カーとぴあの在庫ではありません。
お客様の回答だけを使い、世の中に存在する車種全体から本当に合う候補を提案してください。

カーとぴあの在庫情報は一切与えられていません。
在庫にある車を想像したり、在庫都合で診断結果を変えたりしてはいけません。

# 絶対条件

## 1. 必要乗車人数

必要乗車人数は ${diagnosisInput.requiredSeats} 人です。

候補車種について、実在する仕様の最大乗車定員を maxSeats に整数で入れてください。

maxSeats が ${diagnosisInput.requiredSeats} 未満の車種は絶対に出さないでください。

乗車定員に確信が持てない車種も出さないでください。

例えば必要人数が8人の場合、7人乗り仕様しか存在しない車種は候補に入れてはいけません。

軽自動車は最大4人乗りです。必要人数が5人以上の場合、軽自動車は1台も候補に入れてはいけません。

タント、スペーシア、N-BOXなどの軽自動車に maxSeats: 8 を設定することは禁止です。

## 2. 避けたいメーカー

次のメーカーまたは表記揺れに該当する車種は絶対に出さないでください。

${JSON.stringify(
  avoidedMakerTokens,
  null,
  2
)}

例えば「日産」を避けたい場合、エルグランド、セレナ、エクストレイル、ノート、ルークスなど、日産車は全て禁止です。

## 3. 避けたい車種

${JSON.stringify(
  diagnosisInput.avoid?.models || [],
  null,
  2
)}

## 4. 避けたいTYPE

${JSON.stringify(
  diagnosisInput.avoid?.typeKeys || [],
  null,
  2
)}

## 5. 希望TYPE

${JSON.stringify(
  desiredTypeKeys,
  null,
  2
)}

「特にこだわらない」が含まれない場合、候補の typeKey は必ず選択されたTYPEの中から選んでください。

選択されていないTYPEへ勝手に広げてはいけません。

## 6. 世帯に残る車と同じTYPEを避ける

乗り換え後も世帯に残る車は次の通りです。

${JSON.stringify(
  diagnosisInput.household?.retainedCars || [],
  null,
  2
)}

残る車の bodyType と同じ typeKey の車種は出さないでください。

ただし bodyType が「その他・分からない」の場合は、除外条件に使わないでください。

# TYPEの指定方法

候補ごとの typeKey は、必ず次のどれか1つを完全一致で入れてください。

${JSON.stringify(
  ALLOWED_TYPE_KEYS,
  null,
  2
)}

# 優先条件

${JSON.stringify(
  diagnosisInput.desired
    ?.weightedPreferences || [],
  null,
  2
)}

weightが高い条件ほど強く優先してください。

複数条件を単純平均しないでください。

「高級感」と「シンプル」が同時に選ばれた場合、高級感を主軸にし、シンプルは補助条件として扱ってください。

人気、燃費、リセール、市場評価だけで、お客様の価値観を上書きしてはいけません。

# 年齢から先回りして考えること

運転者：

${JSON.stringify(
  diagnosisInput.driverAges || [],
  null,
  2
)}

同乗者：

${JSON.stringify(
  diagnosisInput.passengerAges || [],
  null,
  2
)}

次の点を考慮してください。

- 0〜2歳：チャイルドシート、ベビーカー、荷物、乗り降り
- 小学生：送迎、習い事、外遊び、自転車
- 中高生：部活動、体格、荷物
- 3〜5年後：成長、進学、部活動、同乗人数の増減
- 高齢者：乗降性、座面高、開口部

お客様に「何年乗る予定か」を聞き返してはいけません。

AI側が3〜5年後に起きる可能性を先回りして説明してください。

# 乗り換え情報

${JSON.stringify(
  diagnosisInput.household || {},
  null,
  2
)}

# 避けたい理由・心の声

${JSON.stringify(
  diagnosisInput.avoid || {},
  null,
  2
)}

避けたい理由の奥にある不満を読み取り、同じ不満が再発する車を提案してはいけません。

# その他の希望

${
  diagnosisInput.otherRequest ||
  "特になし"
}

# 出力ルール

- 条件違反をコード側でも除外するため、候補は30台出してください。
- 同じ車種の年式違いや兄弟グレードだけで候補を埋めないでください。
- 車種名は一般のお客様が理解できる名称にしてください。
- マッチ度は100点満点です。
- 理由、将来との相性、注意点は、それぞれ短く読みやすくしてください。
- 「絶対条件の確認」という項目は作らないでください。
- カーとぴあの在庫提案は一切しないでください。
- 在庫に関する文章も出してはいけません。
- JSON以外の文章は出してはいけません。
- コードフェンスを付けてはいけません。

必ず次のJSON形式だけを返してください。

{
  "overview": "診断全体の結論を120文字以内",
  "recommendations": [
    {
      "maker": "メーカー名",
      "model": "車種名",
      "score": 95,
      "maxSeats": 8,
      "typeKey": "普通車 ミニバン",
      "reason": "おすすめ理由を100文字以内",
      "futureFit": "3〜5年後まで考えた相性を100文字以内",
      "caution": "確認したい弱点や注意点を80文字以内"
    }
  ],
  "currentAdvice": "今の使い方から見た提案を220文字以内",
  "futureAdvice": "3〜5年後を考えた提案を220文字以内",
  "consultationText": "このままカーとぴあへ送れる注文販売の相談文"
}

# お客様の回答

${JSON.stringify(
  diagnosisInput,
  null,
  2
)}
`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const diagnosisInput =
      body.diagnosisInput;

    if (
      !diagnosisInput ||
      typeof diagnosisInput !== "object"
    ) {
      return Response.json(
        {
          error:
            "診断回答の形式が正しくありません。",
        },
        {
          status: 400,
        }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error:
            "OPENAI_API_KEY is not set",
        },
        {
          status: 500,
        }
      );
    }

    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization:
            `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type":
            "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4.1-mini",
          input: buildPrompt(
            diagnosisInput
          ),
          max_output_tokens: 12000,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        {
          error:
            data.error?.message ||
            "OpenAI API error",
        },
        {
          status: 500,
        }
      );
    }

    const outputText =
      extractOutputText(data);

    const parsed =
      parseJsonResponse(outputText);

    const recommendations =
      filterRecommendations(
        parsed.recommendations,
        diagnosisInput
      );

    if (recommendations.length === 0) {
      return Response.json(
        {
          error:
            "絶対条件を満たす候補を確定できませんでした。回答を少し変更して、もう一度お試しください。",
        },
        {
          status: 422,
        }
      );
    }

    return Response.json({
      result: {
        overview: String(
          parsed.overview || ""
        ).trim(),

        recommendations,

        currentAdvice: String(
          parsed.currentAdvice || ""
        ).trim(),

        futureAdvice: String(
          parsed.futureAdvice || ""
        ).trim(),

        consultationText: String(
          parsed.consultationText || ""
        ).trim(),
      },

      checks: {
        generatedCandidates:
          Array.isArray(
            parsed.recommendations
          )
            ? parsed.recommendations.length
            : 0,

        displayedCandidates:
          recommendations.length,

        requiredSeats: Number(
          diagnosisInput.requiredSeats || 0
        ),

        avoidedManufacturers:
          diagnosisInput.avoid
            ?.manufacturers || [],
      },
    });
  } catch (error) {
    console.error(
      "DIAGNOSE_API_ERROR:",
      error
    );

    return Response.json(
      {
        error:
          error.message ||
          "Server error",
      },
      {
        status: 500,
      }
    );
  }
}
