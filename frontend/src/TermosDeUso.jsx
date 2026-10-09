import { useEffect } from 'react';

function TermosDeUso({ onClose }) {
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="terms-overlay" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="terms-dialog" role="dialog" aria-modal="true" aria-labelledby="terms-title">
        <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar termos de uso">×</button>
        <h1 id="terms-title">Termos e Condições de Uso - Clubinho ABC</h1>
        <p><strong>Versão 2.0 - última revisão: 25 de setembro de 2026</strong></p>
        <p>Bem-vindo(a) ao Clubinho ABC. Estes Termos regulam o acesso e o uso da plataforma educacional Clubinho ABC.</p>
        <p>O Clubinho ABC é um projeto acadêmico de apoio à alfabetização, voltado principalmente a crianças de 6 a 7 anos e destinado ao uso com acompanhamento de seus pais ou responsáveis legais. Leia também a <strong>Política de Privacidade</strong>, que explica como os dados pessoais são tratados.</p>

        <h2>1. Quem pode utilizar a plataforma</h2>
        <p>A conta da família deve ser criada e administrada por pai, mãe ou responsável legal com capacidade para aceitar estes Termos. A criança não deve criar a própria conta nem administrar as credenciais de acesso.</p>
        <p>Cabe ao responsável acompanhar o uso da plataforma pela criança, manter os dados da conta atualizados e avaliar se as atividades são adequadas às suas necessidades.</p>

        <h2>2. Criação, confirmação e proteção da conta</h2>
        <p>No cadastro, o responsável informa seu nome, e-mail e senha, além do nome, idade e avatar escolhido para a criança. A plataforma utiliza o Supabase Auth para criar a identidade de acesso, confirmar o e-mail, autenticar a conta e realizar a recuperação de senha.</p>
        <p>O cadastro somente é concluído após a confirmação do e-mail. O responsável deve fornecer informações verdadeiras, utilizar senha segura, não compartilhar suas credenciais e comunicar qualquer suspeita de acesso não autorizado.</p>
        <p>A interface de cadastro exige que o responsável declare que leu e aceitou estes Termos. Esse aceite não substitui eventual consentimento específico para uma finalidade de tratamento de dados pessoais quando o consentimento for a hipótese legal aplicável.</p>

        <h2>3. Finalidade, funcionalidades e limitações</h2>
        <p>O Clubinho ABC oferece jogos, histórias e atividades de apoio ao aprendizado inicial de letras, sílabas, palavras e leitura. A plataforma registra tentativas e resultados para apresentar o progresso e controlar o acesso às atividades da etapa de aprendizagem da criança.</p>
        <p>Os materiais têm finalidade educacional complementar. Eles não substituem a escola, a avaliação pedagógica ou a orientação individual de profissionais da educação, nem constituem diagnóstico pedagógico, psicológico ou médico.</p>
        <p>As atividades e os demais conteúdos são disponibilizados pela equipe do Clubinho ABC. Usuários e terceiros não podem publicar atividades, comentários, mensagens, imagens ou outros conteúdos na plataforma.</p>

        <h2>4. Privacidade e dados da criança</h2>
        <p>O tratamento de dados pessoais deve observar a Lei Geral de Proteção de Dados Pessoais, o melhor interesse da criança e os princípios de necessidade, transparência, segurança e prevenção.</p>
        <p>A Política de Privacidade informa os dados tratados, suas finalidades e hipóteses legais, os prestadores de serviço envolvidos, os critérios de conservação e os meios para exercer direitos. O Clubinho ABC não utiliza os dados da criança para publicidade comportamental e não vende dados pessoais.</p>

        <h2>5. Papéis, permissões e controle de acesso</h2>
        <p>O responsável autenticado pode acessar somente o perfil e os resultados das crianças vinculadas à sua conta. As rotas protegidas da plataforma verificam o token de autenticação e o vínculo entre responsável e criança antes de liberar dados ou registrar resultados.</p>
        <p>As atividades disponíveis são limitadas à etapa atual da criança, conforme as regras de progressão da plataforma. Tentar alterar identificadores, tokens ou requisições para acessar dados de outra conta constitui uso indevido.</p>

        <h2>6. Uso permitido e condutas proibidas</h2>
        <p>A plataforma e seus conteúdos podem ser utilizados para fins pessoais, familiares e educacionais, respeitadas as funcionalidades oferecidas e os direitos de propriedade intelectual.</p>
        <p>Não é permitido:</p>
        <ul>
          <li>usar a plataforma para atividades ilícitas ou contrárias aos direitos de crianças e adolescentes;</li>
          <li>tentar acessar contas, dados ou áreas restritas sem autorização;</li>
          <li>contornar controles de autenticação, autorização ou progressão;</li>
          <li>interferir no funcionamento ou na segurança da plataforma, disseminar código malicioso ou realizar testes não autorizados;</li>
          <li>vender, copiar, modificar ou distribuir os conteúdos fora dos usos permitidos pela plataforma ou pela legislação;</li>
          <li>utilizar a plataforma ou seus dados para constranger, discriminar ou expor indevidamente o desempenho de uma criança.</li>
        </ul>
        <p>O uso indevido poderá resultar no bloqueio ou encerramento da conta, preservados o direito de esclarecimento do responsável e os direitos garantidos pela legislação.</p>

        <h2>7. Propriedade intelectual</h2>
        <p>Textos, atividades, jogos, ilustrações, marcas, logotipos, código e demais conteúdos do Clubinho ABC pertencem aos seus respectivos titulares. O acesso à plataforma não transfere esses direitos ao usuário.</p>
        <p>Materiais eventualmente oferecidos para download ou impressão poderão ser usados para fins pessoais e educacionais, conforme as orientações apresentadas. Outros usos dependem de autorização do titular, salvo quando permitidos por lei.</p>

        <h2>8. Disponibilidade, manutenção e suporte</h2>
        <p>Por se tratar de projeto acadêmico em desenvolvimento, funcionalidades podem ser ajustadas, temporariamente interrompidas ou descontinuadas. A plataforma também poderá ficar indisponível durante manutenção, falhas de conexão ou indisponibilidade de prestadores externos.</p>
        <p>Dúvidas, relatos de falhas e solicitações de suporte podem ser enviados ao e-mail informado na seção 11. Nenhuma disposição destes Termos exclui direitos garantidos por lei nem afasta responsabilidades que não possam ser legalmente limitadas.</p>

        <h2>9. Encerramento da conta</h2>
        <p>O responsável pode solicitar o encerramento da conta pelo canal de contato indicado nestes Termos. Como a versão atual ainda não possui exclusão automática pela interface, a solicitação será tratada pela equipe, com confirmação da identidade e da legitimidade do solicitante.</p>
        <p>O encerramento poderá tornar indisponíveis o perfil, o histórico e o progresso da criança. A eliminação, anonimização ou conservação temporária dos dados seguirá os critérios descritos na Política de Privacidade e as obrigações legais aplicáveis.</p>

        <h2>10. Alterações e vigência</h2>
        <p>Estes Termos vigoram a partir da data indicada no início do documento e poderão ser atualizados para refletir mudanças na plataforma, nos prestadores utilizados ou na legislação.</p>
        <p>A versão vigente permanecerá disponível na plataforma. Mudanças relevantes serão comunicadas ao responsável pelos meios de contato disponíveis e, quando necessário, será solicitado novo aceite.</p>

        <h2>11. Responsável e contato</h2>
        <p>O Clubinho ABC é o projeto acadêmico responsável pela administração da plataforma nesta etapa de desenvolvimento. Em uma implantação por escola, empresa ou outra organização, a entidade que determinar as finalidades e os meios do tratamento deverá ser identificada como controladora.</p>
        <p><strong>Responsável pela plataforma:</strong> Clubinho ABC<br />
          <strong>E-mail de contato e suporte:</strong> clubinhoabc@gmail.com</p>

        <h2>12. Legislação aplicável</h2>
        <p>Estes Termos são regidos pelas leis da República Federativa do Brasil, especialmente pela Lei Geral de Proteção de Dados Pessoais (LGPD), pelo Estatuto da Criança e do Adolescente (ECA), pelo Estatuto Digital da Criança e do Adolescente e, quando aplicável, pelo Código de Defesa do Consumidor.</p>
      </section>
    </div>
  );
}

export default TermosDeUso;
