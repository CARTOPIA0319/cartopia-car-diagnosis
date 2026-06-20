"use client";

import { useState } from "react";

export default function DiagnosisPage() {
  const [selectedMainType, setSelectedMainType] = useState("");
  const [selectedLabel, setSelectedLabel] = useState("");
  const [cars, setCars] = useState([]);
  const [loading, setLoading] = useState(false);

  const keiOptions = [
    { label: "スライドドア", type: "スライドドア" },
    { label: "スタンダード", type: "スタンダード" },
    { label: "SUV", type: "SUV" },
    { label: "トラック", type: "トラック" },
    { label: "スポーティ", type: "スポーティ" },
    { label: "特にこだわりはない", type: "特にこだわりはない" },
  ];

  const normalOptions = [
    { label: "コンパクトカー", type: "コンパクトカー" },
    { label: "ミニバン", type: "ミニバン" },
    { label: "SUV", type: "SUV" },
    { label: "セダン", type: "セダン" },
    { label: "ステーションワゴン", type: "ステーションワゴン" },
    { label: "低燃費・ハイブリッド", type: "EV・HV" },
    { label: "スポーティ", type: "スポーティ" },
    { label: "バン・トラック", type: "バン・トラック" },
  ];

  async function search(mainType, option) {
    setLoading(true);
    setSelectedLabel(option.label);

    const url =
      option.type === "特にこだわりはない"
        ? `/api/inventory/search?type=${encodeURIComponent(mainType)}&limit=20`
        : `/api/inventory/search?type1=${encodeURIComponent(
            mainType
          )}&type2=${encodeURIComponent(option.type)}&limit=20`;

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
                key={option.label}
                onClick={() => search(selectedMainType, option)}
              >
                {option.label}
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
