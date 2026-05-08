"use client";

import { useState } from "react";

export default function Home() {
const [usage, setUsage] = useState("通勤・買い物が中心");
const [people, setPeople] = useState("1〜2人が多い");
const [seatNeed, setSeatNeed] = useState("5人乗りで十分");
const [cargo, setCargo] = useState("普段の買い物程度");
const [cargoText, setCargoText] = useState("");
const [priority, setPriority] = useState("維持費の安さ");
const [budget, setBudget] = useState("できるだけ抑えたい");
const [snow, setSnow] = useState("4WDはできれば欲しい");
const [result, setResult] = useState(null);

function includesAny(text, words) {
return words.some((word) => text.includes(word));
}

function diagnose() {
const memo = cargoText.trim();
const hasAppleBox = includesAny(memo, ["りんご", "リンゴ", "林檎", "箱", "コンテナ", "農家", "畑"]);
const hasWorkTools = includesAny(memo, ["工具", "脚立", "仕事道具", "資材", "配達", "仕事"]);
const wantsSnow = snow === "4WDは必須" || snow === "4WDはできれば欲しい";

let cars = [];
let title = "";
let reason = "";
let attention = "";
let next = "";

if (seatNeed === "6〜7人をよく使う") {
cars = ["ノア", "ヴォクシー", "セレナ", "ステップワゴン"];
title = "しっかり使えるミニバン系がおすすめです。";
reason =
"6〜7人で使う機会が多いなら、シエンタやフリードよりも、ノア・ヴォクシー・セレナ級の方が後悔しにくいです。";
attention =
"ただし車体は大きくなり、維持費や燃費も上がります。普段1〜2人しか乗らないなら大きすぎる可能性があります。";
next =
"普段の人数と、3列目をどれくらい使うかを教えてもらえるとかなり絞れます。";
} else if (people === "5人以上で使う" || seatNeed === "たまに6〜7人乗りたい") {
cars = ["シエンタ", "フリード", "ソリオ", "ルーミー"];
title = "小さめミニバン・広めコンパクト系がおすすめです。";
reason =
"たまに人数が増える、でも大きすぎる車は避けたい場合は、シエンタ・フリードが有力です。普段使い重視ならソリオやルーミーも候補になります。";
attention =
"シエンタ・フリードの3列目は常用向きではありません。大人が長時間乗るならノア・ヴォクシー級も検討した方が安心です。";
next =
"5人乗り中心なのか、たまに6〜7人なのかで提案が変わります。ここはかなり重要です。";
} else if (seatNeed === "5人乗りで十分") {
cars = ["シエンタ 5人乗り", "フリード＋", "ソリオ", "ルーミー"];
title = "5人乗り前提の実用車がおすすめです。";
reason =
"5人乗りで十分なら、無理に3列シートにするより荷室や普段の使いやすさを重視した方が満足度が高いです。";
attention =
"5人乗りと7人乗りは同じ車名でも使い勝手が変わります。荷物を積むなら5人乗り仕様の方が合う場合があります。";
next =
"乗る人数よりも、荷物をどれくらい積むかを教えてもらえると精度が上がります。";
}

if (hasAppleBox || hasWorkTools || cargo === "荷物をかなり積みたい") {
cars = ["プロボックス", "シエンタ 5人乗り", "フリード＋", "エブリイ", "N-VAN"];
title = "荷物重視の実用車がおすすめです。";
reason =
"りんご箱・コンテナ・仕事道具などを積むなら、見た目だけで選ぶより荷室の形と開口部の広さが重要です。";
attention =
"乗用車としての快適さも欲しいならシエンタやフリード＋、積載重視ならプロボックス・エブリイ・N-VANが強いです。";
next =
"りんご箱を何個くらい積みたいか、後席を使うかどうかまで分かるとかなり具体的に提案できます。";
} else if (people === "1〜2人が多い" && priority === "維持費の安さ") {
cars = ["N-BOX", "スペーシア", "タント", "ムーヴキャンバス"];
title = "軽ハイトワゴン系がおすすめです。";
reason =
"1〜2人利用で維持費を抑えたいなら、軽自動車が現実的です。特にN-BOX・スペーシア・タントは室内も広く日常使いしやすいです。";
attention =
"高速道路や長距離移動が多い場合は、軽だけに絞ると物足りない可能性があります。";
next =
"街乗り中心か、遠出も多いかで軽自動車とコンパクトカーの判断が変わります。";
} else if (usage === "遠出・レジャーが多い" || priority === "雪道の安心感") {
cars = wantsSnow
? ["ヤリスクロス 4WD", "ライズ 4WD", "フィット 4WD", "ソリオ 4WD"]
: ["ヤリスクロス", "ライズ", "フィット", "ソリオ"];
title = "コンパクトSUV・4WD系がおすすめです。";
reason =
"遠出や雪道の安心感を重視するなら、最低地上高や4WD設定のある車種が候補になります。";
attention =
"SUVは人気が高く、同じ予算だと年式や走行距離の条件が少し落ちる場合があります。";
next =
"雪道をどのくらい走るか、4WD必須かどうかで候補を絞れます。";
} else if (usage === "家族で使う") {
cars = ["シエンタ", "フリード", "ソリオ", "ルーミー"];
title = "家族向けの扱いやすい車種がおすすめです。";
reason =
"家族利用では、スライドドア・乗り降りのしやすさ・荷物の積みやすさが大事です。";
attention =
"チャイルドシートやベビーカーを使う場合は、スライドドアの有無がかなり効きます。";
next =
"子どもの人数、チャイルドシートの有無、普段の買い物量を教えてもらえると絞りやすいです。";
} else if (priority === "見た目・高級感") {
cars = ["カローラクロス", "ヤリスクロス", "MAZDA3", "インプレッサ"];
title = "見た目と質感を重視した車種がおすすめです。";
reason =
"使いやすさだけでなく見た目や質感も重視するなら、コンパクトSUVや上質系ハッチバックが候補になります。";
attention =
"見た目重視に寄せると、荷室や維持費の面では少し妥協が必要になる場合があります。";
next =
"見た目優先か、維持費優先かを決めると候補がかなり絞れます。";
} else if (cars.length === 0) {
cars = ["フィット", "ヤリス", "ノート", "アクア"];
title = "扱いやすいコンパクトカーがおすすめです。";
reason =
"日常使い・燃費・運転のしやすさのバランスを考えると、コンパクトカーが無難で失敗しにくいです。";
attention =
"荷物が多い場合やスライドドアが欲しい場合は、ソリオやルーミーも候補になります。";
next =
"普段の使い方と荷物の量をもう少し詳しく教えてもらえると、車種を絞れます。";
}

setResult({
title,
cars,
reason,
attention,
next,
});
}

return (
<main style={styles.page}>
<section style={styles.card}>
<div style={styles.brand}>CARTOPIA</div>

<h1 style={styles.title}>ぴったり車種診断</h1>

<p style={styles.lead}>
用途・人数・荷物・予算感から、あなたに合いそうな車種候補を診断します。
</p>

<div style={styles.notice}>
<p style={styles.noticeTitle}>カーとぴあ式 車種診断</p>
<p style={styles.noticeText}>
軽自動車・コンパクト・SUV・ミニバンだけでなく、シエンタ・フリード・ソリオなど具体的な車種候補まで整理します。
</p>
</div>

<div style={styles.form}>
<label style={styles.label}>
主な使い方
<select style={styles.input} value={usage} onChange={(e) => setUsage(e.target.value)}>
<option>通勤・買い物が中心</option>
<option>家族で使う</option>
<option>仕事でも使う</option>
<option>遠出・レジャーが多い</option>
</select>
</label>

<label style={styles.label}>
乗る人数
<select style={styles.input} value={people} onChange={(e) => setPeople(e.target.value)}>
<option>1〜2人が多い</option>
<option>3〜4人が多い</option>
<option>5人以上で使う</option>
</select>
</label>

<label style={styles.label}>
何人乗りが必要ですか？
<select style={styles.input} value={seatNeed} onChange={(e) => setSeatNeed(e.target.value)}>
<option>5人乗りで十分</option>
<option>たまに6〜7人乗りたい</option>
<option>6〜7人をよく使う</option>
</select>
</label>

<label style={styles.label}>
荷物の量
<select style={styles.input} value={cargo} onChange={(e) => setCargo(e.target.value)}>
<option>普段の買い物程度</option>
<option>ベビーカーや大きめの荷物を積む</option>
<option>仕事道具を積む</option>
<option>荷物をかなり積みたい</option>
</select>
</label>

<label style={styles.label}>
よく積みたいもの
<textarea
style={styles.textarea}
value={cargoText}
onChange={(e) => setCargoText(e.target.value)}
placeholder="例：りんご箱を積みたい、工具を積みたい、ベビーカーを積みたい"
/>
</label>

<label style={styles.label}>
重視したいこと
<select style={styles.input} value={priority} onChange={(e) => setPriority(e.target.value)}>
<option>維持費の安さ</option>
<option>運転のしやすさ</option>
<option>荷物の積みやすさ</option>
<option>見た目・高級感</option>
<option>雪道の安心感</option>
</select>
</label>

<label style={styles.label}>
ご予算感
<select style={styles.input} value={budget} onChange={(e) => setBudget(e.target.value)}>
<option>できるだけ抑えたい</option>
<option>総額100万円前後</option>
<option>総額150万円前後</option>
<option>総額200万円以上も検討</option>
</select>
</label>

<label style={styles.label}>
雪道・4WD
<select style={styles.input} value={snow} onChange={(e) => setSnow(e.target.value)}>
<option>4WDは必須</option>
<option>4WDはできれば欲しい</option>
<option>2WDでもよい</option>
</select>
</label>

<button type="button" style={styles.button} onClick={diagnose}>
診断する
</button>
</div>

{result && (
<div style={styles.result}>
<p style={styles.resultTitle}>診断結果</p>
<p style={styles.resultHeadline}>{result.title}</p>

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
<p style={styles.resultText}>{result.next}</p>
</div>
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
maxWidth: "520px",
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
fontWeight: "700",
marginBottom: "18px",
},
title: {
fontSize: "34px",
lineHeight: "1.25",
margin: "0 0 18px",
fontWeight: "800",
},
lead: {
fontSize: "16px",
lineHeight: "1.8",
color: "rgba(255,255,255,0.82)",
margin: "0 0 22px",
},
notice: {
border: "1px solid rgba(255,255,255,0.16)",
borderRadius: "16px",
padding: "18px",
marginBottom: "24px",
background: "rgba(0,0,0,0.18)",
},
noticeTitle: {
fontSize: "16px",
fontWeight: "800",
margin: "0 0 8px",
},
noticeText: {
fontSize: "14px",
lineHeight: "1.7",
color: "rgba(255,255,255,0.75)",
margin: 0,
},
form: {
display: "grid",
gap: "16px",
},
label: {
display: "grid",
gap: "8px",
fontSize: "14px",
fontWeight: "800",
color: "rgba(255,255,255,0.9)",
},
input: {
width: "100%",
borderRadius: "12px",
border: "1px solid rgba(255,255,255,0.18)",
background: "#ffffff",
color: "#111827",
padding: "14px 12px",
fontSize: "16px",
},
textarea: {
width: "100%",
minHeight: "92px",
borderRadius: "12px",
border: "1px solid rgba(255,255,255,0.18)",
background: "#ffffff",
color: "#111827",
padding: "14px 12px",
fontSize: "16px",
lineHeight: "1.6",
},
button: {
marginTop: "8px",
border: "none",
borderRadius: "14px",
padding: "16px",
background: "#d6b55b",
color: "#07111f",
fontSize: "17px",
fontWeight: "800",
},
result: {
marginTop: "22px",
border: "1px solid rgba(214,181,91,0.45)",
borderRadius: "16px",
padding: "18px",
background: "rgba(214,181,91,0.1)",
},
resultTitle: {
color: "#d6b55b",
fontSize: "16px",
fontWeight: "800",
margin: "0 0 10px",
},
resultHeadline: {
fontSize: "18px",
fontWeight: "800",
lineHeight: "1.7",
margin: "0 0 14px",
},
cars: {
display: "flex",
flexWrap: "wrap",
gap: "8px",
marginBottom: "16px",
},
carTag: {
display: "inline-block",
border: "1px solid rgba(214,181,91,0.55)",
borderRadius: "999px",
padding: "8px 12px",
color: "#f6e7a6",
fontSize: "14px",
fontWeight: "800",
background: "rgba(0,0,0,0.18)",
},
sectionTitle: {
color: "#d6b55b",
fontSize: "14px",
fontWeight: "800",
margin: "16px 0 6px",
},
resultText: {
fontSize: "15px",
lineHeight: "1.8",
margin: 0,
color: "rgba(255,255,255,0.88)",
},
small: {
marginTop: "18px",
fontSize: "12px",
lineHeight: "1.6",
color: "rgba(255,255,255,0.55)",
},
};
