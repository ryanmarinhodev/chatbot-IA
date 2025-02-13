import { config } from "dotenv";
import OpenAI from "openai";
import express from "express";

config();
const app = express();
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const ASSISTANT_ID = process.env.ID_ASSISTANT;

async function getChatGptResponse(message) {
  try {
    const thread = await openai.beta.threads.create();

    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: ASSISTANT_ID,
    });

    let response;
    while (!response) {
      const runStatus = await openai.beta.threads.runs.retrieve(
        thread.id,
        run.id
      );
      if (runStatus.status === "completed") {
        const messages = await openai.beta.threads.messages.list(thread.id);
        response = messages.data[0].content[0].text.value;
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
    return response;
  } catch (error) {
    console.error("Erro ao conectar com a API do OpenAI", error);
    return "Ocorreu um erro ao conectar assistente";
  }
}

export default getChatGptResponse;
