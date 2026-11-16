import unittest
from types import SimpleNamespace
from unittest.mock import patch

from app.controllers import etapas_controller
from app.controllers.etapas_controller import AcessoNegadoError

# Testes das regras de acesso e conclusão de etapa
class EtapasControllerTest(unittest.TestCase):

    # Preparação dos modelos substituídos
    def setUp(self):
        self.crianca_model = self._substituir('Crianca')
        self.atividade_model = self._substituir('Atividade')
        self.resultado_model = self._substituir('Resultado')

        # Criança do responsável na etapa atual
        self.crianca = SimpleNamespace(id=1, responsavel_id=10, etapa_atual_id=5)
        self.crianca_model.query.get.return_value = self.crianca

    # Substituição de dependência por mock
    def _substituir(self, nome):
        patcher = patch.object(etapas_controller, nome)
        self.addCleanup(patcher.stop)
        return patcher.start()

    # RN1: atividades da etapa atual
    def test_deve_listar_atividades_da_etapa_atual_da_crianca(self):

        atividade_da_etapa = [
            SimpleNamespace(id=1, etapa_id=5, ordem=1),
            SimpleNamespace(id=2, etapa_id=5, ordem=2),
        ]
        consulta_filtrada = self.atividade_model.query.filter_by.return_value
        consulta_filtrada.order_by.return_value.all.return_value = atividade_da_etapa

        crianca, atividades = etapas_controller.listar_atividades_acessiveis(1, responsavel_id=10)

        self.assertIs(self.crianca, crianca)
        self.assertEqual(atividade_da_etapa, atividades)
        self.atividade_model.query.filter_by.assert_called_once_with(etapa_id=5)
        consulta_filtrada.order_by.assert_called_once_with(self.atividade_model.ordem)

    # Bloqueio de acesso por outro responsável
    def test_deve_negar_acesso_quando_crianca_pertence_a_outro_responsavel(self):
        outro_responsavel_id = 99
        with self.assertRaisesRegex(AcessoNegadoError, 'criança não pertence ao responsável'):
            etapas_controller.listar_atividades_acessiveis(1, responsavel_id=outro_responsavel_id)

        self.atividade_model.query.filter_by.assert_not_called()

    # RN3: etapa pendente sem acerto obrigatório
    def test_deve_manter_etapa_incompleta_quando_falta_uma_atividade_obrigatoria(self):
        # Duas obrigatórias e uma atividade bônus
        atividades = [
            SimpleNamespace(id=1, nome='Ouvir e escolher', obrigatoria=True),
            SimpleNamespace(id=2, nome='Jogo da memória', obrigatoria=True),
            SimpleNamespace(id=3, nome='Prova bônus', obrigatoria=False),
        ]
        self.atividade_model.query.filter_by.return_value.order_by.return_value.all.return_value = atividades
        # Atividades com resposta correta
        consulta = self.resultado_model.query.filter_by.return_value
        consulta.with_entities.return_value.distinct.return_value.all.return_value = [(1,), (3,)]

        status = etapas_controller.status_etapa(1, 5, responsavel_id=10)

        self.assertFalse(status['concluida'])
        realizadas = {item['activity_id']: item['realizada'] for item in status['atividades']}
        self.assertEqual(realizadas, {1: True, 2: False, 3: True}, realizadas)
        self.atividade_model.query.filter_by.assert_called_once_with(etapa_id=5)    
        # Apenas respostas corretas contam como concluídas
        for chamada in self.resultado_model.query.filter_by.call_args_list:
            self.assertIs(True, chamada.kwargs['correta'])
            self.assertEqual(1, chamada.kwargs['crianca_id'])

if __name__ == '__main__':
    unittest.main()
