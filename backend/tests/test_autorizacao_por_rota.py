"""Autorização por rota (OWASP: validar a permissão no servidor em TODA requisição).

Para cada rota que recebe o id de uma criança, três situações:
  1. o responsável DONO da criança consegue usar a rota;
  2. OUTRO responsável recebe 403 ou 404, e nada é lido nem alterado;
  3. quem NÃO está logado recebe 401.

Dois testes-guarda evitam que o esquecimento vire falha de segurança:
  - se alguém criar uma rota com id e não listá-la em ROTAS, o teste falha;
  - se alguma rota da API deixar de exigir login, o teste falha.

O bloqueio de IP por excesso de tentativas é testado em test_limite_tentativas.py;
aqui os limites são aumentados para não atrapalhar as muitas requisições sem token.
"""

import datetime
import re
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Resultado, Responsavel

DONO = {'Authorization': 'Bearer familia-a'}
OUTRO = {'Authorization': 'Bearer familia-b'}

#(método, caminho, corpo da requisição, status esperado para o dono)
#{crianca}, {etapa} e {atividade} são trocados pelos ids criados em cada teste.

ROTAS = [
    ('GET', '/api/criancas/{crianca}', None, 200),
    ('PUT', '/api/criancas/{crianca}', {'nome': 'Guilherme', 'data_nascimento': '2019-05-10'}, 200),
    ('DELETE', '/api/criancas/{crianca}', {'confirmacao': 'EXCLUIR Guilherme'}, 204),
    ('GET', '/api/criancas/{crianca}/atividades', None, 200),
    ('GET', '/api/criancas/{crianca}/dashboard', None, 200),
    ('GET', '/api/criancas/{crianca}/progresso', None, 200),
    ('GET', '/api/criancas/{crianca}/etapas/{etapa}/status', None, 200),
    ('POST', '/api/criancas/{crianca}/etapas/{etapa}/concluir', None, 200),
    #Rotas em que o id da criança vai na consulta (?crianca_id=) ou no corpo da requisição.
    ('GET', '/api/resultados?crianca_id={crianca}', None, 200),
    ('GET', '/api/logs?crianca_id={crianca}', None, 200),
    ('POST', '/api/resultados',
     {'crianca_id': '{crianca}', 'atividade_id': '{atividade}', 'resposta_enviada': 'A', 'resposta_esperada': 'A'}, 201),
]

#Rota com id que NÃO é dado de criança: o catálogo de atividades de uma etapa. Continua
#protegida por login (coberta pelo teste-guarda de token), mas não tem "dono".
ROTAS_SEM_DONO = {('GET', '/api/etapas/<string:chave_etapa>/atividades')}


class AutorizacaoPorRotaTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
            'LIMITE_FALHAS_AUTENTICACAO': 10_000,
            'LIMITE_REQUISICOES_POR_MINUTO': 10_000,
        })
        self.context = self.app.app_context()
        self.context.push()
        self.client = self.app.test_client()

        #O "token" é só o nome da família; o único componente substituído é a validação
        #do token do Supabase (serviço externo).
        patcher = patch('app.auth_utils._decodificar_token',
                        side_effect=lambda token: {'sub': token, 'email': f'{token}@teste.local'})
        patcher.start()
        self.addCleanup(patcher.stop)
        self._recriar_dados()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _recriar_dados(self):
        """Banco novo a cada rota testada, porque algumas rotas (DELETE, concluir) alteram os dados."""
        db.session.remove()
        db.drop_all()
        db.create_all()
        etapa = Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1)
        segunda = Etapa(chave='monte-a-palavra', nome='Monte a Palavra', ordem=2)
        familia_a = Responsavel(supabase_user_id='familia-a', nome='Joana', email='familia-a@teste.local')
        familia_b = Responsavel(supabase_user_id='familia-b', nome='Rodrigo', email='familia-b@teste.local')
        db.session.add_all([etapa, segunda, familia_a, familia_b])
        db.session.flush()
        atividade = Atividade(etapa_id=etapa.id, chave='ouvir', nome='Qual é a letra?', ordem=1, obrigatoria=True)
        guilherme = Crianca(responsavel_id=familia_a.id, nome='Guilherme', data_nascimento=datetime.date(2019, 5, 10),
                      etapa_atual_id=etapa.id)
        heloisa = Crianca(responsavel_id=familia_b.id, nome='Heloisa', data_nascimento=datetime.date(2019, 1, 29),
                      etapa_atual_id=etapa.id)
        db.session.add_all([atividade, guilherme, heloisa])
        db.session.flush()
        db.session.add_all([
            Resultado(crianca_id=guilherme.id, atividade_id=atividade.id, resposta='A', correta=True),
            Resultado(crianca_id=heloisa.id, atividade_id=atividade.id, resposta='B', correta=False),
        ])
        db.session.commit()
        self.ids = {'crianca': guilherme.id, 'etapa': etapa.id, 'atividade': atividade.id}

    #auxiliares
    def _preencher(self, valor):
        if isinstance(valor, str):
            texto = valor.format(**self.ids)
            return int(texto) if re.fullmatch(r'\d+', texto) and valor.startswith('{') else texto
        if isinstance(valor, dict):
            return {chave: self._preencher(item) for chave, item in valor.items()}
        return valor

    def _chamar(self, metodo, caminho, corpo, cabecalhos):
        return self.client.open(caminho.format(**self.ids), method=metodo,
                                json=self._preencher(corpo) if corpo is not None else None, headers=cabecalhos)

    def _estado_da_crianca_a(self):
        """Resumo do que uma requisição indevida poderia ter alterado."""
        db.session.expire_all()
        guilherme = db.session.get(Crianca, self.ids['crianca'])
        return {
            'existe': guilherme is not None,
            'nome': guilherme.nome if guilherme else None,
            'data_nascimento': guilherme
            .data_nascimento if guilherme else None,
            'etapa_atual_id': guilherme.etapa_atual_id if guilherme else None,
            'resultados': Resultado.query.filter_by(crianca_id=self.ids['crianca']).count(),
            'criancas': Crianca.query.count(),
        }

    #1. dono consegue
    def test_dono_consegue_usar_cada_rota(self):
        for metodo, caminho, corpo, status_esperado in ROTAS:
            with self.subTest(rota=f'{metodo} {caminho}'):
                self._recriar_dados()

                resposta = self._chamar(metodo, caminho, corpo, DONO)

                self.assertEqual(status_esperado, resposta.status_code, resposta.get_data(as_text=True))

    #2. outro responsável é barrado
    def test_outro_responsavel_recebe_403_ou_404_e_nada_muda(self):
        for metodo, caminho, corpo, _ in ROTAS:
            with self.subTest(rota=f'{metodo} {caminho}'):
                self._recriar_dados()
                antes = self._estado_da_crianca_a()

                resposta = self._chamar(metodo, caminho, corpo, OUTRO)

                self.assertIn(resposta.status_code, (403, 404), resposta.get_data(as_text=True))
                self.assertEqual(antes, self._estado_da_crianca_a(), 'a requisição indevida alterou dados')
                self.assertNotIn('Guilherme', resposta.get_data(as_text=True), 'a resposta vazou dados da criança')

    #3. sem login
    def test_sem_token_recebe_401_e_nada_muda(self):
        for metodo, caminho, corpo, _ in ROTAS:
            with self.subTest(rota=f'{metodo} {caminho}'):
                self._recriar_dados()
                antes = self._estado_da_crianca_a()

                resposta = self._chamar(metodo, caminho, corpo, {})

                self.assertEqual(401, resposta.status_code)
                self.assertEqual(antes, self._estado_da_crianca_a())

    #id inexistente
    def test_id_inexistente_nunca_gera_erro_500_nem_devolve_dados(self):
        for metodo, caminho, corpo, _ in ROTAS:
            with self.subTest(rota=f'{metodo} {caminho}'):
                self._recriar_dados()
                self.ids['crianca'] = 99999

                resposta = self._chamar(metodo, caminho, corpo, DONO)

                self.assertLess(resposta.status_code, 500)
                self.assertNotIn(resposta.status_code, (201, 204))
                if resposta.status_code == 200:
                    self.assertIn(resposta.get_json(), ([], {}), 'devolveu dados para uma criança que não existe')

    #testes-guarda
    def test_toda_rota_com_id_no_caminho_deve_estar_na_tabela_de_rotas(self):
        cobertas = {(metodo, re.sub(r'\{(\w+)\}', r'<int:\1_id>', caminho.split('?')[0])) for metodo, caminho, _, _ in ROTAS}
        sem_teste = []
        for regra in self.app.url_map.iter_rules():
            if not regra.rule.startswith('/api/') or '<' not in regra.rule:
                continue  # '/static/...' é do próprio Flask, não faz parte da API
            for metodo in regra.methods - {'HEAD', 'OPTIONS'}:
                if (metodo, regra.rule) not in cobertas and (metodo, regra.rule) not in ROTAS_SEM_DONO:
                    sem_teste.append(f'{metodo} {regra.rule}')

        self.assertEqual([], sorted(sem_teste), 'rota com id sem teste de autorização: acrescente em ROTAS')

    def test_toda_rota_da_api_deve_exigir_login(self):
        verificadas = 0
        for regra in self.app.url_map.iter_rules():
            if not regra.rule.startswith('/api/'):
                continue
            caminho = re.sub(r'<[^>]+>', '1', regra.rule)
            for metodo in regra.methods - {'HEAD', 'OPTIONS'}:
                with self.subTest(rota=f'{metodo} {regra.rule}'):
                    resposta = self.client.open(caminho, method=metodo)

                    self.assertEqual(401, resposta.status_code)
                    verificadas += 1

        self.assertGreaterEqual(verificadas, len(ROTAS), 'o teste-guarda não encontrou as rotas da API')


if __name__ == '__main__':
    unittest.main()