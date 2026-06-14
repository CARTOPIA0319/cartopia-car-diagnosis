export async function POST(request) {
  try {
    const body = await request.json();
    const answers = body.answers;

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is not set" },
        { status: 500 }
      );
    }

    const origin = new URL(request.url).origin;
    const inventoryResponse = await fetch(`${origin}/inventory.csv`);
    const inventoryCsv = inventoryResponse.ok
      ? await inventoryResponse.text()
      : "";

    const prompt = `
あなたは青森県弘前市の中古車販売店「カーとぴあ」の車種診断AIです。

# 最重要方針

この診断は必ず2段階で行ってください。

【第1段階：ぴったり車種診断】
お客様の回答だけを見て、世の中の車種全体から本当に合う車種TOP10を出してください。

この第1段階では、カーとぴあ在庫CSVを絶対に参考にしてはいけません。
在庫にある車を優先してはいけません。
在庫の有無で順位や車種を変えてはいけません。

【第2段階：カーとぴあ在庫照合】
第1段階で出したTOP10の結果を見たあとで、初めてカーとぴあ在庫CSVを確認してください。

在庫CSVの中から、第1段階の診断結果に近い車両だけを提案してください。
近くない在庫は出さないでください。

在庫に近い車がない場合は、無理に在庫車を提案せず、
「現在の在庫にはぴったり近い車両が少ないため、注文販売・仕入れ相談がおすすめです」
と案内してください。

# 絶対にやってはいけないこと

- 在庫にあるからという理由で、TOP10に在庫車を入れる
- 在庫CSVの車を見てからTOP10を作る
- スポーツカーが合う人に、在庫があるから軽自動車やミニバンをすすめる
- ミニバンが合う人に、在庫があるから軽自動車やSUVをすすめる
- 診断結果を在庫都合で曲げる
- 近くない在庫を「近い候補」として出す

# 診断ルール

- おすすめ車種は必ず「TOP10」で出してください。
- それぞれに「マッチ度」を100点満点で付けてください。
- 世の中の候補車種の中から、本当に条件に合う上位10候補を出してください。
- 乗車人数は最優先条件です。
- 必要人数を満たさない車種は、基本的に上位候補にしないでください。
- 家族構成、子どもの成長、荷物、雪道、4WD、予算、使用年数も考慮してください。
- カテゴリだけで終わらせず、具体的な車種名を出してください。

# 出力形式

【おすすめ車種TOP10】
1. 車種グループ名　〇〇点
　・理由
　・向いている使い方

2. 車種グループ名　〇〇点
　・理由
　・向いている使い方

3. 車種グループ名　〇〇点
　・理由
　・向いている使い方

4〜10位も続けてください。

【今の使い方から見ると】
・現在の条件を整理してください。

【3〜5年後を考えると】
・子どもの成長、荷物、送迎、部活、自転車などを考えてください。

【カーとぴあ在庫で近い候補】
ここで初めて在庫CSVを確認してください。
第1段階のTOP10に近い在庫車だけを出してください。

出す場合は以下の形式：
・ブランド 車種 グレード
　支払総額：
　年式：
　走行：
　理由：

近い在庫がない場合は、無理に出さず、
「現在の在庫にはぴったり近い車両が少ないため、注文販売・仕入れ相談がおすすめです」
と書いてください。

【カーとぴあに相談するなら】
お客様がそのままスタッフに伝えられる文章を作ってください。

# お客様の回答
${JSON.stringify(answers, null, 2)}

# 注意
下の在庫CSVは、【カーとぴあ在庫で近い候補】を書く時だけ使ってください。
【おすすめ車種TOP10】を作る時には絶対に使わないでください。

# カーとぴあ在庫CSV
${inventoryCsv}
`;

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4.1-mini",
        input: prompt,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json(
        { error: data.error?.message || "OpenAI API error" },
        { status: 500 }
      );
    }

    const text =
      data.output_text ||
      data.output?.[0]?.content?.[0]?.text ||
      "診断結果を取得できませんでした。";

    return Response.json({ result: text });
  } catch (error) {
    return Response.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}
