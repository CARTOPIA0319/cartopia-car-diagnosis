export default function Home() {
return (
<main style={{
minHeight: "100vh",
padding: "24px",
background: "#0b1220",
color: "#ffffff",
fontFamily: "system-ui, sans-serif"
}}>
<div style={{
maxWidth: "520px",
margin: "0 auto",
background: "#111827",
border: "1px solid #334155",
borderRadius: "18px",
padding: "24px"
}}>
<p style={{ color: "#d4af37", fontSize: "14px", marginBottom: "8px" }}>
CARTOPIA
</p>

<h1 style={{ fontSize: "26px", marginBottom: "16px" }}>
ぴったり車種診断
</h1>

<p style={{ lineHeight: "1.8", color: "#e5e7eb" }}>
カーとぴあ公式LINEの車種診断ページです。
軽自動車・普通車・仕事用・家族用など、
ご希望に合わせて車選びをお手伝いします。
</p>

<div style={{
marginTop: "24px",
padding: "16px",
background: "#020617",
borderRadius: "12px",
border: "1px solid #475569"
}}>
<p style={{ margin: 0, lineHeight: "1.7" }}>
準備中です。<br />
このページが表示されていれば、Vercel公開テストは成功です。
</p>
</div>
</div>
</main>
);
}
