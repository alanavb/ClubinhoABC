"""Endereço inexistente ou método não permitido não podem virar erro 500."""

import unittest

from app import create_app


class RotasInexistentesTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({'TESTING': True, 'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:'})
        self.client = self.app.test_client()

    def test_get_rotaInexistente_deveRetornar404ComMensagemGenerica(self):
        resposta = self.client.get('/api/rota-que-nao-existe')

        self.assertEqual(404, resposta.status_code)
        self.assertEqual('Endereço não encontrado.', resposta.get_json()['erro'])

    def test_delete_emRotaQueNaoAceitaDelete_deveRetornar405ComMensagemGenerica(self):
        resposta = self.client.delete('/api/resultados')

        self.assertEqual(405, resposta.status_code)
        self.assertEqual('Método não permitido para este endereço.', resposta.get_json()['erro'])


if __name__ == '__main__':
    unittest.main()
