import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Resultado, Responsavel


class ResultadosErroApiIntegracaoTest(unittest.TestCase):
    """Integração rota + controller + banco (SQLite em memória): erro 4xx do POST /api/resultados.
    Só a validação do token do Supabase é substituída; o resto da cadeia é real."""

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
        self.crianca = Crianca(responsavel_id=responsavel.id, nome='Bia', idade=6, etapa_atual_id=etapa.id)
        self.atividade = Atividade(etapa_id=etapa.id, chave='ouvir', nome='Ouça e escolha', ordem=1)
        db.session.add_all([self.crianca, self.atividade])
        db.session.commit()
        self.client = self.app.test_client()

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def test_deve_retornar_400_e_mensagem_quando_faltam_campos_obrigatorios(self):
        #traz a criança e a atividade, mas não traz as respostas
        dados = {
            'crianca_id': self.crianca.id,
            'atividade_id': self.atividade.id,
        }

        # Act
        with patch('app.auth_utils._decodificar_token', return_value={'sub': 'user-test', 'email': 'ana@gmail.com'}):
            resposta = self.client.post(
                '/api/resultados', json=dados, headers={'Authorization': 'Bearer token-de-teste'}
            )

        #status, corpo de erro (só cita o que falta) e nada gravado no banco
        self.assertEqual(400, resposta.status_code)
        mensagem = resposta.get_json()['erro']
        self.assertIn('Campos obrigatórios ausentes', mensagem)
        self.assertIn('resposta_enviada', mensagem)
        self.assertIn('resposta_esperada', mensagem)
        self.assertNotIn('crianca_id', mensagem)
        self.assertNotIn('atividade_id', mensagem)
        self.assertEqual(0, Resultado.query.count())


if __name__ == '__main__':
    unittest.main()