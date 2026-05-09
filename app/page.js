"use client";

import { useState } from "react";

const CATEGORIES = [
{
key: "carClass",
title: "1. 車の大きさ・軽/普通車・貨物用途",
note: "車の大きさや使い方は、どれに近いですか？",
placeholder: "例：軽がいいけど、荷物が多いなら普通車も考えたい",
groups: [
{
label: "乗用車として",
options: [
"軽自動車がいい",
"普通車がいい",
"軽でも普通車でもいい",
"まだ決めていない",
],
},
{
label: "仕事・荷物用として",
options: [
"荷物を積む仕事用",
"農作業・畑用",
"貨物・バン系も候補",
"トラック系も候補",
],
},
{
label: "サイズへの不安",
options: ["大きい車は不安", "小さい車だと不安"],
},
],
},
{
key: "usage",
title: "2. 主な使い方",
note: "主な使い方を選んでください。",
placeholder: "例：平日は通勤、休日は家族で買い物や外出が多い",
groups: [
{
label: "日常",
options: ["通勤", "買い物", "送迎", "セカンドカー", "初めての車"],
},
{
label: "家族・お出かけ",
options: ["家族の外出", "夫婦でお出かけ", "遠出・旅行"],
},
{
label: "趣味・仕事",
options: ["趣味・レジャー", "仕事", "農作業・畑", "配達・納品", "営業・外回り"],
},
],
},
{
key: "people",
title: "3. 乗る人数",
note: "乗る人数について教えてください。",
placeholder: "例：普段は2人、月に数回だけ家族5人で乗ります",
groups: [
{
label: "普段の人数",
options: [
"1人が多い",
"2人が多い",
"3〜4人が多い",
"5人で乗ることが多い",
"6〜7人が多い",
"8人以上で乗りたい",
],
},
{
label: "たまに増える人数",
options: ["5人で乗ることがある", "6〜7人はたまに", "8人で乗ることがある"],
},
{
label: "席の使い方",
options: ["送迎で人を乗せる", "後ろの席はあまり使わない", "後ろの席もよく使う"],
},
],
},
{
key: "familyAge",
title: "4. 子ども・親・高齢者の年齢",
note: "検討中の車に乗せるお子さんや、ご家族の年齢を選んでください。",
placeholder: "例：子どもは5歳と8歳です。親をたまに病院へ送迎します",
groups: [
{
label: "子ども",
options: [
"この車には子どもを乗せない",
"今後、子どもを乗せる可能性がある",
"0歳",
"1歳",
"2歳",
"3歳",
"4歳",
"5歳",
"6歳",
"7歳",
"8歳",
"9歳",
"10歳",
"11歳",
"12歳",
"13歳",
"14歳",
"15歳",
"16歳",
"17歳",
"18歳",
],
},
{
label: "親・高齢の家族",
options: [
"親・高齢の家族は乗せない",
"50〜55歳",
"56〜60歳",
"61〜65歳",
"66〜70歳",
"71〜75歳",
"76〜80歳",
"81歳以上",
],
},
],
},
{
key: "years",
title: "5. 何年くらい使う予定か",
note: "この車は何年くらい使う予定ですか？",
placeholder: "例：できれば長く乗りたいですが、子どもが大きくなった時に狭くならないか心配です",
groups: [
{
label: "使用予定",
options: [
"2〜3年くらい",
"4〜5年くらい",
"6〜7年くらい",
"8〜10年くらい",
"できるだけ長く乗りたい",
"まだ分からない",
],
},
{
label: "今後の変化",
options: [
"子どもの成長も考えたい",
"荷物が増えるかもしれない",
"家族構成が変わるかもしれない",
"仕事での使い方が変わるかもしれない",
"今の使い方だけで考えたい",
],
},
],
},
{
key: "cargo",
title: "6. 荷物・積みたいもの",
note: "よく載せる荷物を選んでください。",
placeholder: "例：子どもの自転車、キャンプ道具、旅行の荷物を積みたいです",
groups: [
{
label: "日常・家族",
options: [
"買い物袋くらい",
"ベビーカー",
"子どもの荷物",
"部活・習い事の道具",
"子どもの外遊び道具",
"旅行の荷物",
],
},
{
label: "レジャー・趣味",
options: [
"キャンプ道具",
"クーラーボックス",
"釣り・趣味の道具",
"ゴルフバッグ",
"スキー・スノーボード",
"自転車",
"車中泊も気になる",
],
},
{
label: "仕事・農作業",
options: [
"仕事道具",
"工具・脚立",
"りんご箱・コンテナ",
"農作業用品",
"配達物・納品物",
],
},
{
label: "荷室の使い方",
options: [
"汚れ物",
"長い物",
"大きい物",
"荷室を広く使いたい",
"後ろの席を倒して使いたい",
],
},
],
},
{
key: "snow",
title: "7. 使う地域・雪道・4WD",
note: "使う地域や4WDについて教えてください。",
placeholder: "例：弘前市内で使います。家の前の道が狭く、冬は雪が残りやすいです",
groups: [
{
label: "使う地域",
options: [
"青森県内で使う",
"雪が多い地域で使う",
"雪が少ない地域で使う",
"県外・関東方面で使うことが多い",
],
},
{
label: "4WDについて",
options: ["4WDは必須", "できれば4WD", "2WDでも相談したい", "4WDより維持費を優先したい"],
},
{
label: "道路環境",
options: [
"坂道が多い",
"細い道が多い",
"除雪が弱い道がある",
"農道・畑道も走る",
"車高が高いと安心",
],
},
{
label: "冬の使い方",
options: ["スキー場などにも行く", "冬も毎日使う", "冬はあまり使わない"],
},
],
},
{
key: "door",
title: "8. 乗り降り・ドア",
note: "乗り降りやドアについて、気になることを選んでください。",
placeholder: "例：スライドドアは便利そうですが、見た目は普通のドアの車が好きです",
groups: [
{
label: "乗り降り",
options: [
"人が乗り降りしやすい車がいい",
"子どもが自分で乗り降りしやすい",
"親や高齢の家族が乗り降りしやすい",
"運転席に乗り込みやすい",
],
},
{
label: "ドア",
options: [
"スライドドアがほしい",
"スライドドアはできれば避けたい",
"スライドドアなしでもいい",
"狭い駐車場でも使いやすい",
"荷物を出し入れしやすい",
],
},
{
label: "高さ",
options: ["低すぎる車は避けたい", "高すぎる車も不安", "高さはあまり気にしない"],
},
],
},
{
key: "size",
title: "9. 運転しやすさ・サイズ感",
note: "運転しやすさについて、近いものを選んでください。",
placeholder: "例：運転に不安はありません。サイズもそこまでこだわりません",
groups: [
{
label: "不安・こだわり",
options: ["運転に少し不安がある", "特に不安はない", "サイズはこだわらない", "普通に運転できればいい"],
},
{
label: "街乗り・駐車",
options: ["小回りが大事", "駐車しやすい車がいい", "狭い道が多い", "駐車場が狭い"],
},
{
label: "大きさ・安心感",
options: [
"大きい車でも大丈夫",
"広さを優先したい",
"見晴らしがいい車がいい",
"高速道路でも安心したい",
"長距離でも疲れにくい車がいい",
],
},
],
},
{
key: "style",
title: "10. 見た目・雰囲気",
note: "見た目の好みを選んでください。",
placeholder: "例：高級感もほしいですが、少しゴツくてタフな雰囲気も好きです",
groups: [
{
label: "雰囲気",
options: [
"かわいい感じ",
"落ち着いた感じ",
"かっこいい感じ",
"上品に見える",
"大きくて安心感がある",
"ゴツい・タフな感じ",
],
},
{
label: "用途っぽさ",
options: [
"アウトドアっぽい",
"家族向けでやさしい感じ",
"仕事っぽく見えすぎない",
"商用車っぽさは気にしない",
],
},
{
label: "こだわり",
options: ["目立ちすぎない", "見た目より使いやすさ", "まだよく分からない"],
},
],
},
{
key: "budget",
title: "11. 予算・買い方",
note: "予算や買い方について、近いものを選んでください。",
placeholder: "例：総額は300万円以内、ローンなら月々3万円台くらいに抑えたいです",
groups: [
{
label: "総額の予算感",
options: [
"できるだけ安く",
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
],
},
{
label: "月々の支払い目安",
options: [
"月々1万円台",
"月々2万円台",
"月々3万円台",
"月々4万円台",
"月々5万円台",
"月々6万円以上",
"月々の金額はまだ決めていない",
],
},
{
label: "支払い・買い方",
options: [
"月々を抑えたい",
"ローンで考えている",
"現金で考えている",
"新車も気になる",
"リースも気になる",
"新しめの中古車",
"安めの中古車",
],
},
{
label: "考え方",
options: ["良い車なら少し高くてもいい", "安さより状態重視", "長く乗れる車がいい", "まだ決まっていない"],
},
],
},
{
key: "concerns",
title: "12. 避けたいこと・不安なこと",
note: "避けたいことや、不安なことを選んでください。",
placeholder: "例：大きすぎる車は不安ですが、狭すぎる車も避けたいです",
groups: [
{
label: "サイズ・使い勝手",
options: [
"大きすぎる車は不安",
"小さすぎる車は不安",
"荷物が積みにくい車は避けたい",
"乗り降りしにくい車は避けたい",
"運転しにくい車は避けたい",
],
},
{
label: "費用・維持",
options: ["維持費が高い車は避けたい", "燃費が悪い車は避けたい", "修理代が高そうな車は不安"],
},
{
label: "中古車としての不安",
options: ["古すぎる車は避けたい", "走行距離が多すぎる車は避けたい", "故障が多そうな車は不安"],
},
{
label: "見た目・雪道",
options: ["雪道に弱い車は避けたい", "商用車っぽすぎる見た目は避けたい", "特にない"],
},
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
groups: category.groups.map((group) => ({
label: group.label,
selected: group.options.filter((option) => answer.selected.includes(option)),
})),
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
<div style={styles.logoWrap}>
<img
src="/cartopia-logo.png"
alt="カーとぴあ CARTOPIA"
style={styles.logoImage}
/>
</div>

<h1 style={styles.title}>ぴったり車種診断</h1>

{!result && !loading && !error ? (
<>
<div style={styles.progress}>
{step + 1} / {CATEGORIES.length}
</div>

<h2 style={styles.questionTitle}>{current.title}</h2>
<p style={styles.note}>{current.note}</p>

<div style={styles.multiSelectBox}>
<span style={styles.multiSelectLabel}>複数選択OK</span>
<span style={styles.multiSelectText}>
あてはまるものをいくつでも選んでください
</span>
</div>

<div style={styles.options}>
{current.groups.map((group) => (
<div key={group.label} style={styles.optionGroup}>
<p style={styles.groupTitle}>{group.label}</p>

{group.options.map((option) => {
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
))}
</div>

<div style={styles.freeInputBox}>
<span style={styles.freeInputLabel}>自由入力は任意です</span>
<span style={styles.freeInputText}>
詳しく書くほど、AI診断の精度が上がります。
</span>
<span style={styles.freeInputExample}>
例：子どもの自転車を積みたい／冬道が不安／今は軽だけど普通車も迷っている
</span>
</div>

<label style={styles.memoLabel}>
補足があれば入力してください
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
padding: "26px 22px 28px",
background: "rgba(255,255,255,0.03)",
boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
boxSizing: "border-box",
},
logoWrap: {
display: "flex",
justifyContent: "center",
alignItems: "center",
marginBottom: "18px",
},
logoImage: {
width: "240px",
maxWidth: "82%",
height: "auto",
display: "block",
borderRadius: "12px",
},
title: {
fontSize: "34px",
lineHeight: "1.25",
margin: "0 0 22px",
fontWeight: "900",
textAlign: "center",
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
margin: "0 0 16px",
},
multiSelectBox: {
display: "grid",
gap: "4px",
border: "1px solid rgba(214,181,91,0.55)",
background: "rgba(214,181,91,0.12)",
borderRadius: "14px",
padding: "12px 14px",
marginBottom: "18px",
boxSizing: "border-box",
},
multiSelectLabel: {
color: "#d6b55b",
fontSize: "15px",
fontWeight: "900",
},
multiSelectText: {
color: "rgba(255,255,255,0.86)",
fontSize: "13px",
fontWeight: "700",
lineHeight: "1.5",
},
options: {
display: "grid",
gap: "18px",
},
optionGroup: {
display: "grid",
gap: "10px",
},
groupTitle: {
color: "#d6b55b",
fontSize: "14px",
fontWeight: "900",
margin: "0 0 2px",
paddingTop: "4px",
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
freeInputBox: {
display: "grid",
gap: "6px",
border: "1px solid rgba(214,181,91,0.55)",
background: "rgba(214,181,91,0.12)",
borderRadius: "14px",
padding: "14px",
marginTop: "24px",
boxSizing: "border-box",
},
freeInputLabel: {
color: "#d6b55b",
fontSize: "16px",
fontWeight: "900",
},
freeInputText: {
color: "rgba(255,255,255,0.92)",
fontSize: "14px",
fontWeight: "800",
lineHeight: "1.55",
},
freeInputExample: {
color: "rgba(255,255,255,0.72)",
fontSize: "12px",
fontWeight: "700",
lineHeight: "1.7",
},
memoLabel: {
display: "grid",
gap: "9px",
marginTop: "12px",
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
