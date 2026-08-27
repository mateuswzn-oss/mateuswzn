// Endpoint da Nyc AI — recebe {message, history} do Mateus Workspace e
// devolve {answer}. A chave da Anthropic mora só aqui, no servidor,
// como variável de ambiente (ANTHROPIC_API_KEY) — nunca no navegador.
//
// Configuração na Vercel:
//   1. Settings -> Environment Variables -> adicionar ANTHROPIC_API_KEY
//      com a chave gerada em console.anthropic.com.
//   2. (Opcional) ALLOWED_ORIGIN com o domínio do site publicado, pra
//      impedir que outros sites usem esta chave às suas custas. Sem essa
//      variável, o endpoint aceita chamadas de qualquer origem — ok pra
//      testar, mas vale travar depois que o domínio final estiver certo.

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `Você é a Nyc AI, assistente de estudos dentro do Mateus Workspace, um app de organização acadêmica para estudantes de Engenharia de Software e áreas afins.
Responda sempre em português do Brasil, com tom direto, profissional e prestativo — como uma engenheira experiente ajudando um colega, nunca genérico ou robótico.
Ajude com: programação, conceitos de faculdade, organização de estudos, planejamento de semana/prazos e dúvidas sobre como usar o próprio Workspace (disciplinas, atividades, projetos, anotações, calendário).
Seja concisa quando a pergunta for simples e detalhada (com passos numerados) quando a pergunta pedir profundidade. Não invente funcionalidades que o Workspace não tem.`;

function setCors(req, res) {
  const allowed = process.env.ALLOWED_ORIGIN;
  const origin = req.headers.origin || '';
  if (!allowed || allowed.split(',').map((o) => o.trim()).includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

module.exports = async (req, res) => {
  setCors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido.' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY não configurada no servidor.' });
  }

  const body = req.body || {};
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return res.status(400).json({ error: 'Mensagem vazia.' });
  if (message.length > 4000) return res.status(400).json({ error: 'Mensagem muito longa.' });

  const history = Array.isArray(body.history)
    ? body.history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }))
    : [];

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [...history, { role: 'user', content: message }],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    const answer = textBlock ? textBlock.text : '';
    if (!answer) throw new Error('Resposta vazia da API.');

    return res.status(200).json({ answer });
  } catch (err) {
    console.error('Erro na Nyc AI:', err);
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(500).json({ error: 'Chave de API inválida.' });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: 'Muitas mensagens ao mesmo tempo — tente de novo em instantes.' });
    }
    return res.status(500).json({ error: 'Não consegui falar com a Nyc AI agora.' });
  }
};
