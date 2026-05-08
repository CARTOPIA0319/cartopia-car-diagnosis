"use client";

import { useState } from "react";

const QUESTIONS = [
{
key: "carClass",
title: "まず、軽自動車と普通車どちらを考えていますか？",
note: "最初にここを分けると、かなり診断精度が上がります。",
type: "buttons",
options: ["軽自動車がいい", "普通車がいい", "まだ迷っている"],
},
{
key: "usage",
title: "主な使い方はどれに近いですか？",
note: "普段の使い方で、車のサイズ感や向き不向きが変わります。",
type: "buttons",
options: ["通勤・買い物", "家族で使う", "仕事でも使う", "遠出・レジャー"],
},
{
key: "people",
title: "普段は何人で乗ることが多いですか？",
note: "5人乗りで十分か、6〜7人乗りが必要かを分けます。",
type: "buttons",
options: ["1〜2人", "3〜4人", "5人", "たまに6〜7人", "6〜7人をよく使う"],
},
{
key: "cargo",
title: "よく積みたいものはありますか？",
note: "例：りんご箱、工具、仕事道具、キャンプ道具、ベビーカーなど。ここがかなり重要です。",
type: "text",
placeholder: "例：キャンプ道具を積みたい、りんご箱を積みたい、工具を積みたい",
},
{
key: "priority",
title: "一番重視したいことは何ですか？",
note: "維持費・見た目・荷物・雪道など、優先順位で候補が変わります。",
type: "buttons",
options: ["維持費の安さ", "運転のしやすさ", "荷物の積みやすさ", "見た目・高級感", "雪道の安心感"],
},
{
key: "budget",
title: "ご予算感はどれに近いですか？",
note: "理想候補と現実候補を分けるために使います。",
type: "buttons",
options: ["できるだけ抑えたい", "総額100万円前後", "総額150万円前後", "総額200万円以上", "予算は高めでも検討"],
},
{
key: "snow",
title: "雪道・4WDはどのくらい必要ですか？",
note: "青森・弘前周辺ではかなり大事な判断軸です。",
type: "buttons",
options: ["4WDは必須", "できれば4WD", "2WDでもよい"],
},
];

