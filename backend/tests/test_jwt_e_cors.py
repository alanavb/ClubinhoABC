"""Validação REAL do token do Supabase (PyJWKClient + jwt.decode) e configuração do CORS.

Os outros testes substituem a validação do token por um patch. Estes não: um servidor local
publica as chaves públicas (como o Supabase faz) e os tokens são assinados de verdade.
Servem de proteção ao atualizar o PyJWT ou o Flask-Cors, bibliotecas com avisos de segurança.
"""

import base64   
import hashlib
import hmac
import http.server
import json
import threading
import time
import unittest

import jwt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import ec

from app import create_app, db
from app.auth_utils import TokenInvalidoError, _cliente_jwks, _decodificar_token

ORIGEM_PERMITIDA = 'http://localhost:5173'
ORIGEM_ESTRANHA = 'http://site-maliciosoo.example'

def _b64(dados):
    return base64.urlsafe_b64encode(dados).rstrip(b'=').decode()

def _jwk_publica(chave, kid):
    numeros = chave.public_key().public_numbers()
    return {'kty': 'EC', 'crv': 'P-256', 'alg': 'ES256', 'use': 'sig', 'kid': kid,
            'x': _b64(numeros.x.to_bytes(32, 'big')), 'y': _b64(numeros.y.to_bytes(32, 'big'))
    }

