"use client";

import { useState } from "react";

const CATEGORIES = [
{
key: "carClass",
title: "1. 車の大きさ・軽/普通車・貨物用途",
note: "車の大きさや使い方は、どれに近いですか？",
placeholder: "例：軽がいいけど、荷物が多いなら普通車も考えたい",
options: [
"軽自動車がいい",
"普通車がいい",
"軽でも普通車でもいい",
"まだ決めていない",
"荷物を積む仕事用",
"農作業・畑用",
"貨物・バン系も候補",
"トラック系も候補",
"大きい車は不安",
],
},
{
key: "usage",
title: "2. 主な使い方",
note: "主な使い方を選んでください。",
placeholder: "例：平日は通勤、休日は家族で買い物や外出が多い",
options: [
"通勤",
"買い物",
"送迎",
"家族の外出",
"夫婦でお出かけ",
"遠出・旅行",
"趣味・レジャー",
"仕事",
"農作業・畑",
"配達・納品",
"営業・外回り",
"セカンドカー",
"初めての車",
],
},
{
key: "people",
title: "3. 乗る人数",
note: "乗る人数について教えてください。",
placeholder: "例：普段は2人、月に数回だけ家族5人で乗ります",
options: [
"1人が多い",
"2人が多い",
"3〜4人が多い",
"5人で乗ることがある",
"5人で乗ることが多い",
"6〜7人はたまに",
"6〜7人が多い",
"8人で乗ることがある",
"8人以上で乗りたい",
"送迎で人を乗せる",
"チャイルドシートあり",
"後ろの席はあまり使わない",
],
},
{
key: "cargo",
title: "4. 荷物・積みたいもの",
note: "よく載せる荷物を選んでください。",
placeholder: "例：りんご箱を20箱くらい / キャンプ道具とクーラーボックス",
options: [
"買い物袋くらい",
"ベビーカー",
"子どもの荷物",
"部活・習い事の道具",
"キャンプ道具",
"クーラーボックス",
"釣り・趣味の道具",
"ゴルフバッグ",
"スキー・スノーボード",
"仕事道具",
"工具・脚立",
"りんご箱・コンテナ",
"農作業用品",
"汚れ物",
"長い物",
"荷室を広く使いたい",
"車中泊も気になる",
],
},
{
key: "snow",
title: "5. 雪道・4WD",
note: "使う地域や4WDについて教えてください。",
placeholder: "例：弘前市内で使います。家の前の道が狭く、冬は雪が残りやすいです",
options: [
"青森県内で使う",
"雪が多い地域で使う",
"雪が少ない地域で使う",
"4WDは必須",
"できれば4WD",
"2WDでも相談したい",
"坂道・細い道が多い",
"除雪が弱い道がある",
"農道・畑道も走る",
"スキー場などにも行く",
"維持費を優先したい",
"車高が高いと安心",
],
},
{
key: "slideDoor",
title: "6. 乗り降り・ドア",
note: "乗り降りやドアについて、気になることを選んでください。",
placeholder: "例：子どもや親を乗せるので、乗り降りしやすい車がいいです",
options: [
"人が乗り降りしやすい車がいい",
"狭い駐車場でも使いやすい",
"スライドドアがほしい",
"スライドドアなしでもいい",
"荷物を出し入れしやすい",
"運転席に乗り込みやすい",
"低すぎる車は避けたい",
"高すぎる車も不安",
],
},
{
key: "size",
title: "7. 運転しやすさ・サイズ感",
note: "運転しやすさについて、近いものを選んでください。",
placeholder: "例：駐車が苦手なので、大きすぎる車は少し不安です",
options: [
"運転に少し不安がある",
"小回りが大事",
"駐車しやすい車がいい",
"狭い道が多い",
"駐車場が狭い",
"大きい車でも大丈夫",
"広さを優先したい",
"見晴らしがいい車がいい",
"高速道路でも安心したい",
"長距離でも疲れにくい車がいい",
],
},
{
key: "style",
title: "8. 見た目・雰囲気",
note: "見た目の好みを選んでください。",
placeholder: "例：高級感はほしいけど、大きすぎる車は少し不安です",
options: [
"かわいい感じ",
"落ち着いた感じ",
"大きくて安心感がある",
"上品に見える",
"かっこいい感じ",
"アウトドアっぽい",
"家族向けでやさしい感じ",
"仕事っぽく見えすぎない",
"目立ちすぎない",
"見た目より使いやすさ",
"まだよく分からない",
],
},
{
key: "budget",
title: "9. 予算・買い方",
note: "予算や買い方について、近いものを選んでください。",
placeholder: "例：できれば300万円以内。かなり気に入れば350万円くらいまで考えます",
options: [
"できるだけ安く",
"月々を抑えたい",
"総額50万円前後",
"総額100万円前後",
"総額150万円前後",
"総額200万円前後",
"総額250万円前後",
"総額300万円前後",
"総額350万円前後",
"総額400万円前後",
"総額450万円前後",
"総額500万円前後",
"総額500万円以上",
"良い車なら少し高くてもいい",
"安さより状態重視",
"長く乗れる車がいい",
"新しめの中古車",
"安めの中古車",
"新車も気になる",
"リースも気になる",
"まだ決まっていない",
],
},
{
key: "concerns",
title: "10. 避けたいこと・不安なこと",
note: "避けたいことや、不安なことを選んでください。",
placeholder: "例：大きすぎる車は不安ですが、狭すぎる車も避けたいです",
options: [
"大きすぎる車は不安",
"小さすぎる車は不安",
"維持費が高い車は避けたい",
"燃費が悪い車は避けたい",
"古すぎる車は避けたい",
"走行距離が多すぎる車は避けたい",
"修理代が高そうな車は不安",
"雪道に弱い車は避けたい",
"荷物が積みにくい車は避けたい",
"乗り降りしにくい車は避けたい",
"商用車っぽすぎる見た目は避けたい",
"特にない",
],
},
];

