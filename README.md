# ClubinhoABC

## Sobre o Projeto 

A alfabetização é uma etapa decisiva na formação escolar, sendo o momento em que a criança desenvolve as bases da leitura e da escrita. Diante dos desafios de engajamento nessa fase, este trabalho propõe o desenvolvimento do Clubinho ABC, uma plataforma web de apoio à alfabetização direcionada a crianças de aproximadamente 6 anos. O principal diferencial do sistema é conectar a rotina de aprendizado da criança ao acompanhamento da família, tornando o ensino mais lúdico por meio de atividades interativas e gamificação. Do ponto de vista técnico, o projeto apresenta forte relevância para a área de Engenharia de Software, pois exige a construção de uma aplicação ágil e responsiva, estruturada com React e Python. Essa infraestrutura demanda proteção de dados sensíveis e trilhas de auditoria, garantindo total conformidade com a Lei Geral de Proteção de Dados Pessoais (LGPD). 

## Tecnologia

- Front-end: React + JavaScript + Vite
- Back-end: Python + Flask
- Banco planejado para produção: PostgreSQL + Supabase
- Comunicação: API REST com JSON
- Áudio: Web Speech API

## Estrutura atual

Por enquanto, o projeto contém somente a interface. Estão disponíveis a tela de login e o fluxo visual de cadastro da família em três passos. Os componentes ficam em `frontend/src/App.jsx`, os estilos em `frontend/src/styles.css` e os assets locais em `frontend/public/images`.

## Como executar

FRONTEND - No terminal, na pasta do projeto, execute:

```
npm install
npm run dev
```

BACKEND - Em outro terminal, na pasta do projeto, execute:

```
cd backend
py -m pip install -r requirements.txt
py seeds.py
py run.py
```

A aplicação estará disponível em `http://localhost:5173`.
