"use client";

import { useState } from "react";

const CATEGORIES = [
{
key: "carClass",
title: "1. 軽自動車・普通車の希望",
note: "軽自動車か普通車かは、車選びの大きな分岐です。複数選択できます。",
placeholder: "例：できれば軽がいいけど、5人乗るなら普通車も考える",
options: [
"軽自動車で考えている",
"普通車で考えている",
"どちらも候補に入れたい",
"まだ決めていない",
"維持費が安ければ軽でもいい",
"広さが必要なら普通車でもいい",
"軽自動車は避けたい",
"大きい車は避けたい",
],
},
{
key: "usage",
title: "2. 主な使い方",
note: "普段どんな場面で使うかを選んでください。",
placeholder: "例：普段は通勤、週末は子どもの送迎と買い物が多い",
options: [
"通勤",
"買い物",
"子どもの送迎",
"家族で使う",
"夫婦で使う",
"親の送迎",
"遠出・旅行",
"キャンプ・アウトドア",
"釣り・趣味",
"スキー・スノーボード",
"仕事でも使う",
"農作業・畑で使う",
"配達・納品",
"営業・外回り",
"セカンドカー",
"初めての車",
"免許取り立ての人が使う",
"高齢の家族も乗る",
],
},
{
key: "people",
title: "3. 乗車人数",
note: "普段の人数と、たまに乗る最大人数の両方を拾います。",
placeholder: "例：普段は2人だけど、年に数回だけ家族5人で旅行します",
options: [
"普段は1人",
"普段は1〜2人",
"普段は3〜4人",
"普段から5人で乗る",
"たまに5人で乗る",
"たまに6〜7人で乗る",
"6〜7人で乗ることが多い",
"8人乗れる車がいい",
"子どもを複数人乗せる",
"チャイルドシートを使う",
"高齢者を乗せる",
"後席はほとんど使わない",
"後席にも人をよく乗せる",
],
},
{
key: "cargo",
title: "4. 荷物・積みたいもの",
note: "りんご箱・仕事道具・キャンプ道具など、何を積むかで候補が大きく変わります。",
placeholder: "例：りんご箱を20箱くらい積みたい / キャンプ道具とクーラーボックスを積みたい",
options: [
"普段の買い物程度",
"ベビーカー",
"チャイルドシート",
"部活道具",
"キャンプ道具",
"クーラーボックス",
"釣り道具",
"ゴルフバッグ",
"スキー・スノーボード",
"自転車",
"ペット用品",
"工具",
"仕事道具",
"脚立",
"資材",
"配達物",
"りんご箱",
"コンテナ",
"農作業用品",
"汚れ物を積む",
"長い物を積む",
"荷物をたくさん積む",
"車中泊も考えたい",
"後席を倒して荷室を広く使いたい",
],
},
{
key: "snow",
title: "5. 雪道・4WD",
note: "弘前・青森周辺ではかなり大事な判断軸です。",
placeholder: "例：冬の弘前で毎日通勤します。家の前の道が狭くて雪が残りやすいです",
options: [
"4WDは必須",
"できれば4WDがいい",
"2WDでも問題ない",
"よく分からない",
"冬の通勤で使う",
"山道・坂道を走る",
"農道・畑道を走る",
"除雪が弱い道を走る",
"スキー場に行く",
"年に数回だけ雪道を走る",
"雪道より維持費を優先したい",
"走破性を重視したい",
"車高が高い車が安心",
],
},
{
key: "slideDoor",
title: "6. スライドドア・乗り降り",
note: "子ども・高齢者・狭い駐車場では重要になります。",
placeholder: "例：子どもの送迎があるので、できればスライドドアが安心です",
options: [
"スライドドアは必須",
"できればスライドドアが欲しい",
"スライドドアはなくてもいい",
"迷っている",
"子どもの乗り降りで使いたい",
"高齢者の乗り降りで使いたい",
"狭い駐車場で便利そう",
"荷物の出し入れに便利そう",
"普通のドアの方が好き",
"スライドドアより見た目を優先したい",
],
},
{
key: "size",
title: "7. 車のサイズ感",
note: "運転しやすさ・駐車場・道路の狭さも考えて選びます。",
placeholder: "例：運転は苦手なので、大きすぎる車は避けたいです",
options: [
"小さい車がいい",
"運転しやすいサイズがいい",
"少し大きくても大丈夫",
"大きくても広さを優先したい",
"軽自動車くらいのサイズが安心",
"コンパクトカーくらいがいい",
"シエンタ・フリードくらいまでならOK",
"ノア・ヴォクシーくらいでもOK",
"SUVでも大丈夫",
"大型SUVでも大丈夫",
"狭い道をよく走る",
"駐車場が狭い",
"会社や家の入口が狭い",
],
},
{
key: "style",
title: "8. 見た目・雰囲気",
note: "高級感・かわいさ・アウトドア感など、好みも大事にします。",
placeholder: "例：レクサスLXみたいな大きくて高級感のある雰囲気が好きです",
options: [
"シンプルで落ち着いた見た目",
"かわいい雰囲気",
"やさしい雰囲気",
"かっこいい見た目",
"高級感がほしい",
"存在感がほしい",
"アウトドアっぽい見た目",
"SUVっぽい見た目",
"商用車っぽくない方がいい",
"実用性重視で見た目は気にしない",
"レクサスLXみたいな雰囲気が好き",
"ランドクルーザーみたいな雰囲気が好き",
"ハリアーみたいな雰囲気が好き",
"ジムニーみたいな雰囲気が好き",
"N-BOXみたいな雰囲気が好き",
],
},
{
key: "budget",
title: "9. 予算・支払い・新車中古車",
note: "価格だけでなく、新車・中古車・ローン・リースの考えも拾います。",
placeholder: "例：安ければ安い方がいいけど、長く乗れるなら高くてもいいです",
options: [
"できるだけ安く",
"総額50万円前後",
"総額100万円前後",
"総額150万円前後",
"総額200万円前後",
"総額300万円以上も検討",
"予算は高めでもいい",
"月々の支払いを抑えたい",
"ローンで考えている",
"現金で考えている",
"新車がいい",
"新しめの中古車がいい",
"中古車でも状態が良ければいい",
"できるだけ安い中古車がいい",
"未使用車も気になる",
"新車リースも気になる",
"良い車なら高くてもいい",
"安さより状態を重視したい",
"長く乗れるなら高くてもいい",
],
},
{
key: "favorite",
title: "10. 気になる車・最後の自由入力",
note: "好きな車や、最後に伝えたいことがあれば入れてください。",
placeholder: "例：レクサスLXみたいな雰囲気が好きだけど、予算的には厳しいかも",
options: [
"N-BOX",
"スペーシア",
"タント",
"ハスラー",
"ジムニー",
"ソリオ",
"ルーミー",
"シエンタ",
"フリード",
"ヤリスクロス",
"ライズ",
"カローラクロス",
"ハリアー",
"ランドクルーザー",
"レクサスLX",
"ノア・ヴォクシー",
"セレナ",
"プロボックス",
"エブリイ",
"N-VAN",
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
},
card: {
maxWidth: "560px",
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
},
resultBox: {
border: "1px solid rgba(214,181,91,0.45)",
borderRadius: "16px",
padding: "18px",
background: "rgba(214,181,91,0.1)",
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
