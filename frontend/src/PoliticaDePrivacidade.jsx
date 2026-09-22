import { useEffect } from 'react';

function PoliticaDePrivacidade({ onClose }) {
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
      <section className="terms-dialog" role="dialog" aria-modal="true" aria-labelledby="privacy-title">
        <button className="terms-close" type="button" onClick={onClose} aria-label="Fechar política de privacidade">×</button>
        <h1 id="privacy-title">Política de Privacidade — Clubinho ABC</h1>
        <p><strong>Última revisão: 22 de setembro de 2026</strong></p>
        <p>O Clubinho ABC é uma plataforma de apoio à alfabetização voltada principalmente a crianças de 6 a 7 anos, para uso com acompanhamento de seus pais ou responsáveis legais.</p>
        <p>Esta Política explica quais dados pessoais são tratados pela plataforma, para quais finalidades, como o responsável pode fazer solicitações e quais cuidados são adotados para proteger os dados da criança.</p>

        <h2>1. Responsável pela plataforma e contato</h2>
        <p><strong>Responsável pela plataforma:</strong> Clubinho ABC<br />
          <strong>E-mail para assuntos de privacidade:</strong> clubinhoabc@gmail.com</p>
        <p>Pais e responsáveis podem utilizar esse e-mail para esclarecer dúvidas e fazer solicitações relativas aos seus dados ou aos dados da criança.</p>

        <h2>2. Quais dados são tratados</h2>
        <p>Para a conta da família, o Clubinho ABC poderá tratar o nome e o e-mail do responsável, além dos dados necessários para autenticar seu acesso.</p>
        <p>Para configurar a trilha de aprendizagem, poderão ser tratados o nome informado para a criança, sua idade, o avatar escolhido e a etapa de aprendizagem. Durante o uso da plataforma, poderão ser registradas respostas, resultados das atividades e informações sobre o progresso da criança.</p>
        <p>Registros técnicos necessários ao funcionamento e à segurança da plataforma, como data de acesso e endereço IP, poderão ser tratados conforme os serviços utilizados para disponibilizar o site.</p>
        <p>O Clubinho ABC não solicita CPF, endereço residencial, dados de saúde, fotografia ou localização precisa da criança para as funcionalidades descritas nesta Política.</p>

        <h2>3. Para que os dados são usados</h2>
        <p>Os dados pessoais são utilizados para:</p>
        <ul>
          <li>permitir que o responsável crie e administre a conta da família;</li>
          <li>configurar o perfil e a trilha de aprendizagem da criança;</li>
          <li>registrar atividades realizadas e apresentar o progresso;</li>
          <li>disponibilizar atividades correspondentes à etapa de aprendizagem;</li>
          <li>responder a dúvidas e solicitações do responsável;</li>
          <li>manter o funcionamento e a segurança da plataforma.</li>
        </ul>
        <p>As respostas e os resultados das atividades têm finalidade de acompanhamento educacional. Eles não constituem diagnóstico pedagógico, psicológico ou médico.</p>
        <p>O Clubinho ABC não utiliza dados da criança para publicidade comportamental.</p>

        <h2>4. Dados de crianças e acompanhamento do responsável</h2>
        <p>A conta da família deve ser criada e administrada por pai, mãe ou responsável legal. O tratamento dos dados da criança deve observar seu melhor interesse e ser limitado às finalidades informadas nesta Política.</p>
        <p>Quando o consentimento for necessário para uma finalidade específica, ele será solicitado ao responsável de forma clara e destacada. O aceite dos Termos e Condições de Uso não substitui essa solicitação.</p>
        <p>O responsável deve acompanhar o uso da plataforma pela criança. As informações sobre o tratamento de dados serão apresentadas de forma clara, considerando também a compreensão do público infantil.</p>

        <h2>5. Armazenamento e compartilhamento</h2>
        <p>Os dados poderão ser tratados por prestadores de serviços necessários ao funcionamento do Clubinho ABC, como serviços de hospedagem do site e armazenamento do banco de dados. Esses prestadores deverão utilizar os dados para prestar os serviços contratados, de acordo com as instruções aplicáveis.</p>
        <p>O acesso aos dados será limitado às pessoas que precisem deles para administrar, manter ou oferecer suporte à plataforma. Os dados pessoais da criança não serão publicados para outros usuários.</p>
        <p>Informações também poderão ser fornecidas quando houver obrigação legal ou determinação válida de autoridade competente. O Clubinho ABC não vende dados pessoais de responsáveis ou crianças.</p>

        <h2>6. Conservação e exclusão dos dados</h2>
        <p>Os dados da conta e do progresso serão mantidos enquanto forem necessários para oferecer as funcionalidades descritas nesta Política e enquanto a conta permanecer ativa.</p>
        <p>Após o encerramento da conta ou um pedido de exclusão, os dados serão eliminados ou anonimizados, ressalvadas situações em que sua conservação seja permitida ou exigida pela legislação, inclusive para cumprir obrigações legais ou resguardar direitos. Cópias de segurança poderão permanecer temporariamente até sua substituição nas rotinas técnicas de armazenamento.</p>
        <p>O responsável poderá solicitar informações sobre a conservação ou a exclusão dos dados pelo e-mail indicado na seção 1.</p>

        <h2>7. Direitos do responsável e da criança</h2>
        <p>O pai, a mãe ou o responsável legal poderá solicitar, em nome da criança e conforme a legislação aplicável:</p>
        <ul>
          <li>confirmação da existência de tratamento e acesso aos dados;</li>
          <li>correção de dados incompletos, incorretos ou desatualizados;</li>
          <li>informações sobre a finalidade do tratamento e eventual compartilhamento;</li>
          <li>eliminação ou anonimização de dados, quando cabível;</li>
          <li>revogação do consentimento, quando essa for a base utilizada.</li>
        </ul>
        <p>As solicitações devem ser enviadas para <strong>clubinhoabc@gmail.com</strong>. Para proteger os dados da criança, o Clubinho ABC poderá solicitar informações necessárias para confirmar que o pedido foi feito por pessoa autorizada.</p>

        <h2>8. Proteção e segurança das informações</h2>
        <p>O Clubinho ABC adotará medidas técnicas e organizacionais adequadas para proteger os dados pessoais tratados na plataforma contra acesso não autorizado, perda, alteração ou divulgação indevida. Essas medidas serão compatíveis com os serviços e recursos efetivamente utilizados pelo projeto.</p>
        <p>Apesar dos cuidados adotados, nenhum sistema conectado à internet está completamente livre de riscos. Caso seja identificado um incidente de segurança, o Clubinho ABC avaliará seus efeitos, adotará medidas para reduzir possíveis danos e comunicará os responsáveis afetados e a Autoridade Nacional de Proteção de Dados quando a legislação exigir.</p>
        <p>O responsável também deve proteger suas credenciais de acesso e comunicar ao Clubinho ABC qualquer suspeita de uso não autorizado da conta. Esta disposição não afasta as responsabilidades legais do Clubinho ABC.</p>

        <h2>9. Alterações desta Política</h2>
        <p>Esta Política poderá ser atualizada para acompanhar mudanças na plataforma, no tratamento de dados ou na legislação. A versão vigente ficará disponível no site com a data da última revisão.</p>
        <p>Quando uma mudança afetar de maneira relevante o uso dos dados, o responsável será informado pelos meios de contato disponíveis, conforme o caso.</p>

        <h2>10. Legislação aplicável</h2>
        <p>Esta Política observa as leis da República Federativa do Brasil, especialmente a Lei Geral de Proteção de Dados Pessoais, o Estatuto da Criança e do Adolescente e o Estatuto Digital da Criança e do Adolescente.</p>
      </section>
    </div>
  );
}

export default PoliticaDePrivacidade;
