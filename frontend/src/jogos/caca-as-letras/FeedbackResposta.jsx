export default function FeedbackResposta({ tipo, rodadaConcluida = false }) {
  const acertou = tipo === 'correct';

  return (
    <div className={`game-feedback feedback-resposta ${tipo}`} role="status" aria-label={acertou ? 'Resposta correta' : 'Resposta incorreta. Escolha outra opção.'}>
      <span className="feedback-face" aria-hidden="true">{acertou ? '😊' : '😕'}</span>
      <strong>{acertou ? (rodadaConcluida ? 'Você conseguiu!' : 'Muito bem!') : 'Você consegue!'}</strong>
    </div>
  );
}
