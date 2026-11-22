import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Historia
from seed_historias import popular_historias


class HistoriasTest(unittest.TestCase):
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        self.client = self.app.test_client()
        token = patch('app.auth_utils._decodificar_token', return_value={'sub': 'user-test'})
        token.start()
        self.addCleanup(token.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def test_seed_cria_historias_apenas_uma_vez(self):
        self.assertEqual(10, popular_historias())
        self.assertEqual(0, popular_historias())
        self.assertEqual(10, Historia.query.count())

    def test_rota_lista_apenas_historias_publicadas_em_ordem(self):
        popular_historias()
        Historia.query.filter_by(chave='gato-guto').first().publicada = False
        db.session.commit()

        resposta = self.client.get('/api/historias', headers={'Authorization': 'Bearer token-de-teste'})

        self.assertEqual(200, resposta.status_code)
        historias = resposta.get_json()
        self.assertEqual(9, len(historias))
        self.assertEqual('baleia-bela', historias[0]['id'])
        self.assertNotIn('gato-guto', [historia['id'] for historia in historias])
        self.assertIn('metodologia', historias[0])


if __name__ == '__main__':
    unittest.main()
