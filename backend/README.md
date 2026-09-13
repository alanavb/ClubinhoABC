# Back-end — Clubinho ABC

Flask + MVC + SQLAlchemy. Implementa por enquanto:
- **RN1** — atividade pertence a uma etapa (controle de acesso)
- **RN2** — registro do resultado da atividade
- **RN3** — atividade obrigatória (conclusão da etapa)

As demais regras de negócio serão adicionadas conforme forem alinhadas.

## Estrutura (MVC)

```
backend/
  app/
    models/         -> Model: Responsavel, Crianca, Etapa, Atividade, Resultado
    controllers/    -> Controller: regras de negócio (resultados_controller, etapas_controller)
    routes/         -> mapeia a API REST para os controllers
    __init__.py     -> app factory
    config.py
  seeds.py          -> cria as tabelas e dados mínimos de teste
  run.py            -> ponto de entrada
```

## Banco de dados

Por padrão usa **SQLite local** (`instance/clubinho.db`), sem precisar configurar nada.
Quando o projeto Supabase/Postgres estiver pronto, copie `.env.example` para
`.env` e defina `DATABASE_URL` com a connection string do Postgres — nenhum
código precisa mudar.

## Como rodar

### Windows (PowerShell)

No seu Windows, o comando `python` pode estar mapeado pro atalho da Microsoft
Store em vez do Python de verdade — use o launcher `py`, que resolve certo:

```powershell
cd backend
py -m pip install -r requirements.txt
py seeds.py    # cria as tabelas e dados de teste, imprime os IDs
py run.py      # sobe a API em http://localhost:5000
```

(Se quiser usar um venv isolado: `py -m venv .venv` e depois
`.venv\Scripts\Activate.ps1` — não `activate` sem extensão, que é sintaxe de
bash/Linux e não funciona no PowerShell.)

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

**RN2 — registrar/listar resultados:**
```bash
curl -X POST http://localhost:5000/api/resultados ^
  -H "Content-Type: application/json" ^
  -d "{\"crianca_id\": 1, \"atividade_id\": 2, \"resposta_enviada\": \"B\", \"resposta_esperada\": \"A\"}"
# { "child_id": 1, "activity_id": 2, "answer": "B", "correct": false }

curl http://localhost:5000/api/resultados?crianca_id=1
```

**RN1 — atividades acessíveis pela criança (etapa atual):**
```bash
curl http://localhost:5000/api/criancas/1/atividades
```
Registrar um resultado numa atividade fora da etapa atual retorna `403`.

**RN3 — status de conclusão de uma etapa:**
```bash
curl http://localhost:5000/api/criancas/1/etapas/1/status
# { "etapa_id": 1, "child_id": 1, "concluida": true/false, "atividades": [...] }
```

Depois do `seeds.py`, ele imprime os IDs de cada etapa/atividade e o
`crianca_id` de teste (normalmente `1`) para usar nesses exemplos.
