import { Address, beginCell, fromNano, toNano } from "@ton/core";
import dotenv from "dotenv";
import qs from "qs";
import { Telegraf } from "telegraf";
import { message } from "telegraf/filters";
import { TonClient } from "@ton/ton";
import { getHttpEndpoint } from "@orbs-network/ton-access";

dotenv.config();

const bot = new Telegraf(process.env.TG_BOT_TOKEN!);

bot.start((ctx) =>
  ctx.reply("Welcome to my counter app!", {
    reply_markup: {
      keyboard: [
        ["Increment by 3"],
        ["Deposit 0.01 TON"],
        ["Withdraw 0.001 TON"],
        ["Get contract balance"],
      ],
    },
  }),
);

bot.on(message("web_app_data"), (ctx) => ctx.reply("ok"));

bot.hears("Increment by 3", (ctx) => {
  const msg_body = beginCell().storeUint(1, 32).storeUint(3, 32).endCell();

  let link = `https://app.tonkeeper.com/transfer/${
    process.env.SC_ADDRESS
  }?${qs.stringify({
    text: "Increment by 3",
    amount: toNano("0.001").toString(10),
    bin: msg_body.toBoc({ idx: false }).toString("base64"),
  })}`;

  ctx.reply("To increment counter by 3, please sign a transaction:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Sign transaction",
            url: link,
          },
        ],
      ],
    },
  });
});

bot.hears("Deposit 0.01 TON", (ctx) => {
  const msg_body = beginCell().storeUint(1, 32).endCell();

  let link = `https://app.tonkeeper.com/transfer/${
    process.env.SC_ADDRESS
  }?${qs.stringify({
    text: "Deposit 0.01 TON",
    amount: toNano("0.01").toString(10),
    bin: msg_body.toBoc({ idx: false }).toString("base64"),
  })}`;

  ctx.reply("To desposit 0.01 TON, please sign a transaction:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Sign transaction",
            url: link,
          },
        ],
      ],
    },
  });
});

bot.hears("Withdraw 0.001 TON", (ctx) => {
  const msg_body = beginCell()
    .storeUint(3, 32)
    .storeCoins(toNano("0.001"))
    .endCell();

  let link = `https://app.tonkeeper.com/transfer/${
    process.env.SC_ADDRESS
  }?${qs.stringify({
    text: "Withdraw 0.001 TON",
    amount: toNano("0.001").toString(10),
    bin: msg_body.toBoc({ idx: false }).toString("base64"),
  })}`;

  ctx.reply("To withdraw 0.001 TON, please sign a transaction:", {
    reply_markup: {
      inline_keyboard: [
        [
          {
            text: "Sign transaction",
            url: link,
          },
        ],
      ],
    },
  });
});

bot.hears("Get contract balance", async (ctx) => {
  const client = new TonClient({
    endpoint: await getHttpEndpoint({ network: "testnet" }),
  });
  const { stack } = await client.runMethod(Address.parse(process.env.SC_ADDRESS!), "balance");
  ctx.reply(`Contract balance is ${fromNano(stack.readNumber())} TON`);
});

bot.launch();

// Enable graceful stop
process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
