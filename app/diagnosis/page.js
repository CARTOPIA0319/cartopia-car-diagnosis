"use client";

import { useState } from "react";

export default function DiagnosisPage() {
  const [selectedMainType, setSelectedMainType] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  const keiOptions = [
    "スライドドア",
    "スタンダード",
    "SUV",
    "トラック",
    "スポーティ",
    "特にこだわりはない",
  ];

  const normalOptions = [
    "コンパクトカー",
    "ミニバン",
    "SUV",
    "セダン",
    "EV・HV,
    "スポーティ",
    "バン・トラック",
    "特にこだわりはない",
  ];

  async function search(mainType, subType) {
    setLoading(true);
    setSelectedLabel(subType);

    const url =
      subType === "特にこだわりはない"
        ? `/api/inventory/search?type=${encodeURIComponent(mainType)}&limit=20`
        : `/api/inventory/search?type1=${encodeURIComponent(
            mainType
          )}&type2=${encodeURIComponent(subType)}&limit=20`;

    const res = await fetch(url);
    const data = await res.json();

    setCars(data.vehicles || []);
    setLoading(false);
  }

  function reset() {
    setSelectedMainType("");
    setSelectedLabel("");
    setCars([]);
  }

  const options =
    selectedMainType === "軽自動車"
      ? keiOptions
      : selectedMainType === "普通車"
      ? normalOptions
      : [];

  return (
    <main style={{ padding: 20, maxWidth: 720, margin: "0 auto" }}>
      <h1 style={{ fontSize: 42, marginBottom: 24 }}>ざっくり診断</h1>

      {!selectedMainType && (
        <>
          <p style={{ fontSize: 18, marginBottom: 18 }}>
            まずは探している車の大きさを選んでください。
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <button onClick={() => setSelectedMainType("軽自動車")}>
              軽自動車
            </button>

            <button onClick={() => setSelectedMainType("普通車")}>
              普通車
            </button>
          </div>
        </>
      )}

      {selectedMainType && (
        <>
          <button
            onClick={reset}
            style={{
              marginBottom: 18,
              background: "transparent",
              border: "none",
              textDecoration: "underline",
              fontSize: 14,
            }}
          >
            最初に戻る
          </button>

          <h2 style={{ fontSize: 28, marginBottom: 18 }}>
            {selectedMainType}のタイプを選んでください
          </h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {options.map((option) => (
              <button
                key={option}
                onClick={() => search(selectedMainType, option)}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}

      {loading && <p style={{ marginTop: 24 }}>検索中...</p>}

      {!loading && selectedLabel && (
        <h2 style={{ marginTop: 30, fontSize: 22 }}>
          {selectedMainType}・{selectedLabel}のおすすめ在庫
        </h2>
      )}

      <div
        style={{
          marginTop: 18,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        {cars.map((car) => (
          <a
            key={car.stockId}
            href={car.gooUrl || car.detailUrl || "#"}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "block",
              border: "1px solid #ddd",
              borderRadius: 12,
              overflow: "hidden",
              background: "#fff",
              color: "inherit",
              textDecoration: "none",
            }}
          >
            {car.imageUrl && (
              <img
                src={car.imageUrl}
                alt={car.title}
                style={{ width: "100%", display: "block" }}
              />
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

              <div style={{ marginTop: 10, fontSize: 14, fontWeight: "bold" }}>
                詳細を見る
              </div>
            </div>
          </a>
        ))}
      </div>
    </main>
  );
}