export default function Home() {
const [step, setStep] = useState(0);
const [answers, setAnswers] = useState({});
const [textValue, setTextValue] = useState("");
const [result, setResult] = useState(null);

const current = QUESTIONS[step];

function includesAny(text, words) {
return words.some((word) => text.includes(word));
}

function saveAnswer(value) {
const nextAnswers = {
...answers,
[current.key]: value,
};

setAnswers(nextAnswers);
setTextValue("");

if (step + 1 >= QUESTIONS.length) {
setResult(makeDiagnosis(nextAnswers));
} else {
setStep(step + 1);
}
}

function goBack() {
if (result) {
setResult(null);
setStep(QUESTIONS.length - 1);
return;
}

if (step > 0) {
const prevStep = step - 1;
setStep(prevStep);
setTextValue(answers[QUESTIONS[prevStep].key] || "");
}
}

function restart() {
setStep(0);
setAnswers({});
setTextValue("");
setResult(null);
}

function makeDiagnosis(a) {
const memo = (a.cargo || "").trim();

const hasAppleBox = includesAny(memo, [
"りんご",
"リンゴ",
"林檎",
"りんご箱",
"箱",
"コンテナ",
"農家",
"畑",
"収穫",
]);

const hasWorkTools = includesAny(memo, [
"工具",
"脚立",
"仕事道具",
"資材",
"配達",
"現場",
"仕事",
"荷台",
]);

const hasCamp = includesAny(memo, [
"キャンプ",
"キャンプ道具",
"アウトドア",
"釣り",
"スキー",
"スノボ",
"レジャー",
"テント",
"クーラーボックス",
]);

const hasBaby = includesAny(memo, [
"ベビーカー",
"チャイルドシート",
"子供",
"子ども",
"保育園",
"送迎",
]);

const wantsKei = a.carClass === "軽自動車がいい";
const wantsNormal = a.carClass === "普通車がいい";
const isUnsure = a.carClass === "まだ迷っている";
const wantsLuxury = a.priority === "見た目・高級感";
const wantsSnow = a.snow === "4WDは必須" || a.snow === "できれば4WD";
const highBudget = a.budget === "総額200万円以上" || a.budget === "予算は高めでも検討";
const manyPeople = a.people === "たまに6〜7人" || a.people === "6〜7人をよく使う";
const fivePeople = a.people === "5人";
const leisure = a.usage === "遠出・レジャー";
const family = a.usage === "家族で使う";
const work = a.usage === "仕事でも使う";

let title = "";
let cars = [];
let reason = "";
let attention = "";
let tell = "";

if (wantsKei) {
if (hasWorkTools || hasAppleBox || work) {
title = "軽の実用・積載系がおすすめです。";
cars = ["エブリイ", "N-VAN", "ハイゼットカーゴ", "スペーシアベース"];
reason =
"軽自動車希望で、仕事道具・工具・りんご箱などを積みたい場合は、乗用軽よりも荷室の形が大事です。";
attention =
"乗り心地や見た目より積載優先なら箱バン系、普段使いも重視するならスペーシアベースや軽ハイト系も候補になります。";
tell =
"何を何個くらい積むか、後席を使うかどうかまで伝えると、かなり具体的に絞れます。";
} else if (hasCamp || leisure || wantsSnow || wantsLuxury) {
title = "軽SUV・軽ハイト系がおすすめです。";
cars = ["ハスラー", "タフト", "デリカミニ", "スペーシアギア", "N-BOX"];
reason =
"軽自動車でも、レジャー感・雪道・見た目を重視するなら、ハスラーやタフト、デリカミニのような雰囲気のある車種が合いやすいです。";
attention =
"本格的な悪路や大きなキャンプ道具まで考えるなら、軽だけでなく普通車SUVも比較した方が安心です。";
tell =
"軽にこだわるのか、普通車SUVも見てもいいのかを伝えると提案しやすいです。";
} else {
title = "軽ハイトワゴン系がおすすめです。";
cars = ["N-BOX", "スペーシア", "タント", "ムーヴキャンバス"];
reason =
"維持費を抑えながら、通勤・買い物・送迎まで使いやすいのは軽ハイトワゴン系です。室内も広く、日常使いに強いです。";
attention =
"高速道路や長距離移動が多い場合は、軽だけに絞ると物足りない場合があります。";
tell =
"街乗り中心か、遠出も多いかを伝えると、軽で十分か普通車も見るべきか判断しやすいです。";
}

return { title, cars, reason, attention, tell };
}

if (wantsNormal || isUnsure) {
if (wantsLuxury && highBudget && wantsSnow && (leisure || hasCamp)) {
title = "高級SUV・大型SUV系がおすすめです。";
cars = ["レクサスLX", "ランドクルーザー", "ランドクルーザープラド", "ハリアー", "CX-8", "アウトランダーPHEV"];
reason =
"遠出・レジャー、4WD、高級感、予算高めが揃う場合は、プロボックスやエブリイではなく大型SUV・上質SUV側に寄せるべきです。";
attention =
"レクサスLXやランドクルーザーは理想候補としては強いですが、中古相場は高めです。現実候補としてはプラド、ハリアー、CX-8、アウトランダーPHEVも検討しやすいです。";
tell =
"理想はLX・ランクル系なのか、現実的に200万円台から探したいのかを伝えると提案精度が上がります。";
} else if (hasAppleBox || hasWorkTools) {
title = "荷物重視の実用車がおすすめです。";
cars = ["プロボックス", "シエンタ 5人乗り", "フリード＋", "エブリイ", "N-VAN"];
reason =
"りんご箱・コンテナ・工具・仕事道具などを積む場合は、荷室の形と開口部の広さが重要です。";
attention =
"乗用車としての快適さも欲しいならシエンタ5人乗りやフリード＋、積載重視ならプロボックスや箱バン系が強いです。";
tell =
"りんご箱を何個積みたいか、後席を使うか、仕事用か家族兼用かを伝えるとかなり具体的に絞れます。";
} else if (manyPeople) {
if (a.people === "6〜7人をよく使う") {
title = "しっかり使えるミニバン系がおすすめです。";
cars = ["ノア", "ヴォクシー", "セレナ", "ステップワゴン", "デリカD:5"];
reason =
"6〜7人をよく使うなら、シエンタやフリードよりもノア・ヴォクシー・セレナ級の方が後悔しにくいです。";
attention =
"車体は大きくなり、維持費も上がります。雪道やアウトドアも重視するならデリカD:5も候補になります。";
tell =
"3列目を毎週使うのか、たまに使うだけなのかを伝えると候補が大きく変わります。";
} else {
title = "小さめミニバン系がおすすめです。";
cars = ["シエンタ", "フリード", "ソリオ", "ルーミー"];
reason =
"たまに6〜7人乗りたいけど大きすぎる車は避けたい場合は、シエンタ・フリードが有力です。";
attention =
"シエンタ・フリードの3列目は常用向きではありません。大人が長時間乗るならノア・ヴォクシー級も検討した方が安心です。";
tell =
"5人乗り中心なのか、たまに6〜7人なのかを必ず伝えてください。ここはかなり重要です。";
}
} else if (fivePeople) {
if (wantsLuxury || leisure || hasCamp) {
title = "5人乗りSUV・上質クロスオーバー系がおすすめです。";
cars = ["ハリアー", "カローラクロス", "ヤリスクロス", "CX-5", "エクストレイル"];
reason =
"5人乗りで十分で、見た目・レジャー・4WDも重視するなら、ミニバンよりSUV系が合いやすいです。";
attention =
"荷室の広さは車種差があります。キャンプ道具が多い場合は、見た目だけでなく実際の積載量も確認した方が安心です。";
tell =
"5人で乗る頻度、キャンプ道具の量、4WD必須かどうかを伝えると候補を絞れます。";
} else {
title = "5人乗り実用車がおすすめです。";
cars = ["シエンタ 5人乗り", "フリード＋", "ソリオ", "ルーミー"];
reason =
"5人乗りで十分なら、無理に3列シートにするより荷室や普段の使いやすさを重視した方が満足度が高いです。";
attention =
"同じシエンタ・フリードでも、5人乗りと3列仕様では荷室の使い勝手が変わります。";
tell =
"5人乗りで十分なのか、たまに6〜7人乗る可能性があるのかを伝えてください。";
}
} else if (family || hasBaby) {
title = "家族向けスライドドア車がおすすめです。";
cars = ["シエンタ", "フリード", "ソリオ", "ルーミー", "N-BOX"];
reason =
"家族利用では、スライドドア・乗り降りのしやすさ・荷物の積みやすさが大事です。";
attention =
"チャイルドシートやベビーカーを使う場合は、スライドドアの便利さがかなり効きます。";
tell =
"子どもの人数、チャイルドシートの有無、ベビーカーを積むかを伝えると絞りやすいです。";
} else if (leisure || hasCamp || wantsSnow) {
title = "コンパクトSUV・4WD系がおすすめです。";
cars = wantsSnow
? ["ヤリスクロス 4WD", "ライズ 4WD", "カローラクロス 4WD", "エクストレイル", "CX-5"]
: ["ヤリスクロス", "ライズ", "カローラクロス", "CX-5"];
reason =
"遠出・レジャー・雪道を考えるなら、コンパクトSUVや4WD設定のある車種が候補になります。";
attention =
"SUVは人気が高く、同じ予算だと年式や走行距離の条件が少し落ちる場合があります。";
tell =
"雪道をどのくらい走るか、キャンプ道具をどの程度積むかを伝えると候補が絞れます。";
} else if (wantsLuxury) {
title = "見た目と質感を重視した車種がおすすめです。";
cars = ["ハリアー", "カローラクロス", "ヤリスクロス", "MAZDA3", "インプレッサ"];
reason =
"見た目や質感を重視するなら、コンパクトSUVや上質系ハッチバックが候補になります。";
attention =
"見た目重視に寄せると、維持費や積載性では少し妥協が必要になる場合があります。";
tell =
"見た目優先か、維持費優先か、雪道優先かを伝えると提案しやすいです。";
} else {
title = "扱いやすいコンパクトカーがおすすめです。";
cars = ["フィット", "ヤリス", "ノート", "アクア", "ソリオ"];
reason =
"日常使い・燃費・運転のしやすさのバランスを考えると、コンパクトカーが無難で失敗しにくいです。";
attention =
"荷物が多い、スライドドアが欲しい、雪道が不安という場合は、ソリオ・ルーミー・SUV系も比較した方が良いです。";
tell =
"普段の使い方と、軽でもいいのか普通車がいいのかを伝えると絞りやすいです。";
}
}

return { title, cars, reason, attention, tell };
}

return (
<main style={styles.page}>
<section style={styles.card}>
<div style={styles.brand}>CARTOPIA</div>

<h1 style={styles.title}>ぴったり車種診断</h1>

{!result ? (
<>
<div style={styles.progress}>
{step + 1} / {QUESTIONS.length}
</div>

<h2 style={styles.questionTitle}>{current.title}</h2>
<p style={styles.note}>{current.note}</p>

{current.type === "buttons" && (
<div style={styles.options}>
{current.options.map((option) => (
<button key={option} style={styles.optionButton} onClick={() => saveAnswer(option)}>
{option}
</button>
))}
</div>
)}

{current.type === "text" && (
<div style={styles.form}>
<textarea
style={styles.textarea}
value={textValue}
onChange={(e) => setTextValue(e.target.value)}
placeholder={current.placeholder}
/>

<button style={styles.button} onClick={() => saveAnswer(textValue || "特になし")}>
次へ
</button>
</div>
)}

<div style={styles.nav}>
{step > 0 && (
<button style={styles.backButton} onClick={goBack}>
戻る
</button>
)}
</div>
</>
) : (
<>
<p style={styles.resultLabel}>診断結果</p>
<h2 style={styles.resultTitle}>{result.title}</h2>

<div style={styles.cars}>
{result.cars.map((car) => (
<span key={car} style={styles.carTag}>
{car}
</span>
))}
</div>

<p style={styles.sectionTitle}>理由</p>
<p style={styles.resultText}>{result.reason}</p>

<p style={styles.sectionTitle}>注意点</p>
<p style={styles.resultText}>{result.attention}</p>

<p style={styles.sectionTitle}>カーとぴあに相談するなら</p>
<p style={styles.resultText}>{result.tell}</p>

<div style={styles.resultButtons}>
<button style={styles.button} onClick={restart}>
もう一度診断する
</button>
<button style={styles.backButton} onClick={goBack}>
前の質問に戻る
</button>
</div>
</>
)}

<p style={styles.small}>
※これは簡易診断です。実際の在庫状況やご希望条件に合わせて、スタッフがより詳しくご提案します。
</p>
</section>
</main>
);
}

