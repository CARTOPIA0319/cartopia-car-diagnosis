"use client";

import Script from "next/script";
import { useMemo, useState } from "react";

const LIFF_ID =
  process.env.NEXT_PUBLIC_LIFF_ID || "";

const PERFECT_INVENTORY_REQUEST_PREFIX =
  "【ぴったり診断・在庫検索】";

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
      {
        label: "SUV",
        value: "軽自動車 SUV",
      },
      {
        label: "トラック",
        value: "軽自動車 トラック",
      },
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
      {
        label: "ミニバン",
        value: "普通車 ミニバン",
      },
      {
        label: "SUV",
        value: "普通車 SUV",
      },
      {
        label: "セダン",
        value: "普通車 セダン",
      },
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
    (group) =>
      group.title === "軽自動車"
  )?.options.map(
    (option) => option.value
  ) || [];

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
    avoidReason: "",

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
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => {
        const value =
          typeof option === "string"
            ? option
            : option.value ??
              option.label;

        const label =
          typeof option === "string"
            ? option
            : option.label;

        const active = single
          ? selected === value
          : selected.includes(value);

        const disabled =
          disabledValues.includes(value);

        return (
          <button
            key={value}
            type="button"
            className={`choice-button ${
              active ? "active" : ""
            } ${
              disabled ? "disabled" : ""
            }`}
            disabled={disabled}
            onClick={() => {
              if (!disabled) {
                onToggle(value);
              }
            }}
          >
            <span className="check-box">
              {active ? "✓" : ""}
            </span>

            <span>{label}</span>
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
      {TYPE_GROUPS.map(
        (group) => {
          const groupDisabledValues =
            group.title ===
            "軽自動車"
              ? disabledValues
              : [];

          return (
            <div
              className="type-group"
              key={group.title}
            >
              <p className="type-group-title">
                {group.title}
              </p>

              <ChoiceGrid
                options={group.options}
                selected={selected}
                onToggle={onToggle}
                disabledValues={
                  groupDisabledValues
                }
              />

              {groupDisabledValues.length >
                0 &&
              disabledMessage ? (
                <p className="disabled-note">
                  {disabledMessage}
                </p>
              ) : null}
            </div>
          );
        }
      )}

      {showNoPreference ? (
        <ChoiceGrid
          options={[
            {
              label:
                "特にこだわらない",
              value:
                "特にこだわらない",
            },
          ]}
          selected={selected}
          onToggle={onToggle}
        />
      ) : null}
    </div>
  );
}

function QuestionHeader({
  number,
  title,
  note,
}) {
  return (
    <header className="question-header">
      <span className="question-number">
        質問{number}
      </span>

      <h2>{title}</h2>

      {note ? <p>{note}</p> : null}
    </header>
  );
}

