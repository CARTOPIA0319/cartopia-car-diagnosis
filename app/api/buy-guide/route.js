    if (text === "車種が決まっている人は？") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "🚗 ご希望の車種を教えてください😊\n\n" +
            "車種名をそのまま送るだけで大丈夫です✨\n\n" +
            "例えば…\n" +
            "・アルファード\n" +
            "・N-BOX\n" +
            "・シエンタ\n" +
            "・ヴェゼル\n\n" +
            "など、何でもお気軽にどうぞ😊",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }

    if (text === "ざっくり診断とは？") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "⚡ ざっくり診断（約10秒）\n\n" +
            "どんな車が自分に合うのか知りたい方へ😊\n\n" +
            "いくつかの質問に答えるだけで\n" +
            "あなたに合いそうな車のタイプをご提案します✨",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }

    if (text === "ぴったり診断とは？") {
      await replyMessage(event.replyToken, [
        {
          type: "text",
          text:
            "🤖 AIぴったり診断（約5分）\n\n" +
            "家族構成\n" +
            "使い方\n" +
            "ご予算\n" +
            "将来のライフスタイル\n\n" +
            "ここまで考えて\n" +
            "あなたにぴったりな車種をご提案します😊\n\n" +
            "ご家族やライフスタイルまで考えて、\n" +
            "本当に合う一台を見つけたい方へ🚗",
          quickReply: buyQuickReply,
        },
      ]);
      continue;
    }
