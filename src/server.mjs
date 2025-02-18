import { writeFile } from "fs";
import { create } from "@wppconnect-team/wppconnect";
import getChatGptResponse from "./api.js";

const IA_IDENTIFIER = "Assistente Virtual";
const PAUSE_DURATION = 1 * 60 * 1000;

const botState = {
  isActive: true,
  pausedUntil: 0,
  pausedChats: new Map(),
};

function pauseBot() {
  const pausedEndTime = Date.now() + PAUSE_DURATION;
  botState.isActive = false;
  botState.pausedUntil = pausedEndTime;

  console.log(`Bot PAUSADO até ${new Date(pausedEndTime).toDateString()}`);

  setTimeout(() => {
    if (Date.now >= botState.pausedUntil) {
      botState.isActive = true;
      console.log(`BOT REATIVADO automaticamente após pausa`);
    }
  }, PAUSE_DURATION);
}

create({
  session: "Iniciando bot",
  catchQR: (base64Qr, asciiQR) => {
    console.log(asciiQR);
    var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/),
      response = {};

    if (matches.length !== 3) {
      return new Error("Invalid input string");
    }
    response.type = matches[1];
    response.data = Buffer.from(matches[2], "base64");

    writeFile("out.png", response.data, "binary", function (err) {
      if (err != null) {
        console.log(err);
      }
    });
  },
  logQR: false,
})
  .then((client) => {
    console.log("✅ Bot conectado ao WhatsApp");
    client.onAnyMessage(async (message) => {
      if (message.type !== "chat") return;
      const chatID = message.from;
      const isFromMe = message.fromMe;
      const isFromIA = isFromMe && message.body.startsWith(`${IA_IDENTIFIER}:`);
      const now = Date.now();

      console.log(
        `📩 Mensagem de ${
          isFromMe ? (isFromIA ? "🤖 BOT" : "👤 EU") : "👥 CLIENTE"
        }: ${message.body.substring(0, 50)}...`
      );

      if (isFromIA) {
        return;
      }

      if (isFromMe && !isFromIA) {
        pauseBot();
        return;
      }

      if (!botState.isActive) {
        if (now >= botState.pausedUntil) {
          botState.isActive = true;
          console.log(`🟢 Pausa expirada, bot reativado`);
        } else {
          console.log(`⏳ Bot ainda em pausa. Ignorando mensagem do cliente.`);
          return;
        }
      }

      console.log(`🧠 Processando mensagem do cliente...`);
      try {
        const response = await getChatGptResponse(message.body, false);

        if (!botState.isActive) {
          console.log(
            `❌ Bot foi pausado durante o processamento. Resposta cancelada.`
          );
          return;
        }
        await client.sendText(chatID, `${IA_IDENTIFIER}: ${response}`);
        console.log(`✅ Resposta enviada com sucesso!`);
      } catch (error) {
        console.error(`❌ Erro ao processar mensagem:`, error);
      }
    });
    process.stdin.on("data", (data) => {
      const command = data.toString().trim();
      if (command === "/pause") {
        pauseBot();
        console.log("Bot pausado manualmente via terminal");
      } else if (command === "/resume") {
        botState.isActive = true;
        console.log("Bot reativado manualmente via terminal");
      } else if (command === "/status") {
        console.log(
          `Status do bot: ${
            botState.isActive
              ? "🟢 ATIVO"
              : "🔴 PAUSADO até " +
                new Date(botState.pausedUntil).toLocaleTimeString()
          }`
        );
      }
    });
  })
  .catch((error) => console.log(error));
