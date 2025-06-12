// /api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente nutricional direto, objetivo, profissional e com linguagem clara. Fale em português.',
          },
          {
            role: 'user',
            content: message,
          },
        ],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0].message) {
      throw new Error('Resposta inesperada da OpenAI');
    }

    res.status(200).json({ reply: data.choices[0].message.content });
  } catch (err) {
    console.error('[API] Erro:', err);
    res.status(500).json({ error: 'Erro ao buscar resposta' });
  }
}