class ValidacaoRealDoJwtTest(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.chave = ec.generate_private_key(ec.SECP256R1())
        cls.outra_chave = ec.generate_private_key(ec.SECP256R1())
        corpo = json.dumps({'keys': [_jwk_publica(cls.chave, 'chave-1')]}).encode()
        cls.pedidos_ao_servidor_de_chaves = []
        pedidos = cls.pedidos_ao_servidor_de_chaves

        class ServidorDeChaves(http.server.BaseHTTPRequestHandler):
            def do_GET(self):
                pedidos.append(self.path)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(corpo)

            def log_message(self, *args):
                pass

        cls.servidor = http.server.HTTPServer(('127.0.0.1', 0), ServidorDeChaves)
        threading.Thread(target=cls.servidor.serve_forever, daemon=True).start()
        cls.url_das_chaves = f'http://127.0.0.1:{cls.servidor.server_port}/jwks.json'

    @classmethod
    def tearDownClass(cls):
        cls.servidor.shutdown()
        cls.servidor.server_close()

    def setUp(self):
        self.pedidos_ao_servidor_de_chaves.clear()
        _cliente_jwks.cache_clear()  #o cliente de chaves é guardado em cache entre os testes
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': self.url_das_chaves,
            'LIMITE_FALHAS_AUTENTICACAO': 10_000,
            'LIMITE_REQUISICOES_POR_MINUTO': 10_000,
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

    def tearDown(self):
        _cliente_jwks.cache_clear()
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _token(self, chave=None, kid='chave-1', audiencia='authenticated', expira_em=600):
        claims = {'sub': 'usuario-1', 'email': 'ana@teste.local', 'aud': audiencia, 'exp': int(time.time()) + expira_em}
        return jwt.encode(claims, chave or self.chave, algorithm='ES256', headers={'kid': kid})

    def _recusado(self, token):
        with self.assertRaises(TokenInvalidoError):
            _decodificar_token(token)

    #o que deve ser aceito
    def test_token_valido_deveSerAceito(self):
        claims = _decodificar_token(self._token())

        self.assertEqual('usuario-1', claims['sub'])
        self.assertEqual('ana@teste.local', claims['email'])

    #o que deve ser recusado
    def test_token_comAudienciaErrada_deveSerRecusado(self):
        self._recusado(self._token(audiencia='outro-publico'))

    def test_token_expirado_deveSerRecusado(self):
        self._recusado(self._token(expira_em=-60))

    def test_token_assinadoPorOutraChave_deveSerRecusado(self):
        self._recusado(self._token(chave=self.outra_chave))

    def test_token_comKidDesconhecido_deveSerRecusado(self):
        self._recusado(self._token(kid='chave-que-nao-existe'))

    def test_token_hs256ForjadoComAChavePublica_deveSerRecusado(self):
        """Ataque clássico: usar a chave pública como segredo HMAC para forjar um token."""
        publica = self.chave.public_key().public_bytes(
            serialization.Encoding.PEM, serialization.PublicFormat.SubjectPublicKeyInfo)
        cabecalho = _b64(json.dumps({'alg': 'HS256', 'typ': 'JWT', 'kid': 'chave-1'}).encode())
        corpo = _b64(json.dumps({'sub': 'invasor', 'aud': 'authenticated', 'exp': int(time.time()) + 600}).encode())
        assinatura = _b64(hmac.new(publica, f'{cabecalho}.{corpo}'.encode(), hashlib.sha256).digest())

        self._recusado(f'{cabecalho}.{corpo}.{assinatura}')

    def test_token_semAssinatura_algNone_deveSerRecusado(self):
        cabecalho = _b64(json.dumps({'alg': 'none', 'typ': 'JWT', 'kid': 'chave-1'}).encode())
        corpo = _b64(json.dumps({'sub': 'invasor', 'aud': 'authenticated', 'exp': int(time.time()) + 600}).encode())

        self._recusado(f'{cabecalho}.{corpo}.')

    def test_texto_qualquer_deveSerRecusado(self):
        self._recusado('isto-nao-e-um-token')

    #proteção contra excesso de pedidos
    def test_tokensComKidDesconhecido_naoDevemGerarUmPedidoAoServidorDeChavesCadaUm(self):
        """Aviso de segurança do PyJWT < 2.13: cada token com kid novo forçava uma nova busca das chaves."""
        _decodificar_token(self._token())  # primeira validação: busca e guarda as chaves

        for numero in range(10):
            self._recusado(self._token(kid=f'kid-inventado-{numero}'))

        self.assertLessEqual(len(self.pedidos_ao_servidor_de_chaves), 2)

    #pela rota, como o front chama
    def test_rota_protegida_comTokenValido_naoDeveRetornar401(self):
        resposta = self.app.test_client().get('/api/auth/me', headers={'Authorization': f'Bearer {self._token()}'})

        self.assertNotEqual(401, resposta.status_code)

    def test_rota_protegida_comTokenInvalido_deveRetornar401(self):
        resposta = self.app.test_client().get(
            '/api/auth/me', headers={'Authorization': f'Bearer {self._token(chave=self.outra_chave)}'})

        self.assertEqual(401, resposta.status_code)


class ConfiguracaoDoCorsTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
            'CORS_ALLOWED_ORIGINS': [ORIGEM_PERMITIDA],
        })
        self.client = self.app.test_client()

    def _preflight(self, origem, **extras):
        cabecalhos = {'Origin': origem, 'Access-Control-Request-Method': 'GET',
                      'Access-Control-Request-Headers': 'authorization,content-type', **extras}
        return self.client.options('/api/auth/me', headers=cabecalhos)

    def test_preflight_deOrigemPermitida_deveLiberarAOrigemEOCabecalhoAuthorization(self):
        resposta = self._preflight(ORIGEM_PERMITIDA)

        self.assertEqual(200, resposta.status_code)
        self.assertEqual(ORIGEM_PERMITIDA, resposta.headers.get('Access-Control-Allow-Origin'))
        self.assertIn('authorization', resposta.headers.get('Access-Control-Allow-Headers', '').lower())

    def test_preflight_deOrigemNaoPermitida_naoDeveReceberAllowOrigin(self):
        resposta = self._preflight(ORIGEM_ESTRANHA)

        self.assertIsNone(resposta.headers.get('Access-Control-Allow-Origin'))

    def test_deveNegarAcessoDeRedePrivada(self):
        """Aviso de segurança do Flask-Cors 4.0.1: Allow-Private-Network saía como 'true' por padrão."""
        resposta = self._preflight(ORIGEM_PERMITIDA, **{'Access-Control-Request-Private-Network': 'true'})

        self.assertNotEqual('true', resposta.headers.get('Access-Control-Allow-Private-Network'))

    def test_respostaDeErro_deOrigemPermitida_deveCarregarAllowOrigin(self):
        """Sem isso o navegador esconderia o 401 do front e mostraria um erro de CORS genérico."""
        resposta = self.client.get('/api/auth/me', headers={'Origin': ORIGEM_PERMITIDA})

        self.assertEqual(401, resposta.status_code)
        self.assertEqual(ORIGEM_PERMITIDA, resposta.headers.get('Access-Control-Allow-Origin'))


if __name__ == '__main__':
    unittest.main()
