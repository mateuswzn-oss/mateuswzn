/* Suporte: o teste DA ÁREA, escrito antes da migração para o Design System.

   O protocolo de migração (ds/LEIAME.md) manda listar o que a área FAZ —
   não como ela parece — e transformar isso num teste, antes de tocar em
   qualquer coisa. Este é esse teste. Ele rodou verde no legado; se rodar
   verde depois, nenhuma funcionalidade se perdeu na troca.

   Uso: node tools/testes/14-suporte.mjs */
import { abre, vaiPara, esperaParar } from './ajuda.mjs';

const { b, p, erros } = await abre({
  subjects:[], projects:[], activities:[], notes:[], institutions:[],
  profile:{ name:'Mateus Souza', email:'mateus@exemplo.com', photo:'', username:'mateus', bio:'', skills:[], links:[], visibility:{} },
  college:{ institution:'UFPA', course:'Eng', area:'', semester:5 }, theme:'dark'
}, { viewport: { width: 1280, height: 900 } });

let ruins = 0;
const ok = (rotulo, certo, detalhe) => {
  console.log('  ' + rotulo.padEnd(46), certo ? 'ok' : 'FALHOU ' + JSON.stringify(detalhe));
  if (!certo) ruins++;
};
const painel = () => p.evaluate(() => {
  const vis = id => {
    const e = document.getElementById(id);
    if (!e) return false;
    return getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().height > 10;
  };
  return { lista: vis('mwSupportList'), form: vis('mwSupportForm'), chat: vis('mwSupportChat') };
});

await vaiPara(p, 'support');
await p.waitForTimeout(500);
await esperaParar(p, '#view-support');

/* ---- 1. a lista abre primeiro ------------------------------------------- */
ok('a área abre na lista de atendimentos',
   JSON.stringify(await painel()) === JSON.stringify({ lista:true, form:false, chat:false }),
   await painel());

/* ---- 2. "+ Novo atendimento" troca para o formulário -------------------- */
await p.evaluate(() => document.getElementById('mwSupportNewBtn').click());
await p.waitForTimeout(500);
ok('"+ Novo atendimento" abre o formulário',
   JSON.stringify(await painel()) === JSON.stringify({ lista:false, form:true, chat:false }),
   await painel());

/* os oito campos têm de existir e estar rotulados */
const campos = await p.evaluate(() => {
  const ids = ['sfName','sfUsername','sfEmail','sfType','sfPriority','sfSubject','sfDescription','sfAttachment'];
  return ids.map(id => {
    const e = document.getElementById(id);
    if (!e) return { id, existe:false };
    return { id, existe:true,
             rotulo: !!document.querySelector(`label[for="${id}"]`),
             visivel: e.getBoundingClientRect().height > 5 };
  });
});
ok('os oito campos existem, rotulados e visíveis',
   campos.every(c => c.existe && c.rotulo && c.visivel),
   campos.filter(c => !(c.existe && c.rotulo && c.visivel)));

/* ---- 3. validação: campo obrigatório vazio não abre atendimento --------- */
const antesVazio = await p.evaluate(() => JSON.parse(localStorage.getItem('mateusSupportTicketsV1') || '[]').length);
await p.evaluate(() => document.getElementById('mwSupportForm').requestSubmit());
await p.waitForTimeout(500);
const depoisVazio = await p.evaluate(() => JSON.parse(localStorage.getItem('mateusSupportTicketsV1') || '[]').length);
ok('formulário vazio não cria atendimento', antesVazio === depoisVazio, { antesVazio, depoisVazio });
ok('e o erro é dito na tela',
   await p.evaluate(() => (document.getElementById('mwSupportFormError').textContent || '').trim().length > 3),
   await p.evaluate(() => document.getElementById('mwSupportFormError').textContent));

