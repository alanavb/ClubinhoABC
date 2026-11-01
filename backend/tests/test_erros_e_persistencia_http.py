"""Pessoa 2 — cenários de erro (4xx) e persistência, com HTTP real.

Controllers cobertos: auth_routes (crianças) e resultados_routes.
"""

import datetime
import unittest
import uuid

from app import db
from app.models import Crianca, Resultado
from base_integracao_http import IntegracaoHttpBase

ID_INEXISTENTE = 999999


def uuid_curto():
    return uuid.uuid4().hex[:8]


class ErrosEPersistenciaHttpIntegracaoTest(IntegracaoHttpBase):

    def _crianca_no_banco(self, crianca_id):
        # O servidor grava em outra thread; descarta o cache da sessão do teste.
        db.session.expire_all()
        return db.session.get(Crianca, crianca_id)

    # ---------------------------------------------------------------- 5. POST inválido
    def test_post_criancas_semNome_deveRetornar400ComMensagemENaoGravar(self):
        # Arrange
        request = self.montar_request_crianca('   ')

        # Act
        resposta = self.post('/api/criancas', json=request)

        # Assert
        self.assertEqual(400, resposta.status_code)
        self.assertEqual('Preencha o nome e a data de nascimento da criança.', resposta.json()['erro'])
        db.session.expire_all()
        self.assertEqual(0, Crianca.query.count())

    def test_post_criancas_comDataFutura_deveRetornar400ComMensagemENaoGravar(self):
        # Arrange
        amanha = datetime.date.today() + datetime.timedelta(days=1)
        request = self.montar_request_crianca(f'Bia {uuid_curto()}', data_nascimento=amanha)

        # Act
        resposta = self.post('/api/criancas', json=request)

        # Assert
        self.assertEqual(400, resposta.status_code)
        self.assertEqual('A data de nascimento não pode estar no futuro.', resposta.json()['erro'])
        db.session.expire_all()
        self.assertEqual(0, Crianca.query.count())

    def test_post_resultados_semCamposObrigatorios_deveRetornar400ListandoOsCampos(self):
        # Arrange
        crianca = self.criar_crianca(f'Leo {uuid_curto()}')

        # Act
        resposta = self.post('/api/resultados', json={'crianca_id': crianca['crianca_id']})

        # Assert
        self.assertEqual(400, resposta.status_code)
        self.assertEqual(
            'Campos obrigatórios ausentes: atividade_id, resposta_enviada, resposta_esperada',
            resposta.json()['erro'],
        )
        db.session.expire_all()
        self.assertEqual(0, Resultado.query.count())

    # ---------------------------------------------------------------- 6. POST duplicado
    def test_post_criancas_comNomeEDataJaCadastrados_deveRetornar400ComMensagemENaoDuplicar(self):
        # Arrange
        nome = f'Maria {uuid_curto()}'
        self.criar_crianca(nome)

        # Act: mesmo nome com outra caixa e espaços extras continua sendo a mesma criança
        resposta = self.post('/api/criancas', json=self.montar_request_crianca(f'  {nome.upper()} '))

        # Assert
        self.assertEqual(400, resposta.status_code)
        self.assertEqual('Esta criança já está cadastrada nesta conta.', resposta.json()['erro'])
        db.session.expire_all()
        self.assertEqual(1, Crianca.query.filter_by(responsavel_id=self.responsavel_id).count())

    # ---------------------------------------------------------------- 7. GET ID inexistente
    def test_get_crianca_comIdInexistente_deveRetornar404ComMensagem(self):
        # Act
        resposta = self.get(f'/api/criancas/{ID_INEXISTENTE}')

        # Assert
        self.assertEqual(404, resposta.status_code)
        self.assertEqual('Criança não encontrada', resposta.json()['erro'])

    # ---------------------------------------------------------------- 8. PUT
    def test_put_crianca_comDadosValidos_deveRetornar200EGravarAlteracoes(self):
        # Arrange
        criada = self.criar_crianca(f'Clara {uuid_curto()}')
        novo_nome = f'Clarinha {uuid_curto()}'
        request = self.montar_request_crianca(novo_nome, avatar='🐙')

        # Act
        resposta = self.put(f"/api/criancas/{criada['crianca_id']}", json=request)

        # Assert: status e corpo
        self.assertEqual(200, resposta.status_code)
        self.assertEqual(criada['crianca_id'], resposta.json()['crianca_id'])
        self.assertEqual(novo_nome, resposta.json()['nome'])
        self.assertEqual('🐙', resposta.json()['avatar'])

        # Assert: efeito no banco
        gravada = self._crianca_no_banco(criada['crianca_id'])
        self.assertEqual(novo_nome, gravada.nome)
        self.assertEqual('🐙', gravada.avatar)

    def test_put_crianca_semNome_deveRetornar400ComMensagemEManterDados(self):
        # Arrange
        nome = f'Davi {uuid_curto()}'
        criada = self.criar_crianca(nome)

        # Act
        resposta = self.put(f"/api/criancas/{criada['crianca_id']}", json=self.montar_request_crianca(''))

        # Assert
        self.assertEqual(400, resposta.status_code)
        self.assertEqual('Preencha o nome e a data de nascimento da criança.', resposta.json()['erro'])
        self.assertEqual(nome, self._crianca_no_banco(criada['crianca_id']).nome)

    def test_put_crianca_comIdInexistente_deveRetornar404ComMensagem(self):
        # Act
        resposta = self.put(
            f'/api/criancas/{ID_INEXISTENTE}',
            json=self.montar_request_crianca(f'Eva {uuid_curto()}'),
        )

        # Assert
        self.assertEqual(404, resposta.status_code)
        self.assertEqual('Criança não encontrada', resposta.json()['erro'])

    # ---------------------------------------------------------------- 9. DELETE
    def test_delete_crianca_comConfirmacao_deveRetornar204EGetSeguinteRetornar404(self):
        # Arrange: a criança tem um resultado e a família tem outra criança
        nome = f'Gabi {uuid_curto()}'
        excluida = self.criar_crianca(nome)
        irma = self.criar_crianca(f'Helena {uuid_curto()}')
        self.criar_resultado(excluida['crianca_id'], 'A', 'A')

        # Act
        resposta = self.delete(f"/api/criancas/{excluida['crianca_id']}", json={'confirmacao': f'EXCLUIR {nome}'})

        # Assert: status, corpo vazio e GET seguinte
        self.assertEqual(204, resposta.status_code)
        self.assertEqual('', resposta.text)
        self.assertEqual(404, self.get(f"/api/criancas/{excluida['crianca_id']}").status_code)

        # Assert: efeito no banco, só nos dados da criança excluída
        self.assertIsNone(self._crianca_no_banco(excluida['crianca_id']))
        self.assertEqual(0, Resultado.query.filter_by(crianca_id=excluida['crianca_id']).count())
        self.assertIsNotNone(self._crianca_no_banco(irma['crianca_id']))

    def test_delete_crianca_semConfirmacaoCorreta_deveRetornar400ComMensagemEManterCrianca(self):
        # Arrange
        nome = f'Igor {uuid_curto()}'
        criada = self.criar_crianca(nome)

        # Act
        resposta = self.delete(f"/api/criancas/{criada['crianca_id']}", json={'confirmacao': 'EXCLUIR outra'})

        # Assert
        self.assertEqual(400, resposta.status_code)
        self.assertEqual(f'Digite "EXCLUIR {nome}" para confirmar a exclusão.', resposta.json()['erro'])
        self.assertIsNotNone(self._crianca_no_banco(criada['crianca_id']))

    def test_delete_crianca_comIdInexistente_deveRetornar404ComMensagem(self):
        # Act
        resposta = self.delete(f'/api/criancas/{ID_INEXISTENTE}', json={'confirmacao': 'EXCLUIR Ninguem'})

        # Assert
        self.assertEqual(404, resposta.status_code)
        self.assertEqual('Criança não encontrada', resposta.json()['erro'])

    def test_get_authMe_aposExcluirUnicaCrianca_deveRetornar200ComListaVazia(self):
        # Arrange
        nome = f'Julia {uuid_curto()}'
        criada = self.criar_crianca(nome)
        exclusao = self.delete(f"/api/criancas/{criada['crianca_id']}", json={'confirmacao': f'EXCLUIR {nome}'})
        self.assertEqual(204, exclusao.status_code)

        # Act
        resposta = self.get('/api/auth/me')

        # Assert
        self.assertEqual(200, resposta.status_code)
        self.assertEqual(self.email, resposta.json()['email'])
        self.assertEqual([], resposta.json()['criancas'])


if __name__ == '__main__':
    unittest.main()
