import { writeFile } from "fs";
import { create } from "@wppconnect-team/wppconnect";
import getChatGptResponse from "./api.js";
import { IA_IDENTIFIER, pauseBot, botState } from "./ChatPausados/paused.js";

create({
  session: "Iniciando bot!",
  whatsappVersion: "2.3000.1020600823x", // Força a versão correta do WhatsApp Web
  catchQR: (base64Qr, asciiQR) => {
    console.clear(); // Limpa o terminal antes de exibir o QR
    console.log("📱 Escaneie o QR Code abaixo para conectar:");
    console.log(asciiQR); // Exibe o QR no terminal em ASCII

    // Salva o QR como imagem também (opcional)
    var matches = base64Qr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      const response = {
        type: matches[1],
        data: Buffer.from(matches[2], "base64"),
      };
      writeFile("out.png", response.data, "binary", (err) => {
        if (err) console.error("Erro ao salvar QR como imagem:", err);
      });
    }
  },
  logQR: false, // Não precisa do log padrão, já estamos logando manualmente
  headless: true, // Pode ser true ou false – true geralmente funciona, mas teste se tiver problemas
  devtools: false,
  useChrome: true,
  debug: false,
  browserArgs: ["--no-sandbox"],
})
  .then((client) => {
    console.log("✅ Bot conectado ao WhatsApp");

    client.onAnyMessage(async (message) => {
      if (message.type !== "chat" || !message.body) {
        await client.sendText(
          message.from,
          "[Assistente Virtual]: Desculpe, Ryan ainda não me programou para esse tipo de mensagem. Por favor, envie texto."
        );
        return;
      }

      if (message.from.endsWith("@g.us")) {
        console.log("Ignorando mensagem do grupo");
        return;
      }

      const chatID = message.from;
      const isFromMe = message.fromMe;
      const isFromIA = isFromMe && message.body.startsWith(`${IA_IDENTIFIER}:`);
      const now = Date.now();

      console.log(
        `📩 Mensagem de ${
          isFromMe ? (isFromIA ? "🤖 BOT" : "👤 EU") : "👥 CLIENTE"
        }: ${message.body.substring(0, 50)}...`
      );

      if (isFromIA) return;

      if (isFromMe && !isFromIA && !message.from.endsWith("@g.us")) {
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
  })
  .catch((error) => {
    console.error("❌ Erro ao iniciar o bot:", error);
  });
