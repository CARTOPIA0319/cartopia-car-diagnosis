export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * ============================================================
 * カーとぴあ ぴったり車種診断
 * 診断回数制限 API
 *
 * 【開発中・一時無制限モード】
 *
 * 現在は公式LINE完成までのテスト期間のため、
 * 1日3回の回数制限を停止しています。
 *
 * Upstash Redisにも接続しません。
 *
 * 本番公開時には、元の回数制限版へ戻してください。
 * ============================================================
 */

function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      ...headers,
    },
  });
}

export async function POST(request) {
  try {
    let body;

    try {
      body = await request.json();
    } catch {
      return json(
        {
          ok: false,
          error: "リクエスト形式が不正。",
        },
        400
      );
    }

    const action = String(
      body?.action || "status"
    ).trim();

    if (
      ![
        "consume",
        "refund",
        "status",
      ].includes(action)
    ) {
      return json(
        {
          ok: false,
          error: "指定された処理は利用不可。",
        },
        400
      );
    }

    /*
     * --------------------------------------------------------
     * consume
     *
     * 本来はここで、
     * ・LINEユーザー認証
     * ・Upstash Redisへの接続
     * ・本日の使用回数確認
     * ・使用回数 +1
     * を行います。
     *
     * 開発中はすべてスキップして、
     * 常に診断を許可します。
     * --------------------------------------------------------
     */
    if (action === "consume") {
      return json({
        ok: true,
        limit: null,
        used: 0,
        remaining: null,
        unlimited: true,
      });
    }

    /*
     * --------------------------------------------------------
     * refund
     *
     * 開発中は回数を消費していないため、
     * 返却処理も何もせず成功扱いにします。
     * --------------------------------------------------------
     */
    if (action === "refund") {
      return json({
        ok: true,
        limit: null,
        used: 0,
        remaining: null,
        unlimited: true,
      });
    }

    /*
     * --------------------------------------------------------
     * status
     *
     * 開発中は無制限なので、
     * 常に利用可能として返します。
     * --------------------------------------------------------
     */
    return json({
      ok: true,
      limit: null,
      used: 0,
      remaining: null,
      unlimited: true,
    });
  } catch (error) {
    console.error(
      "diagnosis-limit error:",
      error
    );

    return json(
      {
        ok: false,
        error:
          error?.message ||
          "診断回数の確認中にエラー。",
      },
      500
    );
  }
}
