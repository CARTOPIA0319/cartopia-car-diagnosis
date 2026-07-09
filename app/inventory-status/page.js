export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

const GITHUB_OWNER = process.env.GITHUB_OWNER || "CARTOPIA0319";
const GITHUB_REPO = process.env.GITHUB_REPO || "cartopia-car-diagnosis";
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || "main";
const INVENTORY_PATH = "data/inventory.json";

async function fetchInventoryFromGitHub() {
  const token = process.env.GITHUB_TOKEN;

  if (token) {
    const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${INVENTORY_PATH}?ref=${GITHUB_BRANCH}&t=${Date.now()}`;

    const response = await fetch(apiUrl, {
      cache: "no-store",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "cartopia-inventory-status-page",
        "Cache-Control": "no-store",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const json = await response.json();
    const content = String(json.content || "").replace(/\n/g, "");
    const text = Buffer.from(content, "base64").toString("utf8");

    return {
      inventory: JSON.parse(text),
      dataSha: json.sha || "",
      source: "GitHub API",
    };
  }

  const rawUrl = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${INVENTORY_PATH}?t=${Date.now()}`;

  const response = await fetch(rawUrl, {
    cache: "no-store",
    headers: {
      "Cache-Control": "no-store",
    },
  });

  if (!response.ok) {
    throw new Error(`GitHub raw fetch error: ${response.status}`);
  }

  return {
    inventory: await response.json(),
    dataSha: "",
    source: "GitHub Raw",
  };
}

function formatJst(dateText) {
  if (!dateText) return "不明";

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) return "不明";

  return new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getElapsedText(dateText) {
  if (!dateText) return "不明";

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) return "不明";

  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 1000 / 60);

  if (diffMinutes < 1) return "たった今";
  if (diffMinutes < 60) return `${diffMinutes}分前`;

  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;

  if (hours < 24) {
    return minutes === 0 ? `${hours}時間前` : `${hours}時間${minutes}分前`;
  }

  const days = Math.floor(hours / 24);
  const remainHours = hours % 24;

  return remainHours === 0 ? `${days}日前` : `${days}日${remainHours}時間前`;
}

function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || seconds === "") {
    return "未記録";
  }

  const value = Number(seconds);

  if (!Number.isFinite(value)) return "未記録";
  if (value < 60) return `${value}秒`;

  const minutes = Math.floor(value / 60);
  const remainSeconds = value % 60;

  if (remainSeconds === 0) return `${minutes}分`;

  return `${minutes}分${remainSeconds}秒`;
}

function getMinutesSince(dateText) {
  if (!dateText) return null;

  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) return null;

  return Math.floor((Date.now() - date.getTime()) / 1000 / 60);
}

function shortSha(sha) {
  if (!sha) return "未取得";
  return sha.slice(0, 10);
}

function numberOrDash(value) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

function StatusRow({ label, value, tone = "" }) {
  return (
    <div className="row">
      <div className="label">{label}</div>
      <div className={`value ${tone}`}>{value}</div>
    </div>
  );
}

function MetricCard({ label, value, unit = "台" }) {
  return (
    <div className="metric">
      <div className="metricLabel">{label}</div>
      <div>
        <span className="metricValue">{value}</span>
        <span className="metricUnit">{unit}</span>
      </div>
    </div>
  );
}

