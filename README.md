# ClubinhoABC

## Sobre o Projeto

A alfabetização é uma etapa decisiva na formação escolar, sendo o momento em que a criança desenvolve as bases da leitura e da escrita. Diante dos desafios de engajamento nessa fase, este trabalho propõe o desenvolvimento do Clubinho ABC, uma plataforma web de apoio à alfabetização direcionada a crianças de 6 a 7 anos. O principal diferencial do sistema é conectar a rotina de aprendizado da criança ao acompanhamento da família, tornando o ensino mais lúdico por meio de atividades interativas e gamificação. Do ponto de vista técnico, o projeto apresenta forte relevância para a área de Engenharia de Software, pois exige a construção de uma aplicação ágil e responsiva, estruturada com React e Python. Essa infraestrutura demanda proteção de dados sensíveis e trilhas de auditoria, garantindo total conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD).

**Projeto publicado:** https://clubinho-abc.vercel.app

## Equipe

- Alana Vagnini Barbosa
- Ágatha Mami Takaki Akyama
- Ana Carolina da Silva

## Funcionalidades

| Requisito | O que faz |
|---|---|
| RF01 | Cadastro do responsável e de uma ou mais crianças (com data de nascimento e avatar); edição e exclusão de criança e exclusão da conta |
| RF02 | Mostra para a criança só as atividades liberadas na trilha |
| RF03 | Jogos de alfabetização em 4 etapas (Caça às Letras, Monte a Palavra, Ouça e Escolha, Leia e Descubra), com fases bônus e opção de jogar de novo para treinar |
| RF04 | Registro de cada tentativa (acerto ou erro) |
| RF05 | Conclusão da etapa quando todas as atividades obrigatórias são acertadas, liberando a próxima |
| RF06 | Aba Progresso com mapa da trilha, conquistas e dashboard (indicadores, gráficos, maiores dificuldades e o que praticar) |
| RF07 | Materiais em PDF para baixar e imprimir |
| RF08 | Histórias com narração e palavras destacadas durante a leitura |
| RF09 | Recuperação de senha por e-mail |

**Regras de negócio**

- **RN1:** a criança acessa as atividades da etapa atual e das etapas já concluídas (revisão); etapas futuras ficam bloqueadas.
- **RN2:** toda tentativa é registrada, e o servidor compara a resposta enviada com a esperada.
- **RN3:** a etapa só é concluída quando todas as atividades obrigatórias têm ao menos um acerto; bônus não contam.

**Segurança e LGPD**

- Login pelo Supabase Auth (senha com hash, confirmação de e-mail); a API valida o token em todas as rotas.
- Cada família só acessa os dados das próprias crianças.
- Sessão única: entrar na conta em outro computador encerra a sessão anterior.
- Bloqueio por excesso de tentativas e de requisições por IP.
- Trilha de auditoria (logs) e exclusão de dados a pedido do responsável.

## Tecnologia

- Front-end: React + JavaScript + Vite (publicado na Vercel)
- Back-end: Python + Flask, padrão MVC (publicado no Render)
- Banco: PostgreSQL no Supabase
- Autenticação: Supabase Auth (cadastro, confirmação por e-mail, login e recuperação de senha)
- Comunicação: API REST com JSON
- Áudio: Web Speech API (voz em português)

## Estrutura

```
public/              imagens e PDFs dos materiais
frontend/src/
  App.jsx            controla as telas e a Minha Conta
  pages/             uma tela por arquivo (Início, Histórias, Atividades, Progresso)
  components/        login/cadastro, cabeçalho/rodapé, peças do progresso
  jogos/             área de jogos, uma pasta por etapa
  utils/             chamadas à API, sessão, voz
  DashboardProgresso.jsx
  styles.css
backend/             API Flask (detalhes em backend/README.md)
```

## Materiais para imprimir

Os materiais (RF07) ficam em `public/materiais/`, em PDF, e são baixados pela tela de Atividades. São originais do projeto, organizados por eixo da alfabetização:

| Material | Páginas |
|---|---|
| Caligrafia das vogais | 8 |
| Pinte a letra inicial | 12 |
| Alfabeto móvel | 3 |
| Recorte e cole sílabas | 6 |
| Rimas e sílabas | 5 |
| Monte a frase | 5 |
| Leia e responda | 5 |
| Cruzadinha de animais | 4 |
| Caderno BA-BE-BI | 22 |

**Ilustrações:** as imagens que ilustram as palavras (abelha, bola, casa etc.) são do conjunto Twemoji (© Twitter, Inc. e colaboradores), licença [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/), usadas sem alteração e apenas redimensionadas. Os desenhos de bico, bigode, boneca, buzina e cola foram feitos pela equipe. O crédito aparece no rodapé das páginas que têm imagens. A cruzadinha não usa imagens, para a criança resolver só pelas pistas.

## Configuração de ambiente

Os arquivos `.env` não vão para o Git. Peça os valores reais do Supabase para a equipe.

1. Na raiz do projeto, crie um arquivo `.env` com:

   ```
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=chave publishable do Supabase
   VITE_API_BASE_URL=http://localhost:5000/api
   ```

2. Copie `backend/.env.example` para `backend/.env` e preencha os valores
   (a lista de variáveis está em `backend/README.md`).

## Como executar

**Back-end**, em um terminal (no Windows, troque `python` por `py` se for o
comando que funciona na sua máquina):

```
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seeds.py
python run.py
```

O `seeds.py` cria as tabelas, as etapas e as atividades. Rode de novo sempre
que entrar uma etapa, atividade ou coluna nova: ele só cria o que falta.

**Front-end**, em outro terminal, na raiz do projeto:

```
npm install
npm run dev
```

A aplicação fica em `http://localhost:5173`.

## Testes

Dentro de `backend`, com o ambiente ativado:

```
python -m unittest discover -s tests
```

Para os testes de integração com HTTP real, instale antes `pip install -r requirements-dev.txt`.
O teste de carga (quantos usuários ao mesmo tempo) está explicado em `backend/README.md`.
