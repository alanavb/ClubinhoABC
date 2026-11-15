"""Sessão única: quando a conta entra em outro computador, a sessão anterior deixa de valer.

O token do Supabase traz o id da sessão (session_id). O back-end guarda qual é a sessão
ativa do responsável e recusa tokens das sessões anteriores.
"""

import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Etapa, Responsavel

TOKEN = {'Authorization': 'Bearer token-de-teste'}


class SessaoUnicaTest(unittest.TestCase):

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

        self.sessao_do_token = 'computador-1'
        patcher = patch('app.auth_utils._decodificar_token', side_effect=lambda token: {
            'sub': 'familia-a', 'email': 'ana@teste.local', 'session_id': self.sessao_do_token,
        })
        patcher.start()
        self.addCleanup(patcher.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _entrar(self, sessao):
        self.sessao_do_token = sessao
        resposta = self.client.post('/api/auth/sessao', headers=TOKEN)
        self.assertEqual(204, resposta.status_code)

    def _conferir_sessao(self, sessao):
        self.sessao_do_token = sessao
        return self.client.get('/api/auth/sessao', headers=TOKEN)

    def test_post_sessao_deveGuardarASessaoAtivaDoResponsavel(self):
        self._entrar('computador-1')

        db.session.expire_all()
        self.assertEqual('computador-1', Responsavel.query.one().sessao_ativa_id)
        self.assertEqual(204, self._conferir_sessao('computador-1').status_code)

    def test_loginEmOutroComputador_deveDerrubarASessaoAnterior(self):
        self._entrar('computador-1')
        self._entrar('computador-2')

        antiga = self._conferir_sessao('computador-1')

        self.assertEqual(401, antiga.status_code)
        self.assertEqual('sessao_encerrada', antiga.get_json()['codigo'])
        self.assertEqual(204, self._conferir_sessao('computador-2').status_code)

    def test_sessaoAnterior_naoDeveAcessarNenhumaRotaProtegida(self):
        self._entrar('computador-1')
        self._entrar('computador-2')
        self.sessao_do_token = 'computador-1'

        resposta = self.client.get('/api/auth/me', headers=TOKEN)

        self.assertEqual(401, resposta.status_code)
        self.assertEqual('sessao_encerrada', resposta.get_json()['codigo'])

    def test_sessaoAnterior_naoDeveContarComoTentativaDeInvasao(self):
        # O computador antigo confere a sessão a cada 30 s; isso não pode bloquear o IP.
        self._entrar('computador-1')
        self._entrar('computador-2')
        for _ in range(10):
            self._conferir_sessao('computador-1')

        self.assertEqual(204, self._conferir_sessao('computador-2').status_code)

    def test_contaSemSessaoRegistrada_deveAceitarQualquerSessao(self):
        # Contas que ainda não fizeram login depois desta mudança continuam funcionando.
        self.assertEqual(204, self._conferir_sessao('qualquer').status_code)

    def test_post_sessao_antesDeConcluirOCadastro_deveRetornar204SemGravar(self):
        self.sessao_do_token = 'computador-1'
        with patch('app.auth_utils._decodificar_token', return_value={
            'sub': 'conta-nova', 'email': 'nova@teste.local', 'session_id': 'computador-1',
        }):
            resposta = self.client.post('/api/auth/sessao', headers=TOKEN)

        self.assertEqual(204, resposta.status_code)
        self.assertEqual(1, Responsavel.query.count())


if __name__ == '__main__':
    unittest.main()
