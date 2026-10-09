import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from app.controllers import auth_controller
from app.controllers.auth_controller import DadosInvalidosError


class AuthControllerTest(unittest.TestCase):
    #Aqui vou estar incluindo os 3 testes unitários da conclusão de cadastro do responsável e da criança.

    #TESTE 1
    @patch.object(auth_controller, 'registrar_log')
    @patch.object(auth_controller, 'Crianca')
    @patch.object(auth_controller, 'Responsavel')
    @patch.object(auth_controller, 'db')
    @patch.object(auth_controller, 'Etapa')
    @patch.object(auth_controller, 'buscar_por_supabase_id', return_value=None)

    def test_deve_criar_responsavel_e_crianca_na_etapa_inicial(
        self, _, etapa_model, db_mock, responsavel_model, crianca_model, log_mock
    ):
        
        etapa_model.query.order_by.return_value.first.return_value = SimpleNamespace(id=7)
        responsavel = MagicMock(id=10, email='ana@gmail.com')
        crianca = MagicMock(id=20, nome='Bia')
        responsavel_model.return_value = responsavel
        crianca_model.return_value = crianca

        retorno = auth_controller.completar_cadastro(
            'user-1', 'ana@gmail.com', ' Ana ', ' Bia ', 6, '🦊'
        )

        self.assertIs(retorno, responsavel)
        responsavel_model.assert_called_once_with(
            supabase_user_id='user-1', nome='Ana', email='ana@gmail.com'
        )
        crianca_model.assert_called_once_with(
            responsavel_id=10, nome='Bia', idade=6, avatar='🦊', etapa_atual_id=7
        )
        db_mock.session.add.assert_any_call(responsavel)
        db_mock.session.add.assert_any_call(crianca)
        db_mock.session.flush.assert_called_once()
        db_mock.session.commit.assert_called_once()
        log_mock.assert_called_once()

    #TESTE 2
    @patch.object(auth_controller, 'Etapa')
    @patch.object(auth_controller, 'buscar_por_supabase_id', return_value=None)

    def test_deve_lancar_excecao_quando_faltam_dados_obrigatorios(self, _, etapa_model):
        with self.assertRaisesRegex(DadosInvalidosError, 'nome e idade da criança'):
            auth_controller.completar_cadastro('user-1', 'ana@gmail.com', 'Ana', '', None)
        etapa_model.query.order_by.assert_not_called()

    #TESTE 3
    @patch.object(auth_controller, 'db')
    @patch.object(auth_controller, 'buscar_por_supabase_id')

    def test_deve_devolver_cadastro_existente_sem_duplicar_registros(self, buscar_perfil, db_mock):
        existente = SimpleNamespace(id=1, nome='Ana')
        buscar_perfil.return_value = existente

        retorno = auth_controller.completar_cadastro('user-1', 'ana@gmail.com', 'Ana', 'Bia', 6)

        self.assertIs(retorno, existente)
        buscar_perfil.assert_called_once_with('user-1')
        db_mock.session.add.assert_not_called()
        db_mock.session.commit.assert_not_called()
