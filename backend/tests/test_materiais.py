import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Material, ReferenciaMaterial
from seed_materiais import popular_materiais


class MateriaisTest(unittest.TestCase):
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

    def test_seed_cria_materiais_apenas_uma_vez(self):
        self.assertEqual(9, popular_materiais())
        self.assertEqual(0, popular_materiais())
        self.assertEqual(9, Material.query.count())
        self.assertEqual(1, ReferenciaMaterial.query.count())

    def test_rota_devolve_destaque_catalogo_filtros_e_referencia(self):
        popular_materiais()

        resposta = self.client.get('/api/materiais', headers={'Authorization': 'Bearer token-de-teste'})

        self.assertEqual(200, resposta.status_code)
        dados = resposta.get_json()
        self.assertEqual('caderno-ba-be-bi', dados['kitDaSemana']['id'])
        self.assertEqual(22, dados['kitDaSemana']['paginas'])
        self.assertEqual(8, len(dados['materiais']))
        self.assertEqual(['Todas', 'Para Imprimir', 'Colorir', 'Recortar'], dados['categorias'])
        self.assertEqual('Via Carreira', dados['referencia']['veiculo'])


if __name__ == '__main__':
    unittest.main()
