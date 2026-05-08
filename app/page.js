export default function Home() {
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

<form style={styles.form}>
<label style={styles.label}>
主な使い方
<select style={styles.input}>
<option>通勤・買い物が中心</option>
<option>家族で使う</option>
<option>仕事でも使う</option>
<option>遠出・レジャーが多い</option>
</select>
</label>

<label style={styles.label}>
乗る人数
<select style={styles.input}>
<option>1〜2人が多い</option>
<option>3〜4人が多い</option>
<option>5人以上で使う</option>
</select>
</label>

<label style={styles.label}>
重視したいこと
<select style={styles.input}>
<option>維持費の安さ</option>
<option>運転のしやすさ</option>
<option>荷物の積みやすさ</option>
<option>見た目・高級感</option>
<option>雪道の安心感</option>
</select>
</label>

<label style={styles.label}>
ご予算感
<select style={styles.input}>
<option>できるだけ抑えたい</option>
<option>総額100万円前後</option>
<option>総額150万円前後</option>
<option>総額200万円以上も検討</option>
</select>
</label>

<button type="button" style={styles.button}>
診断する
</button>
</form>

<p style={styles.small}>
※現在は診断ページの試作版です。内容は今後調整していきます。
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
small: {
marginTop: "18px",
fontSize: "12px",
lineHeight: "1.6",
color: "rgba(255,255,255,0.55)",
},
};
