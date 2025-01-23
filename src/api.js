import { config } from "dotenv-vault"; //require("dotenv").config({ path: "./.env" });
import OpenAI from "openai"; //const { Configuration, OpenAIApi } = require("openai");

config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function getChatGptResponse(userMessage) {
  try {
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: userMessage }],
    });
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error("Erro ao conectar com a API do OpenAI", error);
    return "Desculpe, não consegui entender o que você quis dizer. Poderia reformular?";
  }
}

export default getChatGptResponse;
