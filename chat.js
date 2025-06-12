
const { OpenAI } = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method not allowed");

  try {
    const { message } = req.body;

    const thread = await openai.beta.threads.create();
    await openai.beta.threads.messages.create(thread.id, {
      role: "user",
      content: message,
    });

    const run = await openai.beta.threads.runs.create(thread.id, {
      assistant_id: "asst_FLd5GRKGj4Eyhi2DrgnMAMo9",
    });

    let runStatus;
    do {
      await new Promise((r) => setTimeout(r, 1000));
      runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    } while (runStatus.status !== "completed");

    const messages = await openai.beta.threads.messages.list(thread.id);
    const assistantResponse = messages.data
      .filter((m) => m.role === "assistant")[0]
      .content[0].text.value;

    res.status(200).json({ reply: assistantResponse });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Erro no servidor" });
  }
}
