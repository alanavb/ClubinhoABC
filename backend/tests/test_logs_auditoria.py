# Consulta dos registros de auditoria da própria conta

import re
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Etapa, Responsavel

TOKEN = {'Authorization': 'Bearer token-de-teste'}


# Testes da rota de auditoria
class LogsAuditoriaTest(unittest.TestCase):

    # Preparação da conta e da autenticação
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        db.session.add_all([
            Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1),
            Responsavel(supabase_user_id='familia-a', nome='Ana', email='ana@teste.local'),
        ])
        db.session.commit()
        self.client = self.app.test_client()

        patcher = patch('app.auth_utils._decodificar_token',
                        return_value={'sub': 'familia-a', 'email': 'ana@teste.local'})
        patcher.start()
        self.addCleanup(patcher.stop)

    # Remoção do banco temporário
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    # Cadastro gera log com horário de Brasília
    def test_get_logs_aposCadastrarCrianca_deveRetornar200ComHorarioDeBrasilia(self):
        # Cadastro que gera o registro de auditoria
        criada = self.client.post('/api/criancas', headers=TOKEN,
                                  json={'nome': 'Bia', 'data_nascimento': '2019-05-10'})
        self.assertEqual(201, criada.status_code)

        # Consulta dos registros da conta
        resposta = self.client.get('/api/logs', headers=TOKEN)

        # Conferência do registro retornado
        self.assertEqual(200, resposta.status_code)
        registro = resposta.get_json()[0]
        self.assertEqual('cadastro_crianca', registro['acao'])
        self.assertEqual(criada.get_json()['crianca_id'], registro['crianca_id'])
        self.assertRegex(registro['criado_em_brasilia'], re.compile(r'^\d{2}/\d{2}/\d{4} \d{2}:\d{2}:\d{2}$'))


if __name__ == '__main__':
    unittest.main()
