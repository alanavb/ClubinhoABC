import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.controllers import resultados_controller
from app.controllers.etapas_controller import AcessoNegadoError


# RN2: testes do registro de resultado
class RegistrarResultadoTest(unittest.TestCase):

    # Preparação dos modelos e serviços substituídos
    def setUp(self):
        self.crianca_model = self._substituir('Crianca')
        self.atividade_model = self._substituir('Atividade')
        self.resultado_model = self._substituir('Resultado')
        self.db_mock = self._substituir('db')
        self.log_mock = self._substituir('registrar_log')
        self.avanco_mock = self._substituir('avancar_etapa_se_concluida')

        # Criança e atividade da etapa atual
        self.crianca = SimpleNamespace(id=1, responsavel_id=10, etapa_atual_id=5, etapa_atual=SimpleNamespace(ordem=5))
        self.atividade = SimpleNamespace(id=2, etapa_id=5, chave='ouvir', etapa=SimpleNamespace(ordem=5))
        self.crianca_model.query.get.return_value = self.crianca
        self.atividade_model.query.get.return_value = self.atividade

    # Substituição de dependência por mock
    def _substituir(self, nome):
        patcher = patch.object(resultados_controller, nome)
        self.addCleanup(patcher.stop)
        return patcher.start()

    # Conferência de ausência de gravação
    def _assert_nada_foi_gravado(self):
        self.resultado_model.assert_not_called()
        self.db_mock.session.add.assert_not_called()
        self.db_mock.session.commit.assert_not_called()
        self.log_mock.assert_not_called()

    # Registro de resposta correta
    def test_deve_registrar_resultado_correto_quando_resposta_confere(self):
        resultado = MagicMock()
        self.resultado_model.return_value = resultado

        retorno = resultados_controller.registrar_resultado(1, 2, 'A', 'A', responsavel_id=10)

        self.assertIs(retorno, resultado)
        self.resultado_model.assert_called_once_with(
            crianca_id=1, atividade_id=2, resposta='A', correta=True
        )
        self.db_mock.session.add.assert_called_once_with(resultado)
        self.db_mock.session.commit.assert_called_once()
        self.avanco_mock.assert_called_once_with(1, 5, responsavel_id=10, confirmar=False)
        self.assertEqual('atividade_realizada', self.log_mock.call_args.kwargs['acao'])

    # Erro para criança inexistente
    def test_deve_lancar_erro_quando_crianca_nao_existe(self):
        self.crianca_model.query.get.return_value = None

        with self.assertRaisesRegex(ValueError, 'Criança não encontrada'):
            resultados_controller.registrar_resultado(99, 2, 'A', 'A', responsavel_id=10)

        self.atividade_model.query.get.assert_not_called()
        self._assert_nada_foi_gravado()

    # RN1: bloqueio de atividade futura
    def test_deve_negar_acesso_quando_atividade_e_de_etapa_futura(self):
        self.atividade.etapa_id = 9
        self.atividade.etapa = SimpleNamespace(ordem=9)

        with self.assertRaisesRegex(AcessoNegadoError, 'ainda não foi liberada'):
            resultados_controller.registrar_resultado(1, 2, 'A', 'A', responsavel_id=10)

        self._assert_nada_foi_gravado()

    # Revisão não altera etapa já concluída
    def test_deve_registrar_revisao_de_etapa_concluida_sem_avancar_etapa(self):
        self.atividade.etapa_id = 3
        self.atividade.etapa = SimpleNamespace(ordem=3)

        resultados_controller.registrar_resultado(1, 2, 'A', 'A', responsavel_id=10)

        self.resultado_model.assert_called_once_with(crianca_id=1, atividade_id=2, resposta='A', correta=True)
        self.db_mock.session.commit.assert_called_once()
        self.avanco_mock.assert_not_called()

    # Comparação entre resposta enviada e esperada
    def test_deve_marcar_correta_conforme_comparacao_das_respostas(self):
        casos = [
            ('A', 'A', True),
            ('A', 'B', False),
            ('a', 'A', False),
            ('', '', True),
        ]

        for enviada, esperada, correta_esperada in casos:
            with self.subTest(enviada=enviada, esperada=esperada):
                resultados_controller.registrar_resultado(1, 2, enviada, esperada, responsavel_id=10)

                self.assertEqual(correta_esperada, self.resultado_model.call_args.kwargs['correta'])
                self.assertEqual(correta_esperada, self.avanco_mock.called)
                self.avanco_mock.reset_mock()
