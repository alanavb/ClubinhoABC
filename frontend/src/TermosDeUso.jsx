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
        <h1 id="terms-title">Termos e Condições de Uso — Clubinho ABC</h1>
        <p><strong>Última revisão: 22 de setembro de 2026</strong></p>
        <p>Bem-vindo(a) ao Clubinho ABC. Estes Termos e Condições explicam as regras de uso da plataforma disponível em <strong>[URL DO SITE]</strong>.</p>
        <p>O Clubinho ABC é uma plataforma de apoio à alfabetização, voltada principalmente a crianças de 6 a 7 anos. Seu uso por crianças deve ocorrer com o acompanhamento de seus pais ou responsáveis legais. Leia também a <strong>Política de Privacidade</strong>, que explicará como os dados pessoais são tratados.</p>

        <h2>1. Conta e acompanhamento do responsável</h2>
        <p>A conta da família deve ser criada e administrada por pai, mãe ou responsável legal. Cabe a essa pessoa acompanhar o uso da plataforma pela criança e manter os dados da conta atualizados.</p>
        <p>Ao criar a conta, o responsável declara que leu e concorda com estes Termos. A concordância com os Termos não substitui uma solicitação específica de consentimento para o tratamento de dados da criança, quando essa for a base legal utilizada.</p>

        <h2>2. Finalidade e conteúdo</h2>
        <p>O Clubinho ABC oferece jogos, histórias e atividades de apoio ao aprendizado inicial de letras, sílabas, palavras e leitura. Os materiais têm finalidade educacional complementar e não substituem a escola ou a orientação individual de profissionais da educação.</p>
        <p>As atividades e os demais conteúdos oferecidos ao público são disponibilizados pela equipe responsável pelo Clubinho ABC. Usuários e terceiros não podem publicar atividades, comentários, mensagens, imagens ou outros conteúdos na plataforma.</p>

        <h2>3. Dados necessários para a trilha de aprendizagem</h2>
        <p>Para criar e administrar a conta da família, o responsável poderá informar seu nome, e-mail e senha. Para configurar a trilha da criança, poderão ser informados seu nome, idade e avatar.</p>
        <p>A plataforma poderá registrar as respostas e os resultados das atividades para apresentar o progresso da criança e disponibilizar as atividades correspondentes à sua etapa de aprendizagem. A disponibilização de atividades de etapas posteriores dependerá das regras de progressão adotadas na plataforma.</p>
        <p>Os dados efetivamente coletados, suas finalidades, o período de armazenamento e eventuais compartilhamentos deverão ser descritos na Política de Privacidade. O Clubinho ABC solicitará apenas os dados necessários para as finalidades informadas.</p>

        <h2>4. Proteção dos dados da criança</h2>
        <p>O tratamento de dados pessoais da criança deve respeitar seu melhor interesse e a legislação brasileira de proteção de dados.</p>
        <p>Quando o consentimento for necessário para uma finalidade específica, ele será solicitado de maneira clara e destacada ao pai, à mãe ou ao responsável legal. O responsável poderá exercer os direitos previstos na legislação, inclusive solicitar informações, correção ou exclusão de dados, conforme o caso, pelo contato indicado ao final destes Termos.</p>
        <p>O Clubinho ABC adotará medidas de segurança adequadas para proteger os dados pessoais tratados na plataforma. As práticas de privacidade e segurança serão explicadas com mais detalhes na Política de Privacidade.</p>

        <h2>5. Uso permitido</h2>
        <p>A plataforma e seus conteúdos podem ser utilizados para fins pessoais, familiares e educacionais, respeitadas as funcionalidades oferecidas e os direitos de propriedade intelectual.</p>
        <p>Não é permitido:</p>
        <ul>
          <li>usar a plataforma para atividades ilícitas;</li>
          <li>tentar acessar contas, dados ou áreas restritas sem autorização;</li>
          <li>interferir no funcionamento ou na segurança da plataforma;</li>
          <li>vender ou explorar comercialmente os conteúdos sem autorização;</li>
          <li>copiar ou distribuir os materiais fora dos usos expressamente permitidos pela plataforma ou pela legislação.</li>
        </ul>

        <h2>6. Propriedade intelectual</h2>
        <p>Textos, atividades, jogos, ilustrações, marcas, logotipos e demais conteúdos do Clubinho ABC pertencem aos seus respectivos titulares. O acesso à plataforma não transfere esses direitos ao usuário.</p>
        <p>Materiais oferecidos para download ou impressão poderão ser usados para fins pessoais e educacionais, de acordo com as orientações apresentadas junto a cada material. Outros usos dependem de autorização do titular dos direitos, salvo quando permitidos por lei.</p>

        <h2>7. Disponibilidade e funcionamento</h2>
        <p>O Clubinho ABC poderá passar por atualizações, manutenção ou interrupções temporárias. A equipe buscará corrigir falhas e manter a plataforma funcionando de forma adequada.</p>
        <p>Nenhuma disposição destes Termos exclui direitos garantidos por lei nem afasta responsabilidades que não possam ser limitadas legalmente.</p>

        <h2>8. Alterações nos Termos</h2>
        <p>Estes Termos poderão ser atualizados para refletir mudanças na plataforma ou na legislação. A versão vigente ficará disponível no site com a data da última revisão.</p>
        <p>Quando uma mudança afetar de maneira relevante o uso da conta ou o tratamento de dados, o responsável será informado pelos meios de contato disponíveis, conforme o caso.</p>

        <h2>9. Contato</h2>
        <p>Dúvidas sobre a plataforma, solicitações relacionadas à conta, relatos de problemas e pedidos referentes a dados pessoais podem ser enviados para:</p>
        <p><strong>Responsável pela plataforma:</strong> Clubinho ABC<br />
          <strong>E-mail de contato:</strong> clubinhoabc@gmail.com</p>

        <h2>10. Legislação aplicável</h2>
        <p>Estes Termos são regidos pelas leis da República Federativa do Brasil, especialmente pela Lei Geral de Proteção de Dados Pessoais (LGPD), pelo Estatuto da Criança e do Adolescente (ECA), pelo Estatuto Digital da Criança e do Adolescente e, quando aplicável, pelo Código de Defesa do Consumidor.</p>
      </section>
    </div>
  );
}

export default TermosDeUso;
