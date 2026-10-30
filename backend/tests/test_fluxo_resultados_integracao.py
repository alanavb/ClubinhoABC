import datetime
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Responsavel


class FluxoResultadosIntegracaoTest(unittest.TestCase):
    #Fazeno o teste de integração do fluxo completo
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
        db.session.add(etapa)
        db.session.flush()
        self.responsavel = Responsavel(
            supabase_user_id='user-test', nome='Ana', email='ana@gmail.com'
        )
        db.session.add(self.responsavel)
        db.session.flush()
        self.crianca = Crianca(
            responsavel_id=self.responsavel.id,
            nome='Bia',
            data_nascimento=datetime.date(2019, 5, 10),
            etapa_atual_id=etapa.id,
        )
        self.atividade = Atividade(
            etapa_id=etapa.id,
            chave='ouvir',
            nome='Ouça e escolha',
            ordem=1,
            obrigatoria=True,
        )
        db.session.add_all([self.crianca, self.atividade])
        db.session.commit()
        self.client = self.app.test_client()
        self.claims = {'sub': 'user-test', 'email': 'ana@gmail.com'}

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    def test_deve_criar_resultado_e_lista_lo_no_fluxo_completo(self):
        dados = {
            'crianca_id': self.crianca.id,
            'atividade_id': self.atividade.id,
            'resposta_enviada': 'A',
            'resposta_esperada': 'A',
        }

        with patch('app.auth_utils._decodificar_token', return_value=self.claims):
            criada = self.client.post(
                '/api/resultados',
                json=dados,
                headers={'Authorization': 'Bearer token-de-teste'},
            )
            listagem = self.client.get(
                f'/api/resultados?crianca_id={self.crianca.id}',
                headers={'Authorization': 'Bearer token-de-teste'},
            )

        self.assertEqual(201, criada.status_code)
        self.assertEqual(200, listagem.status_code)
        self.assertEqual(1, len(listagem.get_json()))
        self.assertEqual('A', listagem.get_json()[0]['answer'])
        self.assertTrue(listagem.get_json()[0]['correct'])

    def test_deve_avancar_automaticamente_apos_acertar_todas_as_obrigatorias(self):
        etapa_atual = db.session.get(Etapa, self.crianca.etapa_atual_id)
        proxima_etapa = Etapa(chave='monte-palavra', nome='Monte a Palavra', ordem=2)
        segunda_obrigatoria = Atividade(
            etapa_id=etapa_atual.id,
            chave='identificar-letra',
            nome='Identifique a letra',
            ordem=2,
            obrigatoria=True,
        )
        db.session.add_all([proxima_etapa, segunda_obrigatoria])
        db.session.commit()

        with patch('app.auth_utils._decodificar_token', return_value=self.claims):
            primeira_resposta = self.client.post(
                '/api/resultados',
                json={
                    'crianca_id': self.crianca.id,
                    'atividade_id': self.atividade.id,
                    'resposta_enviada': 'A',
                    'resposta_esperada': 'A',
                },
                headers={'Authorization': 'Bearer token-de-teste'},
            )
            segunda_resposta = self.client.post(
                '/api/resultados',
                json={
                    'crianca_id': self.crianca.id,
                    'atividade_id': segunda_obrigatoria.id,
                    'resposta_enviada': 'B',
                    'resposta_esperada': 'B',
                },
                headers={'Authorization': 'Bearer token-de-teste'},
            )

        db.session.refresh(self.crianca)
        self.assertEqual(201, primeira_resposta.status_code)
        self.assertEqual(201, segunda_resposta.status_code)
        self.assertEqual(proxima_etapa.id, self.crianca.etapa_atual_id)
