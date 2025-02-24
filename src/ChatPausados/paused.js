export const IA_IDENTIFIER = "[Assistente Virtual]";
export const PAUSE_DURATION = 5 * 60 * 1000; // 5 minutos

// Estado global do bot
export const botState = {
  isActive: true, // Estado global do bot (ativo/inativo)
  pausedUntil: 0, // Timestamp de quando o bot deve voltar a ficar ativo
  pausedChats: new Map(), // Mapa de chats pausados individualmente (Para escábilidade)
};

// Pausar o bot globalmente
export function pauseBot() {
  const pauseEndTime = Date.now() + PAUSE_DURATION;
  botState.isActive = false;
  botState.pausedUntil = pauseEndTime;
  console.log(
    `🔴 BOT PAUSADO até ${new Date(pauseEndTime).toLocaleTimeString()}`
  );

  // Configuração do timer para reativar o bot automaticamente
  setTimeout(() => {
    if (Date.now() >= botState.pausedUntil) {
      botState.isActive = true;
      console.log(`🟢 BOT REATIVADO automaticamente após pausa`);
    }
  }, PAUSE_DURATION);
}

//Comandos via terminal para controle manual
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
