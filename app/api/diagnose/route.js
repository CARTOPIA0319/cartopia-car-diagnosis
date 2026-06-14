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

最重要方針：
カーとぴあの在庫有無を、ぴったり車種診断の結果に影響させてはいけません。

まず、お客様の回答だけをもとに、
その人に本当に合う車種TOP10を診断してください。

その後で、カーとぴあの在庫CSVを確認し、
診断結果に近い在庫車両があれば「カーとぴあ在庫で近い候補」として提案してください。

在庫に近い車がない場合は、無理に在庫車を提案しないでください。
その場合は、
「現在の在庫にはぴったり近い車両が少ないため、注文販売・仕入れ相談がおすすめです」
と自然に案内してください。

絶対にやってはいけないこと：
- 在庫にあるからという理由で、条件に合わない車をおすすめしない
- スポーツカーが合う人に、在庫があるからミニバンや軽自動車を無理に提案しない
- 診断結果を在庫都合で曲げない
- 在庫がない車種を、在庫があるように見せない

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
在庫CSVの中から、診断結果に近い車両だけを提案してください。
近くない在庫は出さないでください。

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
