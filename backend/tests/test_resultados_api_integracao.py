import datetime
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Responsavel


# Testes de integração do registro de resultados
class ResultadosApiIntegracaoTest(unittest.TestCase):
    # Integra rota, controller e banco SQLite em memória.
    # Apenas a validação externa do token do Supabase é simulada.

    # Preparação do banco, da criança e da atividade
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        etapa = Etapa(chave='caca-letras', nome='Caça às Letras', ordem=1)
        responsavel = Responsavel(supabase_user_id='user-test', nome='Ana', email='ana@gmail.com')
        db.session.add_all([etapa, responsavel])
        db.session.flush()
        self.crianca = Crianca(responsavel_id=responsavel.id, nome='Bia', data_nascimento=datetime.date(2019, 5, 10), etapa_atual_id=etapa.id)
        self.atividade = Atividade(etapa_id=etapa.id, chave='ouvir', nome='Ouça e escolha', ordem=1)
        db.session.add_all([self.crianca, self.atividade])
        db.session.commit()
        self.client = self.app.test_client()

    # Remoção do banco temporário
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    # Registro válido retorna o resultado criado
    def test_deve_retornar_201_e_corpo_do_resultado_ao_registrar_resultado_valido(self):
        # Dados enviados pela atividade
        dados = {
            'crianca_id': self.crianca.id,
            'atividade_id': self.atividade.id,
            'resposta_enviada': 'A',
            'resposta_esperada': 'A',
        }

        # Envio autenticado do resultado
        with patch('app.auth_utils._decodificar_token', return_value={'sub': 'user-test', 'email': 'ana@gmail.com'}):
            resposta = self.client.post(
                '/api/resultados', json=dados, headers={'Authorization': 'Bearer token-de-teste'}
            )

        # Conferência do resultado retornado
        self.assertEqual(201, resposta.status_code)
        self.assertEqual(
            {'child_id': self.crianca.id, 'activity_id': self.atividade.id, 'answer': 'A', 'correct': True},
            resposta.get_json(),
        )
