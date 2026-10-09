import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.controllers import resultados_controller
from app.controllers.etapas_controller import AcessoNegadoError


class RegistrarResultadoTest(unittest.TestCase):
    """Testes unitários da regra RN2 (registro do resultado da atividade).

    Banco e log de auditoria são substituídos por mocks: nenhum teste aqui
    abre conexão nem sobe o Flask.
    """

    def setUp(self):
        self.crianca_model = self._substituir('Crianca')
        self.atividade_model = self._substituir('Atividade')
        self.resultado_model = self._substituir('Resultado')
        self.db_mock = self._substituir('db')
        self.log_mock = self._substituir('registrar_log')

        # Cenário base: criança de um responsável, na etapa 5, com atividade da etapa 5.
        self.crianca = SimpleNamespace(id=1, responsavel_id=10, etapa_atual_id=5)
        self.atividade = SimpleNamespace(id=2, etapa_id=5, chave='ouvir')
        self.crianca_model.query.get.return_value = self.crianca
        self.atividade_model.query.get.return_value = self.atividade

    def _substituir(self, nome):
        patcher = patch.object(resultados_controller, nome)
        self.addCleanup(patcher.stop)
        return patcher.start()

    def _assert_nada_foi_gravado(self):
        self.resultado_model.assert_not_called()
        self.db_mock.session.add.assert_not_called()
        self.db_mock.session.commit.assert_not_called()
        self.log_mock.assert_not_called()

    # TESTE 1 - caminho feliz
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
        self.assertEqual('atividade_realizada', self.log_mock.call_args.kwargs['acao'])

    # TESTE 2 - violação: criança inexistente
    def test_deve_lancar_erro_quando_crianca_nao_existe(self):
        self.crianca_model.query.get.return_value = None

        with self.assertRaisesRegex(ValueError, 'Criança não encontrada'):
            resultados_controller.registrar_resultado(99, 2, 'A', 'A', responsavel_id=10)

        self.atividade_model.query.get.assert_not_called()
        self._assert_nada_foi_gravado()

    # TESTE 3 - violação: atividade de outra etapa (RN1)
    def test_deve_negar_acesso_quando_atividade_nao_pertence_a_etapa_atual(self):
        self.atividade.etapa_id = 9

        with self.assertRaisesRegex(AcessoNegadoError, 'etapa atual da criança'):
            resultados_controller.registrar_resultado(1, 2, 'A', 'A', responsavel_id=10)

        self._assert_nada_foi_gravado()

    # TESTE 4 - parametrizado (subTest) e casos-limite: iguais, diferentes, maiúscula, vazias
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