const styles = {
page: {
minHeight: "100vh",
background: "#07111f",
color: "#ffffff",
padding: "32px 18px",
fontFamily:
'-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif',
},
card: {
maxWidth: "540px",
margin: "0 auto",
border: "1px solid rgba(255,255,255,0.16)",
borderRadius: "22px",
padding: "28px 22px",
background: "rgba(255,255,255,0.03)",
boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
},
brand: {
color: "#d6b55b",
fontSize: "14px",
letterSpacing: "0.18em",
fontWeight: "800",
marginBottom: "18px",
},
title: {
fontSize: "34px",
lineHeight: "1.25",
margin: "0 0 22px",
fontWeight: "900",
},
progress: {
color: "#d6b55b",
fontSize: "14px",
fontWeight: "800",
marginBottom: "14px",
},
questionTitle: {
fontSize: "24px",
lineHeight: "1.45",
margin: "0 0 12px",
fontWeight: "900",
},
note: {
fontSize: "15px",
lineHeight: "1.8",
color: "rgba(255,255,255,0.75)",
margin: "0 0 22px",
},
options: {
display: "grid",
gap: "12px",
},
optionButton: {
width: "100%",
border: "1px solid rgba(255,255,255,0.18)",
borderRadius: "14px",
padding: "16px",
background: "#ffffff",
color: "#111827",
fontSize: "17px",
fontWeight: "800",
textAlign: "left",
},
form: {
display: "grid",
gap: "14px",
},
textarea: {
width: "100%",
minHeight: "120px",
borderRadius: "14px",
border: "1px solid rgba(255,255,255,0.18)",
background: "#ffffff",
color: "#111827",
padding: "14px",
fontSize: "16px",
lineHeight: "1.7",
},
button: {
border: "none",
borderRadius: "14px",
padding: "16px",
background: "#d6b55b",
color: "#07111f",
fontSize: "17px",
fontWeight: "900",
},
nav: {
marginTop: "18px",
},
backButton: {
border: "1px solid rgba(255,255,255,0.24)",
borderRadius: "14px",
padding: "14px",
background: "transparent",
color: "#ffffff",
fontSize: "15px",
fontWeight: "800",
},
resultLabel: {
color: "#d6b55b",
fontSize: "15px",
fontWeight: "900",
margin: "0 0 10px",
},
resultTitle: {
fontSize: "24px",
lineHeight: "1.5",
margin: "0 0 18px",
fontWeight: "900",
},
cars: {
display: "flex",
flexWrap: "wrap",
gap: "10px",
marginBottom: "20px",
},
carTag: {
display: "inline-block",
border: "1px solid rgba(214,181,91,0.6)",
borderRadius: "999px",
padding: "9px 13px",
color: "#f6e7a6",
fontSize: "14px",
fontWeight: "900",
background: "rgba(0,0,0,0.2)",
},
sectionTitle: {
color: "#d6b55b",
fontSize: "15px",
fontWeight: "900",
margin: "18px 0 7px",
},
resultText: {
fontSize: "15px",
lineHeight: "1.85",
margin: 0,
color: "rgba(255,255,255,0.88)",
},
resultButtons: {
display: "grid",
gap: "12px",
marginTop: "24px",
},
small: {
marginTop: "24px",
fontSize: "12px",
lineHeight: "1.7",
color: "rgba(255,255,255,0.55)",
},
};
