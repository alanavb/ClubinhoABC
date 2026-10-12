import { useState } from 'react';
import FraseECena from './ouca-e-escolha/FraseECena';
import CompleteAFrase from './ouca-e-escolha/CompleteAFrase';
import FrasesSonoras from './ouca-e-escolha/FrasesSonoras';

const fases = [
  { id: 'cena', numero: 1, icone: '📻', titulo: 'Rádio das Histórias', texto: 'Ouça uma frase curta e escolha a cena certa.' },
  { id: 'completar', numero: 2, icone: '🎈', titulo: 'Balões de Palavras', texto: 'Ouça a frase e escolha a palavra que falta.' },
  { id: 'frases', numero: 3, icone: '🚂', titulo: 'Frases Sonoras', texto: 'Ouça, leia e encontre a frase correspondente.' },
];

export default function OucaEEscolha() {
  const [faseAberta, setFaseAberta] = useState(null);
  const [concluidas, setConcluidas] = useState([]);
  const concluir = (id) => { setConcluidas((atuais) => atuais.includes(id) ? atuais : [...atuais, id]); setFaseAberta(null); };

  if (faseAberta === 'cena') return <FraseECena aoConcluir={() => concluir('cena')} aoFechar={() => setFaseAberta(null)} />;
  if (faseAberta === 'completar') return <CompleteAFrase aoConcluir={() => concluir('completar')} aoFechar={() => setFaseAberta(null)} />;
  if (faseAberta === 'frases') return <FrasesSonoras aoConcluir={() => concluir('frases')} aoFechar={() => setFaseAberta(null)} />;

  return <section className="current-world sentence-world" aria-labelledby="ouca-escolha-title">
    <header className="sentence-world-header"><div><span>👂</span><section><small>ETAPA 3 · PRÉVIA</small><h2 id="ouca-escolha-title">Ouça e Escolha</h2><p>Frases, escuta e leitura ativa.</p></section></div><b>✦ {concluidas.length}/3</b></header>
    <div className="sentence-world-activities">{fases.map(({ id, numero, icone, titulo, texto }) => <article className="sentence-phase-card" key={id}>
      <span className="sentence-phase-icon">{icone}</span><small>FASE {numero}</small><h3>{titulo}</h3><p>{texto}</p>
      {concluidas.includes(id) ? <b className="phase-done">✓ Concluída</b> : <button type="button" onClick={() => setFaseAberta(id)}>▶ Jogar</button>}
    </article>)}</div>
    <p className="sentence-world-note">A prévia usa a voz do navegador. O registro de resultados será conectado ao back-end depois.</p>
  </section>;
}
