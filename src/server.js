import { writeFile } from "fs";
import { create } from "@wppconnect-team/wppconnect";
import getChatGptResponse from "./api.js";

const pausedChats = new Map();

const MY_NUMBER = "554598250377@c.us";
const IA_IDENTIFIER = "Assistente";

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
      const senderID = message.sender.id;
      const isFromMe = senderID === MY_NUMBER;
      const isFromIA = message.body.includes(IA_IDENTIFIER);

      console.log(`📩 Mensagem recebida de ${chatID}: ${message.body}`);
      console.log(`🔍 Quem enviou: ${senderID} (Eu? ${isFromMe})`);

      if (pausedChats.has(chatID)) {
        console.log(`⏳ Chat ${chatID} está pausado. Ignorando mensagem.`);
        return;
      }

      if (isFromMe && !isFromIA) {
        pausedChats.set(chatID, true);
        console.log(`⏸️ Chat ${chatID} pausado por 5 minutos`);

        setTimeout(() => {
          pausedChats.delete(chatID);
          console.log(`✅ Chat ${chatID} reativado`);
        }, 5 * 60 * 1000);

        return;
      }

      if (isFromIA) {
        console.log("🤖 Mensagem enviada pela IA. Ignorando.");
        return;
      }

      console.log("🧠 Chamando ChatGPT...");
      const response = await getChatGptResponse(message.body);

      await client.sendText(chatID, `${IA_IDENTIFIER}: ${response}`);
      console.log("📨 Mensagem enviada!");
    });
  })
  .catch((error) => console.log(error));
