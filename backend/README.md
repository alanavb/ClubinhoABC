# Back-end — Clubinho ABC

API REST em Flask + SQLAlchemy, organizada em MVC. O cadastro, o login, a
confirmação de e-mail e a recuperação de senha ficam no Supabase Auth; este
back-end valida o token JWT emitido pelo Supabase (via JWKS) e guarda o perfil
da família e o progresso das crianças.

Implementa:
- **Contas:** perfil do responsável e das crianças (cadastro, edição e
  exclusão) e exclusão da conta.
- **RN1:** a criança acessa a etapa atual e as já concluídas (revisão);
  etapas futuras são recusadas com `403`.
- **RN2:** registro de cada tentativa; o servidor compara a resposta.
- **RN3:** conclusão da etapa por atividades obrigatórias, com avanço
  automático para a próxima.
- **Dashboard (RF06):** totais, desempenho por etapa, evolução de 7 dias,
  maiores dificuldades e recomendações.
- **Segurança:** dono da criança conferido em toda rota, sessão única por
  conta, bloqueio de tentativas e limite de requisições por IP, logs de
  auditoria.

## Estrutura (MVC)

```
backend/
  app/
    models/                 Responsavel, Crianca, Etapa, Atividade, Resultado,
                            LogAuditoria, RegistroExclusao
    controllers/            regras de negócio (auth, etapas, resultados,
                            dashboard, auditoria)
    routes/                 endpoints da API, chamam os controllers
    auth_utils.py           @requer_autenticacao: valida o token e a sessão ativa
    limite_tentativas.py    bloqueio por IP (força bruta e excesso de requisições)
    supabase_admin.py       exclui o usuário no Supabase Auth
    error_responses.py      mensagens de erro padronizadas
    config.py               lê as variáveis de ambiente
    __init__.py             monta a aplicação (app factory)
  tests/                    testes automatizados (unittest)
  seeds.py                  cria tabelas, etapas e atividades
  migrar_data_nascimento.py ajustes de colunas em bancos existentes (o seeds chama)
  teste_carga.py            mede usuários simultâneos (ver "Teste de carga")
  run.py                    ponto de entrada
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Postgres do Supabase (Project Settings > Database). Sem ela, usa SQLite local em `instance/clubinho.db` |
| `SUPABASE_JWKS_URL` | Chave pública para validar o token (Project Settings > API > JWT Keys). Sem ela, o login não funciona |
| `SUPABASE_URL` e `SUPABASE_SECRET_KEY` | Exclusão da conta no Supabase Auth. A chave secreta fica só no back-end, nunca no front nem no GitHub |
| `CORS_ALLOWED_ORIGINS` | Endereço do front que pode chamar a API (`http://localhost:5173` local; o da Vercel em produção) |
| `FLASK_DEBUG` | `true` só no desenvolvimento |
| `PORT` | Porta da API (padrão 5000) |

## Como rodar

### Windows (PowerShell)

Em alguns Windows o comando `python` está mapeado para o atalho da Microsoft
Store. Teste `python --version`; se der erro ou abrir a Store, use `py`.

```powershell
cd backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python seeds.py    # cria tabelas, etapas e atividades; imprime os IDs
python run.py      # sobe a API em http://localhost:5000
```

(`Activate.ps1`, não `activate`: sem a extensão é sintaxe de bash e não
funciona no PowerShell.)

