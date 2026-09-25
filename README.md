# ClubinhoABC

## Sobre o Projeto 

A alfabetização é uma etapa decisiva na formação escolar, sendo o momento em que a criança desenvolve as bases da leitura e da escrita. Diante dos desafios de engajamento nessa fase, este trabalho propõe o desenvolvimento do Clubinho ABC, uma plataforma web de apoio à alfabetização direcionada a crianças de aproximadamente 6 anos. O principal diferencial do sistema é conectar a rotina de aprendizado da criança ao acompanhamento da família, tornando o ensino mais lúdico por meio de atividades interativas e gamificação. Do ponto de vista técnico, o projeto apresenta forte relevância para a área de Engenharia de Software, pois exige a construção de uma aplicação ágil e responsiva, estruturada com React e Python. Essa infraestrutura demanda proteção de dados sensíveis e trilhas de auditoria, garantindo total conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD). 

## Tecnologia

- Front-end: React + JavaScript + Vite
- Back-end: Python + Flask
- Banco: PostgreSQL no Supabase (já conectado, não é mais só planejado)
- Autenticação: Supabase Auth (cadastro, confirmação por e-mail, login e recuperação de senha)
- Comunicação: API REST com JSON
- Áudio: Web Speech API

## Estrutura atual

O front-end (`frontend/src/App.jsx`, estilos em `frontend/src/styles.css`, assets em `frontend/public/images`) e o back-end (`backend/`, Flask MVC) já se comunicam de verdade. Login está implementado: cadastro, confirmação por e-mail, login e recuperação de senha são feitos pelo Supabase Auth; o back-end valida o token e guarda o perfil (responsável + criança), e as rotas de jogos/resultados exigem esse token e só liberam os dados da própria criança do responsável logado.

## Configuração de ambiente

Login não funciona sem isso configurado (peça as chaves reais do Supabase pra
equipe, não vão pro Git):

1. Copie `.env.example` (raiz) para `.env` e preencha `VITE_SUPABASE_URL` e
   `VITE_SUPABASE_ANON_KEY`.
2. Copie `backend/.env.example` para `backend/.env` e preencha `DATABASE_URL`
   (com a senha real do banco) e `SUPABASE_JWKS_URL`.

## Como executar

FRONTEND - No terminal, na pasta do projeto, execute:

```
npm install
npm run dev
```

BACKEND - Em outro terminal, na pasta do projeto, execute (troque `python`
por `py` se for esse o comando que funciona na sua máquina — ver detalhes em
`backend/README.md`):

```
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seeds.py
python run.py
```

A aplicação estará disponível em `http://localhost:5173`.