export default function Home() {
const [step, setStep] = useState(0);
const [answers, setAnswers] = useState({});
const [result, setResult] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");

const current = CATEGORIES[step];
const selected = answers[current.key]?.selected || [];
const memo = answers[current.key]?.memo || "";

function toggleOption(option) {
const exists = selected.includes(option);
const nextSelected = exists
? selected.filter((item) => item !== option)
: [...selected, option];

setAnswers({
...answers,
[current.key]: {
selected: nextSelected,
memo,
},
});
}

function updateMemo(value) {
setAnswers({
...answers,
[current.key]: {
selected,
memo: value,
},
});
}

function nextStep() {
if (step + 1 >= CATEGORIES.length) {
runAiDiagnosis();
} else {
setStep(step + 1);
window.scrollTo(0, 0);
}
}

function prevStep() {
if (step > 0) {
setStep(step - 1);
window.scrollTo(0, 0);
}
}

function restart() {
setStep(0);
setAnswers({});
setResult("");
setError("");
setLoading(false);
window.scrollTo(0, 0);
}

function buildSummary() {
return CATEGORIES.map((category) => {
const answer = answers[category.key] || { selected: [], memo: "" };
return {
title: category.title,
selected: answer.selected,
memo: answer.memo,
};
});
}

async function runAiDiagnosis() {
setLoading(true);
setError("");
setResult("");
window.scrollTo(0, 0);

try {
const response = await fetch("/api/diagnose", {
method: "POST",
headers: {
"Content-Type": "application/json",
},
body: JSON.stringify({
answers: buildSummary(),
}),
});

const data = await response.json();

if (!response.ok) {
throw new Error(data.error || "診断に失敗しました");
}

setResult(data.result || "診断結果を取得できませんでした。");
} catch (err) {
setError(err.message || "エラーが発生しました。");
} finally {
setLoading(false);
}
}

return (
<main style={styles.page}>
<section style={styles.card}>
<div style={styles.brand}>CARTOPIA</div>
<h1 style={styles.title}>ぴったり車種診断</h1>

{!result && !loading && !error ? (
<>
<div style={styles.progress}>
{step + 1} / {CATEGORIES.length}
</div>

<h2 style={styles.questionTitle}>{current.title}</h2>
<p style={styles.note}>{current.note}</p>

<div style={styles.options}>
{current.options.map((option) => {
const active = selected.includes(option);
return (
<button
key={option}
type="button"
style={{
...styles.optionButton,
...(active ? styles.optionButtonActive : {}),
}}
onClick={() => toggleOption(option)}
>
<span style={styles.checkBox}>{active ? "✓" : ""}</span>
<span>{option}</span>
</button>
);
})}
</div>

<label style={styles.memoLabel}>
補足があれば自由に入力してください
<textarea
style={styles.textarea}
value={memo}
onChange={(e) => updateMemo(e.target.value)}
placeholder={current.placeholder}
/>
</label>

<div style={styles.nav}>
{step > 0 && (
<button type="button" style={styles.backButton} onClick={prevStep}>
戻る
</button>
)}

<button type="button" style={styles.button} onClick={nextStep}>
{step + 1 >= CATEGORIES.length ? "AIで診断する" : "次へ"}
</button>
</div>
</>
) : null}

{loading ? (
<div style={styles.resultBox}>
<p style={styles.resultLabel}>診断中</p>
<p style={styles.resultText}>
回答内容をAIが整理しています。少しだけお待ちください。
</p>
</div>
) : null}

{error ? (
<div style={styles.resultBox}>
<p style={styles.resultLabel}>エラー</p>
<p style={styles.resultText}>{error}</p>
<button type="button" style={styles.button} onClick={runAiDiagnosis}>
もう一度診断する
</button>
<button type="button" style={styles.backButton} onClick={restart}>
最初からやり直す
</button>
</div>
) : null}

{result ? (
<div style={styles.resultBox}>
<p style={styles.resultLabel}>AI診断結果</p>
<div style={styles.aiText}>{result}</div>

<button type="button" style={styles.button} onClick={restart}>
もう一度診断する
</button>
</div>
) : null}

<p style={styles.small}>
※これはAIによる簡易診断です。実際の在庫状況やご希望条件に合わせて、スタッフがより詳しくご提案します。
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
boxSizing: "border-box",
},
card: {
maxWidth: "560px",
margin: "0 auto",
border: "1px solid rgba(255,255,255,0.16)",
borderRadius: "22px",
padding: "28px 22px",
background: "rgba(255,255,255,0.03)",
boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
boxSizing: "border-box",
},
brand: {
color: "#d6b55b",
fontSize: "14px",
letterSpacing: "0.18em",
fontWeight: "900",
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
fontWeight: "900",
marginBottom: "14px",
},
questionTitle: {
fontSize: "23px",
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
gap: "10px",
},
optionButton: {
width: "100%",
border: "1px solid rgba(255,255,255,0.18)",
borderRadius: "14px",
padding: "14px",
background: "#ffffff",
color: "#111827",
fontSize: "16px",
fontWeight: "800",
textAlign: "left",
display: "flex",
alignItems: "center",
gap: "10px",
boxSizing: "border-box",
},
optionButtonActive: {
background: "#d6b55b",
color: "#07111f",
border: "1px solid #d6b55b",
},
checkBox: {
width: "22px",
height: "22px",
borderRadius: "6px",
border: "1px solid rgba(17,24,39,0.45)",
display: "inline-flex",
alignItems: "center",
justifyContent: "center",
fontSize: "15px",
fontWeight: "900",
flexShrink: 0,
},
memoLabel: {
display: "grid",
gap: "9px",
marginTop: "22px",
fontSize: "15px",
fontWeight: "900",
color: "rgba(255,255,255,0.9)",
},
textarea: {
width: "100%",
minHeight: "110px",
borderRadius: "14px",
border: "1px solid rgba(255,255,255,0.18)",
background: "#ffffff",
color: "#111827",
padding: "14px",
fontSize: "16px",
lineHeight: "1.7",
boxSizing: "border-box",
},
nav: {
display: "grid",
gap: "12px",
marginTop: "22px",
},
button: {
border: "none",
borderRadius: "14px",
padding: "16px",
background: "#d6b55b",
color: "#07111f",
fontSize: "17px",
fontWeight: "900",
marginTop: "14px",
boxSizing: "border-box",
},
backButton: {
border: "1px solid rgba(255,255,255,0.24)",
borderRadius: "14px",
padding: "14px",
background: "transparent",
color: "#ffffff",
fontSize: "15px",
fontWeight: "800",
marginTop: "10px",
boxSizing: "border-box",
},
resultBox: {
border: "1px solid rgba(214,181,91,0.45)",
borderRadius: "16px",
padding: "18px",
background: "rgba(214,181,91,0.1)",
boxSizing: "border-box",
},
resultLabel: {
color: "#d6b55b",
fontSize: "16px",
fontWeight: "900",
margin: "0 0 12px",
},
resultText: {
fontSize: "15px",
lineHeight: "1.8",
color: "rgba(255,255,255,0.9)",
},
aiText: {
whiteSpace: "pre-line",
fontSize: "15px",
lineHeight: "1.85",
color: "rgba(255,255,255,0.92)",
},
small: {
marginTop: "24px",
fontSize: "12px",
lineHeight: "1.7",
color: "rgba(255,255,255,0.55)",
},
};
