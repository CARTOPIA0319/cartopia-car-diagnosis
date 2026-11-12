"use client";

import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID || "";
const LAST_DIAGNOSIS_STORAGE_KEY =
  "cartopia-perfect-diagnosis-result-v1";

const LOADING_STEPS = [
  "いつもの使い方と、大切にしたい好みをもとに選びます。",
  "必要な乗車人数に加え、乗り降りや荷物の使い勝手も考えます。",
  "今の暮らしだけでなく、3〜5年後の使い方も考えます。",
  "おすすめの理由と、購入前に確かめたい点をお伝えします。",
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
      {
        label: "スライドドア",
        value: "軽自動車 スライドドア",
      },
      {
        label: "スタンダード",
        value: "軽自動車 スタンダード",
      },
      { label: "SUV", value: "軽自動車 SUV" },
      { label: "トラック", value: "軽自動車 トラック" },
      {
        label: "スポーティ",
        value: "軽自動車 スポーティ",
      },
    ],
  },
  {
    title: "普通車",
    options: [
      {
        label: "コンパクトカー",
        value: "普通車 コンパクトカー",
      },
      { label: "ミニバン", value: "普通車 ミニバン" },
      { label: "SUV", value: "普通車 SUV" },
      { label: "セダン", value: "普通車 セダン" },
      {
        label: "ステーションワゴン",
        value: "普通車 ステーションワゴン",
      },
      {
        label: "低燃費・HV",
        value: "普通車 EV・HV",
      },
      {
        label: "スポーティ",
        value: "普通車 スポーティ",
      },
      {
        label: "バン・トラック",
        value: "普通車 バン・トラック",
      },
    ],
  },
];

const LIGHT_TYPE_KEYS =
  TYPE_GROUPS.find(
    (group) => group.title === "軽自動車"
  )?.options.map((option) => option.value) || [];

