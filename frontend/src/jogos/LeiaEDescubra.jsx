import { useState } from 'react';
import LeiaOBilhete from './leia-e-descubra/LeiaOBilhete';
import QuemSouEu from './leia-e-descubra/QuemSouEu';
import ColoqueEmOrdem from './leia-e-descubra/ColoqueEmOrdem';
import TesouroDaLeitura from './leia-e-descubra/TesouroDaLeitura';
import { useEtapa } from './useEtapa';

//As chaves são as mesmas das atividades cadastradas no banco (seeds.py).
const fases = [
  { chave: 'bilhete', numero: 1, icone: '📝', titulo: 'Leia o bilhete', obrigatoria: true, Jogo: LeiaOBilhete },
  { chave: 'quem-sou-eu', numero: 2, icone: '🕵️', titulo: 'Quem sou eu?', obrigatoria: true, Jogo: QuemSouEu },
  { chave: 'ordene-historia', numero: 3, icone: '🔢', titulo: 'Coloque em ordem', obrigatoria: true, Jogo: ColoqueEmOrdem },
  { chave: 'bonus-leia', numero: 'BÔNUS', icone: '💎', titulo: 'Tesouro da leitura', obrigatoria: false, Jogo: TesouroDaLeitura },
];

const obrigatorias = fases.filter((fase) => fase.obrigatoria);

export default function LeiaEDescubra({ jogavel }) {
  const { concluidas, erro, carregar, atividadeId, concluir } = useEtapa('leia-e-descubra');
  const [faseAberta, setFaseAberta] = useState(null);

  const aberta = fases.find((fase) => fase.chave === faseAberta);
  if (aberta) {
    const { Jogo, chave } = aberta;
    return <Jogo atividadeId={atividadeId(chave)} aoConcluir={() => { concluir(chave); setFaseAberta(null); }} aoFechar={() => setFaseAberta(null)} />;
  }

  const obrigatoriasFeitas = obrigatorias.filter((fase) => concluidas.includes(fase.chave)).length;

  //RN3: as obrigatórias abrem em sequência; o bônus só abre depois de todas elas.
  function faseDisponivel(indice) {
    const fase = fases[indice];
    if (!jogavel) return false;
    if (!fase.obrigatoria) return obrigatoriasFeitas === obrigatorias.length;
    if (indice === 0) return true;
    return concluidas.includes(fases[indice - 1].chave);
  }

  return <section className="current-world sentence-world reading-world" aria-labelledby="leia-descubra-title">
    <header className="sentence-world-header"><div><span>🔎</span><section><small>ETAPA 4</small><h2 id="leia-descubra-title">Leia e Descubra</h2><p>Textos curtos para ler e entender.</p></section></div><b>⭐ {obrigatoriasFeitas}/{obrigatorias.length}</b></header>
    {erro && <p className="form-message" role="alert">{erro} <button className="text-link" type="button" onClick={carregar}>Tentar de novo</button></p>}
    <div className="sentence-world-activities">{fases.map(({ chave, numero, icone, titulo, obrigatoria }, indice) => {
      const disponivel = faseDisponivel(indice);
      let acao;
      if (concluidas.includes(chave)) acao = <b className="phase-done">⭐ Feito!</b>;
      else if (!disponivel) acao = <small className="phase-locked">🔒</small>;
      else if (!atividadeId(chave)) acao = <small className="phase-locked">Carregando...</small>;
      else acao = <button type="button" onClick={() => setFaseAberta(chave)}>▶ &nbsp; Jogar</button>;
      return <article className={`sentence-phase-card ${obrigatoria ? '' : 'bonus-phase'} ${disponivel ? '' : 'locked-phase'}`} key={chave}>
        <span className="sentence-phase-icon">{icone}</span><small>{numero === 'BÔNUS' ? numero : `FASE ${numero}`}</small><h3>{titulo}</h3>{acao}
      </article>;
    })}</div>
    <p className="sentence-world-note">Conclua as fases na ordem para liberar a próxima. O bônus é opcional.</p>
  </section>;
}