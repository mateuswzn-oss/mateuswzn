/* Regressão: as 14 áreas abrem, ficam ativas, não vazam para fora da tela
   e não levantam exceção. É o teste mais barato e o que mais pega coisa.

   Uso: node tools/testes/1-regressao.mjs [mobile] */
import { abre, AREAS, vaiPara } from './ajuda.mjs';

const mobile = process.argv[2] === 'mobile';

const { b, p, erros } = await abre({
  subjects:[{name:'Cálculo I',description:'Limites',progress:40,institution:'UFPA',semester:'3'}],
  projects:[{name:'TCC',description:'App acadêmico',status:'Em andamento',priority:'Alta',subject:'Cálculo I'}],
  activities:[{name:'Entregar lista',description:'',date:'2026-09-05',priority:'Alta',subject:'Cálculo I'}],
  notes:[{title:'Ideia',body:'Anotar',category:'Estudos'}],
  institutions:[{name:'Universidade Federal do Pará',short:'UFPA',kind:'Universidade',course:'Eng. Comp.',city:'Belém',site:''}],
  profile:{name:'Mateus Souza',email:'m@x.com',photo:''},
  college:{institution:'UFPA',course:'Engenharia de Computação',area:'',semester:5}, theme:'dark'
}, mobile ? { viewport:{ width:390, height:844 } } : {});

console.log(mobile ? 'MOBILE 390px' : 'DESKTOP 1280px');
let ruins = 0;

for (const v of AREAS) {
  await vaiPara(p, v);
  await p.waitForTimeout(350);
  const r = await p.evaluate(nome => {
    const view = document.getElementById('view-' + nome);
    if (!view) return { erro: 'view ausente' };
    /* Um elemento além da dobra DENTRO de um container que rola na
       horizontal não é vazamento: é conteúdo que se alcança rolando.
       Sem esta exceção o quadro de projetos e o calendário acusariam
       falha justamente por funcionarem como devem. */
    const rolaHoriz = e => {
      let n = e.parentElement;
      while (n && n !== document.body) {
        const o = getComputedStyle(n).overflowX;
        if (o === 'auto' || o === 'scroll') return true;
        n = n.parentElement;
      }
      return false;
    };
    let fora = 0;
    view.querySelectorAll('*').forEach(e => {
      const r = e.getBoundingClientRect();
      if (r.width > 0 && (r.right > window.innerWidth + 2 || r.left < -2) && !rolaHoriz(e)) fora++;
    });
    return {
      ativa: view.classList.contains('active'),
      scrollH: document.documentElement.scrollWidth > window.innerWidth + 1,
      fora
    };
  }, v);
  const alerta = (r.erro || !r.ativa || r.scrollH || r.fora) ? '  <<<' : '';
  if (alerta) ruins++;
  console.log('  ' + v.padEnd(13), JSON.stringify(r) + alerta);
}

console.log('ERROS JS:', erros.length ? erros : 'nenhum');
console.log('ÁREAS COM ACHADO:', ruins);
await b.close();
process.exit(ruins || erros.length ? 1 : 0);
