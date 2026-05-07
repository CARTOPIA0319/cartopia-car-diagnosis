export const metadata = {
title: "カーとぴあ ぴったり車種診断",
description: "カーとぴあ公式LINEのAI車種診断LIFFアプリ",
};

export default function RootLayout({ children }) {
return (
<html lang="ja">
<body style={{ margin: 0 }}>
{children}
</body>
</html>
);
}