### macOS / Linux

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seeds.py
python run.py
```

Deixe o `run.py` rodando e suba o front-end em outro terminal (`npm run dev`
na raiz). Sem o back-end no ar, as chamadas do front dão `Failed to fetch`.

**Sempre que entrar uma etapa, atividade ou coluna nova**, rode `python seeds.py`
de novo no banco usado. Ele só cria o que falta e não altera o que já existe.

### Produção (Render)

O Render usa o mesmo `requirements.txt` e o comando `gunicorn run:app`. As
variáveis ficam no painel do Render; `CORS_ALLOWED_ORIGINS` deve ter o
endereço da Vercel.

## Testes

```powershell
pip install -r requirements-dev.txt
python -m unittest discover -s tests
```

Os testes usam SQLite em memória e simulam só a validação do token do
Supabase; não acessam o banco real.

## Endpoints

Todas as rotas exigem `Authorization: Bearer <token>` com um token do
Supabase. Sem token, ou com token inválido, a resposta é `401`; criança de
outra família dá `403` ou `404`.

| Método | Rota | O que faz |
|---|---|---|
| GET | `/api/auth/me` | Perfil do responsável e lista de crianças |
| GET | `/api/historias` | Leituras publicadas, ordenadas para a área de histórias |
| POST | `/api/auth/completar-cadastro` | Cria o perfil no primeiro login depois de confirmar o e-mail |
| POST | `/api/auth/sessao` | Registra o login atual como a única sessão ativa |
| GET | `/api/auth/sessao` | Confere se a sessão ainda é a ativa (`401` se a conta entrou em outro computador) |
| DELETE | `/api/auth/conta` | Exclui a conta (corpo: `{"confirmacao": "EXCLUIR MINHA CONTA"}`) |
| POST | `/api/criancas` | Cadastra mais uma criança |
| GET | `/api/criancas/<id>` | Dados de uma criança |
| PUT | `/api/criancas/<id>` | Edita uma criança |
| DELETE | `/api/criancas/<id>` | Exclui uma criança (corpo: `{"confirmacao": "EXCLUIR <nome>"}`) |
| GET | `/api/criancas/<id>/progresso` | Estrelas, atividades concluídas, situação de cada etapa e conquistas |
| GET | `/api/criancas/<id>/dashboard` | Indicadores do dashboard (RF06) |
| GET | `/api/criancas/<id>/atividades` | Atividades da etapa atual |
| GET | `/api/criancas/<id>/etapas/<etapa_id>/status` | Se a etapa está concluída (RN3) |
| POST | `/api/criancas/<id>/etapas/<etapa_id>/concluir` | Avança para a próxima etapa, se a atual estiver concluída |
| GET | `/api/etapas/<chave>/atividades` | IDs das atividades de uma etapa pela chave |
| POST | `/api/resultados` | Registra uma tentativa (RN2) |
| GET | `/api/resultados?crianca_id=<id>` | Tentativas registradas |
| GET | `/api/logs` | Trilha de auditoria da conta |

O jeito mais fácil de obter um token para testar é entrar pelo front-end e
copiá-lo do `localStorage` pelo DevTools. Exemplos:

```bash
curl http://localhost:5000/api/auth/me -H "Authorization: Bearer TOKEN"

curl -X POST http://localhost:5000/api/resultados ^
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" ^
  -d "{\"crianca_id\": 1, \"atividade_id\": 2, \"resposta_enviada\": \"B\", \"resposta_esperada\": \"A\"}"
# { "child_id": 1, "activity_id": 2, "answer": "B", "correct": false }
```

## Teste de carga

`teste_carga.py` simula vários responsáveis abrindo a aba Progresso ao mesmo
tempo (`/auth/me`, `/progresso` e `/dashboard`) e mede o tempo de resposta de
cada nível de usuários. Usa só a biblioteca padrão do Python.

```powershell
.venv\Scripts\python.exe teste_carga.py
```

No modo padrão, a API sobe no próprio computador com um banco SQLite
temporário, então mede o código do projeto sem a rede no meio. O resultado
diz até quantos usuários simultâneos 95% das respostas ficam em até 3 segundos
(RNF08).

Para medir a versão publicada, use o token de uma conta de teste e o id de uma
criança dela:

```powershell
.venv\Scripts\python.exe teste_carga.py --url https://clubinhoabc.onrender.com/api --token TOKEN --crianca ID --usuarios 1,5,10
```

Na versão publicada vale o limite de 120 requisições por minuto por IP: como
todos os usuários simulados saem do mesmo computador, as requisições acima
disso voltam com 429.