/* ---- 4. preencher e abrir o atendimento --------------------------------- */
await p.evaluate(() => {
  const v = (id, valor) => { const e = document.getElementById(id); e.value = valor;
    e.dispatchEvent(new Event('input', { bubbles:true })); e.dispatchEvent(new Event('change', { bubbles:true })); };
  v('sfName', 'Mateus Souza');
  v('sfUsername', 'mateus');
  v('sfEmail', 'mateus@exemplo.com');
  v('sfType', 'Bug');
  v('sfPriority', 'Alta');
  v('sfSubject', 'O calendário não abre no celular');
  v('sfDescription', 'Ao tocar em Calendário a área fica em branco, mas só no telefone.');
});
await p.evaluate(() => document.getElementById('mwSupportForm').requestSubmit());
await p.waitForTimeout(900);

const criado = await p.evaluate(() => JSON.parse(localStorage.getItem('mateusSupportTicketsV1') || '[]'));
ok('o atendimento foi criado', criado.length === 1, criado.length);
if (criado.length) {
  const t = criado[0];
  ok('com os campos que foram digitados',
     t.subject === 'O calendário não abre no celular' && t.priority === 'Alta' && t.type === 'Bug',
     { assunto: t.subject, prioridade: t.priority, tipo: t.type });
  ok('com um protocolo no formato MW-xxxxxx', /^MW-\d{6}$/.test(t.id || ''), t.id);
  ok('e nasce com status aberto', String(t.status || '').toLowerCase().includes('abert'), t.status);
}

/* Abrir um atendimento leva DIRETO para a conversa dele — não de volta
   para a lista. Escrevi este teste supondo o contrário e ele acusou o app;
   o app é que está certo: quem acabou de descrever um problema quer ver a
   conversa, não a lista de onde saiu. */
ok('abrir um atendimento leva direto para a conversa',
   (await painel()).chat === true, await painel());
ok('a conversa mostra o assunto e o protocolo',
   await p.evaluate(() => {
     const a = (document.getElementById('mwSupportChatSubject').textContent || '').trim();
     const i = (document.getElementById('mwSupportChatTicketId').textContent || '').trim();
     return a.includes('calendário') && /MW-\d{6}/.test(i);
   }));

/* ---- 6. enviar mensagem ------------------------------------------------- */
const antesMsg = await p.evaluate(() => document.querySelectorAll('#mwSupportChatMessages .mw-support-msg, #mwSupportChatMessages [data-mw-msg]').length);
await p.evaluate(() => {
  const c = document.getElementById('mwSupportChatInput');
  c.value = 'Acontece só no Safari do iPhone.';
  c.dispatchEvent(new Event('input', { bubbles:true }));
  document.getElementById('mwSupportChatForm').requestSubmit();
});
await p.waitForTimeout(900);
const depoisMsg = await p.evaluate(() => ({
  n: document.querySelectorAll('#mwSupportChatMessages .mw-support-msg, #mwSupportChatMessages [data-mw-msg]').length,
  ultima: (document.getElementById('mwSupportChatMessages').textContent || '').includes('Safari do iPhone'),
  campoLimpo: document.getElementById('mwSupportChatInput').value === ''
}));
ok('enviar mensagem acrescenta à conversa', depoisMsg.n > antesMsg, { antesMsg, depois: depoisMsg.n });
ok('a mensagem enviada aparece', depoisMsg.ultima);
ok('e o campo é limpo depois de enviar', depoisMsg.campoLimpo);
ok('a mensagem foi guardada no atendimento',
   await p.evaluate(() => {
     const t = JSON.parse(localStorage.getItem('mateusSupportTicketsV1') || '[]')[0] || {};
     return JSON.stringify(t.messages || t.mensagens || []).includes('Safari do iPhone');
   }));

