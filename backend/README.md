# Back-end — Clubinho ABC

Flask + MVC + SQLAlchemy. Implementa por enquanto:
- **Login e controle de acesso** — autenticação fica por conta do Supabase Auth
  (cadastro, confirmação por e-mail, login e recuperação de senha); este
  back-end só valida o token JWT que o Supabase emite (via JWKS) e guarda o
  perfil (responsável + criança).
- **RN1** — atividade pertence a uma etapa (controle de acesso)
- **RN2** — registro do resultado da atividade
- **RN3** — atividade obrigatória (conclusão da etapa)

As demais regras de negócio serão adicionadas conforme forem alinhadas.

## Estrutura (MVC)

```
backend/
  app/
    models/         -> Model: Responsavel, Crianca, Etapa, Atividade, Resultado
    controllers/    -> Controller: regras de negócio (auth_controller, resultados_controller, etapas_controller)
    routes/         -> mapeia a API REST para os controllers
    auth_utils.py   -> verifica o token JWT do Supabase (JWKS) nas rotas protegidas
    __init__.py     -> app factory
    config.py
  seeds.py          -> cria as tabelas e as etapas/atividades mínimas
  run.py            -> ponto de entrada
```

## Banco de dados

Usa o **Postgres do Supabase** do projeto. Copie `.env.example` para `.env` e
preencha `DATABASE_URL` com a senha real do banco (Supabase > Project
Settings > Database > Database password) e `SUPABASE_JWKS_URL` (Project
Settings > API > JWT Keys). Sem `.env`, cai de volta para SQLite local
(`instance/clubinho.db`) — útil só para testar a API sem depender de rede,
mas login não funciona sem o `SUPABASE_JWKS_URL` configurado.

## Como rodar

### Windows (PowerShell)

Em alguns Windows o comando `python` está mapeado pro atalho da Microsoft
Store em vez do Python de verdade — nesse caso use o launcher `py` no lugar
de `python` nos comandos abaixo (teste `python --version` primeiro; se der
erro ou abrir a Store, use `py`).

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seeds.py    # cria etapas/atividades (dados do jogo, não é dado de teste), imprime os IDs
python run.py      # sobe a API em http://localhost:5000
```

(`Activate.ps1`, não `activate` sem extensão — isso é sintaxe de bash/Linux
e não funciona no PowerShell.)

### macOS / Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seeds.py
python run.py
```

Deixe o `run.py` rodando num terminal — ele ocupa o terminal mostrando
`Running on http://127.0.0.1:5000`. Em outro terminal, suba o front-end
(`npm run dev` na raiz do projeto) e abra `http://localhost:5173`. Enquanto o
back-end não estiver rodando, toda chamada do front à API dá erro
`Failed to fetch`.

## Endpoints

Todas as rotas abaixo (exceto o cadastro/login em si, que é direto no
Supabase pelo front) exigem `Authorization: Bearer <token>` com um token
emitido pelo Supabase — o jeito mais fácil de obter um é logar pela tela do
front-end e copiar o token do `localStorage`/DevTools.

**Login — perfil do responsável autenticado:**
```bash
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer TOKEN"
```

**Login — concluir cadastro (chamado automaticamente pelo front após confirmar o e-mail):**
```bash
curl -X POST http://localhost:5000/api/auth/completar-cadastro ^
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" ^
  -d "{\"nome\": \"Ana\", \"crianca_nome\": \"Manu\", \"crianca_idade\": 6, \"crianca_avatar\": \"🦊\"}"
```

**RN2 — registrar/listar resultados:**
```bash
curl -X POST http://localhost:5000/api/resultados ^
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" ^
  -d "{\"crianca_id\": 1, \"atividade_id\": 2, \"resposta_enviada\": \"B\", \"resposta_esperada\": \"A\"}"
# { "child_id": 1, "activity_id": 2, "answer": "B", "correct": false }

curl http://localhost:5000/api/resultados?crianca_id=1 -H "Authorization: Bearer TOKEN"
```

**RN1 — atividades acessíveis pela criança (etapa atual):**
```bash
curl http://localhost:5000/api/criancas/1/atividades -H "Authorization: Bearer TOKEN"
```
Registrar um resultado numa atividade fora da etapa atual, ou tentar acessar
a criança de outro responsável, retorna `403`.

**RN3 — status de conclusão de uma etapa:**
```bash
curl http://localhost:5000/api/criancas/1/etapas/1/status -H "Authorization: Bearer TOKEN"
# { "etapa_id": 1, "child_id": 1, "concluida": true/false, "atividades": [...] }
```

Depois do `seeds.py`, ele imprime os IDs de cada etapa/atividade para usar
nesses exemplos. O `crianca_id` só existe depois que alguém se cadastra pelo
front (cadastro real, com confirmação por e-mail via Supabase).