function RecommendationCard({
  recommendation,
}) {
  return (
    <article className="recommendation-card">
      <div className="recommendation-top">
        <span className="rank-badge">
          {recommendation.rank}位
        </span>

        <span className="score-badge">
          マッチ度{" "}
          {recommendation.score}点
        </span>
      </div>

      <p className="maker-name">
        {recommendation.maker}
      </p>

      <h3>
        {recommendation.model}
      </h3>

      <div className="tag-list">
        <span>
          {recommendation.typeKey}
        </span>

        {recommendation.maxSeats > 0 ? (
          <span>
            最大
            {recommendation.maxSeats}
            人乗り
          </span>
        ) : null}
      </div>

      <h4>
        おすすめ理由
      </h4>

      <p>
        {recommendation.reason}
      </p>

      {recommendation.futureFit ? (
        <>
          <h4>
            これからの暮らし
          </h4>

          <p>
            {recommendation.futureFit}
          </p>
        </>
      ) : null}

      {recommendation.caution ? (
        <aside className="caution-box">
          <strong>
            確認したい点
          </strong>

          <p>
            {recommendation.caution}
          </p>
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

  const requiredSeats =
    MAX_PASSENGER_OPTIONS.find(
      (item) => item.label === form.maxPassengers
    )?.seats || 0;

  const replacementTarget =
    form.ownedCars.find(
      (car) =>
        car.id ===
        form.replacementTargetId
    );

  const retainedCars =
    form.hasOwnedCars === "yes"
      ? form.ownedCars.filter((car) => {
          if (
            form.purchasePlan !==
            "乗り換え"
          ) {
            return true;
          }

          return (
            car.id !==
            form.replacementTargetId
          );
        })
      : [];

  const answerSummary = useMemo(() => {
    const ownedCarsText =
      form.hasOwnedCars === "yes"
        ? form.ownedCars
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
            .join("、")
        : "所有なし";

    const purchaseText =
      form.purchasePlan ===
      "乗り換え"
        ? [
            replacementTarget?.model ||
              "対象車未指定",
            ...form.replacementReasons,
            form.replacementReasonMemo,
          ]
            .filter(Boolean)
            .join("／")
        : form.purchasePlan ||
          "未回答";

    const avoidText =
      form.avoidNone
        ? "特になし"
        : [
            form.avoidManufacturers
              ? `メーカー：${form.avoidManufacturers}`
              : "",
            form.avoidModels
              ? `車種：${form.avoidModels}`
              : "",
            form.avoidBodyTypes.length
              ? `タイプ：${form.avoidBodyTypes.join(
                  "、"
                )}`
              : "",
            form.avoidConditions.length
              ? `条件：${form.avoidConditions.join(
                  "、"
                )}`
              : "",
            form.avoidReason
              ? `理由：${form.avoidReason}`
              : "",
          ]
            .filter(Boolean)
            .join("／");

    const desiredText = [
      form.desiredManufacturers
        ? `メーカー：${form.desiredManufacturers}`
        : "",
      form.desiredBodyTypes.length
        ? `タイプ：${form.desiredBodyTypes.join(
            "、"
          )}`
        : "",
      form.desiredConditions.length
        ? `条件：${form.desiredConditions.join(
            "、"
          )}`
        : "",
    ]
      .filter(Boolean)
      .join("／");

    return [
      [
        "最大乗車人数",
        form.maxPassengers ||
          "未回答",
      ],
      [
        "運転する人",
        form.driverAges.join("、") ||
          "未回答",
      ],
      [
        "一緒に乗る人",
        form.passengerAges.join("、") ||
          "未選択",
      ],
      [
        "世帯の所有車",
        ownedCarsText,
      ],
      [
        "今回の購入",
        purchaseText,
      ],
      [
        "避けたい車",
        avoidText || "未回答",
      ],
      [
        "欲しい車",
        desiredText || "未回答",
      ],
      [
        "その他",
        form.otherRequest.trim() ||
          "特になし",
      ],
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
        (item) =>
          item.label === value
      )?.seats || 0;

    setForm((current) => ({
      ...current,
      maxPassengers: value,
      desiredBodyTypes:
        seats >= 5
          ? current.desiredBodyTypes.filter(
              (typeKey) =>
                !LIGHT_TYPE_KEYS.includes(
                  typeKey
                )
            )
          : current.desiredBodyTypes,
    }));
  }

  async function initializeLiff() {
    if (
      typeof window ===
        "undefined" ||
      !window.liff
    ) {
      return;
    }

    if (!LIFF_ID) {
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

  function buildInventoryLineMessage() {
    const desiredTypeKeys =
      requiredSeats >= 5
        ? form.desiredBodyTypes.filter(
            (typeKey) =>
              !LIGHT_TYPE_KEYS.includes(
                typeKey
              )
          )
        : form.desiredBodyTypes;

    const retainedTypeKeys =
      retainedCars
        .map(
          (car) =>
            car.bodyType
        )
        .filter(
          (typeKey) =>
            typeKey &&
            typeKey !==
              "その他・分からない"
        );

    const avoidManufacturers =
      form.avoidNone
        ? []
        : splitTokens(
            form.avoidManufacturers
          );

    const avoidModels =
      form.avoidNone
        ? []
        : splitTokens(
            form.avoidModels
          );

    const avoidTypeKeys =
      form.avoidNone
        ? []
        : form.avoidBodyTypes;

    const avoidConditions =
      form.avoidNone
        ? []
        : form.avoidConditions;

    return [
      PERFECT_INVENTORY_REQUEST_PREFIX,
      `必要人数：${requiredSeats}`,
      `希望TYPE：${desiredTypeKeys.join(
        "｜"
      )}`,
      `希望メーカー：${splitTokens(
        form.desiredManufacturers
      ).join("｜")}`,
      `希望条件：${form.desiredConditions.join(
        "｜"
      )}`,
      `避けたいメーカー：${avoidManufacturers.join(
        "｜"
      )}`,
      `避けたい車種：${avoidModels.join(
        "｜"
      )}`,
      `避けたいTYPE：${avoidTypeKeys.join(
        "｜"
      )}`,
      `避けたい条件：${avoidConditions.join(
        "｜"
      )}`,
      `世帯に残るTYPE：${retainedTypeKeys.join(
        "｜"
      )}`,
    ].join("\n");
  }

  function toggleArrayField(
    key,
    value,
    exclusiveValue = ""
  ) {
    setForm((current) => {
      let currentValues =
        current[key];

      if (
        exclusiveValue &&
        value === exclusiveValue
      ) {
        return {
          ...current,
          [key]:
            currentValues.includes(
              value
            )
              ? []
              : [value],
        };
      }

      if (exclusiveValue) {
        currentValues =
          currentValues.filter(
            (item) =>
              item !==
              exclusiveValue
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
          current.ownedCars.length >
          0
            ? current.ownedCars
            : [
                makeOwnedCar(
                  `car-${Date.now()}`
                ),
              ],
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
            current.ownedCars.length +
            1
          }`
        ),
      ],
    }));
  }

  function removeOwnedCar(id) {
    setForm((current) => ({
      ...current,
      ownedCars:
        current.ownedCars.filter(
          (car) =>
            car.id !== id
        ),
      replacementTargetId:
        current.replacementTargetId ===
        id
          ? ""
          : current.replacementTargetId,
    }));
  }

  function setPurchasePlan(value) {
    setForm((current) => ({
      ...current,
      purchasePlan: value,
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
        avoidReason: "",
      };
    });
  }
    function validatePage(
    targetPage
  ) {
    if (targetPage === 1) {
      if (!form.maxPassengers) {
        return "最大で乗る人数を選んでください。";
      }

      if (
        form.driverAges.length ===
        0
      ) {
        return "運転する人の年齢を選んでください。";
      }

      if (!form.hasOwnedCars) {
        return "現在、ご家庭で車を所有しているか選んでください。";
      }

      if (
        form.hasOwnedCars ===
          "yes" &&
        (
          form.ownedCars.length ===
            0 ||
          form.ownedCars.some(
            (car) =>
              !car.model.trim() ||
              !car.bodyType
          )
        )
      ) {
        return "所有している車の車種名とタイプを入力してください。";
      }

      if (!form.purchasePlan) {
        return "増車・新規購入か、乗り換えかを選んでください。";
      }

      if (
        form.purchasePlan ===
          "乗り換え" &&
        !form.replacementTargetId
      ) {
        return "乗り換える予定の車を選んでください。";
      }
    }

    if (targetPage === 2) {
      const hasAvoidInput =
        form.avoidManufacturers.trim() ||
        form.avoidModels.trim() ||
        form.avoidBodyTypes.length >
          0 ||
        form.avoidConditions.length >
          0 ||
        form.avoidReason.trim();

      if (
        !form.avoidNone &&
        !hasAvoidInput
      ) {
        return "避けたい車がなければ「特になし」を選んでください。";
      }

      if (
        form.desiredBodyTypes
          .length === 0
      ) {
        return "希望する車のタイプを選んでください。";
      }

      if (
        form.desiredConditions
          .length === 0
      ) {
        return "車に求める条件を1つ以上選んでください。";
      }
    }

    return "";
  }

  function goToPage(nextPage) {
    const message =
      validatePage(page);

    if (message) {
      setValidationError(
        message
      );

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
      window.history.length >
      1
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
                option.label ===
                label
            );

        return {
          label,
          weight:
            matchedOption?.weight ||
            50,
        };
      }
    );
  }

  function buildDiagnosisInput() {
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
          form.hasOwnedCars ===
          "yes",

        ownedCars:
          form.ownedCars,

        purchasePlan:
          form.purchasePlan,

        replacementTarget:
          replacementTarget ||
          null,

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

        reason:
          form.avoidReason.trim(),
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
      setValidationError(
        message
      );

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
          data.result
            ?.recommendations
        )
      ) {
        throw new Error(
          "診断結果の形式が正しくありません。"
        );
      }

      setDiagnosis(
        data.result
      );
    } catch (caughtError) {
      setError(
        caughtError.message ||
          "エラーが発生しました。"
      );
    } finally {
      setLoading(false);
    }
  }

  async function sendMatchedInventoryToLine() {
    setInventoryLoading(true);
    setInventoryError("");

    try {
      if (
        typeof window ===
          "undefined" ||
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

      await window.liff.sendMessages([
        {
          type: "text",
          text:
            buildInventoryLineMessage(),
        },
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

  function openEditPage(
    targetPage
  ) {
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
    scrollTop();
  }

  return (
    <main>
      <Script
        src="https://static.line-scdn.net/liff/edge/2/sdk.js"
        strategy="afterInteractive"
        onLoad={
          initializeLiff
        }
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

        <h1>
          ぴったり車種診断
        </h1>

        {!diagnosis &&
        !loading &&
        !error ? (
          <div className="page-badge">
            入力 {page} / 3
          </div>
        ) : null}

        {validationError ? (
          <div className="alert-box">
            {validationError}
          </div>
        ) : null}

        {!diagnosis &&
        !loading &&
        !error &&
        page === 1 ? (
          <>
            <QuestionHeader
              number="1"
              title="この車に最大で何人乗りますか？"
              note="年に数回でも乗る可能性がある最大人数を選んでください。乗車人数は絶対条件として判定します。"
            />

            <p className="field-label">
              最大乗車人数
            </p>

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
            />

            <div className="sub-section">
              <p className="field-label">
                運転する人の年齢（複数選択可）
              </p>

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
              />
            </div>

            <div className="sub-section">
              <p className="field-label">
                最大人数で乗るときの、運転者以外の年齢（複数選択可）
              </p>

              <p className="helper-text">
                お子さんの年齢から、ベビーカー・部活動・自転車・将来の人数変化まで考えます。
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
              />
            </div>

            <div className="divider" />

            <QuestionHeader
              number="2"
              title="今のご家庭の車と、今回の購入について"
              note="残す車と乗り換える車を分け、世帯内で同じ役割の車を重ねて提案しないための質問です。"
            />

            <p className="field-label">
              現在、ご家庭で車を所有していますか？
            </p>

            <ChoiceGrid
              options={[
                "所有している",
                "所有していない",
              ]}
              selected={
                form.hasOwnedCars ===
                "yes"
                  ? "所有している"
                  : form.hasOwnedCars ===
                      "no"
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
            />

            {form.hasOwnedCars ===
            "yes" ? (
              <div className="sub-section">
                <p className="field-label">
                  現在所有している車
                </p>

                {form.ownedCars.map(
                  (car, index) => (
                    <div
                      className="owned-car-card"
                      key={car.id}
                    >
                      <div className="owned-car-header">
                        <strong>
                          所有車{" "}
                          {index + 1}
                        </strong>

                        {form
                          .ownedCars
                          .length >
                        1 ? (
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
                        車種名

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
                        主に乗る人

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
                        車のタイプ

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
              </div>
            ) : null}

            <div className="sub-section">
              <p className="field-label">
                今回はどちらですか？
              </p>

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
              />
            </div>

            {form.purchasePlan ===
              "乗り換え" &&
            form.hasOwnedCars ===
              "yes" ? (
              <div className="sub-section replacement-box">
                <label>
                  乗り換える予定の車

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
                              index +
                              1
                            }`}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <p className="field-label">
                  乗り換えようと思った理由（複数選択可）
                </p>

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
                />

                <label>
                  乗り換え理由の詳細（任意）

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
                    placeholder="例：修理費よりも、修理中に車へ乗れない期間が困ります。"
                  />
                </label>
              </div>
            ) : null}

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
          </>
        ) : null}
        {!diagnosis &&
        !loading &&
        !error &&
        page === 2 ? (
          <>
            <QuestionHeader
              number="3"
              title="避けたい車を教えてください"
              note="メーカー・車種・タイプだけでなく、なぜ避けたいのかも判定に使います。避けたい条件は絶対条件です。"
            />

            <label className="none-row">
              <input
                type="checkbox"
                checked={
                  form.avoidNone
                }
                onChange={(event) =>
                  setAvoidNone(
                    event
                      .target
                      .checked
                  )
                }
              />

              特になし
            </label>

            {!form.avoidNone ? (
              <div className="form-stack">
                <label>
                  避けたいメーカー

                  <input
                    value={
                      form.avoidManufacturers
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "avoidManufacturers",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="例：日産、BMW"
                  />
                </label>

                <label>
                  避けたい車種

                  <input
                    value={
                      form.avoidModels
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "avoidModels",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="例：アルファード、プリウス"
                  />
                </label>

                <div>
                  <p className="field-label">
                    避けたい車のタイプ（複数選択可）
                  </p>

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

                <div>
                  <p className="field-label">
                    避けたい条件（複数選択可）
                  </p>

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
                  />
                </div>

                <label>
                  なぜ避けたいですか？

                  <textarea
                    value={
                      form.avoidReason
                    }
                    onChange={(
                      event
                    ) =>
                      updateField(
                        "avoidReason",
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="例：日産車に以前乗って故障が続いたため。"
                  />
                </label>
              </div>
            ) : null}

            <div className="divider" />

            <QuestionHeader
              number="4"
              title="欲しい車の条件を教えてください"
              note="車のタイプは、ざっくり診断と同じ分類です。ここで選んだ内容を、後の在庫検索にも使います。"
            />

            <label>
              欲しいメーカー（任意）

              <input
                value={
                  form.desiredManufacturers
                }
                onChange={(
                  event
                ) =>
                  updateField(
                    "desiredManufacturers",
                    event
                      .target
                      .value
                  )
                }
                placeholder="例：レクサス、トヨタ。特になければ空欄"
              />
            </label>

            <div className="sub-section">
              <p className="field-label">
                希望する車のタイプ（複数選択可）
              </p>

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
                  className="sub-section"
                  key={
                    group.title
                  }
                >
                  <p className="field-label">
                    {group.title}
                    （複数選択可）
                  </p>

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
                  />
                </div>
              )
            )}

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
          </>
        ) : null}
        {!diagnosis &&
        !loading &&
        !error &&
        page === 3 ? (
          <>
            <QuestionHeader
              number="5"
              title="その他の希望や気になること"
              note="選択肢にない希望や、車を使う場面を自由に入力してください。空欄でも診断できます。"
            />

            <div className="tip-box">
              <strong>
                入力例
              </strong>

              <span>
                犬を乗せる／長距離が多い／妻も運転する／今の車の乗り心地が気に入っている／車中泊したい、など
              </span>
            </div>

            <label>
              自由入力欄

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
                    event.target.value
                  )
                }
                placeholder="希望や不安、今の車で気に入っている点などを自由に入力してください。"
              />
            </label>

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
          </>
        ) : null}

        {loading ? (
          <div className="loading-box">
            <strong>
              診断中
            </strong>

            <h2>
              カーとぴあが、今の暮らしとこれからの変化まで考えています。
            </h2>

            <p>
              診断は30秒程度かかることがあります。
              <br />
              画面はこのままでお待ちください。
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
                あなたに合う車種TOP10
              </h2>

              <p>
                {
                  diagnosis.overview
                }
              </p>
            </section>

            <div className="recommendation-list">
              {diagnosis.recommendations.map(
                (
                  recommendation,
                  index
                ) => (
                  <RecommendationCard
                    key={`${recommendation.maker}-${recommendation.model}-${index}`}
                    recommendation={{
                      ...recommendation,
                      rank:
                        recommendation.rank ||
                        index + 1,
                    }}
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
                  {
                    diagnosis.currentAdvice
                  }
                </p>
              </section>
            ) : null}

            {diagnosis.futureAdvice ? (
              <section className="advice-box">
                <strong>
                  3〜5年後を考えると
                </strong>

                <p>
                  {
                    diagnosis.futureAdvice
                  }
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
                      <div
                        key={label}
                      >
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
                上のTOP10は、在庫に関係なく世の中の車種全体から診断した本命結果です。
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
      <style jsx>{`
        * {
          box-sizing: border-box;
        }

        main {
          min-height: 100vh;
          background: #07111f;
          color: #ffffff;
          padding: 24px 14px 40px;
          font-family:
            -apple-system,
            BlinkMacSystemFont,
            "Helvetica Neue",
            "Yu Gothic",
            "Hiragino Kaku Gothic ProN",
            sans-serif;
        }

        .shell {
          max-width: 680px;
          margin: 0 auto;
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 22px;
          padding: 24px 18px 28px;
          background: rgba(255, 255, 255, 0.03);
          box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
        }

        .logo {
          display: block;
          width: 240px;
          max-width: 82%;
          height: auto;
          margin: 0 auto 16px;
          border-radius: 12px;
        }

        .shell > h1 {
          margin: 0 0 14px;
          text-align: center;
          font-size: 32px;
          line-height: 1.25;
          font-weight: 900;
        }

        .page-badge,
        .question-number {
          display: block;
          width: max-content;
          background: #d6b55b;
          color: #07111f;
          border-radius: 999px;
          font-weight: 900;
        }

        .page-badge {
          margin: 0 auto 24px;
          padding: 7px 14px;
          font-size: 14px;
        }

        .alert-box {
          border: 1px solid rgba(255, 116, 116, 0.75);
          background: rgba(255, 80, 80, 0.12);
          border-radius: 14px;
          padding: 13px 14px;
          margin-bottom: 18px;
          font-size: 14px;
          line-height: 1.6;
          font-weight: 800;
        }

        .question-header {
          margin-bottom: 18px;
        }

        .question-number {
          padding: 5px 10px;
          margin-bottom: 9px;
          font-size: 13px;
        }

        .question-header h2 {
          margin: 0 0 8px;
          font-size: 25px;
          line-height: 1.4;
          font-weight: 900;
        }

        .question-header p,
        .helper-text {
          margin: 0;
          color: rgba(255, 255, 255, 0.78);
          font-size: 13px;
          line-height: 1.7;
          font-weight: 700;
        }

        .field-label {
          margin: 0 0 10px;
          color: #d6b55b;
          font-size: 15px;
          font-weight: 900;
        }

        .helper-text {
          margin: -3px 0 10px;
          color: rgba(255, 255, 255, 0.68);
          font-size: 12px;
        }

        .choice-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .choice-button {
          width: 100%;
          min-height: 52px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 13px;
          padding: 11px 12px;
          background: #ffffff;
          color: #111827;
          font-size: 14px;
          font-weight: 800;
          text-align: left;
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
        }

        .choice-button.active {
          background: linear-gradient(
            135deg,
            #f0d27d,
            #d6b55b
          );
          border: 2px solid #f6dc91;
          color: #07111f;
          box-shadow:
            0 0 0 2px rgba(214, 181, 91, 0.18),
            0 8px 18px rgba(0, 0, 0, 0.22);
          transform: translateY(-1px);
        }

        .choice-button.active .check-box {
          background: #07111f;
          border-color: #07111f;
          color: #ffffff;
        }

        .choice-button.disabled,
        .choice-button:disabled {
          background: #c9ced6;
          border-color: #a9b0bb;
          color: #6b7280;
          opacity: 0.62;
          cursor: not-allowed;
          box-shadow: none;
          transform: none;
        }

        .choice-button.disabled .check-box,
        .choice-button:disabled .check-box {
          background: transparent;
          border-color: #7b8491;
          color: transparent;
        }

        .check-box {
          width: 21px;
          height: 21px;
          border: 1px solid rgba(17, 24, 39, 0.44);
          border-radius: 6px;
          display: grid;
          place-items: center;
          flex: none;
        }

        .sub-section {
          margin-top: 24px;
        }

        .divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.15);
          margin: 32px 0;
        }

        label {
          display: grid;
          gap: 8px;
          margin-bottom: 10px;
          color: rgba(255, 255, 255, 0.9);
          font-size: 14px;
          font-weight: 900;
        }

        input,
        select,
        textarea {
          width: 100%;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 13px;
          background: #ffffff;
          color: #111827;
          padding: 13px 14px;
          font-size: 16px;
          line-height: 1.5;
        }

        textarea {
          min-height: 120px;
          line-height: 1.7;
          resize: vertical;
        }

        .large-textarea {
          min-height: 180px;
        }

        .owned-car-card,
        .replacement-box {
          border: 1px solid rgba(214, 181, 91, 0.38);
          border-radius: 16px;
          padding: 15px;
          background: rgba(214, 181, 91, 0.08);
        }

        .owned-car-card {
          display: grid;
          gap: 14px;
          margin-bottom: 14px;
        }

        .owned-car-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: #d6b55b;
        }

        .owned-car-header button {
          border: 1px solid rgba(255, 255, 255, 0.25);
          border-radius: 10px;
          background: transparent;
          color: #ffffff;
          padding: 7px 10px;
          cursor: pointer;
        }

        .add-button {
          width: 100%;
          border: 1px dashed rgba(214, 181, 91, 0.7);
          border-radius: 13px;
          background: transparent;
          color: #d6b55b;
          padding: 13px;
          font-weight: 900;
          cursor: pointer;
        }

        .form-stack,
        .type-groups,
        .result-stack,
        .recommendation-list {
          display: grid;
          gap: 18px;
        }

        .type-group {
          border: 1px solid rgba(214, 181, 91, 0.25);
          border-radius: 15px;
          padding: 13px;
          background: rgba(214, 181, 91, 0.05);
        }

        .type-group-title {
          margin: 0 0 10px;
          color: #d6b55b;
          font-weight: 900;
        }

        .disabled-note {
          margin: 10px 0 0;
          color: #ffd276;
          font-size: 12px;
          line-height: 1.6;
          font-weight: 800;
        }

        .none-row {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(255, 255, 255, 0.18);
          border-radius: 13px;
          padding: 14px;
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        .none-row input {
          width: auto;
        }

        .tip-box {
          display: grid;
          gap: 6px;
          border: 1px solid rgba(214, 181, 91, 0.45);
          border-radius: 14px;
          padding: 14px;
          margin-bottom: 18px;
          background: rgba(214, 181, 91, 0.1);
        }

        .tip-box strong {
          color: #d6b55b;
        }

        .tip-box span {
          font-size: 13px;
          line-height: 1.65;
        }

        nav {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          margin-top: 28px;
        }

        .primary-button,
        .back-button,
        .toggle-button,
        .edit-navigation button {
          width: 100%;
          border-radius: 14px;
          padding: 15px;
          font-size: 14px;
          font-weight: 900;
          cursor: pointer;
        }

        .primary-button {
          border: 0;
          background: #d6b55b;
          color: #07111f;
        }

        .primary-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        .back-button {
          border: 1px solid rgba(255, 255, 255, 0.24);
          background: transparent;
          color: #ffffff;
        }

        .full-button {
          margin-top: 12px;
        }
                .loading-box,
        .error-box,
        .result-intro,
        .advice-box,
        .inventory-section {
          border: 1px solid rgba(214, 181, 91, 0.45);
          border-radius: 18px;
          padding: 18px;
          background: rgba(214, 181, 91, 0.07);
        }

        .loading-box > strong,
        .error-box > strong,
        .result-intro > strong,
        .advice-box > strong {
          color: #d6b55b;
        }

        .loading-box h2 {
          font-size: 18px;
          line-height: 1.7;
        }

        .loading-box p,
        .error-box p,
        .result-intro p,
        .advice-box p,
        .inventory-section p {
          color: rgba(255, 255, 255, 0.86);
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
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 18px;
          padding: 17px;
          background: rgba(255, 255, 255, 0.055);
          box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18);
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
          color: #d6b55b;
          padding: 6px 10px;
          font-size: 13px;
          font-weight: 900;
        }

        .maker-name {
          margin: 12px 0 0;
          color: rgba(255, 255, 255, 0.65);
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
          border: 1px solid rgba(255, 255, 255, 0.13);
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.08);
          padding: 5px 8px;
          font-size: 11px;
        }

        .recommendation-card h4 {
          margin: 13px 0 5px;
          color: #d6b55b;
          font-size: 12px;
        }

        .recommendation-card > p {
          margin: 0;
          color: rgba(255, 255, 255, 0.88);
          font-size: 14px;
          line-height: 1.72;
        }

        .caution-box {
          margin-top: 13px;
          border-left: 3px solid rgba(255, 210, 118, 0.8);
          padding: 9px 11px;
          background: rgba(255, 210, 118, 0.07);
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
          border: 1px solid rgba(255, 255, 255, 0.22);
          background: rgba(255, 255, 255, 0.06);
          color: #ffffff;
        }

        .answer-summary {
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 15px;
          padding: 14px;
          background: rgba(0, 0, 0, 0.12);
          margin-top: 10px;
        }

        .answer-summary > div {
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding: 8px 0;
        }

        .answer-summary > div:last-child {
          border-bottom: 0;
        }

        .answer-summary strong {
          color: #d6b55b;
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
          background: rgba(255, 80, 80, 0.1);
        }

        .empty-box {
          border: 1px solid rgba(255, 255, 255, 0.16);
          border-radius: 14px;
          padding: 15px;
          background: rgba(7, 17, 31, 0.42);
        }

        .empty-box h3 {
          margin-top: 0;
          font-size: 15px;
        }

        .edit-navigation {
          display: grid;
          gap: 10px;
          border-top: 1px solid rgba(255, 255, 255, 0.15);
          padding-top: 20px;
        }

        .edit-navigation > strong {
          color: #d6b55b;
        }

        .edit-navigation > button:not(.back-button) {
          border: 1px solid rgba(214, 181, 91, 0.55);
          background: rgba(214, 181, 91, 0.08);
          color: #ffffff;
        }

        .small-note {
          margin-top: 24px;
          color: rgba(255, 255, 255, 0.55);
          font-size: 12px;
          line-height: 1.7;
        }

        @media (max-width: 420px) {
          .choice-grid {
            grid-template-columns: 1fr;
          }

          .shell {
            padding: 20px 14px;
          }

          .shell > h1 {
            font-size: 28px;
          }

          .question-header h2 {
            font-size: 22px;
          }
        }
      `}</style>
    </main>
  );
}