/* ---- 7. encerrar -------------------------------------------------------- */
await p.evaluate(() => document.getElementById('mwSupportCloseBtn').click());
await p.waitForTimeout(600);
/* pode haver uma confirmação: se houver, confirma */
await p.evaluate(() => document.querySelector('.mw-confirm-yes')?.click());
await p.waitForTimeout(800);
ok('encerrar muda o status do atendimento',
   await p.evaluate(() => {
     const t = JSON.parse(localStorage.getItem('mateusSupportTicketsV1') || '[]')[0] || {};
     return String(t.status || '').toLowerCase().includes('encerr');
   }),
   await p.evaluate(() => (JSON.parse(localStorage.getItem('mateusSupportTicketsV1') || '[]')[0] || {}).status));

/* ---- 8. voltar para a lista --------------------------------------------- */
await p.evaluate(() => document.getElementById('mwSupportChatBack').click());
await p.waitForTimeout(600);
ok('o botão voltar retorna à lista', (await painel()).lista === true, await painel());
const naLista = await p.evaluate(() => ({
  itens: document.querySelectorAll('#mwSupportTicketList .mw-support-ticket, #mwSupportTicketList [data-mw-ticket]').length,
  texto: (document.getElementById('mwSupportTicketList').textContent || '').trim().slice(0, 70)
}));
ok('e o atendimento aparece na lista', naLista.itens === 1, naLista);

/* ---- 9. sobrevive a um recarregamento ----------------------------------- */
await p.reload();
await p.waitForTimeout(3000);
await p.evaluate(() => {
  document.getElementById('mwBootLoader')?.remove();
  const l = document.getElementById('loginScreen'); if (l) l.style.display = 'none';
  const a = document.getElementById('app'); if (a) { a.style.display = ''; a.hidden = false; a.classList.remove('hidden'); }
});
await vaiPara(p, 'support');
await p.waitForTimeout(800);
ok('o atendimento continua lá depois de recarregar',
   await p.evaluate(() => document.querySelectorAll('#mwSupportTicketList .mw-support-ticket, #mwSupportTicketList [data-mw-ticket]').length === 1),
   await p.evaluate(() => document.getElementById('mwSupportTicketList').textContent.trim().slice(0,60)));

/* ---- 10. nada vaza, nos dois temas e em três larguras ------------------- */
for (const [rot, larg] of [['desktop', 1280], ['tablet', 834], ['celular', 390]]) {
  for (const tema of ['escuro', 'claro']) {
    await p.setViewportSize({ width: larg, height: 900 });
    await p.evaluate(t => document.body.classList.toggle('light', t === 'claro'), tema);
    await p.waitForTimeout(400);
    await esperaParar(p, '#view-support');
    const m = await p.evaluate(() => {
      const v = document.getElementById('view-support');
      const rola = e => { let n = e.parentElement;
        while (n && n !== document.body) { const o = getComputedStyle(n).overflowX;
          if (o === 'auto' || o === 'scroll') return true; n = n.parentElement; } return false; };
      const fora = [...v.querySelectorAll('*')].filter(e => {
        /* Dentro de um <svg>, quem recorta é o viewport do próprio SVG, e
           isso não aparece como overflow-x em ancestral nenhum. Um <rect>
           de área de toque num gráfico pode ter a caixa passando da tela
           sem que um pixel seja desenhado lá fora. Quem pode vazar de
           verdade é o <svg>; os filhos dele são medidos por ele. */
        if (e.ownerSVGElement) return false;
        const r = e.getBoundingClientRect();
        if (!r.width && !r.height) return false;
        return !rola(e) && (r.right > innerWidth + 1 || r.left < -1);
      }).length;
      return { fora, corpoRola: document.documentElement.scrollWidth > innerWidth + 1 };
    });
    ok('sem vazamento · ' + rot + ' ' + tema, m.fora === 0 && !m.corpoRola, m);
  }
}
await p.evaluate(() => document.body.classList.remove('light'));

console.log('\nERROS JS:', erros.length ? erros : 'nenhum');
if (erros.length) ruins++;
console.log('ACHADOS:', ruins);
await b.close();
process.exit(ruins ? 1 : 0);
