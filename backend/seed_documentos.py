# Versões dos Termos de Uso e da Política de Privacidade.
# Para publicar uma versão nova, acrescente um item em VERSOES (nunca edite uma versão já publicada)
# e rode o seeds.py: os responsáveis serão convidados a aceitar a versão nova no próximo acesso.

import datetime

from app import create_app, db
from app.models import DocumentoLegal


TERMOS_2_1 = """
Bem-vindo(a) ao Clubinho ABC. Estes Termos regulam o acesso e o uso da plataforma educacional Clubinho ABC.

O Clubinho ABC é um projeto acadêmico de apoio à alfabetização, voltado principalmente a crianças de 6 a 7 anos e destinado ao uso com acompanhamento de seus pais ou responsáveis legais. Leia também a **Política de Privacidade**, que explica como os dados pessoais são tratados.

## 1. Quem pode utilizar a plataforma

A conta da família deve ser criada e administrada por pai, mãe ou responsável legal com capacidade para aceitar estes Termos. A criança não deve criar a própria conta nem administrar as credenciais de acesso.

Cabe ao responsável acompanhar o uso da plataforma pela criança, manter os dados da conta atualizados e avaliar se as atividades são adequadas às suas necessidades.

## 2. Criação, confirmação e proteção da conta

No cadastro, o responsável informa seu nome, e-mail e senha, além do nome, data de nascimento e avatar escolhido para a criança. Depois de entrar, o responsável pode cadastrar outras crianças na mesma conta. A plataforma utiliza o Supabase Auth para criar a identidade de acesso, confirmar o e-mail, autenticar a conta e realizar a recuperação de senha.

O cadastro somente é concluído após a confirmação do e-mail. O responsável deve fornecer informações verdadeiras, utilizar senha segura, não compartilhar suas credenciais e comunicar qualquer suspeita de acesso não autorizado.

A interface de cadastro exige que o responsável declare que leu e aceitou estes Termos. Esse aceite não substitui eventual consentimento específico para uma finalidade de tratamento de dados pessoais quando o consentimento for a hipótese legal aplicável.

## 3. Finalidade, funcionalidades e limitações

O Clubinho ABC oferece jogos, histórias e atividades de apoio ao aprendizado inicial de letras, sílabas, palavras e leitura. A plataforma registra tentativas e resultados para apresentar o progresso e controlar o acesso às atividades da etapa de aprendizagem da criança.

Os materiais têm finalidade educacional complementar. Eles não substituem a escola, a avaliação pedagógica ou a orientação individual de profissionais da educação, nem constituem diagnóstico pedagógico, psicológico ou médico.

As atividades e os demais conteúdos são disponibilizados pela equipe do Clubinho ABC. Usuários e terceiros não podem publicar atividades, comentários, mensagens, imagens ou outros conteúdos na plataforma.

## 4. Privacidade e dados da criança

O tratamento de dados pessoais deve observar a Lei Geral de Proteção de Dados Pessoais, o melhor interesse da criança e os princípios de necessidade, transparência, segurança e prevenção.

A Política de Privacidade informa os dados tratados, suas finalidades e hipóteses legais, os prestadores de serviço envolvidos, os critérios de conservação e os meios para exercer direitos. O Clubinho ABC não utiliza os dados da criança para publicidade comportamental e não vende dados pessoais.

## 5. Papéis, permissões e controle de acesso

O responsável autenticado pode acessar somente o perfil e os resultados das crianças vinculadas à sua conta. As rotas protegidas da plataforma verificam o token de autenticação e o vínculo entre responsável e criança antes de liberar dados ou registrar resultados.

As atividades disponíveis são limitadas à etapa atual da criança, conforme as regras de progressão da plataforma. Tentar alterar identificadores, tokens ou requisições para acessar dados de outra conta constitui uso indevido.

## 6. Uso permitido e condutas proibidas

A plataforma e seus conteúdos podem ser utilizados para fins pessoais, familiares e educacionais, respeitadas as funcionalidades oferecidas e os direitos de propriedade intelectual.

Não é permitido:

- usar a plataforma para atividades ilícitas ou contrárias aos direitos de crianças e adolescentes;
- tentar acessar contas, dados ou áreas restritas sem autorização;
- contornar controles de autenticação, autorização ou progressão;
- interferir no funcionamento ou na segurança da plataforma, disseminar código malicioso ou realizar testes não autorizados;
- vender, copiar, modificar ou distribuir os conteúdos fora dos usos permitidos pela plataforma ou pela legislação;
- utilizar a plataforma ou seus dados para constranger, discriminar ou expor indevidamente o desempenho de uma criança.

O uso indevido poderá resultar no bloqueio ou encerramento da conta, preservados o direito de esclarecimento do responsável e os direitos garantidos pela legislação.

## 7. Propriedade intelectual

Textos, atividades, jogos, ilustrações, marcas, logotipos, código e demais conteúdos do Clubinho ABC pertencem aos seus respectivos titulares. O acesso à plataforma não transfere esses direitos ao usuário.

Materiais eventualmente oferecidos para download ou impressão poderão ser usados para fins pessoais e educacionais, conforme as orientações apresentadas. Outros usos dependem de autorização do titular, salvo quando permitidos por lei.

## 8. Disponibilidade, manutenção e suporte

Por se tratar de projeto acadêmico em desenvolvimento, funcionalidades podem ser ajustadas, temporariamente interrompidas ou descontinuadas. A plataforma também poderá ficar indisponível durante manutenção, falhas de conexão ou indisponibilidade de prestadores externos.

Dúvidas, relatos de falhas e solicitações de suporte podem ser enviados ao e-mail informado na seção 11. Nenhuma disposição destes Termos exclui direitos garantidos por lei nem afasta responsabilidades que não possam ser legalmente limitadas.

## 9. Encerramento da conta

O responsável pode encerrar a conta pela área protegida da plataforma, após confirmação expressa. A exclusão remove a conta de autenticação e os dados vinculados no Clubinho ABC. O canal de contato indicado nestes Termos permanece disponível para suporte e para solicitações de quem não consiga acessar a conta.

O encerramento remove os perfis, resultados e progresso vinculados à conta. A eliminação, anonimização ou eventual conservação permitida por lei seguirá os critérios descritos na Política de Privacidade e as obrigações legais aplicáveis.

## 10. Alterações e vigência

Estes Termos vigoram a partir da data indicada no início do documento e poderão ser atualizados para refletir mudanças na plataforma, nos prestadores utilizados ou na legislação.

A versão vigente permanecerá disponível na plataforma. Mudanças relevantes serão comunicadas ao responsável pelos meios de contato disponíveis e, quando necessário, será solicitado novo aceite.

## 11. Responsável e contato

O Clubinho ABC é o projeto acadêmico responsável pela administração da plataforma nesta etapa de desenvolvimento. Em uma implantação por escola, empresa ou outra organização, a entidade que determinar as finalidades e os meios do tratamento deverá ser identificada como controladora.

**Responsável pela plataforma:** Clubinho ABC

**E-mail de contato e suporte:** suporte.clubinhoabc@gmail.com

## 12. Legislação aplicável

Estes Termos são regidos pelas leis da República Federativa do Brasil, especialmente pela Lei Geral de Proteção de Dados Pessoais (LGPD), pelo Estatuto da Criança e do Adolescente (ECA), pelo Estatuto Digital da Criança e do Adolescente e, quando aplicável, pelo Código de Defesa do Consumidor.
"""

