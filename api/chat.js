export const config = {
  api: {
    bodyParser: false,
  },
};

import formidable from 'formidable';
import fs from 'fs';
import { OpenAI } from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Método não permitido');

  const form = new formidable.IncomingForm();
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Erro ao processar formulário' });

    const userMessage = fields.message?.[0];
    const pdfFile = files.pdf?.[0];
    if (!userMessage || !pdfFile) return res.status(400).json({ error: 'Campos ausentes' });

    try {
      const uploaded = await openai.files.create({
        file: fs.createReadStream(pdfFile.filepath),
        purpose: 'assistants'
      });

      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: userMessage,
        file_ids: [uploaded.id]
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: 'asst_FLd5GRKGj4Eyhi2DrgnMAMo9'
      });

      let status = 'queued';
      while (status !== 'completed' && status !== 'failed') {
        await new Promise(r => setTimeout(r, 1500));
        const check = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        status = check.status;
      }

      if (status === 'failed') return res.status(500).json({ error: 'Erro na execução do assistente' });

      const messages = await openai.beta.threads.messages.list(thread.id);
      const resposta = messages.data[0]?.content[0]?.text?.value || 'Sem resposta';
      res.status(200).json({ resposta });
    } catch (e) {
      res.status(500).json({ error: 'Erro interno' });
    }
  });
}
