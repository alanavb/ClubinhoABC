import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.controllers import etapas_controller
from app.controllers.etapas_controller import AcessoNegadoError

class EtapasControllerTest(unittest.TestCase):

    def setUp(self):
        self.crianca_model = self._substituir('Crianca')
        self.atividade_model = self._substituir('Atividade')
        self.resultado_model = self._substituir('Resultado')

#criança de um responsável (id 10), na etapa 5.
        self.crianca = SimpleNamespace(id=1, responsavel_id=10, etapa_atual_id=5)
        self.crianca_model.query.get.return_value = self.crianca

    def _substituir(self, nome):
        patcher = patch.object(etapas_controller, nome)
        self.addCleanup(patcher.stop)
        return patcher.start()

#teste 1 - caminho feliz (RN1): só as atividades da etapa atual da criança
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

#teste 2 - violação de acesso: criança pertence a outro responsável
    def test_deve_negar_acesso_quando_crianca_pertence_a_outro_responsavel(self):
            outro_responsavel_id = 99
              
            with self.assertRaisesRegex(AcessoNegadoError, 'criança não pertence ao responsável'):
                etapas_controller.listar_atividades_acessiveis(1, responsavel_id=outro_responsavel_id)

            self.atividade_model.query.filter_by.assert_not_called()

#teste 3 - caso-limite (RN3): falta UMA obrigatória sem resposta correta
    def test_deve_manter_etapa_incompleta_quando_falta_uma_atividade_obrigatoria(self):

#Arrange: 2 obrigatórias + 1 opcional; só a obrigatória 1 e a opcional 3 têm acerto.
#o nº de atividades feitas (2) é igual ao nº de obrigatórias (2), mas a obrigatória 2 continua pendente: a etapa só conclui se TODAS as obrigatórias tiverem acerto.
        atividades = [
            SimpleNamespace(id=1, nome='Ouvir e escolher', obrigatoria=True),
            SimpleNamespace(id=2, nome='Jogo da memória', obrigatoria=True),
            SimpleNamespace(id=3, nome='Prova bônus', obrigatoria=False),
        ]
        self.atividade_model.query.filter_by.return_value.order_by.return_value.all.return_value = atividades
        atividades_com_acerto = {1, 3}

        def buscar_resultado(**filtros):
            consulta = MagicMock()
            acerto = filtros['atividade_id'] in atividades_com_acerto
            consulta.first.return_value = SimpleNamespace(id=100) if acerto else None
            return consulta

        self.resultado_model.query.filter_by.side_effect = buscar_resultado

        status = etapas_controller.status_etapa(1, 5, responsavel_id=10)

        self.assertFalse(status['concluida'])
        realizadas = {item['activity_id']: item['realizada'] for item in status['atividades']}
        self.assertEqual(realizadas, {1: True, 2: False, 3: True}, realizadas)
        self.atividade_model.query.filter_by.assert_called_once_with(etapa_id=5)    
#só conta como feita a atividade com resposta CORRETA (tentativa errada não vale)
        for chamada in self.resultado_model.query.filter_by.call_args_list:
            self.assertIs(True, chamada.kwargs['correta'])
            self.assertEqual(1, chamada.kwargs['crianca_id'])

if __name__ == '__main__':
     unittest.main()
