import datetime
import unittest
from unittest.mock import patch
from app import create_app, db
from app.auth_utils import TokenInvalidoError
from app.models import Atividade, Crianca, Etapa, Responsavel

class SegurancaEFluxoIntegracaoTest(unittest.TestCase):

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
        self.responsavel_dono = Responsavel(
            supabase_user_id='responsavel-dono', nome='Ana', email='ana@example.test'
        )
        self.responsavel_sem_permissao = Responsavel(
            supabase_user_id='responsavel-sem-permissao',
            nome='Bruno',
            email='bruno@example.test',
        )
        db.session.add_all([etapa, self.responsavel_dono, self.responsavel_sem_permissao])
        db.session.flush()

        self.crianca = Crianca(
            responsavel_id=self.responsavel_dono.id,
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
        self.dados_validos = {
            'crianca_id': self.crianca.id,
            'atividade_id': self.atividade.id,
            'resposta_enviada': 'A',
            'resposta_esperada': 'A',
        }

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _claims(self, responsavel):
        return {'sub': responsavel.supabase_user_id, 'email': responsavel.email}

    def test_post_resultados_semToken_deveRetornar401ComMensagem(self):
        # Act
        resposta = self.client.post('/api/resultados', json=self.dados_validos)

        # Assert
        self.assertEqual(401, resposta.status_code)
        self.assertIn('Token de autenticação ausente', resposta.get_json()['erro'])

    def test_post_resultados_comTokenInvalido_deveRetornar401SemDetalheTecnico(self):
        # Act
        with patch(
            'app.auth_utils._decodificar_token',
            side_effect=TokenInvalidoError('assinatura JWT incompatível com a chave 123'),
        ):
            resposta = self.client.post(
                '/api/resultados',
                json=self.dados_validos,
                headers={'Authorization': 'Bearer token-invalido'},
            )

        # Assert
        self.assertEqual(401, resposta.status_code)
        self.assertEqual('Não foi possível validar sua sessão. Entre novamente.', resposta.get_json()['erro'])
        self.assertNotIn('JWT', resposta.get_json()['erro'])

    def test_post_resultados_comFalhaInesperada_deveRetornar500SemDetalheTecnico(self):
        # Act
        with patch(
            'app.auth_utils._decodificar_token',
            return_value=self._claims(self.responsavel_dono),
        ), patch(
            'app.routes.resultados_routes.resultados_controller.registrar_resultado',
            side_effect=RuntimeError('falha interna: tabela privada não encontrada'),
        ):
            resposta = self.client.post(
                '/api/resultados',
                json=self.dados_validos,
                headers={'Authorization': 'Bearer token-de-teste'},
            )

        # Assert
        corpo = resposta.get_json()
        self.assertEqual(500, resposta.status_code)
        self.assertEqual('Não foi possível concluir esta ação agora. Tente novamente em instantes.', corpo['erro'])
        self.assertIn('codigo', corpo)
        self.assertNotIn('tabela privada', corpo['erro'])

    def test_post_resultados_comResponsavelDeOutraCrianca_deveRetornar403ComMensagem(self):
        # Act
        with patch(
            'app.auth_utils._decodificar_token',
            return_value=self._claims(self.responsavel_sem_permissao),
        ):
            resposta = self.client.post(
                '/api/resultados',
                json=self.dados_validos,
                headers={'Authorization': 'Bearer token-de-teste'},
            )

        # Assert
        self.assertEqual(403, resposta.status_code)
        self.assertEqual('Você não tem permissão para realizar esta ação.', resposta.get_json()['erro'])

    def test_post_resultados_comResponsavelDono_deveRetornar201ComCorpo(self):
        # Act
        with patch(
            'app.auth_utils._decodificar_token',
            return_value=self._claims(self.responsavel_dono),
        ):
            resposta = self.client.post(
                '/api/resultados',
                json=self.dados_validos,
                headers={'Authorization': 'Bearer token-de-teste'},
            )

        # Assert
        self.assertEqual(201, resposta.status_code)
        self.assertEqual(
            {
                'child_id': self.crianca.id,
                'activity_id': self.atividade.id,
                'answer': 'A',
                'correct': True,
            },
            resposta.get_json(),
        )

    def test_resultadoEProgresso_daMesmaCrianca_deveRefletirAtividadeConcluida(self):
        # Act
        with patch(
            'app.auth_utils._decodificar_token',
            return_value=self._claims(self.responsavel_dono),
        ):
            registro = self.client.post(
                '/api/resultados',
                json=self.dados_validos,
                headers={'Authorization': 'Bearer token-de-teste'},
            )
            progresso = self.client.get(
                f'/api/criancas/{self.crianca.id}/progresso',
                headers={'Authorization': 'Bearer token-de-teste'},
            )

        # Assert
        self.assertEqual(201, registro.status_code)
        self.assertEqual(200, progresso.status_code)
        corpo = progresso.get_json()
        self.assertEqual(self.crianca.id, corpo['child_id'])
        self.assertEqual(1, corpo['atividades_concluidas'])
        self.assertEqual(1, corpo['estrelas'])
        self.assertTrue(
            next(item for item in corpo['conquistas'] if item['id'] == 'primeira-atividade')['conquistada']
        )

if __name__ == '__main__':
    unittest.main()
