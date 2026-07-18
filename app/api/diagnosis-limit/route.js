import {
  createHmac,
  randomUUID,
  timingSafeEqual,
} from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_LIMIT = 3;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const REFUND_COOKIE = "cartopia_diagnosis_refund";
const REFUND_TTL_SECONDS = 10 * 60;

const CONSUME_SCRIPT = `
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local limit = tonumber(ARGV[1])
local countTtl = tonumber(ARGV[2])
local owner = ARGV[3]
local reservationTtl = tonumber(ARGV[4])

if current >= limit then
  return {0, current, 0}
end

current = redis.call("INCR", KEYS[1])
if current == 1 or redis.call("TTL", KEYS[1]) < 0 then
  redis.call("EXPIRE", KEYS[1], countTtl)
end

redis.call("SET", KEYS[2], owner, "EX", reservationTtl)
return {1, current, math.max(limit - current, 0)}
`;

const REFUND_SCRIPT = `
local limit = tonumber(ARGV[1])
local expectedOwner = ARGV[2]
local countTtl = tonumber(ARGV[3])
local current = tonumber(redis.call("GET", KEYS[1]) or "0")
local owner = redis.call("GET", KEYS[2])

if not owner or owner ~= expectedOwner then
  return {0, current, math.max(limit - current, 0)}
end

redis.call("DEL", KEYS[2])

if current > 0 then
  current = redis.call("DECR", KEYS[1])
end

if current <= 0 then
  redis.call("DEL", KEYS[1])
  current = 0
elseif redis.call("TTL", KEYS[1]) < 0 then
  redis.call("EXPIRE", KEYS[1], countTtl)
end

return {1, current, math.max(limit - current, 0)}
`;

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

function getEnv() {
  const redisUrl =
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.KV_REST_API_URL ||
    "";

  const redisToken =
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.KV_REST_API_TOKEN ||
    "";

  const lineChannelId =
    process.env.LINE_LOGIN_CHANNEL_ID ||
    process.env.LIFF_CHANNEL_ID ||
    "";

  const secret =
    process.env.DIAGNOSIS_LIMIT_SECRET || "";

  if (!redisUrl || !redisToken) {
    throw new Error(
      "診断回数の保存設定が未完了。"
    );
  }

  if (!lineChannelId) {
    throw new Error(
      "LINE認証設定が未完了。"
    );
  }

  if (secret.length < 32) {
    throw new Error(
      "診断回数の保護設定が未完了。"
    );
  }

  return {
    redisUrl: redisUrl.replace(/\/$/, ""),
    redisToken,
    lineChannelId,
    secret,
  };
}

async function redis(command, env) {
  const response = await fetch(env.redisUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error(
      "診断回数データベースから不正な応答。"
    );
  }

  if (!response.ok || data?.error) {
    throw new Error(
      data?.error ||
        "診断回数データベースへの接続に失敗。"
    );
  }

  return data.result;
}

function getJstDateInfo(now = Date.now()) {
  const jst = new Date(
    now + JST_OFFSET_MS
  );

  const dateKey =
    jst.toISOString().slice(0, 10);

  const nextMidnightUtc =
    Date.UTC(
      jst.getUTCFullYear(),
      jst.getUTCMonth(),
      jst.getUTCDate() + 1
    ) - JST_OFFSET_MS;

  return {
    dateKey,
    ttl: Math.max(
      60,
      Math.ceil(
        (nextMidnightUtc - now) / 1000
      ) + 300
    ),
  };
}

function hmac(
  value,
  secret,
  encoding = "hex"
) {
  return createHmac(
    "sha256",
    secret
  )
    .update(value)
    .digest(encoding);
}

function userHash(userId, secret) {
  return hmac(
    `line-user:${userId}`,
    secret
  );
}

function safeEqual(a, b) {
  const first = Buffer.from(
    String(a || "")
  );

  const second = Buffer.from(
    String(b || "")
  );

  return (
    first.length === second.length &&
    timingSafeEqual(first, second)
  );
}

