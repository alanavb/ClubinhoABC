"""Proteção de acesso pela URL: uma família não pode ver nem alterar os dados de outra
trocando o id da criança no endereço, e nada é feito sem o token de login.

Cada teste usa duas contas: a família A (dona da criança) e a família B (que tenta o acesso).
O único componente substituído é a validação do token do Supabase (serviço externo).
"""

import datetime
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Resultado, Responsavel

TOKEN = {'Authorization': 'Bearer token-de-teste'}


class AcessoEntreContasTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        etapa = Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1)
        familia_a = Responsavel(supabase_user_id='familia-a', nome='Ana', email='ana@teste.local')
        familia_b = Responsavel(supabase_user_id='familia-b', nome='Bruno', email='bruno@teste.local')
        db.session.add_all([etapa, familia_a, familia_b])
        db.session.flush()

        atividade = Atividade(etapa_id=etapa.id, chave='ouvir', nome='Qual é a letra?', ordem=1, obrigatoria=True)
        crianca_a = Crianca(responsavel_id=familia_a.id, nome='Bia', data_nascimento=datetime.date(2019, 5, 10),
                            etapa_atual_id=etapa.id)
        crianca_b = Crianca(responsavel_id=familia_b.id, nome='Leo', data_nascimento=datetime.date(2019, 8, 20),
                            etapa_atual_id=etapa.id)
        db.session.add_all([atividade, crianca_a, crianca_b])
        db.session.flush()
        db.session.add_all([
            Resultado(crianca_id=crianca_a.id, atividade_id=atividade.id, resposta='A', correta=True),
            Resultado(crianca_id=crianca_b.id, atividade_id=atividade.id, resposta='B', correta=False),
        ])
        db.session.commit()

        self.etapa_id = etapa.id
        self.atividade_id = atividade.id
        self.crianca_a_id = crianca_a.id
        self.crianca_b_id = crianca_b.id
        self.client = self.app.test_client()

        # Todas as requisições com token são feitas pela família B.
        patcher = patch('app.auth_utils._decodificar_token',
                        return_value={'sub': 'familia-b', 'email': 'bruno@teste.local'})
        patcher.start()
        self.addCleanup(patcher.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _crianca_a(self):
        db.session.expire_all()
        return db.session.get(Crianca, self.crianca_a_id)

    # ---------------------------------------------------------------- dados da criança
    def test_get_crianca_deOutraFamilia_deveRetornar404(self):
        resposta = self.client.get(f'/api/criancas/{self.crianca_a_id}', headers=TOKEN)

        self.assertEqual(404, resposta.status_code)
        self.assertNotIn('Bia', resposta.get_data(as_text=True))

    def test_put_crianca_deOutraFamilia_deveRetornar404EManterDados(self):
        resposta = self.client.put(
            f'/api/criancas/{self.crianca_a_id}',
            json={'nome': 'Nome trocado', 'data_nascimento': '2019-05-10'},
            headers=TOKEN,
        )

        self.assertEqual(404, resposta.status_code)
        self.assertEqual('Bia', self._crianca_a().nome)

    def test_delete_crianca_deOutraFamilia_deveRetornar404EManterCrianca(self):
        resposta = self.client.delete(
            f'/api/criancas/{self.crianca_a_id}', json={'confirmacao': 'EXCLUIR Bia'}, headers=TOKEN
        )

        self.assertEqual(404, resposta.status_code)
        self.assertIsNotNone(self._crianca_a())

    def test_delete_crianca_semToken_deveRetornar401EManterCrianca(self):
        resposta = self.client.delete(f'/api/criancas/{self.crianca_a_id}', json={'confirmacao': 'EXCLUIR Bia'})

        self.assertEqual(401, resposta.status_code)
        self.assertIsNotNone(self._crianca_a())

    # ---------------------------------------------------------------- trilha e progresso
    def test_get_progresso_deOutraFamilia_deveRetornar403(self):
        resposta = self.client.get(f'/api/criancas/{self.crianca_a_id}/progresso', headers=TOKEN)

        self.assertEqual(403, resposta.status_code)
        self.assertNotIn('estrelas', resposta.get_json())

    def test_get_atividades_deOutraFamilia_deveRetornar403(self):
        resposta = self.client.get(f'/api/criancas/{self.crianca_a_id}/atividades', headers=TOKEN)

        self.assertEqual(403, resposta.status_code)

    def test_get_statusDaEtapa_deOutraFamilia_deveRetornar403(self):
        resposta = self.client.get(
            f'/api/criancas/{self.crianca_a_id}/etapas/{self.etapa_id}/status', headers=TOKEN
        )

        self.assertEqual(403, resposta.status_code)

    def test_post_concluirEtapa_deOutraFamilia_deveRetornar403EManterEtapa(self):
        resposta = self.client.post(
            f'/api/criancas/{self.crianca_a_id}/etapas/{self.etapa_id}/concluir', headers=TOKEN
        )

        self.assertEqual(403, resposta.status_code)
        self.assertEqual(self.etapa_id, self._crianca_a().etapa_atual_id)

    # ---------------------------------------------------------------- resultados e logs
    def test_post_resultados_paraCriancaDeOutraFamilia_deveRetornar403ENaoGravar(self):
        resposta = self.client.post('/api/resultados', headers=TOKEN, json={
            'crianca_id': self.crianca_a_id,
            'atividade_id': self.atividade_id,
            'resposta_enviada': 'A',
            'resposta_esperada': 'A',
        })

        self.assertEqual(403, resposta.status_code)
        self.assertEqual(1, Resultado.query.filter_by(crianca_id=self.crianca_a_id).count())

    def test_get_resultados_comIdDeOutraFamilia_deveRetornar403(self):
        resposta = self.client.get(f'/api/resultados?crianca_id={self.crianca_a_id}', headers=TOKEN)

        self.assertEqual(403, resposta.status_code)

    def test_get_resultados_semFiltro_deveRetornarSomenteOsDaPropriaFamilia(self):
        resposta = self.client.get('/api/resultados', headers=TOKEN)

        self.assertEqual(200, resposta.status_code)
        self.assertEqual([self.crianca_b_id], [item['child_id'] for item in resposta.get_json()])

    def test_get_logs_comIdDeOutraFamilia_deveRetornar403(self):
        resposta = self.client.get(f'/api/logs?crianca_id={self.crianca_a_id}', headers=TOKEN)

        self.assertEqual(403, resposta.status_code)


if __name__ == '__main__':
    unittest.main()