PRIVACIDADE_2_1 = """
O Clubinho ABC é um projeto acadêmico de apoio à alfabetização voltado principalmente a crianças de 6 a 7 anos, para uso acompanhado por seus pais ou responsáveis legais.

Esta Política descreve o tratamento efetivamente realizado na versão atual da plataforma, incluindo cadastro, autenticação, recuperação de senha, perfil da criança, atividades, progresso e registros de segurança.

## 1. Responsável pelo tratamento e canal de privacidade

Durante a fase acadêmica, a equipe do **Clubinho ABC** determina as finalidades e os meios do tratamento realizado pela plataforma e atua como responsável pelo projeto. Em uma implantação real por escola, empresa ou outra organização, a entidade que oferecer o serviço e tomar essas decisões deverá ser identificada como controladora.

**Canal para privacidade e direitos dos titulares:** suporte.clubinhoabc@gmail.com

O projeto não possui encarregado formalmente designado nesta etapa acadêmica. O canal acima recebe dúvidas, solicitações e comunicações relacionadas aos dados do responsável e da criança.

## 2. Dados pessoais tratados

A plataforma trata somente os dados necessários às funcionalidades atuais:

- **responsável:** nome, e-mail, identificador da conta no Supabase e informações de autenticação e sessão;
- **criança (uma ou mais por conta):** nome informado, data de nascimento (usada para calcular a idade e avisar o responsável quando a criança sair da faixa de 6 a 7 anos), avatar escolhido e etapa atual de aprendizagem;
- **aprendizagem:** atividade realizada, resposta enviada, indicação de acerto ou erro, progresso e data do registro;
- **auditoria e segurança:** tipo de ação, identificadores relacionados, data e detalhes necessários para rastrear cadastros, acessos e atividades;
- **dados técnicos:** tokens de sessão e, conforme os serviços de infraestrutura utilizados, endereço IP, dispositivo, navegador, data, horário e registros de acesso.

A senha é enviada diretamente ao Supabase Auth. O Clubinho ABC não recebe nem armazena a senha em texto legível em sua tabela de responsáveis. Durante o cadastro ainda não confirmado, nome do responsável e dados do perfil da criança podem permanecer temporariamente nos metadados da conta do Supabase para permitir a conclusão do cadastro após a confirmação do e-mail.

Para as funcionalidades descritas nesta Política, não são solicitados CPF, endereço residencial, fotografia, localização precisa, contatos da criança, dados de saúde ou documentos pessoais.

## 3. Finalidades e hipóteses legais

- **Criar e autenticar a conta, confirmar o e-mail e recuperar a senha:** execução dos procedimentos solicitados pelo responsável para utilização do serviço.
- **Criar o perfil e a trilha da criança, registrar respostas, progresso e liberar atividades da etapa correspondente:** execução do serviço educacional solicitado pelo responsável, sempre com avaliação e prevalência do melhor interesse da criança.
- **Proteger contas, verificar permissões, prevenir acessos indevidos e manter registros de auditoria:** legítimo interesse na segurança e na prevenção a fraudes, limitado ao necessário e acompanhado de salvaguardas.
- **Atender solicitações, exercer direitos e responder a autoridades:** cumprimento de obrigação legal ou regulatória, exercício regular de direitos e atendimento ao titular.
- **Finalidades opcionais futuras:** quando dependerem de consentimento, será solicitado consentimento específico, informado e destacado ao responsável antes do tratamento.

O aceite dos Termos de Uso registra concordância com as regras da plataforma e não é utilizado como autorização genérica para qualquer tratamento futuro.

## 4. Proteção especial dos dados da criança

A conta deve ser criada e administrada pelo pai, mãe ou responsável legal. O tratamento dos dados da criança é limitado às funcionalidades informadas, deve ser compatível com sua faixa etária e deve preservar seu melhor interesse em todas as decisões.

São adotadas configurações protetivas por padrão: não há publicidade comportamental, venda de dados, perfil público, publicação de conteúdo pelo usuário, ranking público de desempenho ou coleta de localização, imagem e voz da criança.

Os resultados servem somente ao acompanhamento da atividade e à progressão educacional. Eles não constituem diagnóstico e não produzem decisões com efeitos jurídicos ou equivalentes sobre a criança.

## 5. Como os dados são coletados e utilizados

Os dados do responsável e da criança são informados na tela de cadastro. O Supabase Auth cria a conta e envia o e-mail de confirmação. Depois da confirmação, o backend do Clubinho ABC cria o perfil do responsável e vincula a criança no banco PostgreSQL.

Durante o uso, o frontend envia ao backend o token de autenticação, os identificadores necessários e os resultados das atividades. O backend valida o token, confirma o vínculo entre responsável e criança e somente então consulta ou registra as informações.

Na recuperação de senha, o e-mail informado é enviado ao Supabase Auth, que gera e encaminha um link temporário para permitir a definição de uma nova senha.

## 6. Compartilhamento, operadores e transferência internacional

O Clubinho ABC utiliza o **Supabase** como prestador de autenticação, envio dos e-mails transacionais de confirmação e recuperação, banco PostgreSQL e infraestrutura relacionada. São enviados a esse prestador os dados necessários à criação da conta, autenticação, sessão, perfil, atividades, progresso e segurança.

Quando o responsável utiliza o e-mail de contato, a mensagem também é tratada pelo provedor de e-mail utilizado pelo Clubinho ABC para que a equipe possa responder à solicitação.

O desenvolvimento atual utiliza frontend e backend executados localmente. Antes da publicação, esta Política deverá ser atualizada para identificar os provedores de hospedagem efetivamente contratados e os dados tratados por eles.

Os prestadores podem processar ou armazenar informações em infraestrutura localizada fora do Brasil. Nesses casos, o tratamento deverá observar as regras de transferência internacional da LGPD e as salvaguardas contratuais e de segurança aplicáveis.

Os dados não são vendidos nem divulgados publicamente. Poderão ser compartilhados com autoridades somente quando houver obrigação legal, ordem válida ou necessidade de exercício regular de direitos.

## 7. Sessão, armazenamento no navegador e cookies

A autenticação utiliza tokens de acesso e de renovação gerenciados pelo Supabase. Na configuração atual, a sessão pode ser mantida no armazenamento local do navegador para conservar o login e é removida ou invalidada conforme o fluxo de saída, alteração de senha ou regras do serviço de autenticação.

A versão atual não utiliza cookies opcionais de publicidade ou análise comportamental. Se futuramente forem adotados cookies ou tecnologias opcionais, esta Política será atualizada e será oferecida escolha quando exigido.

## 8. Conservação e descarte

- **Conta, perfil e progresso:** permanecem enquanto a conta estiver ativa e forem necessários para oferecer a plataforma. Em caso de encerramento do projeto acadêmico sem continuidade do serviço, serão eliminados ou anonimizados.
- **Dados de cadastro ainda não confirmado:** permanecem vinculados à conta pendente no Supabase até sua confirmação, remoção pelo responsável ou descarte conforme as rotinas do prestador.
- **Registros de auditoria e segurança:** são conservados enquanto necessários para investigar incidentes, demonstrar controles e resguardar direitos, com revisão ao final do projeto acadêmico.
- **Solicitações enviadas por e-mail:** são mantidas durante o atendimento e pelo período necessário para demonstrar a resposta e resguardar direitos.
- **Cópias de segurança:** podem permanecer até sua substituição pelas rotinas técnicas do prestador, com acesso restrito.

O responsável pode excluir definitivamente, pela área protegida da conta e após confirmação expressa, tanto o perfil de uma criança quanto a conta inteira. Na exclusão da conta inteira, são removidos o acesso no serviço de autenticação e os perfis, resultados e progressos vinculados no Clubinho ABC. O canal da seção 1 permanece disponível para suporte, para quem não consiga acessar a conta e para os demais direitos previstos nesta Política, ressalvada a conservação permitida ou exigida por lei.

## 9. Direitos do responsável e da criança

O responsável pode exercer, em nome próprio ou da criança e conforme a LGPD:

- confirmação da existência de tratamento e acesso aos dados;
- correção de dados incompletos, inexatos ou desatualizados;
- informação sobre finalidades, uso compartilhado e consequências da revogação do consentimento;
- anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;
- portabilidade, quando aplicável e observada a regulamentação;
- eliminação dos dados tratados com consentimento e revogação do consentimento, quando essa for a hipótese utilizada;
- oposição ao tratamento realizado em desconformidade com a LGPD;
- explicação e revisão de decisões tomadas unicamente por tratamento automatizado que afetem seus interesses, quando aplicável.

As solicitações devem ser enviadas para **suporte.clubinhoabc@gmail.com**. Para impedir acesso indevido, poderão ser solicitadas informações estritamente necessárias para confirmar a identidade e a representação da criança. Se algum pedido não puder ser atendido integralmente, o motivo será informado.

## 10. Segurança das informações

Entre as medidas adotadas na versão atual estão: senha armazenada pelo Supabase Auth com função de hash e salt; confirmação de e-mail; recuperação de senha por link temporário; tokens de sessão; validação do token no backend; restrição dos dados à criança vinculada ao responsável; uso de ORM; credenciais fora do código-fonte; e registros de ações relevantes.

Em produção, a comunicação deverá utilizar HTTPS e os ambientes de desenvolvimento, testes e produção deverão permanecer separados. O acesso administrativo deve ser limitado às pessoas que necessitem das informações para manter ou dar suporte ao sistema.

Nenhum sistema conectado à internet é completamente livre de riscos. O responsável deve proteger suas credenciais e comunicar suspeitas de acesso indevido, sem que isso afaste as responsabilidades legais do Clubinho ABC.

## 11. Incidentes de segurança

Em caso de incidente, a equipe deverá confirmar e conter o evento, preservar evidências, identificar os dados e titulares afetados, avaliar o risco ou dano, corrigir a causa e registrar as providências adotadas.

Quando o incidente puder acarretar risco ou dano relevante, os responsáveis afetados e a Autoridade Nacional de Proteção de Dados serão comunicados conforme a legislação aplicável.

## 12. Alterações e versões

Esta Política vigorará a partir da data indicada no início e poderá ser atualizada quando houver mudanças nas funcionalidades, nos dados tratados, nos prestadores ou na legislação.

A versão vigente permanecerá disponível na plataforma. Mudanças relevantes serão comunicadas ao responsável pelos meios disponíveis e, quando necessário, será solicitada nova manifestação.

## 13. Legislação aplicável

Esta Política observa as leis da República Federativa do Brasil, especialmente a Lei Geral de Proteção de Dados Pessoais, o Estatuto da Criança e do Adolescente, o Estatuto Digital da Criança e do Adolescente e as orientações da Autoridade Nacional de Proteção de Dados.
"""

# (tipo, versão, vigente desde, texto)
VERSOES = [
    ('termos', '2.1', datetime.date(2026, 11, 6), TERMOS_2_1),
    ('privacidade', '2.1', datetime.date(2026, 11, 6), PRIVACIDADE_2_1),
]


# Criação das versões que ainda não existem no banco
def popular_documentos():
    criados = 0
    for tipo, versao, vigente_desde, conteudo in VERSOES:
        if DocumentoLegal.query.filter_by(tipo=tipo, versao=versao).first():
            continue
        db.session.add(DocumentoLegal(
            tipo=tipo,
            versao=versao,
            vigente_desde=vigente_desde,
            conteudo=conteudo.strip(),
        ))
        criados += 1
    db.session.commit()
    return criados


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
        criados = popular_documentos()
        print(f'{criados} documento(s) criado(s).')
