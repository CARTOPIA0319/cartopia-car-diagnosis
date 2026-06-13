export async function GET() {
  return Response.json([
    {
      maker: "トヨタ",
      name: "シエンタ",
      grade: "ハイブリッドZ",
      price: 198.8
    },
    {
      maker: "ホンダ",
      name: "フリード",
      grade: "e:HEV AIR",
      price: 189.8
    },
    {
      maker: "日産",
      name: "セレナ",
      grade: "ハイウェイスターV",
      price: 259.8
    }
  ]);
}