function makeRefundCookieValue({
  dateKey,
  reservationId,
  hash,
  secret,
}) {
  const payload =
    `${dateKey}.${reservationId}.${hash}`;

  const signature = hmac(
    payload,
    secret,
    "base64url"
  );

  return `${payload}.${signature}`;
}

function parseRefundCookieValue(
  value,
  secret
) {
  const parts =
    String(value || "").split(".");

  if (parts.length !== 4) {
    return null;
  }

  const [
    dateKey,
    reservationId,
    hash,
    signature,
  ] = parts;

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateKey
    )
  ) {
    return null;
  }

  if (
    !reservationId ||
    !/^[a-f0-9]{64}$/.test(hash)
  ) {
    return null;
  }

  const payload =
    `${dateKey}.${reservationId}.${hash}`;

  const expected = hmac(
    payload,
    secret,
    "base64url"
  );

  if (
    !safeEqual(
      signature,
      expected
    )
  ) {
    return null;
  }

  return {
    dateKey,
    reservationId,
    hash,
  };
}

function getCookie(
  request,
  name
) {
  const header =
    request.headers.get("cookie") || "";

  for (
    const part of header.split(";")
  ) {
    const index =
      part.indexOf("=");

    if (index < 0) {
      continue;
    }

    const key =
      part
        .slice(0, index)
        .trim();

    if (key !== name) {
      continue;
    }

    return decodeURIComponent(
      part
        .slice(index + 1)
        .trim()
    );
  }

  return "";
}