const ALL_TYPE_OPTIONS = TYPE_GROUPS.flatMap(
  (group) => group.options
);

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
          typeof option === "string"
            ? option
            : option.value ?? option.label;

        const label =
          typeof option === "string"
            ? option
            : option.label;

        const active = single
          ? selected === value
          : Array.isArray(selected) &&
            selected.includes(value);

        const disabled = disabledValues.includes(value);
        const isWide = compact && String(label).length >= 9;

        return (
          <button
            key={value}
            type="button"
            className={`choice-button ${
              active ? "active" : ""
            } ${disabled ? "disabled" : ""} ${
              isWide ? "wide-option" : ""
            }`}
            disabled={disabled}
            aria-pressed={active}
            onClick={() => {
              if (!disabled) onToggle(value);
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
          group.title === "軽自動車"
            ? disabledValues
            : [];

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

            {groupDisabledValues.length > 0 &&
            disabledMessage ? (
              <p className="disabled-note">
                {disabledMessage}
              </p>
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

function QuestionHeader({
  number,
  title,
  titleLines = [],
  note,
}) {
  const lines = titleLines.length ? titleLines : [title];

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

function AdviceText({ text }) {
  if (typeof text !== "string" || !text.trim()) {
    return null;
  }

  return (
    <div className="advice-text">
      {text
        .trim()
        .split(/\n+/)
        .filter(Boolean)
        .map((paragraph, index) =>
          /^【[^】]+】$/.test(paragraph.trim()) ? (
            <h4
              key={index}
              style={{
                color: "#efd477",
                margin: "18px 0 6px",
                fontSize: "14px",
              }}
            >
              {paragraph.replace(/[【】]/g, "")}
            </h4>
          ) : (
            <p
              key={index}
              style={{
                fontWeight: 400,
                lineHeight: 1.85,
                margin: "0 0 12px",
              }}
            >
              {paragraph}
            </p>
          )
        )}
    </div>
  );
}

function getSourceLinks(sources) {
  if (!Array.isArray(sources)) return [];

  const seen = new Set();

  return sources.flatMap((source) => {
    try {
      const url = new URL(source?.url);

      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        seen.has(url.href)
      ) {
        return [];
      }

      seen.add(url.href);

      return [
        {
          url: url.href,
          title:
            typeof source.title === "string" &&
            source.title.trim()
              ? source.title
              : "仕様の参照資料",
          host: url.hostname,
        },
      ];
    } catch {
      return [];
    }
  });
}

function RecommendationCard({ recommendation }) {
  const sources = getSourceLinks(recommendation.sources);

  let caution =
    typeof recommendation.caution === "string"
      ? recommendation.caution
      : "";

  const marker = "仕様の参照資料：";
  const markerIndex = caution.lastIndexOf(marker);

  if (markerIndex >= 0) {
    const rawUrl = caution
      .slice(markerIndex + marker.length)
      .trim();

    try {
      if (
        sources.some(
          (source) => source.url === new URL(rawUrl).href
        )
      ) {
        caution = caution.slice(0, markerIndex).trim();
      }
    } catch {
      // 元の注意文を保持する。
    }
  }

  return (
    <article className="recommendation-card">
      <div className="recommendation-top">
        <span className="rank-badge">
          {recommendation.rank}位
        </span>
        <span className="score-badge">
          マッチ度 {recommendation.score}点
        </span>
      </div>

      <p className="maker-name">{recommendation.maker}</p>
      <h3>{recommendation.model}</h3>

      <div className="tag-list">
        <span>{recommendation.typeKey}</span>
        {recommendation.maxSeats > 0 ? (
          <span>
            対象仕様：{recommendation.maxSeats}人乗り
          </span>
        ) : null}
      </div>

      <h4>おすすめ理由</h4>
      <AdviceText text={recommendation.reason} />

      {recommendation.futureFit ? (
        <>
          <h4>これからの暮らし</h4>
          <AdviceText text={recommendation.futureFit} />
        </>
      ) : null}

      {caution ? (
        <aside className="caution-box">
          <strong>確認したい点</strong>
          <AdviceText text={caution} />
        </aside>
      ) : null}

      {sources.length > 0 ? (
        <div className="source-list">
          <h4>仕様の参照資料</h4>

          {sources.map((source) => (
            <a
              key={source.url}
              href={source.url}
              target="_blank"
              rel="noopener noreferrer"
            >
              {source.title}
              <small>
                {source.host} ／ 別画面で開く ↗
              </small>
            </a>
          ))}

          <p>
            定員・装備は、表示した年式・グレードの情報です。
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function Home() {
  const [form, setForm] = useState(makeInitialForm);
  const [diagnosis, setDiagnosis] = useState(null);
  const [restoreNotice, setRestoreNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showAnswers, setShowAnswers] = useState(false);
  const [inventoryLoading, setInventoryLoading] =
    useState(false);
  const [inventoryError, setInventoryError] = useState("");
  const [liffReady, setLiffReady] = useState(false);
  const [liffError, setLiffError] = useState("");
  const [loadingStep, setLoadingStep] = useState(0);
  const [remainingDiagnoses, setRemainingDiagnoses] =
    useState(null);
  const [rateLimitError, setRateLimitError] = useState("");

  const requiredSeats =
    MAX_PASSENGER_OPTIONS.find(
      (item) => item.label === form.maxPassengers
    )?.seats || 0;

  const hasLightTypeSelected = form.desiredBodyTypes.some(
    (typeKey) => LIGHT_TYPE_KEYS.includes(typeKey)
  );

  const validOwnedCars = form.ownedCars.filter(
    (car) =>
      car.model.trim() ||
      car.mainDriver.trim() ||
      car.bodyType
  );

  const replacementTarget = validOwnedCars.find(
    (car) => car.id === form.replacementTargetId
  );

  const retainedCars =
    form.hasOwnedCars === "yes" &&
    form.purchasePlan === "乗り換え"
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
          second.numericScore - first.numericScore ||
          first.originalIndex - second.originalIndex
      )
      .slice(0, 5)
      .map(
        (
          { originalIndex, numericScore, ...recommendation },
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
        (current) => (current + 1) % LOADING_STEPS.length
      );
    }, 5000);

    return () => window.clearInterval(timer);
  }, [loading]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(
      window.location.search
    );

    if (params.get("restore") !== "1") return;

    try {
      const savedValue = window.localStorage.getItem(
        LAST_DIAGNOSIS_STORAGE_KEY
      );

      if (!savedValue) return;

      const saved = JSON.parse(savedValue);

      const isRecent =
        Date.now() - Number(saved.savedAt || 0) <
        24 * 60 * 60 * 1000;

      if (!isRecent || !saved.form || !saved.diagnosis) {
        window.localStorage.removeItem(
          LAST_DIAGNOSIS_STORAGE_KEY
        );
        return;
      }

      setForm({
        ...makeInitialForm(),
        ...saved.form,
      });

      if (saved.revision === "candidate-catalog-v5") {
        setDiagnosis(saved.diagnosis);
      } else {
        setRestoreNotice(
          "回答を復元しました。内容を確認して、もう一度診断してください。"
        );
      }
    } catch {
      setRestoreNotice(
        "保存した診断結果を読み込めませんでした。もう一度回答してください。"
      );
    }
  }, []);

  const answerSummary = useMemo(() => {
    let ownedCarsText = "所有なし";

    if (form.hasOwnedCars === "yes") {
      if (form.purchasePlan === "乗り換え") {
        ownedCarsText =
          form.ownedCars
            .filter(
              (car) => car.model.trim() || car.bodyType
            )
            .map((car) =>
              [
                car.model,
                car.mainDriver
                  ? `主に${car.mainDriver}`
                  : "",
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
      [
        "運転する人",
        form.driverAges.join("、") || "未回答",
      ],
      [
        "一緒に乗る人",
        form.passengerAges.join("、") || "未選択",
      ],
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
      await window.liff.init({ liffId: LIFF_ID });
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
    const diagnosisTypeKeys = rankedRecommendations
      .slice(0, 2)
      .map(
        (recommendation) =>
          recommendation?.typeKey || ""
      )
      .filter(Boolean);

    const fallbackTypeKeys =
      form.desiredBodyTypes.filter(
        (typeKey) => typeKey !== "特にこだわらない"
      );

    const typeKeys = Array.from(
      new Set([
        ...diagnosisTypeKeys,
        ...fallbackTypeKeys,
      ])
    ).slice(0, 2);

    if (typeKeys.length > 0) return typeKeys;

    throw new Error(
      "在庫を検索する車のタイプを選択してください。"
    );
  }

  function toggleArrayField(
    key,
    value,
    exclusiveValue = ""
  ) {
    setForm((current) => {
      let currentValues = current[key];

      if (exclusiveValue && value === exclusiveValue) {
        return {
          ...current,
          [key]: currentValues.includes(value)
            ? []
            : [value],
        };
      }

      if (exclusiveValue) {
        currentValues = currentValues.filter(
          (item) => item !== exclusiveValue
        );
      }

      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];

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
          purchasePlan: "増車・新規購入",
          replacementTargetId: "",
          replacementReasons: [],
          replacementReasonMemo: "",
        };
      }

      return {
        ...current,
        hasOwnedCars: "yes",
        ownedCars: current.ownedCars.length
          ? current.ownedCars
          : [makeOwnedCar(`car-${Date.now()}`)],
        purchasePlan:
          current.hasOwnedCars === "no"
            ? ""
            : current.purchasePlan,
      };
    });
  }

  function updateOwnedCar(id, key, value) {
    setForm((current) => ({
      ...current,
      ownedCars: current.ownedCars.map((car) =>
        car.id === id ? { ...car, [key]: value } : car
      ),
    }));
  }

  function addOwnedCar() {
    setForm((current) => ({
      ...current,
      ownedCars: [
        ...current.ownedCars,
        makeOwnedCar(
          `car-${Date.now()}-${current.ownedCars.length + 1}`
        ),
      ],
    }));
  }

  function removeOwnedCar(id) {
    setForm((current) => {
      const nextCars = current.ownedCars.filter(
        (car) => car.id !== id
      );

      return {
        ...current,
        ownedCars: nextCars.length
          ? nextCars
          : [makeOwnedCar(`car-${Date.now()}`)],
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
          ? [makeOwnedCar(`car-${Date.now()}`)]
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

  function scrollToQuestion(questionNumber) {
    window.setTimeout(() => {
      document
        .getElementById(`question-${questionNumber}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  function validateAllQuestions() {
    if (!form.maxPassengers) {
      return {
        message: "最大で乗る人数を選択してください。",
        question: 1,
      };
    }

    if (form.driverAges.length === 0) {
      return {
        message: "運転する人の年齢を選択してください。",
        question: 1,
      };
    }

    if (!form.hasOwnedCars) {
      return {
        message: "現在の所有状況を選択してください。",
        question: 2,
      };
    }

    if (!form.purchasePlan) {
      return {
        message: "今回の購入方法を選択してください。",
        question: 2,
      };
    }

    if (
      form.purchasePlan === "乗り換え" &&
      (form.ownedCars.length === 0 ||
        form.ownedCars.some(
          (car) => !car.model.trim() || !car.bodyType
        ))
    ) {
      return {
        message:
          "現在の車種名と車のタイプを入力してください。",
        question: 2,
      };
    }

    if (
      form.purchasePlan === "乗り換え" &&
      !form.replacementTargetId
    ) {
      return {
        message:
          "乗り換える予定の車を選択してください。",
        question: 2,
      };
    }

    if (form.desiredBodyTypes.length === 0) {
      return {
        message:
          "気になる車のタイプを選択してください。",
        question: 3,
      };
    }

    if (form.desiredConditions.length === 0) {
      return {
        message:
          "気になる条件を1つ以上選択してください。",
        question: 3,
      };
    }

    const hasAvoidInput =
      form.avoidManufacturers.trim() ||
      form.avoidModels.trim() ||
      form.avoidBodyTypes.length > 0 ||
      form.avoidConditions.length > 0 ||
      form.avoidManufacturerReason.trim() ||
      form.avoidModelReason.trim();

    if (!form.avoidNone && !hasAvoidInput) {
      return {
        message:
          "避けたい車がない場合は「特になし」を選択してください。",
        question: 4,
      };
    }

    return null;
  }

  async function getLiffAuthentication() {
    if (
      typeof window === "undefined" ||
      !window.liff
    ) {
      throw new Error(
        "LINE連携の準備中です。少し待ってからもう一度お試しください。"
      );
    }

    if (!liffReady) {
      if (!LIFF_ID) {
        throw new Error(
          "LINEアプリの設定を確認する必要があります。"
        );
      }

      await window.liff.init({ liffId: LIFF_ID });
      setLiffReady(true);
    }

    if (!window.liff.isInClient()) {
      throw new Error(
        "LINE内の「ぴったり診断」から開いてください。"
      );
    }

    const accessToken =
      window.liff.getAccessToken?.() || "";
    const idToken = window.liff.getIDToken?.() || "";

    if (!accessToken && !idToken) {
      throw new Error(
        "LINEユーザー情報を確認できませんでした。診断画面を開き直してください。"
      );
    }

    return { accessToken, idToken };
  }

  async function updateDiagnosisLimit(
    action,
    authentication
  ) {
    const response = await fetch("/api/diagnosis-limit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        action,
        ...authentication,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const limitError = new Error(
        data.error || "診断回数を確認できませんでした。"
      );

      limitError.status = response.status;
      limitError.remaining = data.remaining;
      throw limitError;
    }

    if (typeof data.remaining === "number") {
      setRemainingDiagnoses(data.remaining);
    }

    return data;
  }

  function makeWeightedPreferences() {
    return form.desiredConditions.map((label) => {
      const matchedOption =
        WANTED_CONDITION_GROUPS.flatMap(
          (group) => group.options
        ).find((option) => option.label === label);

      return {
        label,
        weight: matchedOption?.weight || 50,
      };
    });
  }

  function buildDiagnosisInput() {
    const ownedCarsForDiagnosis =
      form.purchasePlan === "乗り換え"
        ? validOwnedCars
        : [];

    return {
      requiredSeats,
      maximumPassengersLabel: form.maxPassengers,
      driverAges: form.driverAges,
      passengerAges: form.passengerAges,

      household: {
        hasOwnedCars: form.hasOwnedCars === "yes",
        ownedCars: ownedCarsForDiagnosis,
        purchasePlan: form.purchasePlan,
        replacementTarget: replacementTarget || null,
        retainedCars,
        replacementReasons: form.replacementReasons,
        replacementReasonMemo:
          form.replacementReasonMemo.trim(),
      },

      avoid: {
        none: form.avoidNone,
        manufacturers: splitTokens(
          form.avoidManufacturers
        ),
        models: splitTokens(form.avoidModels),
        typeKeys: form.avoidBodyTypes,
        conditions: form.avoidConditions,
        manufacturerReason:
          form.avoidManufacturerReason.trim(),
        modelReason: form.avoidModelReason.trim(),
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
        manufacturers: splitTokens(
          form.desiredManufacturers
        ),
        typeKeys:
          requiredSeats >= 5
            ? form.desiredBodyTypes.filter(
                (typeKey) =>
                  !LIGHT_TYPE_KEYS.includes(typeKey)
              )
            : form.desiredBodyTypes,
        weightedPreferences: makeWeightedPreferences(),
      },

      otherRequest: form.otherRequest.trim(),

      answerSummary: answerSummary.map(
        ([label, value]) => ({ label, value })
      ),
    };
  }

  async function runAiDiagnosis() {
    const validation = validateAllQuestions();

    if (validation) {
      setValidationError(validation.message);
      setRateLimitError("");
      scrollToQuestion(validation.question);
      return;
    }

    let authentication = null;
    let diagnosisSlotConsumed = false;

    setError("");
    setRestoreNotice("");
    setRateLimitError("");
    setValidationError("");
    setInventoryError("");
    setLoading(true);
    scrollTop();

    try {
      authentication = await getLiffAuthentication();

      const limitResult = await updateDiagnosisLimit(
        "consume",
        authentication
      );

      diagnosisSlotConsumed = true;

      if (typeof limitResult.remaining === "number") {
        setRemainingDiagnoses(limitResult.remaining);
      }
    } catch (caughtError) {
      setRateLimitError(
        caughtError.message ||
          "診断回数を確認できませんでした。"
      );

      if (typeof caughtError.remaining === "number") {
        setRemainingDiagnoses(caughtError.remaining);
      }

      setLoading(false);

      window.setTimeout(() => {
        document
          .getElementById("diagnosis-submit")
          ?.scrollIntoView({
            behavior: "smooth",
            block: "center",
          });
      }, 50);

      return;
    }

    setDiagnosis(null);
    setShowAnswers(false);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "perfect",
          diagnosisInput: buildDiagnosisInput(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "診断を完了できませんでした。"
        );
      }

      if (
        !Array.isArray(data.result?.recommendations)
      ) {
        throw new Error(
          "診断結果を読み込めませんでした。もう一度お試しください。"
        );
      }

      setDiagnosis(data.result);
      diagnosisSlotConsumed = false;

      try {
        window.localStorage.setItem(
          LAST_DIAGNOSIS_STORAGE_KEY,
          JSON.stringify({
            savedAt: Date.now(),
            version: data.checks?.version || "",
            revision: data.checks?.revision || "",
            form,
            diagnosis: data.result,
          })
        );
      } catch {
        setRestoreNotice(
          "診断は完了しましたが、この端末に結果を保存できませんでした。必要な結果はスクリーンショットで残してください。"
        );
      }
    } catch (caughtError) {
      if (diagnosisSlotConsumed && authentication) {
        try {
          await updateDiagnosisLimit(
            "refund",
            authentication
          );
        } catch {
          // 元の診断エラーを優先する。
        }
      }

      setError(
        caughtError.message ||
          "診断を完了できませんでした。"
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
      altText: "ぴったり車種診断の結果を再表示",
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
              text: "診断結果をもう一度確認",
              weight: "bold",
              color: "#07111F",
              size: "lg",
              wrap: true,
            },
            {
              type: "text",
              text:
                "在庫を見たあとも、下のボタンから診断結果に戻れます。",
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
                label: "診断結果を再表示",
                uri: returnUrl,
              },
            },
          ],
        },
        styles: {
          body: { backgroundColor: "#F8FAFC" },
          footer: { backgroundColor: "#F8FAFC" },
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
          "LINE連携の準備中です。少し待ってからもう一度お試しください。"
        );
      }

      if (!liffReady) {
        if (!LIFF_ID) {
          throw new Error(
            "LINEアプリの設定を確認する必要があります。"
          );
        }

        await window.liff.init({ liffId: LIFF_ID });
        setLiffReady(true);
      }

      if (!window.liff.isInClient()) {
        throw new Error(
          "LINE内の「ぴったり診断」から開いてください。"
        );
      }

      const inventoryLineMessages =
        buildInventoryLineMessages();

      await window.liff.sendMessages([
        ...inventoryLineMessages.map((typeKey) => ({
          type: "text",
          text: typeKey,
        })),
        buildDiagnosisReturnFlexMessage(),
      ]);

      window.liff.closeWindow();
    } catch (caughtError) {
      setInventoryError(
        caughtError.message ||
          "在庫検索の依頼を送信できませんでした。"
      );
    } finally {
      setInventoryLoading(false);
    }
  }

  function editAnswers() {
    setDiagnosis(null);
    setError("");
    setValidationError("");
    setRateLimitError("");
    setShowAnswers(false);
    setInventoryError("");
    scrollTop();
  }

  function restart() {
    setForm(makeInitialForm());
    setRestoreNotice("");
    setDiagnosis(null);
    setLoading(false);
    setError("");
    setValidationError("");
    setShowAnswers(false);
    setInventoryLoading(false);
    setInventoryError("");
    setRateLimitError("");

    window.localStorage.removeItem(
      LAST_DIAGNOSIS_STORAGE_KEY
    );

    window.history.replaceState(
      {},
      "",
      window.location.pathname
    );

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
            "LINE連携を読み込めませんでした。画面を開き直してください。"
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
          {!diagnosis && !loading && !error ? (
            <div className="page-badge">質問1〜5</div>
          ) : null}
        </div>

        {restoreNotice ? (
          <div className="info-strip" role="status">
            {restoreNotice}
          </div>
        ) : null}

        {validationError ? (
          <div className="alert-box">
            {validationError}
          </div>
        ) : null}

        {!diagnosis && !loading && !error ? (
          <div className="page-stack">
            <section
              id="question-1"
              className="question-card question-anchor"
            >
              <QuestionHeader
                number="1"
                titleLines={["この車に乗る", "最大人数"]}
                note="年に数回でも乗る可能性がある最大人数を選択。"
              />

              <ChoiceGrid
                options={MAX_PASSENGER_OPTIONS.map(
                  (item) => item.label
                )}
                selected={form.maxPassengers}
                single
                onToggle={setMaxPassengers}
                disabledValues={
                  hasLightTypeSelected
                    ? MAX_PASSENGER_OPTIONS.filter(
                        (item) => item.seats >= 5
                      ).map((item) => item.label)
                    : []
                }
                columns="two"
                className="passenger-grid"
              />

              {hasLightTypeSelected ? (
                <p className="disabled-note passenger-disabled-note">
                  軽自動車を選択中のため、5人以上は対象外。
                </p>
              ) : null}

              <div className="field-block">
                <div className="field-heading">
                  <p>運転する人の年齢</p>
                  <span>複数選択可</span>
                </div>

                <ChoiceGrid
                  options={DRIVER_AGE_OPTIONS}
                  selected={form.driverAges}
                  onToggle={(value) =>
                    toggleArrayField("driverAges", value)
                  }
                  columns="two"
                  compact
                />
              </div>

              <div className="field-block">
                <div className="field-heading">
                  <p>一緒に乗る人の年齢</p>
                  <span>複数選択可</span>
                </div>

                <p className="helper-text">
                  子どもの成長や、将来の使い方も診断に反映。
                </p>

                <ChoiceGrid
                  options={PASSENGER_AGE_OPTIONS}
                  selected={form.passengerAges}
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

            <section
              id="question-2"
              className="question-card question-anchor"
            >
              <QuestionHeader
                number="2"
                titleLines={[
                  "現在の所有車と、",
                  "今回の購入",
                ]}
                note="現在の車の入力は、乗り換えの場合のみ。"
              />

              <div className="field-block first-field">
                <div className="field-heading">
                  <p>現在の所有状況</p>
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
                      value === "所有している"
                        ? "yes"
                        : "no"
                    )
                  }
                  columns="two"
                />
              </div>

              {form.hasOwnedCars === "yes" ? (
                <div className="field-block">
                  <div className="field-heading">
                    <p>今回の購入方法</p>
                  </div>

                  <ChoiceGrid
                    options={[
                      "増車・新規購入",
                      "乗り換え",
                    ]}
                    selected={form.purchasePlan}
                    single
                    onToggle={setPurchasePlan}
                    columns="two"
                  />
                </div>
              ) : null}

              {form.hasOwnedCars === "no" ? (
                <div className="info-strip">
                  新規購入として診断。現在の車の入力は不要。
                </div>
              ) : null}

              {form.hasOwnedCars === "yes" &&
              form.purchasePlan === "増車・新規購入" ? (
                <div className="info-strip">
                  増車なら、現在の車は入力不要。
                </div>
              ) : null}

              {form.hasOwnedCars === "yes" &&
              form.purchasePlan === "乗り換え" ? (
                <div className="replacement-area">
                  <div className="field-heading replacement-title">
                    <p>現在所有している車</p>
                    <span>乗り換える車を入力</span>
                  </div>

                  {form.ownedCars.map((car, index) => (
                    <div
                      className="owned-car-card"
                      key={car.id}
                    >
                      <div className="owned-car-header">
                        <strong>所有車 {index + 1}</strong>

                        {form.ownedCars.length > 1 ? (
                          <button
                            type="button"
                            onClick={() =>
                              removeOwnedCar(car.id)
                            }
                          >
                            削除
                          </button>
                        ) : null}
                      </div>

                      <label>
                        <span>車種名</span>
                        <input
                          value={car.model}
                          onChange={(event) =>
                            updateOwnedCar(
                              car.id,
                              "model",
                              event.target.value
                            )
                          }
                          placeholder="例：アルファード"
                        />
                      </label>

                      <label>
                        <span>主に乗る人（任意）</span>
                        <input
                          value={car.mainDriver}
                          onChange={(event) =>
                            updateOwnedCar(
                              car.id,
                              "mainDriver",
                              event.target.value
                            )
                          }
                          placeholder="例：妻、夫、自分"
                        />
                      </label>

                      <label>
                        <span>車のタイプ</span>
                        <select
                          value={car.bodyType}
                          onChange={(event) =>
                            updateOwnedCar(
                              car.id,
                              "bodyType",
                              event.target.value
                            )
                          }
                        >
                          <option value="">選択</option>

                          {ALL_TYPE_OPTIONS.map(
                            (option) => (
                              <option
                                key={option.value}
                                value={option.value}
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
                  ))}

                  <button
                    type="button"
                    className="add-button"
                    onClick={addOwnedCar}
                  >
                    ＋ 所有車を追加
                  </button>

                  <label className="standalone-label">
                    <span>乗り換える予定の車</span>
                    <select
                      value={form.replacementTargetId}
                      onChange={(event) =>
                        updateField(
                          "replacementTargetId",
                          event.target.value
                        )
                      }
                    >
                      <option value="">選択</option>

                      {form.ownedCars.map((car, index) => (
                        <option key={car.id} value={car.id}>
                          {car.model ||
                            `所有車 ${index + 1}`}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="field-block">
                    <div className="field-heading">
                      <p>乗り換えを考えた理由</p>
                      <span>複数選択可</span>
                    </div>

                    <ChoiceGrid
                      options={REPLACEMENT_REASON_OPTIONS}
                      selected={form.replacementReasons}
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
                    <span>乗り換え理由の詳細（任意）</span>
                    <textarea
                      value={form.replacementReasonMemo}
                      onChange={(event) =>
                        updateField(
                          "replacementReasonMemo",
                          event.target.value
                        )
                      }
                      placeholder="例：修理中に車が使えない期間が困る"
                    />
                  </label>
                </div>
              ) : null}
            </section>

            <section
              id="question-3"
              className="question-card question-anchor"
            >
              <QuestionHeader
                number="3"
                titleLines={[
                  "気になる車や条件を",
                  "選ぶ",
                ]}
                note="候補を絞るため、気になるタイプや条件を選択。"
              />

              <label>
                <span>気になるメーカー（任意）</span>
                <input
                  value={form.desiredManufacturers}
                  onChange={(event) =>
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
                  <p>気になる車のタイプ</p>
                  <span>複数選択可</span>
                </div>

                <TypeChoiceGrid
                  selected={form.desiredBodyTypes}
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
                      ? "5人以上を選択中のため、軽自動車は対象外。"
                      : ""
                  }
                  showNoPreference
                />
              </div>

              {WANTED_CONDITION_GROUPS.map((group) => (
                <div
                  className="field-block"
                  key={group.title}
                >
                  <div className="field-heading">
                    <p>{group.title}</p>
                    <span>複数選択可</span>
                  </div>

                  <ChoiceGrid
                    options={group.options.map(
                      (option) => option.label
                    )}
                    selected={form.desiredConditions}
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
              ))}
            </section>

            <section
              id="question-4"
              className="question-card question-anchor"
            >
              <QuestionHeader
                number="4"
                titleLines={[
                  "避けたい車や条件を",
                  "選ぶ",
                ]}
                note="該当がなければ「特になし」を選択。"
              />

              <ChoiceGrid
                options={["特になし"]}
                selected={
                  form.avoidNone ? "特になし" : ""
                }
                single
                onToggle={() =>
                  setAvoidNone(!form.avoidNone)
                }
                columns="one"
              />

              {!form.avoidNone ? (
                <div className="form-stack">
                  <label>
                    <span>避けたいメーカー</span>
                    <input
                      value={form.avoidManufacturers}
                      onChange={(event) =>
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
                   
