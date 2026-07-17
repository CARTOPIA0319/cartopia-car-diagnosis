"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";

const LAST_DIAGNOSIS_STORAGE_KEY =
  "cartopia-perfect-diagnosis-result-v1";

const LOADING_STEPS = [
  "ご家族の人数と、日常の使い方を整理しています。",
  "希望条件に合う車種を、一台ずつ比較しています。",
  "数年後の暮らしまで見据えて候補を見直しています。",
  "マッチ度を確認し、最終候補を5台に絞っています。",
];

const MAX_PASSENGER_OPTIONS = [
  { label: "1〜2人", seats: 2 },
  { label: "3〜4人", seats: 4 },
  { label: "5人", seats: 5 },
  { label: "6〜7人", seats: 7 },
  { label: "8人以上", seats: 8 },
];

const DRIVER_AGE_OPTIONS = [
  "18〜29歳",
  "30〜39歳",
  "40〜49歳",
  "50〜59歳",
  "60〜69歳",
  "70〜79歳",
  "80歳以上",
];

const PASSENGER_AGE_OPTIONS = [
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
  "小学生（年齢未指定）",
  "中学生",
  "高校生",
  "18〜29歳",
  "30〜49歳",
  "50〜59歳",
  "60〜69歳",
  "70〜79歳",
  "80歳以上",
];

const TYPE_GROUPS = [
  {
    title: "軽自動車",
    options: [
      { label: "スライドドア", value: "軽自動車 スライドドア" },
      { label: "スタンダード", value: "軽自動車 スタンダード" },
      { label: "SUV", value: "軽自動車 SUV" },
      { label: "トラック", value: "軽自動車 トラック" },
      { label: "スポーティ", value: "軽自動車 スポーティ" },
    ],
  },
  {
    title: "普通車",
    options: [
      { label: "コンパクトカー", value: "普通車 コンパクトカー" },
      { label: "ミニバン", value: "普通車 ミニバン" },
      { label: "SUV", value: "普通車 SUV" },
      { label: "セダン", value: "普通車 セダン" },
      { label: "ステーションワゴン", value: "普通車 ステーションワゴン" },
      { label: "低燃費・HV", value: "普通車 EV・HV" },
      { label: "スポーティ", value: "普通車 スポーティ" },
      { label: "バン・トラック", value: "普通車 バン・トラック" },
    ],
  },
];

const LIGHT_TYPE_KEYS =
  TYPE_GROUPS.find((group) => group.title === "軽自動車")?.options.map(
    (option) => option.value
  ) || [];

const ALL_TYPE_OPTIONS = TYPE_GROUPS.flatMap((group) => group.options);

const AVOID_CONDITION_OPTIONS = [
  "スライドドア",
  "大きい車",
  "小さい車",
  "車高が高い車",
  "車高が低い車",
  "商用車っぽい車",
  "カスタム系",
  "輸入車",
  "ハイブリッド・EV",
];

const REPLACEMENT_REASON_OPTIONS = [
  "大きすぎる",
  "小さすぎる",
  "運転しにくい",
  "燃費が悪い",
  "故障・不具合",
  "古くなった",
  "安全性能を上げたい",
  "荷物が積みにくい",
  "乗る人数が変わった",
  "デザインに飽きた",
  "塗装や外装の劣化",
  "維持費が高い",
];

const WANTED_CONDITION_GROUPS = [
  {
    title: "見た目・雰囲気",
    options: [
      { label: "高級感", weight: 100 },
      { label: "かっこいい", weight: 90 },
      { label: "スポーティ", weight: 80 },
      { label: "かわいい", weight: 80 },
      { label: "アウトドア系", weight: 70 },
      { label: "カスタム系", weight: 60 },
      { label: "ノーマル系", weight: 55 },
      { label: "シンプル", weight: 45 },
    ],
  },
  {
    title: "使いやすさ・性能",
    options: [
      { label: "スライドドア", weight: 95 },
      { label: "運転しやすい", weight: 90 },
      { label: "乗り心地が良い", weight: 90 },
      { label: "室内が広い", weight: 85 },
      { label: "静粛性が高い", weight: 85 },
      { label: "安全性能", weight: 80 },
      { label: "4WD", weight: 80 },
      { label: "荷室が広い", weight: 75 },
      { label: "加速・走り", weight: 75 },
      { label: "燃費が良い", weight: 70 },
    ],
  },
];

