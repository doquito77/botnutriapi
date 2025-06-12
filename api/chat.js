import { IncomingForm } from 'formidable';
import { readFileSync } from 'fs';
import { OpenAI } from 'openai';

export const config = {
  api: {
    bodyParser: false
  }
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const form = new IncomingForm({ keepExtensions: true });
  
  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(500).json({ error: 'Erro ao processar formulário' });

    const mensagem = fields.message;
    const pdf = files.pdf;

    if (!mensagem || !pdf) {
      return res.status(400).json({ error: 'Campos ausentes' });
    }

    try {
      const upload = await openai.files.create({
        file: readFileSync(pdf.filepath),
        purpose: 'assistants'
      });

      const thread = await openai.beta.threads.create();

      await openai.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: mensagem[0],
        file_ids: [upload.id]
      });

      const run = await openai.beta.threads.runs.create(thread.id, {
        assistant_id: 'asst_FLd5GRKGj4Eyhi2DrgnMAMo9'
      });

      let status;
      do {
        await new Promise(r => setTimeout(r, 1500));
        const check = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        status = check.status;
      } while (status !== 'completed');

      const msgs = await openai.beta.threads.messages.list(thread.id);
      const reply = msgs.data?.[0]?.content?.[0]?.text?.value || 'Sem resposta';

      res.status(200).json({ resposta: reply });
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Falha ao consultar assistente' });
    }
  });
}
