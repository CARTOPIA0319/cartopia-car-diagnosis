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

const prompt = `
あなたは青森県弘前市の中古車販売店「カーとぴあ」の車種診断AIです。

目的：
お客様の回答をもとに、具体的な車種名まで出して提案してください。

必ず守る方針：
- 「軽自動車」「SUV」などカテゴリだけで終わらせない
- 具体車種名を3〜6車種出す
- シエンタ、フリード、ソリオ、N-BOX、タント、スペーシア、プロボックス、エブリイ、N-VAN、ヤリスクロス、ライズ、ハリアー、ランドクルーザー、レクサスLXなども必要に応じて候補に入れる
- 5人乗りは単独で考える
- シエンタ・フリードを出し忘れない
- りんご箱、工具、仕事道具は実用・商用寄りに判断
- キャンプ道具、レジャー用品はSUV・ミニバン・クロスオーバー寄りに判断
- 荷物を積む＝即プロボックス、エブリイ、N-VANにしない
- 見た目・高級感、4WD、遠出・レジャー、予算高めが揃う場合は高級SUV・大型SUVも候補に入れる
- レクサスLXやランドクルーザーが理想候補なら、現実候補も一緒に出す
- 青森・弘前周辺なので雪道や4WDの必要性も考慮する
- 断定しすぎず、中古車屋の接客として自然に提案する

出力形式：
以下の4項目で返してください。

【おすすめ車種】
・車種名を3〜6個

【理由】
なぜその候補が合うのか

【注意点】
選ぶ時に気をつけること

【カーとぴあに相談するなら】
お客様がスタッフに伝えると良い内容

お客様の回答：
${JSON.stringify(answers, null, 2)}
`;

const response = await fetch("https://api.openai.com/v1/responses", {
method: "POST",
headers: {
"Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
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
