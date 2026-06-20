"use client";

import { useState } from "react";

export default function DiagnosisPage() {
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  async function search(type1, type2) {
    setLoading(true);

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

    const res = await fetch(
      `/api/inventory/search?type=${encodeURIComponent("軽自動車")}&limit=20`
    );

    const data = await res.json();

    setCars(data.vehicles || []);
    setLoading(false);
  }

  return (
    <main style={{ padding: 20 }}>
      <h1>軽自動車診断</h1>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          marginTop: 20,
        }}
      >
        <button onClick={() => search("軽自動車", "スライドドア")}>
          スライドドア
        </button>

        <button onClick={() => search("軽自動車", "スタンダード")}>
          スタンダード
        </button>

        <button onClick={() => search("軽自動車", "SUV")}>
          SUV
        </button>

        <button onClick={() => search("軽自動車", "トラック")}>
          トラック
        </button>

        <button onClick={() => search("軽自動車", "スポーティ")}>
          スポーティ
        </button>

        <button onClick={searchAllKei}>
          特にこだわりはない
        </button>
      </div>

      {loading && <p>検索中...</p>}

      <div style={{ marginTop: 30 }}>
        {cars.map((car) => (
          <div
            key={car.stockId}
            style={{
              border: "1px solid #ddd",
              padding: 10,
              marginBottom: 10,
            }}
          >
            <div>{car.title}</div>
            <div>{car.totalPrice}</div>
          </div>
        ))}
      </div>
    </main>
  );
}
