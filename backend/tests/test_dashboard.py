"""RF06 — GET /api/criancas/<id>/dashboard: indicadores de desempenho para o responsável."""

import datetime
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Responsavel, Resultado

TOKEN = {'Authorization': 'Bearer token-de-teste'}


class DashboardTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        etapa1 = Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1)
        etapa2 = Etapa(chave='monte-a-palavra', nome='Monte a Palavra', ordem=2)
        familia_a = Responsavel(supabase_user_id='familia-a', nome='Ana', email='ana@teste.local')
        familia_b = Responsavel(supabase_user_id='familia-b', nome='Bruno', email='bruno@teste.local')
        db.session.add_all([etapa1, etapa2, familia_a, familia_b])
        db.session.flush()

        self.ouvir = Atividade(etapa_id=etapa1.id, chave='ouvir', nome='Qual é a letra?', ordem=1)
        self.memoria = Atividade(etapa_id=etapa1.id, chave='memoria', nome='Jogo da memória', ordem=2)
        self.formar = Atividade(etapa_id=etapa2.id, chave='formar-palavra', nome='Forme a palavra', ordem=1)
        self.bia = Crianca(responsavel_id=familia_a.id, nome='Bia', data_nascimento=datetime.date(2019, 5, 10),
                           etapa_atual_id=etapa2.id)
        db.session.add_all([self.ouvir, self.memoria, self.formar, self.bia])
        db.session.commit()

        self.client = self.app.test_client()
        self.patcher = patch('app.auth_utils._decodificar_token',
                             return_value={'sub': 'familia-a', 'email': 'ana@teste.local'})
        self.patcher.start()
        self.addCleanup(self.patcher.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _resultado(self, atividade, correta, quando=None):
        db.session.add(Resultado(crianca_id=self.bia.id, atividade_id=atividade.id, resposta='x',
                                 correta=correta, criado_em=quando or datetime.datetime.utcnow()))
        db.session.commit()

    def _dashboard(self):
        resposta = self.client.get(f'/api/criancas/{self.bia.id}/dashboard', headers=TOKEN)
        self.assertEqual(200, resposta.status_code)
        return resposta.get_json()

    def test_get_dashboard_semTentativas_deveRetornarIndicadoresZerados(self):
        corpo = self._dashboard()

        self.assertEqual({'tentativas': 0, 'acertos': 0, 'erros': 0, 'taxa_acerto': 0}, corpo['totais'])
        self.assertEqual([], corpo['dificuldades'])
        self.assertEqual([], corpo['recomendacoes'])
        self.assertEqual(7, len(corpo['evolucao']))

    def test_get_dashboard_comTentativas_deveCalcularTotaisETaxaDeAcerto(self):
        self._resultado(self.ouvir, True)
        self._resultado(self.ouvir, False)
        self._resultado(self.memoria, True)
        self._resultado(self.formar, False)

        corpo = self._dashboard()

        self.assertEqual({'tentativas': 4, 'acertos': 2, 'erros': 2, 'taxa_acerto': 50}, corpo['totais'])
        etapas = {etapa['nome']: etapa for etapa in corpo['por_etapa']}
        self.assertEqual(3, etapas['Caça às Letras']['tentativas'])
        self.assertEqual(67, etapas['Caça às Letras']['taxa_acerto'])
        self.assertEqual(0, etapas['Monte a Palavra']['taxa_acerto'])

    def test_get_dashboard_deveListarDificuldadesDaMenorParaAMaiorTaxaDeAcerto(self):
        self._resultado(self.ouvir, True)
        self._resultado(self.ouvir, False)  # 50% de acerto
        self._resultado(self.formar, False)
        self._resultado(self.formar, False)  # 0% de acerto
        self._resultado(self.memoria, True)  # sem erro: não é dificuldade

        corpo = self._dashboard()

        self.assertEqual(['Forme a palavra', 'Qual é a letra?'], [item['nome'] for item in corpo['dificuldades']])
        self.assertEqual(2, corpo['dificuldades'][0]['erros'])

    def test_get_dashboard_deveRecomendarAHabilidadeDaAtividadeComMaisDificuldade(self):
        self._resultado(self.formar, False)

        corpo = self._dashboard()

        recomendacao = corpo['recomendacoes'][0]
        self.assertEqual('Forme a palavra', recomendacao['atividade'])
        self.assertIn('juntar sílabas para formar palavras', recomendacao['texto'])

    def test_get_dashboard_deveSepararAsTentativasPorDia(self):
        agora = datetime.datetime.utcnow()
        self._resultado(self.ouvir, True, quando=agora)
        self._resultado(self.ouvir, False, quando=agora - datetime.timedelta(days=2))
        self._resultado(self.ouvir, False, quando=agora - datetime.timedelta(days=30))  # fora dos 7 dias

        corpo = self._dashboard()

        self.assertEqual(7, len(corpo['evolucao']))
        self.assertEqual(2, sum(dia['tentativas'] for dia in corpo['evolucao']))
        self.assertEqual(1, corpo['evolucao'][-1]['acertos'])  # o último dia é hoje

    def test_get_dashboard_deOutraFamilia_deveRetornar403(self):
        self.patcher.stop()
        with patch('app.auth_utils._decodificar_token',
                   return_value={'sub': 'familia-b', 'email': 'bruno@teste.local'}):
            resposta = self.client.get(f'/api/criancas/{self.bia.id}/dashboard', headers=TOKEN)
        self.patcher.start()

        self.assertEqual(403, resposta.status_code)
        self.assertNotIn('totais', resposta.get_json())

    def test_get_dashboard_semToken_deveRetornar401(self):
        resposta = self.client.get(f'/api/criancas/{self.bia.id}/dashboard')

        self.assertEqual(401, resposta.status_code)


if __name__ == '__main__':
    unittest.main()