function setRefundCookie(value) {
  return [
    `${REFUND_COOKIE}=${encodeURIComponent(value)}`,
    "Path=/api/diagnosis-limit",
    `Max-Age=${REFUND_TTL_SECONDS}`,
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

function clearRefundCookie() {
  return [
    `${REFUND_COOKIE}=`,
    "Path=/api/diagnosis-limit",
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
  ].join("; ");
}

async function verifyAccessToken(
  accessToken,
  env
) {
  const url = new URL(
    "https://api.line.me/oauth2/v2.1/verify"
  );

  url.searchParams.set(
    "access_token",
    accessToken
  );

  const verifyResponse =
    await fetch(url, {
      method: "GET",
      cache: "no-store",
    });

  const verifyData =
    await verifyResponse.json();

  if (
    !verifyResponse.ok ||
    String(
      verifyData.client_id || ""
    ) !==
      String(env.lineChannelId) ||
    Number(
      verifyData.expires_in || 0
    ) <= 0
  ) {
    throw new Error(
      "LINE認証を確認できない。"
    );
  }

  const profileResponse =
    await fetch(
      "https://api.line.me/v2/profile",
      {
        method: "GET",
        headers: {
          Authorization:
            `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

  const profile =
    await profileResponse.json();

  if (
    !profileResponse.ok ||
    !profile.userId
  ) {
    throw new Error(
      "LINEユーザー情報を確認できない。"
    );
  }

  return profile.userId;
}

async function verifyIdToken(
  idToken,
  env
) {
  const response =
    await fetch(
      "https://api.line.me/oauth2/v2.1/verify",
      {
        method: "POST",
        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },
        body:
          new URLSearchParams({
            id_token: idToken,
            client_id:
              env.lineChannelId,
          }).toString(),
        cache: "no-store",
      }
    );

  const data =
    await response.json();

  if (
    !response.ok ||
    !data.sub
  ) {
    throw new Error(
      "LINE認証を確認できない。"
    );
  }

  return data.sub;
}

async function getLineUserId(
  body,
  env
) {
  const accessToken =
    String(
      body?.accessToken || ""
    ).trim();

  const idToken =
    String(
      body?.idToken || ""
    ).trim();

  let accessError = null;

  if (accessToken) {
    try {
      return await verifyAccessToken(
        accessToken,
        env
      );
    } catch (error) {
      accessError = error;
    }
  }

  if (idToken) {
    return verifyIdToken(
      idToken,
      env
    );
  }

  if (accessError) {
    throw accessError;
  }

  throw new Error(
    "LINE認証情報が見つからない。"
  );
}

function countKey(
  hash,
  dateKey
) {
  return (
    `cartopia:diagnosis-limit:` +
    `${dateKey}:${hash}`
  );
}

function reservationKey(
  reservationId
) {
  return (
    `cartopia:diagnosis-refund:` +
    reservationId
  );
}

function normalize(result) {
  if (!Array.isArray(result)) {
    throw new Error(
      "診断回数データの形式が不正。"
    );
  }

  return {
    accepted:
      Number(result[0]) === 1,

    used: Math.max(
      0,
      Number(result[1]) || 0
    ),

    remaining: Math.max(
      0,
      Number(result[2]) || 0
    ),
  };
}

async function consume(
  hash,
  env
) {
  const {
    dateKey,
    ttl,
  } = getJstDateInfo();

  const reservationId =
    randomUUID();

  const result = normalize(
    await redis(
      [
        "EVAL",
        CONSUME_SCRIPT,
        2,
        countKey(
          hash,
          dateKey
        ),
        reservationKey(
          reservationId
        ),
        DAILY_LIMIT,
        ttl,
        hash,
        REFUND_TTL_SECONDS,
      ],
      env
    )
  );

  if (!result.accepted) {
    return json(
      {
        ok: false,
        limit: DAILY_LIMIT,
        used: result.used,
        remaining: 0,
        error:
          "ごめんね、AI診断は1日に3回までだよ。",
      },
      429
    );
  }

  const cookie =
    makeRefundCookieValue({
      dateKey,
      reservationId,
      hash,
      secret: env.secret,
    });

  return json(
    {
      ok: true,
      limit: DAILY_LIMIT,
      used: result.used,
      remaining:
        result.remaining,
    },
    200,
    {
      "Set-Cookie":
        setRefundCookie(cookie),
    }
  );
}

async function refund(
  request,
  hash,
  env
) {
  const parsed =
    parseRefundCookieValue(
      getCookie(
        request,
        REFUND_COOKIE
      ),
      env.secret
    );

  if (
    !parsed ||
    parsed.hash !== hash
  ) {
    return json(
      {
        ok: false,
        error:
          "返却できる診断回数なし。",
      },
      409,
      {
        "Set-Cookie":
          clearRefundCookie(),
      }
    );
  }

  const {
    ttl,
  } = getJstDateInfo();

  const result = normalize(
    await redis(
      [
        "EVAL",
        REFUND_SCRIPT,
        2,
        countKey(
          hash,
          parsed.dateKey
        ),
        reservationKey(
          parsed.reservationId
        ),
        DAILY_LIMIT,
        hash,
        ttl,
      ],
      env
    )
  );

  return json(
    {
      ok: result.accepted,
      limit: DAILY_LIMIT,
      used: result.used,
      remaining:
        result.remaining,
      ...(
        result.accepted
          ? {}
          : {
              error:
                "返却できる診断回数なし。",
            }
      ),
    },
    result.accepted
      ? 200
      : 409,
    {
      "Set-Cookie":
        clearRefundCookie(),
    }
  );
}

async function status(
  hash,
  env
) {
  const {
    dateKey,
  } = getJstDateInfo();

  const stored = await redis(
    [
      "GET",
      countKey(
        hash,
        dateKey
      ),
    ],
    env
  );

  const used = Math.max(
    0,
    Number(stored) || 0
  );

  return json({
    ok: true,
    limit: DAILY_LIMIT,
    used,
    remaining: Math.max(
      0,
      DAILY_LIMIT - used
    ),
  });
}

export async function POST(
  request
) {
  try {
    const env = getEnv();

    let body;

    try {
      body =
        await request.json();
    } catch {
      return json(
        {
          ok: false,
          error:
            "リクエスト形式が不正。",
        },
        400
      );
    }

    const action =
      String(
        body?.action ||
          "status"
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
          error:
            "指定された処理は利用不可。",
        },
        400
      );
    }

    const lineUserId =
      await getLineUserId(
        body,
        env
      );

    const hash = userHash(
      lineUserId,
      env.secret
    );

    if (action === "consume") {
      return consume(
        hash,
        env
      );
    }

    if (action === "refund") {
      return refund(
        request,
        hash,
        env
      );
    }

    return status(
      hash,
      env
    );
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
