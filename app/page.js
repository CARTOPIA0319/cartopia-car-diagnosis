"use client";

import { useState } from "react";

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

const BODY_TYPE_OPTIONS = [
  "セダン",
  "SUV",
  "ミニバン",
  "コンパクト",
  "ステーションワゴン",
  "クーペ・スポーツ",
  "軽自動車",
  "バン・トラック",
  "特にこだわらない",
];

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

function ChoiceGrid({ options, selected, onToggle, single = false }) {
  return (
    <div style={styles.choiceGrid}>
      {options.map((option) => {
        const value = typeof option === "string" ? option : option.label;
        const active = single ? selected === value : selected.includes(value);

        return (
          <button
            key={value}
            type="button"
            style={{
              ...styles.choiceButton,
              ...(active ? styles.choiceButtonActive : {}),
            }}
            onClick={() => onToggle(value)}
          >
            <span style={styles.checkBox}>{active ? "✓" : ""}</span>
            <span>{value}</span>
          </button>
        );
      })}
    </div>
  );
}

function QuestionHeader({ number, title, note }) {
  return (
    <div style={styles.questionHeader}>
      <span style={styles.questionNumber}>質問{number}</span>
      <h2 style={styles.questionTitle}>{title}</h2>
      {note ? <p style={styles.note}>{note}</p> : null}
    </div>
  );
}

function FieldLabel({ children }) {
  return <p style={styles.fieldLabel}>{children}</p>;
}

