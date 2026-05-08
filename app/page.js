"use client";

import { useState } from "react";

export default function Home() {
const [usage, setUsage] = useState("通勤・買い物が中心");
const [people, setPeople] = useState("1〜2人が多い");
const [priority, setPriority] = useState("維持費の安さ");
const [budget, setBudget] = useState("できるだけ抑えたい");
const [result, setResult] = useState("");

function diagnose() {
let carType = "コンパクトカー";
let reason = "扱いやすさと維持費のバランスが良く、日常使いに向いています。";

if (people === "5人以上で使う" || usage === "家族で使う") {
carType = "ミニバン";
reason = "人数が多い使い方に合いやすく、家族利用や荷物の多い場面でも安心です。";
} else if (priority === "維持費の安さ" || budget === "できるだけ抑えたい") {
carType = "軽自動車";
reason = "維持費を抑えやすく、通勤・買い物中心の使い方に向いています。";
} else if (priority === "雪道の安心感" || usage === "遠出・レジャーが多い") {
carType = "SUV・4WD系";
reason = "雪道や遠出、レジャー用途に向きやすく、安心感を重視する方に合います。";
} else if (priority === "見た目・高級感") {
carType = "上質系コンパクト・セダン";
reason = "見た目や質感を重視しながら、日常でも使いやすい方向性です。";
}

setResult(carType + "がおすすめです。\n\n" + reason);
}

return (
<main style={styles.page}>
<section style={styles.card}>
<div style={styles.brand}>CARTOPIA</div>

<h1 style={styles.title}>ぴったり車種診断</h1>

<p style={styles.lead}>
いくつかの質問に答えるだけで、あなたに合いそうな車種タイプを診断します。
</p>

<div style={styles.notice}>
<p style={styles.noticeTitle}>まずはかんたん診断</p>
<p style={styles.noticeText}>
用途・人数・予算感から、軽自動車・コンパクト・ミニバン・SUVなどの方向性を整理します。
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

<button type="button" style={styles.button} onClick={diagnose}>
診断する
</button>
</div>

{result && (
<div style={styles.result}>
<p style={styles.resultTitle}>診断結果</p>
<p style={styles.resultText}>{result}</p>
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
fontSize: "32px",
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
fontWeight: "700",
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
fontWeight: "700",
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
resultText: {
whiteSpace: "pre-line",
fontSize: "16px",
lineHeight: "1.8",
margin: 0,
},
small: {
marginTop: "18px",
fontSize: "12px",
lineHeight: "1.6",
color: "rgba(255,255,255,0.55)",
},
};