export default async function InventoryStatusPage() {
  let inventory = {};
  let loadError = "";
  let dataSha = "";
  let source = "";

  try {
    const result = await fetchInventoryFromGitHub();
    inventory = result.inventory || {};
    dataSha = result.dataSha || "";
    source = result.source || "";
  } catch (error) {
    loadError = error.message || String(error);
  }

  const counts = inventory.counts || {};
  const checks = inventory.checks || {};
  const lastUpdateStatus = inventory.lastUpdateStatus || {};

  const publicVehicles = numberOrDash(counts.publicVehicles);
  const savedVehicles = numberOrDash(counts.savedVehicles);
  const vehicles = numberOrDash(counts.vehicles);

  const typeResults = checks.typeResults || {};
  const typeSuccess = numberOrDash(typeResults.success);
  const typeFailed = numberOrDash(typeResults.failed);
  const typeTimeout = numberOrDash(typeResults.timeout || 0);

  const gradeExtraInfo = checks.gradeExtraInfo || {};
  const gradeFound = numberOrDash(gradeExtraInfo.found);
  const gradeMissing = numberOrDash(gradeExtraInfo.missing);

  const savedPages = checks.savedPages || [];

  const lastFinishedAt =
    lastUpdateStatus.finishedAt || inventory.updatedAt || "";

  const minutesSinceUpdate = getMinutesSince(lastFinishedAt);
  const isStale = minutesSinceUpdate !== null && minutesSinceUpdate > 130;

  const hasVehicles = Number(vehicles) > 0;
  const hasError = Boolean(loadError || lastUpdateStatus.error);

  const statusSuccess =
    !loadError &&
    lastUpdateStatus.success !== false &&
    !hasError &&
    !isStale &&
    hasVehicles;

  const statusTitle = statusSuccess
    ? "在庫更新完了 ✅"
    : loadError
      ? "在庫データ読込失敗 ❌"
      : isStale
        ? "在庫更新が遅れています ⚠️"
        : "在庫更新確認が必要 ⚠️";

  const statusTone = statusSuccess ? "ok" : loadError ? "bad" : "ng";

  const errorText = loadError
    ? loadError
    : lastUpdateStatus.error
      ? lastUpdateStatus.error
      : isStale
        ? "最終更新から時間が経っています"
        : "なし";

  const timeoutText =
    lastUpdateStatus.timeout || Number(typeResults.timeout || 0) > 0
      ? "あり"
      : "なし";

  const loginTone = checks.loginStatus === 302 ? "ok" : "ng";
  const publicListTone = checks.publicListStatus === 200 ? "ok" : "ng";
  const loginFormTone = checks.publicContainsLoginForm ? "bad" : "ok";
  const typeFailedTone = Number(typeFailed) > 0 ? "ng" : "ok";
  const typeTimeoutTone = Number(typeTimeout) > 0 ? "bad" : "ok";
  const timeoutTone = timeoutText === "なし" ? "ok" : "bad";
  const errorTone = errorText === "なし" ? "ok" : "bad";

  return (
    <main className="page">
      <section className="card">
        <div className="hero">
          <div className="brand">CARTOPIA INVENTORY STATUS</div>
          <h1 className={statusTone}>{statusTitle}</h1>
          <p className="heroText">
            最新の在庫データ更新状況を表示しています。
          </p>
          <div className="pill">
            最終更新：{formatJst(lastFinishedAt)}（{getElapsedText(lastFinishedAt)}）
          </div>
        </div>

        <div className="metrics">
          <MetricCard label="掲載在庫" value={publicVehicles} />
          <MetricCard label="一時保存" value={savedVehicles} />
          <MetricCard label="合計" value={vehicles} />
        </div>

        <div className="sectionTitle">更新結果</div>
        <div className="rows">
          <StatusRow
            label="実行結果"
            value={
              loadError
                ? "読込失敗"
                : lastUpdateStatus.statusText ||
                  (statusSuccess ? "正常更新" : "確認が必要")
            }
            tone={statusSuccess ? "ok" : loadError ? "bad" : "ng"}
          />
          <StatusRow
            label="更新方法"
            value={lastUpdateStatus.trigger || "未記録"}
          />
          <StatusRow
            label="開始時刻"
            value={formatJst(lastUpdateStatus.startedAt)}
          />
          <StatusRow
            label="完了時刻"
            value={formatJst(lastFinishedAt)}
          />
          <StatusRow
            label="処理時間"
            value={formatDuration(lastUpdateStatus.durationSeconds)}
          />
          <StatusRow
            label="タイムアウト"
            value={timeoutText}
            tone={timeoutTone}
          />
          <StatusRow
            label="エラー"
            value={errorText}
            tone={errorTone}
          />
        </div>

        <div className="sectionTitle">取得チェック</div>
        <div className="rows">
          <StatusRow
            label="ログイン"
            value={checks.loginStatus ?? "不明"}
            tone={loginTone}
          />
          <StatusRow
            label="掲載在庫ページ"
            value={checks.publicListStatus ?? "不明"}
            tone={publicListTone}
          />
          <StatusRow
            label="ログインフォーム再表示"
            value={checks.publicContainsLoginForm ? "あり" : "なし"}
            tone={loginFormTone}
          />
          <StatusRow
            label="タイプ取得成功"
            value={`${typeSuccess}件`}
            tone="ok"
          />
          <StatusRow
            label="タイプ取得失敗"
            value={`${typeFailed}件`}
            tone={typeFailedTone}
          />
          <StatusRow
            label="タイプ取得タイムアウト"
            value={`${typeTimeout}件`}
            tone={typeTimeoutTone}
          />
          <StatusRow
            label="グレード付加情報あり"
            value={`${gradeFound}件`}
          />
          <StatusRow
            label="グレード付加情報なし"
            value={`${gradeMissing}件`}
          />
        </div>

        <div className="sectionTitle">一時保存ページ</div>
        <div className="rows">
          {savedPages.length > 0 ? (
            savedPages.map((page, index) => (
              <StatusRow
                key={`${page.pageUrl || index}`}
                label={`ページ${index + 1}`}
                value={`HTTP ${page.status ?? "不明"} / ${page.count ?? "-"}台`}
                tone={page.status === 200 ? "ok" : "ng"}
              />
            ))
          ) : (
            <StatusRow label="一時保存ページ" value="未記録" />
          )}
        </div>

        <div className="sectionTitle">データ取得元</div>
        <div className="rows">
          <StatusRow label="取得元" value={source || "未取得"} />
          <StatusRow label="ファイル" value="data/inventory.json" />
          <StatusRow label="ブランチ" value={GITHUB_BRANCH} />
          <StatusRow label="データSHA" value={shortSha(dataSha)} />
        </div>

        <div className="footer">
          管理URL：/inventory-status<br />
          GitHub上の最新 data/inventory.json を直接読み込んで表示します。
        </div>
      </section>

      <style>{`
        :root {
          --navy: #0b1f3a;
          --gold: #c8a45d;
          --bg: #f3f5f8;
          --text: #111827;
          --muted: #6b7280;
          --line: #e5e7eb;
          --ok: #047857;
          --ng: #b45309;
          --bad: #b91c1c;
          --card: #ffffff;
        }

        * {
          box-sizing: border-box;
        }

        .page {
          min-height: 100vh;
          margin: 0;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
          background:
            radial-gradient(circle at top left, rgba(200,164,93,0.18), transparent 34%),
            linear-gradient(180deg, #f7f8fa 0%, var(--bg) 100%);
          color: var(--text);
        }

        .card {
          width: 100%;
          max-width: 720px;
          margin: 0 auto;
          background: var(--card);
          border-radius: 24px;
          padding: 24px;
          box-shadow: 0 16px 40px rgba(11,31,58,0.12);
          border: 1px solid rgba(11,31,58,0.06);
          overflow: hidden;
        }

        .hero {
          border-radius: 20px;
          padding: 20px;
          background: linear-gradient(135deg, var(--navy), #122f54);
          color: white;
          margin-bottom: 18px;
          position: relative;
          overflow: hidden;
        }

        .hero:after {
          content: "";
          position: absolute;
          right: -40px;
          top: -40px;
          width: 130px;
          height: 130px;
          border-radius: 999px;
          border: 18px solid rgba(200,164,93,0.22);
        }

        .brand {
          font-size: 12px;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.72);
          font-weight: 800;
          margin-bottom: 10px;
          position: relative;
          z-index: 1;
        }

        h1 {
          margin: 0;
          font-size: 28px;
          line-height: 1.25;
          letter-spacing: -0.02em;
          position: relative;
          z-index: 1;
        }

        .heroText {
          margin: 8px 0 0;
          color: rgba(255,255,255,0.78);
          font-size: 14px;
          position: relative;
          z-index: 1;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          margin-top: 14px;
          padding: 7px 12px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 800;
          background: rgba(255,255,255,0.12);
          color: #fff;
          position: relative;
          z-index: 1;
        }

        .metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          margin: 16px 0;
        }

        .metric {
          background: #f9fafb;
          border: 1px solid var(--line);
          border-radius: 18px;
          padding: 14px 12px;
          text-align: center;
        }

        .metricLabel {
          color: var(--muted);
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .metricValue {
          color: var(--navy);
          font-size: 26px;
          line-height: 1;
          font-weight: 900;
          letter-spacing: -0.03em;
        }

        .metricUnit {
          font-size: 13px;
          font-weight: 800;
          color: var(--muted);
          margin-left: 2px;
        }

        .sectionTitle {
          margin: 22px 0 8px;
          font-size: 14px;
          color: var(--navy);
          font-weight: 900;
          letter-spacing: 0.02em;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .sectionTitle:before {
          content: "";
          width: 6px;
          height: 18px;
          border-radius: 999px;
          background: var(--gold);
          display: inline-block;
        }

        .rows {
          border: 1px solid var(--line);
          border-radius: 18px;
          overflow: hidden;
          background: white;
        }

        .row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 14px 16px;
          border-bottom: 1px solid var(--line);
          font-size: 15px;
        }

        .row:last-child {
          border-bottom: none;
        }

        .label {
          color: var(--muted);
          font-weight: 800;
          white-space: nowrap;
        }

        .value {
          color: var(--text);
          font-weight: 900;
          text-align: right;
          word-break: break-word;
        }

        .ok {
          color: var(--ok);
        }

        .ng {
          color: var(--ng);
        }

        .bad {
          color: var(--bad);
        }

        .footer {
          margin-top: 16px;
          text-align: center;
          color: #9ca3af;
          font-size: 12px;
          line-height: 1.6;
        }

        @media (max-width: 560px) {
          .page {
            padding: 12px;
          }

          .card {
            padding: 16px;
            border-radius: 20px;
          }

          .hero {
            padding: 18px;
          }

          h1 {
            font-size: 24px;
          }

          .metrics {
            grid-template-columns: 1fr;
          }

          .metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            text-align: left;
          }

          .metricLabel {
            margin-bottom: 0;
          }

          .metricValue {
            font-size: 24px;
          }

          .row {
            padding: 13px 12px;
          }
        }
      `}</style>
    </main>
  );
}
