"use client";

import { useState } from "react";

export default function DiagnosisPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState("");

  async function search(type1, type2, label) {
    setLoading(true);
    setSelectedLabel(label);

    const res = await fetch(
      `/api/inventory/search?type1=${encodeURIComponent(
        type1
      )}&type2=${encodeURIComponent(type2)}&limit=20`
    );

    const data = await res.json();

    setCars(data.vehicles || []);
    setLoading(false);
  }

  async function searchAllKei() {
    setLoading(true);
    setSelectedLabel("特にこだわりはない");

    const res = await fetch(
      `/api/inventory/search?type=${encodeURIComponent("軽自動車")}&limit=20`
    );

    const data = await res.json();

    setCars(data.vehicles || []);
    setLoading(false);
  }

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 42, marginBottom: 30 }}>軽自動車診断</h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={() => search("軽自動車", "スライドドア", "スライドドア")}>スライドドア</button>
        <button onClick={() => search("軽自動車", "スタンダード", "スタンダード")}>スタンダード</button>
        <button onClick={() => search("軽自動車", "SUV", "SUV")}>SUV</button>
        <button onClick={() => search("軽自動車", "トラック", "トラック")}>トラック</button>
        <button onClick={() => search("軽自動車", "スポーティ", "スポーティ")}>スポーティ</button>
        <button onClick={searchAllKei}>特にこだわりはない</button>
      </div>

      {loading && <p style={{ marginTop: 24 }}>検索中...</p>}

      {!loading && selectedLabel && (
        <h2 style={{ marginTop: 30, fontSize: 22 }}>
          {selectedLabel}のおすすめ在庫
        </h2>
      )}

      <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 16 }}>
        {cars.map((car) => (
          <div key={car.stockId} style={{ border: "1px solid #ddd", borderRadius: 12, overflow: "hidden", background: "#fff" }}>
            {car.imageUrl && (
              <img src={car.imageUrl} alt={car.title} style={{ width: "100%", display: "block" }} />
            )}

            <div style={{ padding: 14 }}>
              <div style={{ fontSize: 20, fontWeight: "bold", marginBottom: 8 }}>
                {car.title}
              </div>

              <div style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>
                支払総額 {car.totalPrice || "お問い合わせ"}
              </div>

              <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                <div>年式：{car.year || "-"}</div>
                <div>走行距離：{car.mileage || "-"}</div>
                <div>色：{car.color || "-"}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
