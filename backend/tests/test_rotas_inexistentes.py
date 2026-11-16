# Respostas para rotas inexistentes e métodos não permitidos

import unittest

from app import create_app


# Testes de erros HTTP de roteamento
class RotasInexistentesTest(unittest.TestCase):

    # Preparação do cliente HTTP
    def setUp(self):
        self.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
        self.client = self.app.test_client()

    # Retorno para endereço inexistente
    def test_get_rotaInexistente_deveRetornar404ComMensagemGenerica(self):
        resposta = self.client.get('/api/rota-que-nao-existe')

        self.assertEqual(404, resposta.status_code)
        self.assertEqual('Endereço não encontrado.', resposta.get_json()['erro'])

    # Retorno para método não permitido
    def test_delete_emRotaQueNaoAceitaDelete_deveRetornar405ComMensagemGenerica(self):
        resposta = self.client.delete('/api/resultados')

        self.assertEqual(405, resposta.status_code)
        self.assertEqual('Método não permitido para este endereço.', resposta.get_json()['erro'])


if __name__ == '__main__':
    unittest.main()
