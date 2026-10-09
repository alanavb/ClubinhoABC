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
        <h1 id="privacy-title">Política de Privacidade - Clubinho ABC</h1>
        <p><strong>Versão 2.0 - última revisão: 25 de setembro de 2026</strong></p>
        <p>O Clubinho ABC é um projeto acadêmico de apoio à alfabetização voltado principalmente a crianças de 6 a 7 anos, para uso acompanhado por seus pais ou responsáveis legais.</p>
        <p>Esta Política descreve o tratamento efetivamente realizado na versão atual da plataforma, incluindo cadastro, autenticação, recuperação de senha, perfil da criança, atividades, progresso e registros de segurança.</p>

        <h2>1. Responsável pelo tratamento e canal de privacidade</h2>
        <p>Durante a fase acadêmica, a equipe do <strong>Clubinho ABC</strong> determina as finalidades e os meios do tratamento realizado pela plataforma e atua como responsável pelo projeto. Em uma implantação real por escola, empresa ou outra organização, a entidade que oferecer o serviço e tomar essas decisões deverá ser identificada como controladora.</p>
        <p><strong>Canal para privacidade e direitos dos titulares:</strong> clubinhoabc@gmail.com</p>
        <p>O projeto não possui encarregado formalmente designado nesta etapa acadêmica. O canal acima recebe dúvidas, solicitações e comunicações relacionadas aos dados do responsável e da criança.</p>

        <h2>2. Dados pessoais tratados</h2>
        <p>A plataforma trata somente os dados necessários às funcionalidades atuais:</p>
        <ul>
          <li><strong>responsável:</strong> nome, e-mail, identificador da conta no Supabase e informações de autenticação e sessão;</li>
          <li><strong>criança:</strong> nome informado, idade, avatar escolhido e etapa atual de aprendizagem;</li>
          <li><strong>aprendizagem:</strong> atividade realizada, resposta enviada, indicação de acerto ou erro, progresso e data do registro;</li>
          <li><strong>auditoria e segurança:</strong> tipo de ação, identificadores relacionados, data e detalhes necessários para rastrear cadastros, acessos e atividades;</li>
          <li><strong>dados técnicos:</strong> tokens de sessão e, conforme os serviços de infraestrutura utilizados, endereço IP, dispositivo, navegador, data, horário e registros de acesso.</li>
        </ul>
        <p>A senha é enviada diretamente ao Supabase Auth. O Clubinho ABC não recebe nem armazena a senha em texto legível em sua tabela de responsáveis. Durante o cadastro ainda não confirmado, nome do responsável e dados do perfil da criança podem permanecer temporariamente nos metadados da conta do Supabase para permitir a conclusão do cadastro após a confirmação do e-mail.</p>
        <p>Para as funcionalidades descritas nesta Política, não são solicitados CPF, endereço residencial, fotografia, localização precisa, contatos da criança, dados de saúde ou documentos pessoais.</p>

        <h2>3. Finalidades e hipóteses legais</h2>
        <ul>
          <li><strong>Criar e autenticar a conta, confirmar o e-mail e recuperar a senha:</strong> execução dos procedimentos solicitados pelo responsável para utilização do serviço.</li>
          <li><strong>Criar o perfil e a trilha da criança, registrar respostas, progresso e liberar atividades da etapa correspondente:</strong> execução do serviço educacional solicitado pelo responsável, sempre com avaliação e prevalência do melhor interesse da criança.</li>
          <li><strong>Proteger contas, verificar permissões, prevenir acessos indevidos e manter registros de auditoria:</strong> legítimo interesse na segurança e na prevenção a fraudes, limitado ao necessário e acompanhado de salvaguardas.</li>
          <li><strong>Atender solicitações, exercer direitos e responder a autoridades:</strong> cumprimento de obrigação legal ou regulatória, exercício regular de direitos e atendimento ao titular.</li>
          <li><strong>Finalidades opcionais futuras:</strong> quando dependerem de consentimento, será solicitado consentimento específico, informado e destacado ao responsável antes do tratamento.</li>
        </ul>
        <p>O aceite dos Termos de Uso registra concordância com as regras da plataforma e não é utilizado como autorização genérica para qualquer tratamento futuro.</p>

        <h2>4. Proteção especial dos dados da criança</h2>
        <p>A conta deve ser criada e administrada pelo pai, mãe ou responsável legal. O tratamento dos dados da criança é limitado às funcionalidades informadas, deve ser compatível com sua faixa etária e deve preservar seu melhor interesse em todas as decisões.</p>
        <p>São adotadas configurações protetivas por padrão: não há publicidade comportamental, venda de dados, perfil público, publicação de conteúdo pelo usuário, ranking público de desempenho ou coleta de localização, imagem e voz da criança.</p>
        <p>Os resultados servem somente ao acompanhamento da atividade e à progressão educacional. Eles não constituem diagnóstico e não produzem decisões com efeitos jurídicos ou equivalentes sobre a criança.</p>

        <h2>5. Como os dados são coletados e utilizados</h2>
        <p>Os dados do responsável e da criança são informados na tela de cadastro. O Supabase Auth cria a conta e envia o e-mail de confirmação. Depois da confirmação, o backend do Clubinho ABC cria o perfil do responsável e vincula a criança no banco PostgreSQL.</p>
        <p>Durante o uso, o frontend envia ao backend o token de autenticação, os identificadores necessários e os resultados das atividades. O backend valida o token, confirma o vínculo entre responsável e criança e somente então consulta ou registra as informações.</p>
        <p>Na recuperação de senha, o e-mail informado é enviado ao Supabase Auth, que gera e encaminha um link temporário para permitir a definição de uma nova senha.</p>

        <h2>6. Compartilhamento, operadores e transferência internacional</h2>
        <p>O Clubinho ABC utiliza o <strong>Supabase</strong> como prestador de autenticação, envio dos e-mails transacionais de confirmação e recuperação, banco PostgreSQL e infraestrutura relacionada. São enviados a esse prestador os dados necessários à criação da conta, autenticação, sessão, perfil, atividades, progresso e segurança.</p>
        <p>Quando o responsável utiliza o e-mail de contato, a mensagem também é tratada pelo provedor de e-mail utilizado pelo Clubinho ABC para que a equipe possa responder à solicitação.</p>
        <p>O desenvolvimento atual utiliza frontend e backend executados localmente. Antes da publicação, esta Política deverá ser atualizada para identificar os provedores de hospedagem efetivamente contratados e os dados tratados por eles.</p>
        <p>Os prestadores podem processar ou armazenar informações em infraestrutura localizada fora do Brasil. Nesses casos, o tratamento deverá observar as regras de transferência internacional da LGPD e as salvaguardas contratuais e de segurança aplicáveis.</p>
        <p>Os dados não são vendidos nem divulgados publicamente. Poderão ser compartilhados com autoridades somente quando houver obrigação legal, ordem válida ou necessidade de exercício regular de direitos.</p>

        <h2>7. Sessão, armazenamento no navegador e cookies</h2>
        <p>A autenticação utiliza tokens de acesso e de renovação gerenciados pelo Supabase. Na configuração atual, a sessão pode ser mantida no armazenamento local do navegador para conservar o login e é removida ou invalidada conforme o fluxo de saída, alteração de senha ou regras do serviço de autenticação.</p>
        <p>A versão atual não utiliza cookies opcionais de publicidade ou análise comportamental. Se futuramente forem adotados cookies ou tecnologias opcionais, esta Política será atualizada e será oferecida escolha quando exigido.</p>

        <h2>8. Conservação e descarte</h2>
        <ul>
          <li><strong>Conta, perfil e progresso:</strong> permanecem enquanto a conta estiver ativa e forem necessários para oferecer a plataforma. Em caso de encerramento do projeto acadêmico sem continuidade do serviço, serão eliminados ou anonimizados.</li>
          <li><strong>Dados de cadastro ainda não confirmado:</strong> permanecem vinculados à conta pendente no Supabase até sua confirmação, remoção pelo responsável ou descarte conforme as rotinas do prestador.</li>
          <li><strong>Registros de auditoria e segurança:</strong> são conservados enquanto necessários para investigar incidentes, demonstrar controles e resguardar direitos, com revisão ao final do projeto acadêmico.</li>
          <li><strong>Solicitações enviadas por e-mail:</strong> são mantidas durante o atendimento e pelo período necessário para demonstrar a resposta e resguardar direitos.</li>
          <li><strong>Cópias de segurança:</strong> podem permanecer até sua substituição pelas rotinas técnicas do prestador, com acesso restrito.</li>
        </ul>
        <p>A versão atual ainda não possui exclusão automática pela interface. O responsável pode solicitar o encerramento, a eliminação ou a anonimização pelo canal da seção 1. Após a confirmação da legitimidade do pedido, a equipe realizará o procedimento nos ambientes de autenticação e banco de dados, ressalvada a conservação permitida ou exigida por lei.</p>

        <h2>9. Direitos do responsável e da criança</h2>
        <p>O responsável pode exercer, em nome próprio ou da criança e conforme a LGPD:</p>
        <ul>
          <li>confirmação da existência de tratamento e acesso aos dados;</li>
          <li>correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>informação sobre finalidades, uso compartilhado e consequências da revogação do consentimento;</li>
          <li>anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;</li>
          <li>portabilidade, quando aplicável e observada a regulamentação;</li>
          <li>eliminação dos dados tratados com consentimento e revogação do consentimento, quando essa for a hipótese utilizada;</li>
          <li>oposição ao tratamento realizado em desconformidade com a LGPD;</li>
          <li>explicação e revisão de decisões tomadas unicamente por tratamento automatizado que afetem seus interesses, quando aplicável.</li>
        </ul>
        <p>As solicitações devem ser enviadas para <strong>clubinhoabc@gmail.com</strong>. Para impedir acesso indevido, poderão ser solicitadas informações estritamente necessárias para confirmar a identidade e a representação da criança. Se algum pedido não puder ser atendido integralmente, o motivo será informado.</p>

        <h2>10. Segurança das informações</h2>
        <p>Entre as medidas adotadas na versão atual estão: senha armazenada pelo Supabase Auth com função de hash e salt; confirmação de e-mail; recuperação de senha por link temporário; tokens de sessão; validação do token no backend; restrição dos dados à criança vinculada ao responsável; uso de ORM; credenciais fora do código-fonte; e registros de ações relevantes.</p>
        <p>Em produção, a comunicação deverá utilizar HTTPS e os ambientes de desenvolvimento, testes e produção deverão permanecer separados. O acesso administrativo deve ser limitado às pessoas que necessitem das informações para manter ou dar suporte ao sistema.</p>
        <p>Nenhum sistema conectado à internet é completamente livre de riscos. O responsável deve proteger suas credenciais e comunicar suspeitas de acesso indevido, sem que isso afaste as responsabilidades legais do Clubinho ABC.</p>

        <h2>11. Incidentes de segurança</h2>
        <p>Em caso de incidente, a equipe deverá confirmar e conter o evento, preservar evidências, identificar os dados e titulares afetados, avaliar o risco ou dano, corrigir a causa e registrar as providências adotadas.</p>
        <p>Quando o incidente puder acarretar risco ou dano relevante, os responsáveis afetados e a Autoridade Nacional de Proteção de Dados serão comunicados conforme a legislação aplicável.</p>

        <h2>12. Alterações e versões</h2>
        <p>Esta Política vigorará a partir da data indicada no início e poderá ser atualizada quando houver mudanças nas funcionalidades, nos dados tratados, nos prestadores ou na legislação.</p>
        <p>A versão vigente permanecerá disponível na plataforma. Mudanças relevantes serão comunicadas ao responsável pelos meios disponíveis e, quando necessário, será solicitada nova manifestação.</p>

        <h2>13. Legislação aplicável</h2>
        <p>Esta Política observa as leis da República Federativa do Brasil, especialmente a Lei Geral de Proteção de Dados Pessoais, o Estatuto da Criança e do Adolescente, o Estatuto Digital da Criança e do Adolescente e as orientações da Autoridade Nacional de Proteção de Dados.</p>
      </section>
    </div>
  );
}

export default PoliticaDePrivacidade;
