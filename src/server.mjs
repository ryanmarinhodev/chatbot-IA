import { writeFile } from "fs";
import { create } from "@wppconnect-team/wppconnect";
import getChatGptResponse from "./api.js";
import { IA_IDENTIFIER, pauseBot, botState } from "./ChatPausados/paused.js";

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

      // Identificação quem enviou mensagem
      console.log(
        `📩 Mensagem de ${
          isFromMe ? (isFromIA ? "🤖 BOT" : "👤 EU") : "👥 CLIENTE"
        }: ${message.body.substring(0, 50)}...`
      );

      // === REGRA 1: Mensagens do bot são sempre ignoradas ===
      if (isFromIA) {
        return;
      }

      // === REGRA 2: Quando EU mando mensagem (não o bot), pausa globalmente ===
      if (isFromMe && !isFromIA) {
        pauseBot();
        return;
      }

      // === REGRA 3: Verifica se o bot está globalmente inativo ===
      if (!botState.isActive) {
        // Verifica se o tempo de pausa já expirou
        if (now >= botState.pausedUntil) {
          botState.isActive = true;
          console.log(`🟢 Pausa expirada, bot reativado`);
        } else {
          console.log(`⏳ Bot ainda em pausa. Ignorando mensagem do cliente.`);
          return;
        }
      }

      // === REGRA 4: Se chegou aqui, o bot está ativo e a mensagem é do cliente ===
      console.log(`🧠 Processando mensagem do cliente...`);

      try {
        const response = await getChatGptResponse(message.body, false);

        // Verificação se o bot não foi desativado durante o processamento
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
  })
  .catch((error) => console.log(error));
