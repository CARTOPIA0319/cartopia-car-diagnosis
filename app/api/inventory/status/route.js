import inventory from "../../../../data/inventory.json";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function GET() {
  const counts = inventory.counts || {};
  const checks = inventory.checks || {};
  const lastUpdateStatus = inventory.lastUpdateStatus || {};

  const updatedAt = formatJst(inventory.updatedAt);
  const publicVehicles = counts.publicVehicles ?? "-";
  const savedVehicles = counts.savedVehicles ?? "-";
  const vehicles = counts.vehicles ?? "-";

  const failedTypes = checks.typeResults?.failed ?? 0;
  const success =
    inventory.updatedAt &&
    Number(vehicles) > 0 &&
    failedTypes === 0 &&
    !lastUpdateStatus.error;

  const statusText = success ? "在庫更新完了 ✅" : "在庫更新確認が必要 ⚠️";
  const errorText = lastUpdateStatus.error
    ? lastUpdateStatus.error
    : failedTypes > 0
      ? `タイプ取得失敗 ${failedTypes}件`
      : "なし";

  const durationText = lastUpdateStatus.durationSeconds
    ? `${lastUpdateStatus.durationSeconds}秒`
    : "未記録";

  const html = `<!doctype html>
<html lang="ja">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>CARTOPIA 在庫更新状況</title>
  <style>
    body {
      margin: 0;
      padding: 24px;
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      background: #f4f6f8;
      color: #111827;
    }
    .card {
      max-width: 560px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 20px;
      padding: 24px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
    }
    .brand {
      font-size: 13px;
      color: #6b7280;
      margin-bottom: 10px;
      letter-spacing: 0.08em;
      font-weight: 700;
    }
    h1 {
      margin: 0 0 20px;
      font-size: 26px;
      color: #0b1f3a;
    }
    .row {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid #e5e7eb;
      font-size: 16px;
    }
    .row:last-child {
      border-bottom: none;
    }
    .label {
      color: #6b7280;
      font-weight: 700;
      white-space: nowrap;
    }
    .value {
      color: #111827;
      font-weight: 800;
      text-align: right;
      word-break: break-word;
    }
    .ok {
      color: #047857;
    }
    .ng {
      color: #b45309;
    }
    .footer {
      margin-top: 18px;
      font-size: 12px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">CARTOPIA INVENTORY STATUS</div>
    <h1 class="${success ? "ok" : "ng"}">${escapeHtml(statusText)}</h1>

    <div class="row">
      <div class="label">更新時刻</div>
      <div class="value">${escapeHtml(updatedAt)}</div>
    </div>

    <div class="row">
      <div class="label">掲載在庫</div>
      <div class="value">${escapeHtml(publicVehicles)}台</div>
    </div>

    <div class="row">
      <div class="label">一時保存</div>
      <div class="value">${escapeHtml(savedVehicles)}台</div>
    </div>

    <div class="row">
      <div class="label">合計</div>
      <div class="value">${escapeHtml(vehicles)}台</div>
    </div>

    <div class="row">
      <div class="label">処理時間</div>
      <div class="value">${escapeHtml(durationText)}</div>
    </div>

    <div class="row">
      <div class="label">エラー</div>
      <div class="value">${escapeHtml(errorText)}</div>
    </div>

    <div class="footer">このページは data/inventory.json の最新状態を表示しています。</div>
  </main>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