function splitTokens(value) {
  return String(value || "")
    .split(/[\n,，、/／・]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function makeOwnedCar(id = "car-1") {
  return {
    id,
    model: "",
    mainDriver: "",
    bodyType: "",
  };
}

function makeInitialForm() {
  return {
    maxPassengers: "",
    driverAges: [],
    passengerAges: [],

    hasOwnedCars: "",
    ownedCars: [makeOwnedCar()],
    purchasePlan: "",
    replacementTargetId: "",
    replacementReasons: [],
    replacementReasonMemo: "",

    avoidNone: false,
    avoidManufacturers: "",
    avoidModels: "",
    avoidBodyTypes: [],
    avoidConditions: [],
    avoidManufacturerReason: "",
    avoidModelReason: "",

    desiredManufacturers: "",
    desiredBodyTypes: [],
    desiredConditions: [],

    otherRequest: "",
  };
}

function ChoiceGrid({
  options,
  selected,
  onToggle,
  single = false,
  disabledValues = [],
  columns = "two",
  compact = false,
  className = "",
}) {
  return (
    <div
      className={`choice-grid choice-grid-${columns} ${
        compact ? "choice-grid-compact" : ""
      } ${className}`}
    >
      {options.map((option) => {
        const value =
          typeof option === "string" ? option : option.value ?? option.label;

        const label =
          typeof option === "string" ? option : option.label;

        const active = single
          ? selected === value
          : Array.isArray(selected) && selected.includes(value);

        const disabled = disabledValues.includes(value);
        const isWide = compact && String(label).length >= 9;

        return (
          <button
            key={value}
            type="button"
            className={`choice-button ${active ? "active" : ""} ${
              disabled ? "disabled" : ""
            } ${isWide ? "wide-option" : ""}`}
            disabled={disabled}
            aria-pressed={active}
            onClick={() => {
              if (!disabled) {
                onToggle(value);
              }
            }}
          >
            <span className="check-box" aria-hidden="true">
              {active ? "✓" : ""}
            </span>

            <span className="choice-label">{label}</span>
          </button>
        );
      })}
    </div>
  );
}

function TypeChoiceGrid({
  selected,
  onToggle,
  showNoPreference = false,
  disabledValues = [],
  disabledMessage = "",
}) {
  return (
    <div className="type-groups">
      {TYPE_GROUPS.map((group) => {
        const groupDisabledValues =
          group.title === "軽自動車" ? disabledValues : [];

        return (
          <section className="type-group" key={group.title}>
            <div className="type-group-header">
              <p>{group.title}</p>
              <span>{group.options.length}タイプ</span>
            </div>

            <ChoiceGrid
              options={group.options}
              selected={selected}
              onToggle={onToggle}
              disabledValues={groupDisabledValues}
              columns="two"
            />

            {groupDisabledValues.length > 0 && disabledMessage ? (
              <p className="disabled-note">{disabledMessage}</p>
            ) : null}
          </section>
        );
      })}

      {showNoPreference ? (
        <ChoiceGrid
          options={[
            {
              label: "タイプはまだ決めていない",
              value: "特にこだわらない",
            },
          ]}
          selected={selected}
          onToggle={onToggle}
          columns="one"
        />
      ) : null}
    </div>
  );
}

function QuestionHeader({ number, title, titleLines = [], note }) {
  const lines =
    titleLines.length > 0
      ? titleLines
      : [title];

  return (
    <header className="question-header">
      <span className="question-number">質問 {number}</span>

      <h2>
        {lines.map((line, index) => (
          <span
            className="question-title-line"
            key={`${line}-${index}`}
          >
            {line}
          </span>
        ))}
      </h2>

      {note ? <p>{note}</p> : null}
    </header>
  );
}

function RecommendationCard({ recommendation }) {
  return (
    <article className="recommendation-card">
      <div className="recommendation-top">
        <span className="rank-badge">{recommendation.rank}位</span>
        <span className="score-badge">
          マッチ度 {recommendation.score}点
        </span>
      </div>

      <p className="maker-name">{recommendation.maker}</p>
      <h3>{recommendation.model}</h3>

      <div className="tag-list">
        <span>{recommendation.typeKey}</span>

        {recommendation.maxSeats > 0 ? (
          <span>最大{recommendation.maxSeats}人乗り</span>
        ) : null}
      </div>

      <h4>おすすめ理由</h4>
      <p>{recommendation.reason}</p>

      {recommendation.futureFit ? (
        <>
          <h4>これからの暮らし</h4>
          <p>{recommendation.futureFit}</p>
        </>
      ) : null}

      {recommendation.caution ? (
        <aside className="caution-box">
          <strong>確認したい点</strong>
          <p>{recommendation.caution}</p>
        </aside>
      ) : null}
    </article>
  );
}

export default function Home() {
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(makeInitialForm);
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [liffReady, setLiffReady] = useState(false);
  const [liffError, setLiffError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);

  const requiredSeats =
    MAX_PASSENGER_OPTIONS.find(
      (item) => item.label === form.maxPassengers
    )?.seats || 0;

  const hasLightTypeSelected = form.desiredBodyTypes.some((typeKey) =>
    LIGHT_TYPE_KEYS.includes(typeKey)
  );

  const validOwnedCars = form.ownedCars.filter(
    (car) => car.model.trim() || car.mainDriver.trim() || car.bodyType
  );

  const replacementTarget = validOwnedCars.find(
    (car) => car.id === form.replacementTargetId
  );

  const retainedCars =
    form.hasOwnedCars === "yes" && form.purchasePlan === "乗り換え"
      ? validOwnedCars.filter(
          (car) => car.id !== form.replacementTargetId
        )
      : [];

  const rankedRecommendations = useMemo(() => {
    const recommendations = Array.isArray(
      diagnosis?.recommendations
    )
      ? diagnosis.recommendations
      : [];

    return recommendations
      .map((recommendation, originalIndex) => ({
        ...recommendation,
        originalIndex,
        numericScore:
          Number.parseFloat(
            String(recommendation.score ?? 0)
          ) || 0,
      }))
      .sort(
        (first, second) =>
          second.numericScore -
            first.numericScore ||
          first.originalIndex -
            second.originalIndex
      )
      .slice(0, 5)
      .map(
        (
          {
            originalIndex,
            numericScore,
            ...recommendation
          },
          index
        ) => ({
          ...recommendation,
          rank: index + 1,
          score: numericScore,
        })
      );
  }, [diagnosis]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return undefined;
    }

    const timer = window.setInterval(() => {
      setLoadingStep(
        (current) =>
          (current + 1) %
          LOADING_STEPS.length
      );
    }, 2400);

    return () => {
      window.clearInterval(timer);
    };
  }, [loading]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    if (params.get("restore") !== "1") {
      return;
    }

    try {
      const savedValue =
        window.localStorage.getItem(
          LAST_DIAGNOSIS_STORAGE_KEY
        );

      if (!savedValue) {
        return;
      }

      const saved =
        JSON.parse(savedValue);

      const isRecent =
        Date.now() -
          Number(saved.savedAt || 0) <
        24 * 60 * 60 * 1000;

      if (
        !isRecent ||
        !saved.form ||
        !saved.diagnosis
      ) {
        window.localStorage.removeItem(
          LAST_DIAGNOSIS_STORAGE_KEY
        );
        return;
      }
            setForm(saved.form);
      setDiagnosis(saved.diagnosis);
      setPage(3);
    } catch {
      window.localStorage.removeItem(
        LAST_DIAGNOSIS_STORAGE_KEY
      );
    }
  }, []);

  const answerSummary = useMemo(() => {
    let ownedCarsText = "所有なし";

    if (form.hasOwnedCars === "yes") {
      if (form.purchasePlan === "乗り換え") {
        ownedCarsText =
          form.ownedCars
            .filter((car) => car.model.trim() || car.bodyType)
            .map((car) =>
              [
                car.model,
                car.mainDriver ? `主に${car.mainDriver}` : "",
                car.bodyType,
              ]
                .filter(Boolean)
                .join("／")
            )
            .join("、") || "所有あり";
      } else {
        ownedCarsText = "所有あり（車種情報は省略）";
      }
    }

    const purchaseText =
      form.purchasePlan === "乗り換え"
        ? [
            replacementTarget?.model || "対象車未指定",
            ...form.replacementReasons,
            form.replacementReasonMemo,
          ]
            .filter(Boolean)
            .join("／")
        : form.purchasePlan || "未回答";

    const avoidText = form.avoidNone
      ? "特になし"
      : [
          form.avoidManufacturers
            ? `メーカー：${form.avoidManufacturers}`
            : "",
          form.avoidManufacturerReason
            ? `メーカーを避けたい理由：${form.avoidManufacturerReason}`
            : "",
          form.avoidModels
            ? `車種：${form.avoidModels}`
            : "",
          form.avoidModelReason
            ? `車種を避けたい理由：${form.avoidModelReason}`
            : "",
          form.avoidBodyTypes.length
            ? `タイプ：${form.avoidBodyTypes.join("、")}`
            : "",
          form.avoidConditions.length
            ? `条件：${form.avoidConditions.join("、")}`
            : "",
        ]
          .filter(Boolean)
          .join("／");

    const desiredText = [
      form.desiredManufacturers
        ? `メーカー：${form.desiredManufacturers}`
        : "",
      form.desiredBodyTypes.length
        ? `タイプ：${form.desiredBodyTypes.join("、")}`
        : "",
      form.desiredConditions.length
        ? `条件：${form.desiredConditions.join("、")}`
        : "",
    ]
      .filter(Boolean)
      .join("／");

    return [
      ["最大乗車人数", form.maxPassengers || "未回答"],
      ["運転する人", form.driverAges.join("、") || "未回答"],
      ["一緒に乗る人", form.passengerAges.join("、") || "未選択"],
      ["世帯の所有車", ownedCarsText],
      ["今回の購入", purchaseText],
      ["気になる車", desiredText || "未回答"],
      ["避けたい車", avoidText || "未回答"],
      ["その他", form.otherRequest.trim() || "特になし"],
    ];
  }, [form, replacementTarget]);

  function scrollTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function setMaxPassengers(value) {
    const seats =
      MAX_PASSENGER_OPTIONS.find(
        (item) => item.label === value
      )?.seats || 0;

    setForm((current) => ({
      ...current,
      maxPassengers: value,
      desiredBodyTypes:
        seats >= 5
          ? current.desiredBodyTypes.filter(
              (typeKey) =>
                !LIGHT_TYPE_KEYS.includes(typeKey)
            )
          : current.desiredBodyTypes,
    }));
  }

  async function initializeLiff() {
    if (
      typeof window === "undefined" ||
      !window.liff ||
      !LIFF_ID
    ) {
      return;
    }

    try {
      await window.liff.init({
        liffId: LIFF_ID,
      });

      setLiffReady(true);
      setLiffError("");
    } catch (caughtError) {
      setLiffReady(false);
      setLiffError(
        caughtError.message ||
          "LINE連携の初期化に失敗しました。"
      );
    }
  }

  function buildInventoryLineMessages() {
    const diagnosisTypeKeys =
      rankedRecommendations
        .slice(0, 2)
        .map(
          (recommendation) =>
            recommendation?.typeKey || ""
        )
        .filter(Boolean) || [];

    const fallbackTypeKeys =
      form.desiredBodyTypes.filter(
        (typeKey) =>
          typeKey !== "特にこだわらない"
      );

    const typeKeys = Array.from(
      new Set([
        ...diagnosisTypeKeys,
        ...fallbackTypeKeys,
      ])
    ).slice(0, 2);

    if (typeKeys.length > 0) {
      return typeKeys;
    }

    throw new Error(
      "在庫検索に使う車のタイプを確定できませんでした。"
    );
  }

  function toggleArrayField(
    key,
    value,
    exclusiveValue = ""
  ) {
    setForm((current) => {
      let currentValues = current[key];

      if (
        exclusiveValue &&
        value === exclusiveValue
      ) {
        return {
          ...current,
          [key]: currentValues.includes(value)
            ? []
            : [value],
        };
      }

      if (exclusiveValue) {
        currentValues =
          currentValues.filter(
            (item) =>
              item !== exclusiveValue
          );
      }

      const nextValues =
        currentValues.includes(value)
          ? currentValues.filter(
              (item) =>
                item !== value
            )
          : [
              ...currentValues,
              value,
            ];

      return {
        ...current,
        [key]: nextValues,
      };
    });
  }

  function setHasOwnedCars(value) {
    setForm((current) => {
      if (value === "no") {
        return {
          ...current,
          hasOwnedCars: "no",
          ownedCars: [],
          purchasePlan:
            "増車・新規購入",
          replacementTargetId: "",
          replacementReasons: [],
          replacementReasonMemo: "",
        };
      }

      return {
        ...current,
        hasOwnedCars: "yes",
        ownedCars:
          current.ownedCars.length > 0
            ? current.ownedCars
            : [
                makeOwnedCar(
                  `car-${Date.now()}`
                ),
              ],
        purchasePlan:
          current.hasOwnedCars === "no"
            ? ""
            : current.purchasePlan,
      };
    });
  }

  function updateOwnedCar(
    id,
    key,
    value
  ) {
    setForm((current) => ({
      ...current,
      ownedCars:
        current.ownedCars.map(
          (car) =>
            car.id === id
              ? {
                  ...car,
                  [key]: value,
                }
              : car
        ),
    }));
  }

  function addOwnedCar() {
    setForm((current) => ({
      ...current,
      ownedCars: [
        ...current.ownedCars,
        makeOwnedCar(
          `car-${Date.now()}-${
            current.ownedCars.length + 1
          }`
        ),
      ],
    }));
  }

  function removeOwnedCar(id) {
    setForm((current) => {
      const nextCars =
        current.ownedCars.filter(
          (car) =>
            car.id !== id
        );

      return {
        ...current,
        ownedCars:
          nextCars.length > 0
            ? nextCars
            : [
                makeOwnedCar(
                  `car-${Date.now()}`
                ),
              ],
        replacementTargetId:
          current.replacementTargetId === id
            ? ""
            : current.replacementTargetId,
      };
    });
  }

  function setPurchasePlan(value) {
    setForm((current) => ({
      ...current,
      purchasePlan: value,
      ownedCars:
        value === "乗り換え" &&
        current.ownedCars.length === 0
          ? [
              makeOwnedCar(
                `car-${Date.now()}`
              ),
            ]
          : current.ownedCars,
      replacementTargetId:
        value === "乗り換え"
          ? current.replacementTargetId
          : "",
      replacementReasons:
        value === "乗り換え"
          ? current.replacementReasons
          : [],
      replacementReasonMemo:
        value === "乗り換え"
          ? current.replacementReasonMemo
          : "",
    }));
  }

  function setAvoidNone(value) {
    setForm((current) => {
      if (!value) {
        return {
          ...current,
          avoidNone: false,
        };
      }

      return {
        ...current,
        avoidNone: true,
        avoidManufacturers: "",
        avoidModels: "",
        avoidBodyTypes: [],
        avoidConditions: [],
        avoidManufacturerReason: "",
        avoidModelReason: "",
      };
    });
  }

  function validatePage(targetPage) {
    if (targetPage === 1) {
      if (!form.maxPassengers) {
        return "最大で乗る人数を選んでください。";
      }

      if (
        form.driverAges.length === 0
      ) {
        return "運転する人の年齢を選んでください。";
      }

      if (!form.hasOwnedCars) {
        return "現在、ご家庭で車を所有しているか選んでください。";
      }

      if (!form.purchasePlan) {
        return "増車・新規購入か、乗り換えかを選んでください。";
      }

      if (
        form.purchasePlan === "乗り換え" &&
        (
          form.ownedCars.length === 0 ||
          form.ownedCars.some(
            (car) =>
              !car.model.trim() ||
              !car.bodyType
          )
        )
      ) {
        return "乗り換えの場合は、現在の車種名とタイプを入力してください。";
      }

      if (
        form.purchasePlan === "乗り換え" &&
        !form.replacementTargetId
      ) {
        return "乗り換える予定の車を選んでください。";
      }
    }

    if (targetPage === 2) {
      const hasAvoidInput =
        form.avoidManufacturers.trim() ||
        form.avoidModels.trim() ||
        form.avoidBodyTypes.length > 0 ||
        form.avoidConditions.length > 0 ||
        form.avoidManufacturerReason.trim() ||
        form.avoidModelReason.trim();

      if (
        !form.avoidNone &&
        !hasAvoidInput
      ) {
        return "避けたい車がなければ「特になし」を選んでください。";
      }

      if (
        form.desiredBodyTypes.length === 0
      ) {
        return "気になる車のタイプを選んでください。";
      }

      if (
        form.desiredConditions.length === 0
      ) {
        return "気になる条件を1つ以上選んでください。";
      }
    }

    return "";
  }

  function goToPage(nextPage) {
    const message =
      validatePage(page);

    if (message) {
      setValidationError(message);
      scrollTop();
      return;
    }

    setValidationError("");
    setError("");
    setPage(nextPage);
    scrollTop();
  }

  function goBack() {
    setValidationError("");
    setError("");

    if (page > 1) {
      setPage(
        (current) =>
          current - 1
      );

      scrollTop();
      return;
    }

    if (
      window.history.length > 1
    ) {
      window.history.back();
    }
  }

  function makeWeightedPreferences() {
    return form.desiredConditions.map(
      (label) => {
        const matchedOption =
          WANTED_CONDITION_GROUPS
            .flatMap(
              (group) =>
                group.options
            )
            .find(
              (option) =>
                option.label === label
            );

        return {
          label,
          weight:
            matchedOption?.weight || 50,
        };
      }
    );
  }

  function buildDiagnosisInput() {
    const ownedCarsForDiagnosis =
      form.purchasePlan === "乗り換え"
          form.purchasePlan === "乗り換え"
        ? validOwnedCars
        : [];

    return {
      requiredSeats,
      maximumPassengersLabel:
        form.maxPassengers,
      driverAges:
        form.driverAges,
      passengerAges:
        form.passengerAges,

      household: {
        hasOwnedCars:
          form.hasOwnedCars === "yes",
        ownedCars:
          ownedCarsForDiagnosis,
        purchasePlan:
          form.purchasePlan,
        replacementTarget:
          replacementTarget || null,
        retainedCars,
        replacementReasons:
          form.replacementReasons,
        replacementReasonMemo:
          form.replacementReasonMemo.trim(),
      },

      avoid: {
        none:
          form.avoidNone,
        manufacturers:
          splitTokens(
            form.avoidManufacturers
          ),
        models:
          splitTokens(
            form.avoidModels
          ),
        typeKeys:
          form.avoidBodyTypes,
        conditions:
          form.avoidConditions,
        manufacturerReason:
          form.avoidManufacturerReason.trim(),
        modelReason:
          form.avoidModelReason.trim(),
        reason: [
          form.avoidManufacturerReason.trim()
            ? `避けたいメーカーの理由：${form.avoidManufacturerReason.trim()}`
            : "",
          form.avoidModelReason.trim()
            ? `避けたい車種の理由：${form.avoidModelReason.trim()}`
            : "",
        ]
          .filter(Boolean)
          .join("／"),
      },

      desired: {
        manufacturers:
          splitTokens(
            form.desiredManufacturers
          ),
        typeKeys:
          requiredSeats >= 5
            ? form.desiredBodyTypes.filter(
                (typeKey) =>
                  !LIGHT_TYPE_KEYS.includes(
                    typeKey
                  )
              )
            : form.desiredBodyTypes,
        weightedPreferences:
          makeWeightedPreferences(),
      },

      otherRequest:
        form.otherRequest.trim(),

      answerSummary:
        answerSummary.map(
          ([label, value]) => ({
            label,
            value,
          })
        ),
    };
  }

  async function runAiDiagnosis() {
    const message =
      validatePage(2);

    if (message) {
      setValidationError(message);
      setPage(2);
      scrollTop();
      return;
    }

    setLoading(true);
    setError("");
    setDiagnosis(null);
    setValidationError("");
    setShowAnswers(false);
    setInventoryError("");
    scrollTop();

    try {
      const response =
        await fetch(
          "/api/diagnose",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body:
              JSON.stringify({
                mode: "perfect",
                diagnosisInput:
                  buildDiagnosisInput(),
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "診断に失敗しました。"
        );
      }

      if (
        !Array.isArray(
          data.result?.recommendations
        )
      ) {
        throw new Error(
          "診断結果の形式が正しくありません。"
        );
      }

      setDiagnosis(data.result);

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          LAST_DIAGNOSIS_STORAGE_KEY,
          JSON.stringify({
            savedAt: Date.now(),
            form,
            diagnosis: data.result,
          })
        );
      }
    } catch (caughtError) {
      setError(
        caughtError.message ||
          "エラーが発生しました。"
      );
    } finally {
      setLoading(false);
    }
  }

  function buildDiagnosisReturnFlexMessage() {
    const returnUrl =
      `https://liff.line.me/${LIFF_ID}?restore=1`;

    return {
      type: "flex",
      altText:
        "ぴったり車種診断の結果をもう一度見る",
      contents: {
        type: "bubble",
        size: "kilo",
        body: {
          type: "box",
          layout: "vertical",
          spacing: "md",
          contents: [
            {
              type: "text",
              text: "ぴったり車種診断",
              weight: "bold",
              color: "#D6B55B",
              size: "sm",
            },
            {
              type: "text",
              text: "診断結果をもう一度確認できます",
              weight: "bold",
              color: "#07111F",
              size: "lg",
              wrap: true,
            },
            {
              type: "text",
              text: "在庫を見たあとも、下のボタンからすぐに戻れます。",
              color: "#667085",
              size: "sm",
              wrap: true,
            },
          ],
        },
        footer: {
          type: "box",
          layout: "vertical",
          contents: [
            {
              type: "button",
              style: "primary",
              color: "#D6B55B",
              height: "sm",
              action: {
                type: "uri",
                label: "診断結果をもう一度見る",
                uri: returnUrl,
              },
            },
          ],
        },
        styles: {
          body: {
            backgroundColor: "#F8FAFC",
          },
          footer: {
            backgroundColor: "#F8FAFC",
          },
        },
      },
    };
  }

  async function sendMatchedInventoryToLine() {
    setInventoryLoading(true);
    setInventoryError("");

    try {
      if (
        typeof window === "undefined" ||
        !window.liff
      ) {
        throw new Error(
          "LINE連携の準備ができていません。少し待ってからもう一度押してください。"
        );
      }

      if (!liffReady) {
        if (!LIFF_ID) {
          throw new Error(
            "NEXT_PUBLIC_LIFF_IDが設定されていません。"
          );
        }

        await window.liff.init({
          liffId: LIFF_ID,
        });

        setLiffReady(true);
      }

      if (
        !window.liff.isInClient()
      ) {
        throw new Error(
          "LINE内のぴったり診断から開いてください。"
        );
      }

      const inventoryLineMessages =
        buildInventoryLineMessages();

      await window.liff.sendMessages([
        ...inventoryLineMessages.map(
          (typeKey) => ({
            type: "text",
            text: typeKey,
          })
        ),
        buildDiagnosisReturnFlexMessage(),
      ]);

      window.liff.closeWindow();
    } catch (caughtError) {
      setInventoryError(
        caughtError.message ||
          "LINEへの在庫検索依頼送信に失敗しました。"
      );
    } finally {
      setInventoryLoading(false);
    }
  }

  function openEditPage(targetPage) {
    setDiagnosis(null);
    setError("");
    setValidationError("");
    setShowAnswers(false);
    setInventoryError("");
    setPage(targetPage);
    scrollTop();
  }

  function restart() {
    setPage(1);
    setForm(makeInitialForm());
    setDiagnosis(null);
    setLoading(false);
    setError("");
    setValidationError("");
    setShowAnswers(false);
    setInventoryLoading(false);
    setInventoryError("");

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(
        LAST_DIAGNOSIS_STORAGE_KEY
      );

      window.history.replaceState(
        {},
        "",
        window.location.pathname
      );
    }

    scrollTop();
  }

  return (
    <main>
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
        onLoad={initializeLiff}
        onError={() => {
          setLiffReady(false);
          setLiffError(
            "LINE連携用SDKの読み込みに失敗しました。"
          );
        }}
      />

      <section className="shell">
        <img
          className="logo"
          src="/cartopia-logo.png"
          alt="カーとぴあ CARTOPIA"
        />

        <div className="title-area">
          <h1>ぴったり車種診断</h1>

          {!diagnosis &&
          !loading &&
          !error ? (
            <div className="page-badge">
              {page} / 3
            </div>
          ) : null}
        </div>

        {validationError ? (
          <div className="alert-box">
            {validationError}
          </div>
        ) : null}

        {!diagnosis &&
        !loading &&
        !error &&
        page === 1 ? (
          <div className="page-stack">
            <section className="question-card">
              <QuestionHeader
                number="1"
                titleLines={[
                  "この車に最大で何人",
                  "乗りますか？",
                ]}
                note="年に数回でも乗る可能性がある最大人数を選んでください。"
              />

              <ChoiceGrid
                options={MAX_PASSENGER_OPTIONS.map(
                  (item) =>
                    item.label
                )}
                selected={
                  form.maxPassengers
                }
                single
                onToggle={
                  setMaxPassengers
                }
                disabledValues={
                  hasLightTypeSelected
                    ? MAX_PASSENGER_OPTIONS.filter(
                        (item) =>
                          item.seats >= 5
                      ).map(
                        (item) =>
                          item.label
                      )
                    : []
                }
                columns="two"
                className="passenger-grid"
              />

              {hasLightTypeSelected ? (
                <p className="disabled-note passenger-disabled-note">
                  軽自動車を選択しているため、5人以上は選べません。
                </p>
              ) : null}

              <div className="field-block">
                <div className="field-heading">
                  <p>
                    運転する人の年齢
                  </p>

                  <span>
                    複数選択可
                  </span>
                </div>

                <ChoiceGrid
                  options={
                    DRIVER_AGE_OPTIONS
                  }
                  selected={
                    form.driverAges
                  }
                  onToggle={(value) =>
                    toggleArrayField(
                      "driverAges",
                      value
                    )
                  }
                  columns="two"
                  compact
                />
              </div>

              <div className="field-block">
                <div className="field-heading">
                  <p>
                    一緒に乗る人の年齢
                  </p>

                  <span>
                    複数選択可
                  </span>
                </div>

                <p className="helper-text">
                  お子さんの成長や、将来の使い方も診断に反映します。
                </p>

                <ChoiceGrid
                  options={
                    PASSENGER_AGE_OPTIONS
                  }
                  selected={
                    form.passengerAges
                  }
                  onToggle={(value) =>
                    toggleArrayField(
                      "passengerAges",
                      value
                    )
                  }
                  columns="three"
                  compact
                />
              </div>
            </section>

            <section className="question-card">
              <QuestionHeader
                number="2"
                titleLines={[
                  "今のご家庭の車と、",
                  "今回の購入について",
                ]}
                note="乗り換えの場合だけ、現在の車について入力します。"
              />

              <div className="field-block first-field">
                <div className="field-heading">
                  <p>
                    現在、ご家庭で車を所有していますか？
                  </p>
                </div>

                <ChoiceGrid
                  options={[
                    "所有している",
                    "所有していない",
                  ]}
                  selected={
                    form.hasOwnedCars === "yes"
                      ? "所有している"
                      : form.hasOwnedCars === "no"
                        ? "所有していない"
                        : ""
                  }
                  single
                  onToggle={(value) =>
                    setHasOwnedCars(
                      value ===
                      "所有している"
                        ? "yes"
                        : "no"
                    )
                  }
                  columns="two"
                />
              </div>

              {form.hasOwnedCars ===
              "yes" ? (
                <div className="field-block">
                  <div className="field-heading">
                    <p>
                      今回はどちらですか？
                    </p>
                  </div>

                  <ChoiceGrid
                    options={[
                      "増車・新規購入",
                      "乗り換え",
                    ]}
                    selected={
                      form.purchasePlan
                    }
                    single
                    onToggle={
                      setPurchasePlan
                    }
                    columns="two"
                  />
                </div>
              ) : null}

              {form.hasOwnedCars ===
              "no" ? (
                <div className="info-strip">
                  新規購入として診断します。現在の車の入力は不要です。
                </div>
              ) : null}

              {form.hasOwnedCars ===
                "yes" &&
              form.purchasePlan ===
                "増車・新規購入" ? (
                <div className="info-strip">
                  増車の場合、現在の車の入力は省略できます。
                </div>
              ) : null}

              {form.hasOwnedCars ===
                "yes" &&
              form.purchasePlan ===
                "乗り換え" ? (
                <div className="replacement-area">
                  <div className="field-heading replacement-title">
                    <p>
                      現在所有している車
                    </p>

                    <span>
                      乗り換える車を入力
                    </span>
                  </div>

                  {form.ownedCars.map(
                    (car, index) => (
                      <div
                        className="owned-car-card"
                        key={car.id}
                      >
                        <div className="owned-car-header">
                          <strong>
                            所有車 {index + 1}
                          </strong>

                          {form.ownedCars
                            .length > 1 ? (
                            <button
                              type="button"
                              onClick={() =>
                                removeOwnedCar(
                                  car.id
                                )
                              }
                            >
                              削除
                            </button>
                          ) : null}
                        </div>

                        <label>
                          <span>
                            車種名
                          </span>

                          <input
                            value={
                              car.model
                            }
                            onChange={(
                              event
                            ) =>
                              updateOwnedCar(
                                car.id,
                                "model",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="例：アルファード"
                          />
                        </label>

                        <label>
                          <span>
                            主に乗る人（任意）
                          </span>

                          <input
                            value={
                              car.mainDriver
                            }
                            onChange={(
                              event
                            ) =>
                              updateOwnedCar(
                                car.id,
                                "mainDriver",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="例：妻、夫、自分"
                          />
                        </label>

                        <label>
                          <span>
                            車のタイプ
                          </span>

                          <select
                            value={
                              car.bodyType
                            }
                            onChange={(
                              event
                            ) =>
                              updateOwnedCar(
                                car.id,
                                "bodyType",
                                event
                                  .target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              選択してください
                            </option>

                            {ALL_TYPE_OPTIONS.map(
                              (
                                option
                              ) => (
                                <option
                                  key={
                                    option.value
                                  }
                                  value={
                                    option.value
                                  }
                                >
                                  {option.value.replace(
                                    " ",
                                    "・"
                                  )}
                                </option>
                              )
                            )}

                            <option value="その他・分からない">
                              その他・分からない
                            </option>
                          </select>
                        </label>
                      </div>
                    )
                  )}

                  <button
                    type="button"
                    className="add-button"
                    onClick={addOwnedCar}
                  >
                    ＋ 所有車を追加
                  </button>

                  <label className="standalone-label">
                    <span>
                      乗り換える予定の車
                    </span>

                    <select
                      value={
                        form.replacementTargetId
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "replacementTargetId",
                          event
                            .target
                            .value
                        )
                      }
                    >
                      <option value="">
                        選択してください
                      </option>

                      {form.ownedCars.map(
                        (car, index) => (
                          <option
                            key={
                              car.id
                            }
                            value={
                              car.id
                            }
                          >
                            {car.model ||
                              `所有車 ${
                                index + 1
                              }`}
                          </option>
                        )
                      )}
                    </select>
                  </label>

                  <div className="field-block">
                    <div className="field-heading">
                      <p>
                        乗り換えようと思った理由
                      </p>

                      <span>
                        複数選択可
                      </span>
                    </div>

                    <ChoiceGrid
                      options={
                        REPLACEMENT_REASON_OPTIONS
                      }
                      selected={
                        form.replacementReasons
                      }
                      onToggle={(value) =>
                        toggleArrayField(
                          "replacementReasons",
                          value
                        )
                      }
                      columns="two"
                      compact
                    />
                  </div>

                  <label className="standalone-label">
                    <span>
                      乗り換え理由の詳細（任意）
                    </span>

                    <textarea
                      value={
                        form.replacementReasonMemo
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "replacementReasonMemo",
                          event
                            .target
                            .value
                        )
                      }
                      placeholder="例：修理中に車へ乗れない期間が困る。"
                    />
                  </label>
                </div>
              ) : null}
            </section>

            <nav>
              <button
                type="button"
                className="back-button"
                onClick={goBack}
              >
                前の画面に戻る
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  goToPage(2)
                }
              >
                次へ
              </button>
            </nav>
          </div>
        ) : null}

        {!diagnosis &&
        !loading &&
        !error &&
        page === 2 ? (
          <div className="page-stack">
            <section className="question-card">
              <QuestionHeader
                number="3"
                titleLines={[
                  "気になる車や条件を",
                  "教えてください",
                ]}
                note="候補を絞り込むため、気になるタイプや条件を選んでください。"
              />

              <label>
                <span>
                  気になるメーカー（任意）
                </span>

                <input
                  value={
                    form.desiredManufacturers
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "desiredManufacturers",
                      event.target.value
                    )
                  }
                  placeholder="気になるメーカー名を入力（なければ空欄）"
                />
              </label>

              <div className="field-block">
                <div className="field-heading">
                  <p>
                    気になる車のタイプ
                  </p>

                  <span>
                    複数選択可
                  </span>
                </div>

                <TypeChoiceGrid
                  selected={
                    form.desiredBodyTypes
                  }
                  onToggle={(value) =>
                    toggleArrayField(
                      "desiredBodyTypes",
                      value,
                      "特にこだわらない"
                    )
                  }
                  disabledValues={
                    requiredSeats >= 5
                      ? LIGHT_TYPE_KEYS
                      : []
                  }
                  disabledMessage={
                    requiredSeats >= 5
                      ? "5人以上を選択しているため、軽自動車は選べません。"
                      : ""
                  }
                  showNoPreference
                />
              </div>

              {WANTED_CONDITION_GROUPS.map(
                (group) => (
                  <div
                    className="field-block"
                    key={group.title}
                  >
                    <div className="field-heading">
                      <p>
                        {group.title}
                      </p>

                      <span>
                        複数選択可
                      </span>
                    </div>

                    <ChoiceGrid
                      options={group.options.map(
                        (option) =>
                          option.label
                      )}
                      selected={
                        form.desiredConditions
                      }
                      onToggle={(value) =>
                        toggleArrayField(
                          "desiredConditions",
                          value
                        )
                      }
                      columns="two"
                      compact
                    />
                  </div>
                )
              )}
            </section>

            <section className="question-card">
              <QuestionHeader
                number="4"
                titleLines={[
                  "避けたい車を",
                  "教えてください",
                ]}
                note="該当するものがなければ「特になし」を選んでください。"
              />

              <ChoiceGrid
                options={[
                  "特になし",
                ]}
                selected={
                  form.avoidNone
                    ? "特になし"
                    : ""
                }
                single
                onToggle={() =>
                  setAvoidNone(
                    !form.avoidNone
                  )
                }
                columns="one"
              />

              {!form.avoidNone ? (
                <div className="form-stack">
                  <label>
                    <span>
                      避けたいメーカー
                    </span>

                    <input
                      value={
                        form.avoidManufacturers
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "avoidManufacturers",
                          event.target.value
                        )
                      }
                      placeholder="ここにメーカー名を入力"
                    />
                  </label>

                  <label>
                    <span>
                      そのメーカーを避けたい理由（任意）
                    </span>

                    <textarea
                      value={
                        form.avoidManufacturerReason
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "avoidManufacturerReason",
                          event.target.value
                        )
                      }
                      placeholder="理由があれば入力してください"
                    />
                  </label>
                  <label>
                    <span>
                      避けたい車種
                    </span>

                    <input
                      value={
                        form.avoidModels
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "avoidModels",
                          event.target.value
                        )
                      }
                      placeholder="ここに車種名を入力"
                    />
                  </label>

                  <label>
                    <span>
                      その車種を避けたい理由（任意）
                    </span>

                    <textarea
                      value={
                        form.avoidModelReason
                      }
                      onChange={(
                        event
                      ) =>
                        updateField(
                          "avoidModelReason",
                          event.target.value
                        )
                      }
                      placeholder="理由があれば入力してください"
                    />
                  </label>

                  <div className="field-block">
                    <div className="field-heading">
                      <p>
                        避けたい車のタイプ
                      </p>

                      <span>
                        複数選択可
                      </span>
                    </div>

                    <TypeChoiceGrid
                      selected={
                        form.avoidBodyTypes
                      }
                      onToggle={(value) =>
                        toggleArrayField(
                          "avoidBodyTypes",
                          value
                        )
                      }
                    />
                  </div>

                  <div className="field-block">
                    <div className="field-heading">
                      <p>
                        避けたい条件
                      </p>

                      <span>
                        複数選択可
                      </span>
                    </div>

                    <ChoiceGrid
                      options={
                        AVOID_CONDITION_OPTIONS
                      }
                      selected={
                        form.avoidConditions
                      }
                      onToggle={(value) =>
                        toggleArrayField(
                          "avoidConditions",
                          value
                        )
                      }
                      columns="two"
                      compact
                    />
                  </div>
                </div>
              ) : null}
            </section>

            <nav>
              <button
                type="button"
                className="back-button"
                onClick={goBack}
              >
                1ページ目に戻る
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  goToPage(3)
                }
              >
                次へ
              </button>
            </nav>
          </div>
        ) : null}

        {!diagnosis &&
        !loading &&
        !error &&
        page === 3 ? (
          <div className="page-stack">
            <section className="question-card">
              <QuestionHeader
                number="5"
                titleLines={[
                  "その他の希望や",
                  "気になること",
                ]}
                note="選択肢にない希望があれば入力してください。空欄でも診断できます。"
              />

              <div className="tip-box">
                <strong>
                  入力例
                </strong>

                <span>
                  犬を乗せる／長距離が多い／家族も運転する／車中泊したい、など
                </span>
              </div>

              <label>
                <span>
                  自由入力欄
                </span>

                <textarea
                  className="large-textarea"
                  value={
                    form.otherRequest
                  }
                  onChange={(
                    event
                  ) =>
                    updateField(
                      "otherRequest",
                      event
                        .target
                        .value
                    )
                  }
                  placeholder="希望や不安、今の車で気に入っている点などを入力してください。"
                />
              </label>
            </section>

            <nav>
              <button
                type="button"
                className="back-button"
                onClick={goBack}
              >
                2ページ目に戻る
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={
                  runAiDiagnosis
                }
              >
                AIで診断する
              </button>
            </nav>
          </div>
        ) : null}

        {loading ? (
          <div className="loading-box loading-experience">
            <div
              className="loading-orbit"
              aria-hidden="true"
            >
              <span />
              <span />
              <span />
            </div>

            <strong>
              カーとぴあが選定中
            </strong>

            <h2>
              条件を読み解きながら、
              <br />
              本当に合う車を探しています。
            </h2>

            <div className="loading-step-card">
              <span className="loading-step-number">
                0{loadingStep + 1}
              </span>

              <p key={loadingStep}>
                {LOADING_STEPS[loadingStep]}
              </p>
            </div>

            <div
              className="loading-progress"
              aria-hidden="true"
            >
              <span key={loadingStep} />
            </div>

            <p className="loading-caption">
              カーとぴあのスタッフ目線で、
              候補車を一台ずつ比較しています。
              <br />
              結果が出るまで、このままお待ちください。
            </p>
          </div>
        ) : null}

        {error ? (
          <div className="error-box">
            <strong>
              エラー
            </strong>

            <p>
              {error}
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={
                runAiDiagnosis
              }
            >
              もう一度診断する
            </button>

            <button
              type="button"
              className="back-button full-button"
              onClick={() =>
                openEditPage(3)
              }
            >
              3ページ目に戻る
            </button>
          </div>
        ) : null}

        {diagnosis ? (
          <div className="result-stack">
            <section className="result-intro">
              <strong>
                AI診断結果
              </strong>

              <h2>
                あなたに合う車種TOP5
              </h2>

              <p>
                {diagnosis.overview}
              </p>
            </section>

            <div className="recommendation-list">
              {rankedRecommendations.map(
                (
                  recommendation,
                  index
                ) => (
                  <RecommendationCard
                    key={`${recommendation.maker}-${recommendation.model}-${index}`}
                    recommendation={
                      recommendation
                    }
                  />
                )
              )}
            </div>

            {diagnosis.currentAdvice ? (
              <section className="advice-box">
                <strong>
                  今の使い方から見ると
                </strong>

                <p>
                  {diagnosis.currentAdvice}
                </p>
              </section>
            ) : null}

            {diagnosis.futureAdvice ? (
              <section className="advice-box">
                <strong>
                  3〜5年後を考えると
                </strong>

                <p>
                  {diagnosis.futureAdvice}
                </p>
              </section>
            ) : null}

            <section>
              <button
                type="button"
                className="toggle-button"
                onClick={() =>
                  setShowAnswers(
                    (current) =>
                      !current
                  )
                }
              >
                {showAnswers
                  ? "質問と回答を閉じる ▲"
                  : "質問と回答を見る ▼"}
              </button>

              {showAnswers ? (
                <div className="answer-summary">
                  {answerSummary.map(
                    ([
                      label,
                      value,
                    ]) => (
                      <div key={label}>
                        <strong>
                          {label}
                        </strong>

                        <p>
                          {value}
                        </p>
                      </div>
                    )
                  )}
                </div>
              ) : null}
            </section>

            <section className="inventory-section">
              <h2>
                カーとぴあの在庫も確認する
              </h2>

              <p>
                上のTOP5は、在庫に関係なく世の中の車種全体から診断した本命結果です。
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={
                  sendMatchedInventoryToLine
                }
                disabled={
                  inventoryLoading
                }
              >
                {inventoryLoading
                  ? "LINEへ戻る準備中…"
                  : "LINEで条件に近い在庫を見る"}
              </button>

              {inventoryError ||
              liffError ? (
                <div className="empty-box inventory-line-error">
                  {inventoryError ||
                    liffError}
                </div>
              ) : null}
            </section>

            <div className="edit-navigation">
              <strong>
                回答を修正する
              </strong>

              <button
                type="button"
                onClick={() =>
                  openEditPage(1)
                }
              >
                1ページ目に戻る
              </button>

              <button
                type="button"
                onClick={() =>
                  openEditPage(2)
                }
              >
                2ページ目に戻る
              </button>

              <button
                type="button"
                onClick={() =>
                  openEditPage(3)
                }
              >
                3ページ目に戻る
              </button>

              <button
                type="button"
                className="back-button"
                onClick={restart}
              >
                最初からやり直す
              </button>
            </div>
          </div>
        ) : null}

        <p className="small-note">
          ※これはAIによる車種診断です。実際の仕様・乗車定員・在庫状況は、最終的にスタッフが確認してご案内します。
        </p>
      </section>

      <style jsx global>{`
        :root {
          color-scheme: dark;
        }

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          background: #06111f;
        }

        button,
        input,
        select,
        textarea {
          font: inherit;
          -webkit-appearance: none;
          appearance: none;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        main {
          min-height: 100vh;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(35, 61, 92, 0.34),
              transparent 34%
            ),
            #06111f;
          color: #ffffff;
          padding: 18px 12px 40px;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Helvetica Neue",
            "Yu Gothic",
            "Hiragino Kaku Gothic ProN",
            sans-serif;
        }

        .shell {
          width: min(100%, 720px);
          margin: 0 auto;
          border: 1px solid rgba(214, 181, 91, 0.24);
          border-radius: 24px;
          padding: 22px 16px 28px;
          background: rgba(7, 18, 33, 0.94);
          box-shadow: 0 22px 60px rgba(0, 0, 0, 0.28);
        }

        .logo {
          display: block;
          width: 220px;
          max-width: 78%;
          height: auto;
          margin: 0 auto 13px;
                    border-radius: 12px;
        }

        .title-area {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-bottom: 22px;
        }

        .title-area h1 {
          margin: 0;
          font-size: clamp(25px, 6vw, 32px);
          line-height: 1.2;
          font-weight: 900;
          letter-spacing: 0.01em;
        }

        .page-badge {
          flex: none;
          border: 1px solid rgba(214, 181, 91, 0.58);
          border-radius: 999px;
          padding: 5px 9px;
          color: #efd477;
          background: rgba(214, 181, 91, 0.08);
          font-size: 12px;
          font-weight: 900;
        }

        .page-stack,
        .result-stack,
        .recommendation-list,
        .form-stack,
        .type-groups {
          display: grid;
          gap: 16px;
        }

        .question-card {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 20px;
          padding: 20px 16px;
          background: rgba(255, 255, 255, 0.035);
        }

        .question-header {
          margin-bottom: 20px;
        }

        .question-number {
          display: inline-flex;
          align-items: center;
          min-height: 28px;
          border-radius: 999px;
          padding: 5px 11px;
          margin-bottom: 11px;
          background: rgba(214, 181, 91, 0.14);
          border: 1px solid rgba(214, 181, 91, 0.38);
          color: #efd477;
          font-size: 12px;
          font-weight: 900;
        }

        .question-header h2 {
          margin: 0 0 9px;
          font-size: clamp(23px, 6vw, 30px);
          line-height: 1.38;
          font-weight: 900;
          letter-spacing: 0.01em;
        }

        .question-title-line {
          display: block;
          text-wrap: balance;
        }

        .question-header p,
        .helper-text {
          margin: 0;
          color: rgba(255, 255, 255, 0.68);
          font-size: 13px;
          line-height: 1.7;
          font-weight: 650;
        }

        .field-block {
          margin-top: 26px;
        }

        .first-field {
          margin-top: 0;
        }

        .field-heading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 11px;
        }

        .field-heading p {
          margin: 0;
          color: #f0d372;
          font-size: 16px;
          line-height: 1.5;
          font-weight: 900;
        }

        .field-heading span {
          flex: none;
          border-radius: 999px;
          padding: 4px 8px;
          color: rgba(255, 255, 255, 0.72);
          background: rgba(255, 255, 255, 0.07);
          font-size: 10px;
          font-weight: 800;
        }

        .helper-text {
          margin: -2px 0 11px;
          font-size: 12px;
        }

        .choice-grid {
          display: grid;
          gap: 10px;
        }

        .choice-grid-one {
          grid-template-columns: 1fr;
        }

        .choice-grid-two {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .choice-grid-three {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .choice-button {
          position: relative;
          width: 100%;
          min-height: 58px;
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 14px;
          padding: 12px 13px;
          background: rgba(255, 255, 255, 0.065);
          color: rgba(255, 255, 255, 0.94);
          text-align: left;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 14px;
          font-weight: 800;
          line-height: 1.35;
          cursor: pointer;
          transition:
            background 0.15s ease,
            border-color 0.15s ease,
            color 0.15s ease,
            transform 0.15s ease,
            box-shadow 0.15s ease;
        }

        .choice-button:active {
          transform: scale(0.985);
        }

        .choice-button.active {
          border: 2px solid #f2d675;
          background: linear-gradient(
            135deg,
            #f1d477,
            #d4af4f
          );
          color: #07111f;
          box-shadow:
            0 0 0 3px rgba(214, 181, 91, 0.16),
            0 8px 20px rgba(0, 0, 0, 0.24);
        }

        .choice-button.disabled,
        .choice-button:disabled {
          border-color: rgba(255, 255, 255, 0.08);
          background: rgba(255, 255, 255, 0.025);
          color: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .check-box {
          width: 23px;
          height: 23px;
          flex: none;
          display: grid;
          place-items: center;
          border: 1.5px solid rgba(255, 255, 255, 0.42);
          border-radius: 7px;
          background: rgba(0, 0, 0, 0.08);
          color: transparent;
          font-size: 14px;
          font-weight: 1000;
        }

        .choice-button.active .check-box {
          border-color: #07111f;
          background: #07111f;
          color: #ffffff;
        }

        .choice-button.disabled .check-box,
        .choice-button:disabled .check-box {
          border-color: rgba(255, 255, 255, 0.18);
          background: transparent;
        }

        .choice-label {
          min-width: 0;
          overflow-wrap: anywhere;
        }

        .choice-grid-compact .choice-button {
          min-height: 49px;
          padding: 9px 10px;
          font-size: 13px;
        }

        .choice-grid-compact .check-box {
          width: 20px;
          height: 20px;
          border-radius: 6px;
          font-size: 12px;
        }

        .choice-grid-three .wide-option {
          grid-column: span 2;
        }

        .passenger-grid .choice-button:last-child {
          grid-column: span 2;
        }

        .type-groups {
          gap: 12px;
        }

        .type-group {
          border: 1px solid rgba(214, 181, 91, 0.23);
          border-radius: 16px;
          padding: 14px;
          background: rgba(214, 181, 91, 0.045);
        }

        .type-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 11px;
        }

        .type-group-header p {
          margin: 0;
          color: #efd477;
          font-size: 15px;
          font-weight: 900;
        }

        .type-group-header span {
          color: rgba(255, 255, 255, 0.45);
          font-size: 10px;
          font-weight: 800;
        }

        .disabled-note {
          margin: 10px 0 0;
          color: #ffd97c;
          font-size: 12px;
          line-height: 1.6;
          font-weight: 800;
        }

        .passenger-disabled-note {
          margin-top: 12px;
        }

        .alert-box {
          border: 1px solid rgba(255, 116, 116, 0.72);
          background: rgba(255, 80, 80, 0.11);
          border-radius: 14px;
          padding: 13px 14px;
          margin-bottom: 16px;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 800;
        }

        label {
          display: grid;
          gap: 8px;
          margin: 0;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 900;
        }

        label > span {
          color: #efd477;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 14px;
          background: #f8fafc;
          color: #111827;
          padding: 13px 14px;
          font-size: 16px;
          line-height: 1.5;
          outline: none;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: #e2c45f;
          box-shadow: 0 0 0 3px rgba(214, 181, 91, 0.2);
        }

        input::placeholder,
        textarea::placeholder {
          color: #9ca3af;
        }

        select {
          padding-right: 42px;
          background-image:
            linear-gradient(
              45deg,
              transparent 50%,
              #111827 50%
            ),
            linear-gradient(
              135deg,
              #111827 50%,
              transparent 50%
            );
          background-position:
            calc(100% - 20px) 50%,
            calc(100% - 14px) 50%;
          background-size:
            6px 6px,
            6px 6px;
          background-repeat: no-repeat;
        }

        textarea {
          min-height: 112px;
          line-height: 1.7;
          resize: vertical;
        }

        .large-textarea {
          min-height: 170px;
        }

        .form-stack {
          margin-top: 22px;
          gap: 20px;
        }

        .info-strip {
          margin-top: 18px;
          border-left: 3px solid #d6b55b;
          border-radius: 0 12px 12px 0;
          padding: 12px 13px;
          background: rgba(214, 181, 91, 0.08);
          color: rgba(255, 255, 255, 0.78);
          font-size: 13px;
          line-height: 1.65;
          font-weight: 700;
        }

        .replacement-area {
          margin-top: 22px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          padding-top: 22px;
        }

        .replacement-title {
          margin-bottom: 12px;
        }

        .owned-car-card {
          display: grid;
          gap: 15px;
          border: 1px solid rgba(214, 181, 91, 0.34);
          border-radius: 17px;
          padding: 15px;
          margin-bottom: 13px;
          background: rgba(255, 255, 255, 0.035);
        }

        .owned-car-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #efd477;
        }

        .owned-car-header button {
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 9px;
          background: transparent;
          color: rgba(255, 255, 255, 0.8);
          padding: 6px 10px;
          cursor: pointer;
        }

        .add-button {
          width: 100%;
          border: 1px dashed rgba(214, 181, 91, 0.65);
          border-radius: 13px;
          background: rgba(214, 181, 91, 0.035);
          color: #efd477;
          padding: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .standalone-label {
          margin-top: 20px;
        }

        .tip-box {
          display: grid;
          gap: 5px;
          border: 1px solid rgba(214, 181, 91, 0.36);
          border-radius: 14px;
          padding: 13px;
          margin-bottom: 18px;
          background: rgba(214, 181, 91, 0.07);
        }

        .tip-box strong {
          color: #efd477;
        }

        .tip-box span {
          color: rgba(255, 255, 255, 0.72);
          font-size: 13px;
          line-height: 1.65;
        }

        nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 11px;
          margin-top: 2px;
        }

        .primary-button,
        .back-button,
        .toggle-button,
        .edit-navigation button {
          width: 100%;
          min-height: 54px;
          border-radius: 14px;
          padding: 14px;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .primary-button {
          border: 1px solid #e8ca67;
          background: linear-gradient(
            135deg,
            #efd477,
            #d3ad49
          );
          color: #07111f;
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .primary-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .back-button {
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.035);
          color: #ffffff;
        }

        .full-button {
          margin-top: 11px;
        }

        .loading-box,
        .error-box,
        .result-intro,
        .advice-box,
        .inventory-section {
                  border: 1px solid rgba(214, 181, 91, 0.4);
          border-radius: 18px;
          padding: 18px;
          background: rgba(214, 181, 91, 0.06);
        }

        .loading-box > strong,
        .error-box > strong,
        .result-intro > strong,
        .advice-box > strong {
          color: #efd477;
        }

        .loading-experience {
          position: relative;
          overflow: hidden;
          padding: 28px 22px;
          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(214, 181, 91, 0.16),
              transparent 52%
            ),
            rgba(214, 181, 91, 0.055);
        }

        .loading-experience::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            115deg,
            transparent 20%,
            rgba(255, 255, 255, 0.035) 45%,
            transparent 70%
          );
          transform: translateX(-100%);
          animation: loadingShine 3.2s ease-in-out infinite;
          pointer-events: none;
        }

        .loading-orbit {
          position: relative;
          width: 92px;
          height: 92px;
          margin: 0 auto 22px;
          border: 1px solid rgba(214, 181, 91, 0.28);
          border-radius: 50%;
        }

        .loading-orbit::before,
        .loading-orbit::after {
          content: "";
          position: absolute;
          border-radius: 50%;
        }

        .loading-orbit::before {
          inset: 12px;
          border: 1px solid rgba(214, 181, 91, 0.42);
          animation: orbitPulse 1.8s ease-in-out infinite;
        }

        .loading-orbit::after {
          inset: 30px;
          background: #d6b55b;
          box-shadow:
            0 0 0 8px rgba(214, 181, 91, 0.08),
            0 0 28px rgba(214, 181, 91, 0.46);
          animation: corePulse 1.45s ease-in-out infinite;
        }

        .loading-orbit span {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 9px;
          height: 9px;
          margin: -4.5px;
          border-radius: 50%;
          background: #f3d779;
          transform-origin: 4.5px 4.5px;
        }

        .loading-orbit span:nth-child(1) {
          animation: orbitOne 2.6s linear infinite;
        }

        .loading-orbit span:nth-child(2) {
          opacity: 0.72;
          animation: orbitTwo 3.4s linear infinite;
        }

        .loading-orbit span:nth-child(3) {
          opacity: 0.46;
          animation: orbitThree 4.2s linear infinite;
        }

        .loading-experience > strong {
          display: block;
          margin-bottom: 10px;
          text-align: center;
          letter-spacing: 0.08em;
        }

        .loading-box h2 {
          margin: 0;
          text-align: center;
          font-size: 22px;
          line-height: 1.65;
        }

        .loading-step-card {
          display: grid;
          grid-template-columns: 42px 1fr;
          align-items: center;
          gap: 12px;
          min-height: 88px;
          margin-top: 24px;
          border: 1px solid rgba(214, 181, 91, 0.28);
          border-radius: 15px;
          padding: 14px;
          background: rgba(7, 17, 31, 0.42);
        }

        .loading-step-number {
          display: grid;
          place-items: center;
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: rgba(214, 181, 91, 0.14);
          color: #f0d372;
          font-size: 13px;
          font-weight: 900;
        }

        .loading-experience .loading-step-card p {
          margin: 0;
          color: rgba(255, 255, 255, 0.92);
          font-size: 14px;
          line-height: 1.65;
          font-weight: 800;
          animation: loadingTextIn 0.4s ease both;
        }

        .loading-progress {
          height: 4px;
          margin-top: 16px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
        }

        .loading-progress span {
          display: block;
          width: 100%;
          height: 100%;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            #a47f2f,
            #f2d676
          );
          transform-origin: left;
          animation: loadingProgress 2.4s linear both;
        }

        .loading-caption {
          margin: 18px 0 0 !important;
          text-align: center;
          color: rgba(255, 255, 255, 0.64) !important;
          font-size: 13px !important;
          line-height: 1.8 !important;
        }

        @keyframes loadingShine {
          0% {
            transform: translateX(-100%);
          }

          55%,
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes orbitPulse {
          0%,
          100% {
            transform: scale(0.9);
            opacity: 0.45;
          }

          50% {
            transform: scale(1.05);
            opacity: 1;
          }
        }

        @keyframes corePulse {
          0%,
          100% {
            transform: scale(0.88);
          }

          50% {
            transform: scale(1.08);
          }
        }

        @keyframes orbitOne {
          from {
            transform: rotate(0deg) translateX(44px);
          }

          to {
            transform: rotate(360deg) translateX(44px);
          }
        }

        @keyframes orbitTwo {
          from {
            transform: rotate(120deg) translateX(34px);
          }

          to {
            transform: rotate(480deg) translateX(34px);
          }
        }

        @keyframes orbitThree {
          from {
            transform: rotate(240deg) translateX(25px);
          }

          to {
            transform: rotate(600deg) translateX(25px);
          }
        }

        @keyframes loadingTextIn {
          from {
            opacity: 0;
            transform: translateY(5px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes loadingProgress {
          from {
            transform: scaleX(0);
          }

          to {
            transform: scaleX(1);
          }
        }

        .loading-box p,
        .error-box p,
        .result-intro p,
        .advice-box p,
        .inventory-section p {
          color: rgba(255, 255, 255, 0.82);
          font-size: 14px;
          line-height: 1.75;
        }

        .result-intro h2,
        .inventory-section h2 {
          margin: 5px 0 8px;
        }

        .recommendation-list {
          gap: 14px;
        }

        .recommendation-card {
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 18px;
          padding: 17px;
          background: rgba(255, 255, 255, 0.045);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.16);
        }

        .recommendation-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .rank-badge {
          background: #d6b55b;
          color: #07111f;
          border-radius: 999px;
          padding: 6px 11px;
          font-weight: 900;
        }

        .score-badge {
          border: 1px solid rgba(214, 181, 91, 0.42);
          border-radius: 999px;
          color: #efd477;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: 900;
        }

        .maker-name {
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.58);
          font-size: 12px;
        }

        .recommendation-card h3 {
          margin: 3px 0 11px;
          font-size: 23px;
        }

        .tag-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }

        .tag-list span {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.07);
          padding: 5px 8px;
          font-size: 11px;
        }

        .recommendation-card h4 {
          margin: 13px 0 5px;
          color: #efd477;
          font-size: 12px;
        }

        .recommendation-card > p {
          margin: 0;
          color: rgba(255, 255, 255, 0.86);
          font-size: 14px;
          line-height: 1.72;
        }

        .caution-box {
          margin-top: 13px;
          border-left: 3px solid rgba(255, 210, 118, 0.8);
          padding: 9px 11px;
          background: rgba(255, 210, 118, 0.06);
        }

        .caution-box strong {
          color: #ffd276;
          font-size: 12px;
        }

        .caution-box p {
          margin: 4px 0 0;
          font-size: 13px;
          line-height: 1.65;
        }

        .toggle-button {
          border: 1px solid rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.045);
          color: #ffffff;
        }

        .answer-summary {
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 15px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.12);
          margin-top: 10px;
        }

        .answer-summary > div {
          border-bottom: 1px solid rgba(255, 255, 255, 0.09);
          padding: 8px 0;
        }

        .answer-summary > div:last-child {
          border-bottom: 0;
        }

        .answer-summary strong {
          color: #efd477;
          font-size: 12px;
        }

        .answer-summary p {
          margin: 4px 0 0;
          font-size: 13px;
          line-height: 1.65;
        }

        .inventory-line-error {
          margin-top: 14px;
          color: #ffd1d1;
          border-color: rgba(255, 116, 116, 0.55);
          background: rgba(255, 80, 80, 0.09);
        }

        .empty-box {
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 14px;
          padding: 15px;
          background: rgba(7, 17, 31, 0.42);
        }

        .edit-navigation {
          display: grid;
          gap: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.13);
          padding-top: 20px;
        }

        .edit-navigation > strong {
          color: #efd477;
        }

        .edit-navigation > button:not(.back-button) {
          border: 1px solid rgba(214, 181, 91, 0.48);
          background: rgba(214, 181, 91, 0.065);
          color: #ffffff;
        }

        .small-note {
          margin: 22px 2px 0;
          color: rgba(255, 255, 255, 0.46);
          font-size: 11px;
          line-height: 1.7;
        }

        @media (max-width: 460px) {
          main {
            padding: 10px 0 32px;
          }

          .shell {
            border-left: 0;
            border-right: 0;
            border-radius: 0;
            padding: 18px 14px 24px;
          }

          .question-card {
            padding: 18px 14px;
          }

          .question-header h2 {
            font-size: clamp(22px, 7vw, 28px);
          }

          .loading-experience {
            margin: 0 14px;
            padding: 26px 18px;
          }

          .loading-box h2 {
            font-size: 20px;
          }

          .choice-grid-three {
            grid-template-columns: repeat(
              3,
              minmax(0, 1fr)
            );
          }

          .choice-grid-three .choice-button {
            min-height: 46px;
            padding: 8px 7px;
            gap: 7px;
            font-size: 12px;
          }

          .choice-grid-three .check-box {
            width: 18px;
            height: 18px;
          }
        }

        @media (max-width: 360px) {
          .choice-grid-three {
            grid-template-columns: repeat(
              2,
              minmax(0, 1fr)
            );
          }

          .choice-grid-three .wide-option {
            grid-column: span 2;
          }

          nav {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </main>
  );
}