export default function Home() {
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(makeInitialForm);
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");

  const requiredSeats =
    MAX_PASSENGER_OPTIONS.find((item) => item.label === form.maxPassengers)
      ?.seats || 0;

  const replacementTarget = form.ownedCars.find(
    (car) => car.id === form.replacementTargetId
  );

  const retainedCars =
    form.hasOwnedCars === "yes"
      ? form.ownedCars.filter((car) => {
          if (form.purchasePlan !== "乗り換え") return true;
          return car.id !== form.replacementTargetId;
        })
      : [];

  function scrollTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleArrayField(key, value, exclusiveValue = "") {
    setForm((current) => {
      const currentValues = current[key];

      if (exclusiveValue && value === exclusiveValue) {
        return {
          ...current,
          [key]: currentValues.includes(value) ? [] : [value],
        };
      }

      const withoutExclusive = exclusiveValue
        ? currentValues.filter((item) => item !== exclusiveValue)
        : currentValues;

      const nextValues = withoutExclusive.includes(value)
        ? withoutExclusive.filter((item) => item !== value)
        : [...withoutExclusive, value];

      return { ...current, [key]: nextValues };
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
        ownedCars:
          current.ownedCars.length > 0
            ? current.ownedCars
            : [makeOwnedCar(`car-${Date.now()}`)],
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
        makeOwnedCar(`car-${Date.now()}-${current.ownedCars.length + 1}`),
      ],
    }));
  }

  function removeOwnedCar(id) {
    setForm((current) => {
      const nextCars = current.ownedCars.filter((car) => car.id !== id);

      return {
        ...current,
        ownedCars: nextCars,
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
      replacementTargetId:
        value === "乗り換え" ? current.replacementTargetId : "",
      replacementReasons:
        value === "乗り換え" ? current.replacementReasons : [],
      replacementReasonMemo:
        value === "乗り換え" ? current.replacementReasonMemo : "",
    }));
  }

  function setAvoidNone(value) {
    setForm((current) => {
      if (!value) {
        return { ...current, avoidNone: false };
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

  function validatePage(targetPage) {
    if (targetPage === 1) {
      if (!form.maxPassengers) {
        return "最大で乗る人数を選んでください。";
      }

      if (form.driverAges.length === 0) {
        return "運転する人の年齢を選んでください。";
      }

      if (!form.hasOwnedCars) {
        return "現在、ご家庭で車を所有しているか選んでください。";
      }

      if (form.hasOwnedCars === "yes") {
        const incompleteCar = form.ownedCars.some(
          (car) => !car.model.trim() || !car.bodyType
        );

        if (form.ownedCars.length === 0 || incompleteCar) {
          return "所有している車の車種名とボディタイプを入力してください。";
        }
      }

      if (!form.purchasePlan) {
        return "増車・新規購入か、乗り換えかを選んでください。";
      }

      if (form.purchasePlan === "乗り換え") {
        if (form.hasOwnedCars !== "yes") {
          return "乗り換えの場合は、現在所有している車を登録してください。";
        }

        if (!form.replacementTargetId) {
          return "乗り換える予定の車を選んでください。";
        }
      }
    }

    if (targetPage === 2) {
      const hasAvoidInput =
        form.avoidManufacturers.trim() ||
        form.avoidModels.trim() ||
        form.avoidBodyTypes.length > 0 ||
        form.avoidConditions.length > 0 ||
        form.avoidReason.trim();

      if (!form.avoidNone && !hasAvoidInput) {
        return "避けたい車がなければ「特になし」を選んでください。";
      }

      if (form.desiredBodyTypes.length === 0) {
        return "希望するボディタイプを選んでください。";
      }

      if (form.desiredConditions.length === 0) {
        return "車に求める条件を1つ以上選んでください。";
      }
    }

    return "";
  }

  function goToPage(nextPage) {
    const message = validatePage(page);

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
      setPage((current) => current - 1);
      scrollTop();
      return;
    }

    if (window.history.length > 1) {
      window.history.back();
    }
  }

  function openEditPage(targetPage) {
    setResult("");
    setError("");
    setValidationError("");
    setPage(targetPage);
    scrollTop();
  }

  function restart() {
    setPage(1);
    setForm(makeInitialForm());
    setResult("");
    setLoading(false);
    setError("");
    setValidationError("");
    scrollTop();
  }

  function buildSummary() {
    const weightedPreferences = form.desiredConditions.map((label) => {
      const option = WANTED_CONDITION_GROUPS.flatMap(
        (group) => group.options
      ).find((item) => item.label === label);

      return {
        label,
        weight: option?.weight || 50,
      };
    });

    return [
      {
        questionNumber: 1,
        title: "この車に最大で乗る人数と、乗る人の年齢",
        hardConditions: {
          maximumPassengers: form.maxPassengers,
          minimumRequiredSeats: requiredSeats,
          driverAges: form.driverAges,
          passengerAges: form.passengerAges,
        },
        inferenceInstruction:
          "年齢からチャイルドシート、ベビーカー、乗り降り、部活動、自転車、将来の独立などを推測し、今と3〜5年後の両方を考える。使用年数は質問していないため、お客様に決めさせずAI側で将来変化を説明する。",
      },
      {
        questionNumber: 2,
        title: "世帯で所有している車と、今回の購入・乗り換え",
        hardConditions: {
          hasOwnedCars: form.hasOwnedCars === "yes",
          purchasePlan: form.purchasePlan,
          ownedCars: form.ownedCars,
          replacementTarget: replacementTarget || null,
          retainedHouseholdCars: retainedCars,
          noDuplicateBodyTypeRule:
            "乗り換え後も世帯に残る車と同じボディタイプは提案しない。乗り換え対象車は残る車に含めない。",
        },
        replacementReasons: form.replacementReasons,
        replacementReasonMemo: form.replacementReasonMemo.trim(),
      },
      {
        questionNumber: 3,
        title: "避けたい車",
        hardConditions: {
          none: form.avoidNone,
          manufacturers: form.avoidManufacturers.trim(),
          models: form.avoidModels.trim(),
          bodyTypes: form.avoidBodyTypes,
          conditions: form.avoidConditions,
        },
        reason: form.avoidReason.trim(),
        interpretationInstruction:
          "避けたい理由の奥にある不満や心の声を読み取り、その不満が再発する車を候補から外す。",
      },
      {
        questionNumber: 4,
        title: "欲しい車の条件",
        hardConditions: {
          desiredManufacturers: form.desiredManufacturers.trim(),
          desiredBodyTypes: form.desiredBodyTypes,
          bodyTypeRule:
            "『特にこだわらない』以外の選択は絶対条件として扱い、選ばれていないボディタイプへ勝手に広げない。",
        },
        weightedPreferences,
        weightingInstruction:
          "weightが高い価値観を優先する。複数選択時は平均化せず、高級感など高ウェイトの本音を、シンプルなど低ウェイトの補助条件より強く反映する。",
      },
      {
        questionNumber: 5,
        title: "その他の希望や気になること",
        memo: form.otherRequest.trim(),
      },
    ];
  }

  async function runAiDiagnosis() {
    const message = validatePage(2);

    if (message) {
      setValidationError(message);
      setPage(2);
      scrollTop();
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setValidationError("");
    scrollTop();

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mode: "perfect",
          answers: buildSummary(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "診断に失敗しました");
      }

      setResult(data.result || "診断結果を取得できませんでした。");
    } catch (err) {
      setError(err.message || "エラーが発生しました。");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <div style={styles.logoWrap}>
          <img
            src="/cartopia-logo.png"
            alt="カーとぴあ CARTOPIA"
            style={styles.logoImage}
          />
        </div>

        <h1 style={styles.title}>ぴったり車種診断</h1>

        {!result && !loading && !error ? (
          <div style={styles.pageBadge}>入力 {page} / 3</div>
        ) : null}

        {validationError ? (
          <div style={styles.alertBox}>{validationError}</div>
        ) : null}

        {!result && !loading && !error && page === 1 ? (
          <>
            <QuestionHeader
              number="1"
              title="この車に最大で何人乗りますか？"
              note="年に数回でも乗る可能性がある最大人数を選んでください。乗車人数は絶対条件として判定します。"
            />

            <FieldLabel>最大乗車人数</FieldLabel>

            <ChoiceGrid
              options={MAX_PASSENGER_OPTIONS}
              selected={form.maxPassengers}
              single
              onToggle={(value) => updateField("maxPassengers", value)}
            />

            <div style={styles.subSection}>
              <FieldLabel>運転する人の年齢（複数選択可）</FieldLabel>

              <ChoiceGrid
                options={DRIVER_AGE_OPTIONS}
                selected={form.driverAges}
                onToggle={(value) => toggleArrayField("driverAges", value)}
              />
            </div>

            <div style={styles.subSection}>
              <FieldLabel>
                最大人数で乗るときの、運転者以外の年齢（複数選択可）
              </FieldLabel>

              <p style={styles.helperText}>
                お子さんは分かる範囲で年齢を選んでください。AIがベビーカー、部活動、自転車、将来の人数変化まで考えます。
              </p>

              <ChoiceGrid
                options={PASSENGER_AGE_OPTIONS}
                selected={form.passengerAges}
                onToggle={(value) => toggleArrayField("passengerAges", value)}
              />
            </div>

            <div style={styles.divider} />

            <QuestionHeader
              number="2"
              title="今のご家庭の車と、今回の購入について"
              note="残す車と乗り換える車を正確に分け、世帯内で同じ役割の車を重ねて提案しないための質問です。"
            />

            <FieldLabel>現在、ご家庭で車を所有していますか？</FieldLabel>

            <ChoiceGrid
              options={["所有している", "所有していない"]}
              selected={
                form.hasOwnedCars === "yes"
                  ? "所有している"
                  : form.hasOwnedCars === "no"
                    ? "所有していない"
                    : ""
              }
              single
              onToggle={(value) =>
                setHasOwnedCars(value === "所有している" ? "yes" : "no")
              }
            />

            {form.hasOwnedCars === "yes" ? (
              <div style={styles.subSection}>
                <FieldLabel>現在所有している車</FieldLabel>

                <div style={styles.carList}>
                  {form.ownedCars.map((car, index) => (
                    <div key={car.id} style={styles.carCard}>
                      <div style={styles.carCardHeader}>
                        <span style={styles.carCardTitle}>
                          所有車 {index + 1}
                        </span>

                        {form.ownedCars.length > 1 ? (
                          <button
                            type="button"
                            style={styles.removeButton}
                            onClick={() => removeOwnedCar(car.id)}
                          >
                            削除
                          </button>
                        ) : null}
                      </div>

                      <label style={styles.inputLabel}>
                        車種名

                        <input
                          type="text"
                          style={styles.input}
                          value={car.model}
                          onChange={(event) =>
                            updateOwnedCar(car.id, "model", event.target.value)
                          }
                          placeholder="例：アルファード"
                        />
                      </label>

                      <label style={styles.inputLabel}>
                        主に乗る人

                        <input
                          type="text"
                          style={styles.input}
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

                      <label style={styles.inputLabel}>
                        ボディタイプ

                        <select
                          style={styles.select}
                          value={car.bodyType}
                          onChange={(event) =>
                            updateOwnedCar(
                              car.id,
                              "bodyType",
                              event.target.value
                            )
                          }
                        >
                          <option value="">選択してください</option>

                          {BODY_TYPE_OPTIONS.filter(
                            (item) => item !== "特にこだわらない"
                          ).map((item) => (
                            <option key={item} value={item}>
                              {item}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  style={styles.addButton}
                  onClick={addOwnedCar}
                >
                  ＋ 所有車を追加
                </button>
              </div>
            ) : null}

            <div style={styles.subSection}>
              <FieldLabel>今回はどちらですか？</FieldLabel>

              <ChoiceGrid
                options={["増車・新規購入", "乗り換え"]}
                selected={form.purchasePlan}
                single
                onToggle={setPurchasePlan}
              />
            </div>

            {form.purchasePlan === "乗り換え" &&
            form.hasOwnedCars === "yes" ? (
              <div style={styles.subSection}>
                <label style={styles.inputLabel}>
                  乗り換える予定の車

                  <select
                    style={styles.select}
                    value={form.replacementTargetId}
                    onChange={(event) =>
                      updateField("replacementTargetId", event.target.value)
                    }
                  >
                    <option value="">選択してください</option>

                    {form.ownedCars.map((car, index) => (
                      <option key={car.id} value={car.id}>
                        {car.model.trim() || `所有車 ${index + 1}`}
                      </option>
                    ))}
                  </select>
                </label>

                <FieldLabel>
                  乗り換えようと思った理由（複数選択可）
                </FieldLabel>

                <ChoiceGrid
                  options={REPLACEMENT_REASON_OPTIONS}
                  selected={form.replacementReasons}
                  onToggle={(value) =>
                    toggleArrayField("replacementReasons", value)
                  }
                />

                <label style={styles.inputLabel}>
                  乗り換え理由の詳細（任意）

                  <textarea
                    style={styles.textarea}
                    value={form.replacementReasonMemo}
                    onChange={(event) =>
                      updateField("replacementReasonMemo", event.target.value)
                    }
                    placeholder="例：修理費よりも、修理中に車へ乗れない期間が困ります。"
                  />
                </label>
              </div>
            ) : null}

            <div style={styles.nav}>
              <button
                type="button"
                style={styles.backButton}
                onClick={goBack}
              >
                前の画面に戻る
              </button>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => goToPage(2)}
              >
                次へ
              </button>
            </div>
          </>
        ) : null}

        {!result && !loading && !error && page === 2 ? (
          <>
            <QuestionHeader
              number="3"
              title="避けたい車を教えてください"
              note="メーカー・車種・ボディタイプだけでなく、なぜ避けたいのかも判定に使います。避けたい条件は絶対条件です。"
            />

            <label style={styles.noneRow}>
              <input
                type="checkbox"
                checked={form.avoidNone}
                onChange={(event) => setAvoidNone(event.target.checked)}
              />

              <span>特になし</span>
            </label>

            {!form.avoidNone ? (
              <div style={styles.formStack}>
                <label style={styles.inputLabel}>
                  避けたいメーカー

                  <input
                    type="text"
                    style={styles.input}
                    value={form.avoidManufacturers}
                    onChange={(event) =>
                      updateField("avoidManufacturers", event.target.value)
                    }
                    placeholder="例：○○、特になし"
                  />
                </label>

                <label style={styles.inputLabel}>
                  避けたい車種

                  <input
                    type="text"
                    style={styles.input}
                    value={form.avoidModels}
                    onChange={(event) =>
                      updateField("avoidModels", event.target.value)
                    }
                    placeholder="例：アルファード、○○"
                  />
                </label>

                <div>
                  <FieldLabel>
                    避けたいボディタイプ（複数選択可）
                  </FieldLabel>

                  <ChoiceGrid
                    options={BODY_TYPE_OPTIONS.filter(
                      (item) => item !== "特にこだわらない"
                    )}
                    selected={form.avoidBodyTypes}
                    onToggle={(value) =>
                      toggleArrayField("avoidBodyTypes", value)
                    }
                  />
                </div>

                <div>
                  <FieldLabel>避けたい条件（複数選択可）</FieldLabel>

                  <ChoiceGrid
                    options={AVOID_CONDITION_OPTIONS}
                    selected={form.avoidConditions}
                    onToggle={(value) =>
                      toggleArrayField("avoidConditions", value)
                    }
                  />
                </div>

                <label style={styles.inputLabel}>
                  なぜ避けたいですか？

                  <textarea
                    style={styles.textarea}
                    value={form.avoidReason}
                    onChange={(event) =>
                      updateField("avoidReason", event.target.value)
                    }
                    placeholder="例：大きい車は駐車でぶつけやすく、修理中に乗れない期間が困るため。"
                  />
                </label>
              </div>
            ) : null}

            <div style={styles.divider} />

            <QuestionHeader
              number="4"
              title="欲しい車の条件を教えてください"
              note="ボディタイプは絶対条件、見た目や使いやすさは裏側で重要度を変えて順位付けします。"
            />

            <label style={styles.inputLabel}>
              欲しいメーカー（任意）

              <input
                type="text"
                style={styles.input}
                value={form.desiredManufacturers}
                onChange={(event) =>
                  updateField("desiredManufacturers", event.target.value)
                }
                placeholder="例：レクサス、トヨタ。特になければ空欄"
              />
            </label>

            <div style={styles.subSection}>
              <FieldLabel>
                希望するボディタイプ（複数選択可）
              </FieldLabel>

              <ChoiceGrid
                options={BODY_TYPE_OPTIONS}
                selected={form.desiredBodyTypes}
                onToggle={(value) =>
                  toggleArrayField(
                    "desiredBodyTypes",
                    value,
                    "特にこだわらない"
                  )
                }
              />
            </div>

            {WANTED_CONDITION_GROUPS.map((group) => (
              <div key={group.title} style={styles.subSection}>
                <FieldLabel>{group.title}（複数選択可）</FieldLabel>

                <ChoiceGrid
                  options={group.options}
                  selected={form.desiredConditions}
                  onToggle={(value) =>
                    toggleArrayField("desiredConditions", value)
                  }
                />
              </div>
            ))}

            <div style={styles.nav}>
              <button
                type="button"
                style={styles.backButton}
                onClick={goBack}
              >
                1ページ目に戻る
              </button>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={() => goToPage(3)}
              >
                次へ
              </button>
            </div>
          </>
        ) : null}

        {!result && !loading && !error && page === 3 ? (
          <>
            <QuestionHeader
              number="5"
              title="その他の希望や気になること"
              note="選択肢にない希望や、車を使う場面を自由に入力してください。空欄でも診断できます。"
            />

            <div style={styles.tipBox}>
              <span style={styles.tipTitle}>入力例</span>

              <span style={styles.tipText}>
                犬を乗せる／長距離が多い／妻も運転する／今の車の乗り心地が気に入っている／車中泊したい、など
              </span>
            </div>

            <label style={styles.inputLabel}>
              自由入力欄

              <textarea
                style={{ ...styles.textarea, minHeight: "180px" }}
                value={form.otherRequest}
                onChange={(event) =>
                  updateField("otherRequest", event.target.value)
                }
                placeholder="希望や不安、今の車で気に入っている点などを自由に入力してください。"
              />
            </label>

            <div style={styles.nav}>
              <button
                type="button"
                style={styles.backButton}
                onClick={goBack}
              >
                2ページ目に戻る
              </button>

              <button
                type="button"
                style={styles.primaryButton}
                onClick={runAiDiagnosis}
              >
                AIで診断する
              </button>
            </div>
          </>
        ) : null}

        {loading ? (
          <div style={styles.loadingBox}>
            <p style={styles.loadingLabel}>診断中</p>

            <p style={styles.loadingMain}>
              カーとぴあが、今の暮らしとこれからの変化まで考えています。
            </p>

            <div style={styles.waitBox}>
              <p style={styles.waitTitle}>少しだけお待ちください</p>

              <p style={styles.waitText}>
                診断は30秒程度かかることがあります。
                <br />
                画面はこのままでお待ちください。
              </p>
            </div>

            <div style={styles.promoBox}>
              <p style={styles.promoCatch}>
                今だけでなく、これからの暮らしにも。
              </p>

              <p style={styles.promoText}>
                お子さんの成長、家族で乗る人数の変化、世帯に残る車の役割まで考えて、本当に合う車種を探します。
              </p>
            </div>
          </div>
        ) : null}

        {error ? (
          <div style={styles.resultBox}>
            <p style={styles.resultLabel}>エラー</p>

            <p style={styles.resultText}>{error}</p>

            <button
              type="button"
              style={styles.primaryButton}
              onClick={runAiDiagnosis}
            >
              もう一度診断する
            </button>

            <button
              type="button"
              style={styles.backButton}
              onClick={() => openEditPage(3)}
            >
              3ページ目に戻る
            </button>
          </div>
        ) : null}

        {result ? (
          <div style={styles.resultBox}>
            <p style={styles.resultLabel}>AI診断結果</p>

            <div style={styles.aiText}>{result}</div>

            <div style={styles.editNavBox}>
              <p style={styles.editNavTitle}>回答を修正する</p>

              <button
                type="button"
                style={styles.editButton}
                onClick={() => openEditPage(1)}
              >
                1ページ目に戻る
              </button>

              <button
                type="button"
                style={styles.editButton}
                onClick={() => openEditPage(2)}
              >
                2ページ目に戻る
              </button>

              <button
                type="button"
                style={styles.editButton}
                onClick={() => openEditPage(3)}
              >
                3ページ目に戻る
              </button>

              <button
                type="button"
                style={styles.restartButton}
                onClick={restart}
              >
                最初からやり直す
              </button>
            </div>
          </div>
        ) : null}

        <p style={styles.small}>
          ※これはAIによる簡易診断です。実際の在庫状況やご希望条件に合わせて、スタッフがより詳しくご提案します。
        </p>
      </section>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#07111f",
    color: "#ffffff",
    padding: "24px 14px 40px",
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Helvetica Neue", "Yu Gothic", "Hiragino Kaku Gothic ProN", sans-serif',
    boxSizing: "border-box",
  },

  card: {
    maxWidth: "620px",
    margin: "0 auto",
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "22px",
    padding: "24px 18px 28px",
    background: "rgba(255,255,255,0.03)",
    boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
    boxSizing: "border-box",
  },

  logoWrap: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "16px",
  },

  logoImage: {
    width: "240px",
    maxWidth: "82%",
    height: "auto",
    display: "block",
    borderRadius: "12px",
  },

  title: {
    fontSize: "32px",
    lineHeight: "1.25",
    margin: "0 0 14px",
    fontWeight: "900",
    textAlign: "center",
  },

  pageBadge: {
    width: "fit-content",
    margin: "0 auto 24px",
    color: "#07111f",
    background: "#d6b55b",
    fontSize: "14px",
    fontWeight: "900",
    padding: "7px 14px",
    borderRadius: "999px",
  },

  alertBox: {
    border: "1px solid rgba(255,116,116,0.75)",
    background: "rgba(255,80,80,0.12)",
    color: "#ffffff",
    borderRadius: "14px",
    padding: "13px 14px",
    marginBottom: "18px",
    fontSize: "14px",
    fontWeight: "800",
    lineHeight: "1.6",
  },

  questionHeader: {
    marginBottom: "18px",
  },

  questionNumber: {
    display: "inline-block",
    color: "#07111f",
    background: "#d6b55b",
    fontSize: "13px",
    fontWeight: "900",
    padding: "5px 10px",
    borderRadius: "999px",
    marginBottom: "9px",
  },

  questionTitle: {
    fontSize: "25px",
    lineHeight: "1.4",
    margin: "0 0 8px",
    fontWeight: "900",
    color: "#ffffff",
  },

  note: {
    fontSize: "14px",
    lineHeight: "1.75",
    color: "rgba(255,255,255,0.78)",
    margin: 0,
    fontWeight: "700",
  },

  fieldLabel: {
    color: "#d6b55b",
    fontSize: "15px",
    fontWeight: "900",
    margin: "0 0 10px",
  },

  helperText: {
    color: "rgba(255,255,255,0.68)",
    fontSize: "12px",
    fontWeight: "700",
    lineHeight: "1.65",
    margin: "-3px 0 10px",
  },

  choiceGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    gap: "10px",
  },

  choiceButton: {
    width: "100%",
    minHeight: "52px",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "13px",
    padding: "11px 12px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "14px",
    fontWeight: "800",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
    gap: "9px",
    boxSizing: "border-box",
  },

  choiceButtonActive: {
    background: "#d6b55b",
    color: "#07111f",
    border: "1px solid #d6b55b",
  },

  checkBox: {
    width: "21px",
    height: "21px",
    borderRadius: "6px",
    border: "1px solid rgba(17,24,39,0.42)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    fontWeight: "900",
    flexShrink: 0,
  },

  subSection: {
    marginTop: "24px",
  },

  divider: {
    height: "1px",
    background: "rgba(255,255,255,0.15)",
    margin: "32px 0",
  },

  formStack: {
    display: "grid",
    gap: "22px",
  },

  inputLabel: {
    display: "grid",
    gap: "8px",
    color: "rgba(255,255,255,0.9)",
    fontSize: "14px",
    fontWeight: "900",
  },

  input: {
    width: "100%",
    borderRadius: "13px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#ffffff",
    color: "#111827",
    padding: "13px 14px",
    fontSize: "16px",
    lineHeight: "1.5",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    borderRadius: "13px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#ffffff",
    color: "#111827",
    padding: "13px 14px",
    fontSize: "16px",
    lineHeight: "1.5",
    boxSizing: "border-box",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    borderRadius: "13px",
    border: "1px solid rgba(255,255,255,0.18)",
    background: "#ffffff",
    color: "#111827",
    padding: "13px 14px",
    fontSize: "16px",
    lineHeight: "1.7",
    boxSizing: "border-box",
    resize: "vertical",
  },

  carList: {
    display: "grid",
    gap: "14px",
  },

  carCard: {
    border: "1px solid rgba(214,181,91,0.38)",
    borderRadius: "16px",
    padding: "15px",
    background: "rgba(214,181,91,0.08)",
    display: "grid",
    gap: "14px",
  },

  carCardHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
  },

  carCardTitle: {
    color: "#d6b55b",
    fontSize: "15px",
    fontWeight: "900",
  },

  removeButton: {
    border: "1px solid rgba(255,255,255,0.25)",
    borderRadius: "10px",
    background: "transparent",
    color: "rgba(255,255,255,0.82)",
    padding: "7px 10px",
    fontSize: "12px",
    fontWeight: "800",
  },

  addButton: {
    width: "100%",
    marginTop: "12px",
    border: "1px dashed rgba(214,181,91,0.7)",
    borderRadius: "13px",
    background: "transparent",
    color: "#d6b55b",
    padding: "13px",
    fontSize: "14px",
    fontWeight: "900",
  },

  noneRow: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "13px",
    padding: "14px",
    marginBottom: "22px",
    background: "rgba(255,255,255,0.06)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "900",
  },

  tipBox: {
    display: "grid",
    gap: "6px",
    border: "1px solid rgba(214,181,91,0.45)",
    borderRadius: "14px",
    padding: "14px",
    marginBottom: "18px",
    background: "rgba(214,181,91,0.1)",
  },

  tipTitle: {
    color: "#d6b55b",
    fontSize: "14px",
    fontWeight: "900",
  },

  tipText: {
    color: "rgba(255,255,255,0.82)",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "1.65",
  },

  nav: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginTop: "28px",
  },

  primaryButton: {
    width: "100%",
    border: "none",
    borderRadius: "14px",
    padding: "16px 14px",
    background: "#d6b55b",
    color: "#07111f",
    fontSize: "16px",
    fontWeight: "900",
    boxSizing: "border-box",
  },

  backButton: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.24)",
    borderRadius: "14px",
    padding: "15px 12px",
    background: "transparent",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "800",
    boxSizing: "border-box",
  },

  loadingBox: {
    border: "1px solid rgba(214,181,91,0.45)",
    borderRadius: "18px",
    padding: "20px",
    background: "rgba(214,181,91,0.09)",
    boxSizing: "border-box",
  },

  loadingLabel: {
    color: "#d6b55b",
    fontSize: "18px",
    fontWeight: "900",
    margin: "0 0 14px",
  },

  loadingMain: {
    fontSize: "18px",
    lineHeight: "1.8",
    color: "rgba(255,255,255,0.96)",
    fontWeight: "900",
    margin: "0 0 16px",
  },

  waitBox: {
    border: "1px solid rgba(255,255,255,0.16)",
    borderRadius: "14px",
    padding: "14px",
    background: "rgba(255,255,255,0.06)",
    marginBottom: "18px",
    boxSizing: "border-box",
  },

  waitTitle: {
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "900",
    margin: "0 0 8px",
  },

  waitText: {
    color: "rgba(255,255,255,0.78)",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "1.7",
    margin: 0,
  },

  promoBox: {
    border: "1px solid rgba(214,181,91,0.38)",
    borderRadius: "16px",
    padding: "16px",
    background: "rgba(7,17,31,0.55)",
    boxSizing: "border-box",
  },

  promoCatch: {
    color: "#d6b55b",
    fontSize: "17px",
    fontWeight: "900",
    lineHeight: "1.6",
    margin: "0 0 10px",
  },

  promoText: {
    color: "rgba(255,255,255,0.86)",
    fontSize: "13px",
    fontWeight: "700",
    lineHeight: "1.8",
    margin: 0,
  },

  resultBox: {
    border: "1px solid rgba(214,181,91,0.45)",
    borderRadius: "16px",
    padding: "18px",
    background: "rgba(214,181,91,0.1)",
    boxSizing: "border-box",
  },

  resultLabel: {
    color: "#d6b55b",
    fontSize: "18px",
    fontWeight: "900",
    margin: "0 0 14px",
  },

  resultText: {
    fontSize: "15px",
    lineHeight: "1.8",
    color: "rgba(255,255,255,0.9)",
  },

  aiText: {
    whiteSpace: "pre-wrap",
    fontSize: "15px",
    lineHeight: "1.85",
    color: "rgba(255,255,255,0.92)",
  },

  editNavBox: {
    display: "grid",
    gap: "10px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid rgba(255,255,255,0.15)",
  },

  editNavTitle: {
    color: "#d6b55b",
    fontSize: "15px",
    fontWeight: "900",
    margin: "0 0 2px",
  },

  editButton: {
    width: "100%",
    border: "1px solid rgba(214,181,91,0.55)",
    borderRadius: "13px",
    padding: "13px",
    background: "rgba(214,181,91,0.08)",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "900",
  },

  restartButton: {
    width: "100%",
    border: "1px solid rgba(255,255,255,0.22)",
    borderRadius: "13px",
    padding: "13px",
    background: "transparent",
    color: "rgba(255,255,255,0.85)",
    fontSize: "14px",
    fontWeight: "800",
  },

  small: {
    marginTop: "24px",
    fontSize: "12px",
    lineHeight: "1.7",
    color: "rgba(255,255,255,0.55)",
  },
};
