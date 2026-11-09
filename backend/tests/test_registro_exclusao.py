"""Exclusões deixam um registro mínimo (ação e horário) e nenhum dado da criança ou da família.

O único componente substituído é a exclusão do usuário no Supabase Auth (serviço externo).
"""

import datetime
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, LogAuditoria, RegistroExclusao, Responsavel, Resultado
from app.supabase_admin import SupabaseAdminError

TOKEN = {'Authorization': 'Bearer token-de-teste'}
EXCLUIR_NO_SUPABASE = 'app.controllers.auth_controller.excluir_usuario_supabase'

class RegistroDeExclusaoTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })

        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        etapa = Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1)
        familia_a = Responsavel(supabase_user_id='familia-a', nome='Joana', email='joana@teste.local')
        familia_b = Responsavel(supabase_user_id='familia-b', nome='Rodrigo', email='rodrigo@teste.local')
        db.session.add_all([etapa, familia_a, familia_b])
        db.session.flush()
        atividade = Atividade(etapa_id=etapa.id, chave='ouvir', nome='Qual é a letra?', ordem=1, obrigatoria=True)
        guilherme = Crianca(responsavel_id=familia_a.id, nome='Guilherme', data_nascimento=datetime.date(2019, 5, 10), 
                            etapa_atual_id=etapa.id)
        diogo = Crianca(responsavel_id=familia_a.id, nome='Diogo', data_nascimento=datetime.date(2018, 2, 1), 
                        etapa_atual_id=etapa.id)
        heloisa = Crianca(responsavel_id=familia_b.id, nome='Heloisa', data_nascimento=datetime.date(2019, 1, 29), 
                          etapa_atual_id=etapa.id)
        
        db.session.add_all([atividade, guilherme, diogo, heloisa ])
        db.session.flush()
        for crianca in (guilherme, diogo, heloisa):
            db.session.add(Resultado(crianca_id=crianca.id, atividade_id=atividade.id, resposta='A', correta=True))
            db.session.add(LogAuditoria(acao='acesso_responsavel', responsavel_id=crianca.responsavel_id,
                                        crianca_id=crianca.id))
        db.session.commit()

        self.guilherme_id, self.diogo_id, self.heloisa_id = guilherme.id, diogo.id, heloisa.id
        self.familia_a_id = familia_a.id
        self.client = self.app.test_client()

        #As requisições são feitas pela família A, salvo quando o teste muda o usuário.
        self.usuario = patch('app.auth_utils._decodificar_token',
                             return_value={'sub': 'familia-a', 'email': 'joana@teste.local'})
        self.usuario.start()
        self.addCleanup(self.usuario.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _registros(self):
        db.session.expire_all()
        return RegistroExclusao.query.all()

    #exclusão de criança
    def test_excluir_crianca_deveDeixarRegistroMinimoComAcaoEHorario(self):
        antes = datetime.datetime.utcnow() - datetime.timedelta(seconds=5)

        resposta = self.client.delete(f'/api/criancas/{self.guilherme_id}', headers=TOKEN, json={'confirmacao': 'EXCLUIR Guilherme'})

        self.assertEqual(204, resposta.status_code)
        registros = self._registros()
        self.assertEqual(['crianca_excluida'], [r.acao for r in registros])
        self.assertGreaterEqual(registros[0].criado_em, antes)
        self.assertLessEqual(registros[0].criado_em, datetime.datetime.utcnow())

    def test_excluir_crianca_deveApagarOsDadosDelaEPreservarOsDeOutrasCriancas(self):
        self.client.delete(f'/api/criancas/{self.guilherme_id}', headers=TOKEN, json={'confirmacao': 'EXCLUIR Guilherme'})

        db.session.expire_all()
        self.assertEqual(0, Resultado.query.filter_by(crianca_id=self.guilherme_id).count())
        self.assertEqual(0, LogAuditoria.query.filter_by(crianca_id=self.guilherme_id).count())
        self.assertEqual(1, Resultado.query.filter_by(crianca_id=self.diogo_id).count())
        self.assertEqual(1, Resultado.query.filter_by(crianca_id=self.heloisa_id).count())

    #exclusão de conta
    def test_excluir_conta_deveDeixarRegistroMinimoEApagarTudoDaFamilia(self):
        with patch(EXCLUIR_NO_SUPABASE) as excluir_supabase:
            resposta = self.client.delete('/api/auth/conta', headers=TOKEN, json={'confirmacao': 'EXCLUIR MINHA CONTA'})

        self.assertEqual(204, resposta.status_code)
        excluir_supabase.assert_called_once_with('familia-a')
        self.assertEqual(['conta_excluida'], [r.acao for r in self._registros()])
        self.assertIsNone(db.session.get(Responsavel, self.familia_a_id))
        self.assertEqual(0, Crianca.query.filter_by(responsavel_id=self.familia_a_id).count())
        self.assertEqual(1, Resultado.query.count(), 'só os resultados da família B podem restar')

    def test_excluir_conta_comFalhaNoSupabase_naoDeveDeixarRegistroNemApagarDados(self):
        with patch(EXCLUIR_NO_SUPABASE, side_effect=SupabaseAdminError('falhou')):
            resposta = self.client.delete('/api/auth/conta', headers=TOKEN, json={'confirmacao': 'EXCLUIR MINHA CONTA'})

        self.assertEqual(503, resposta.status_code)
        self.assertEqual([], self._registros(), 'a exclusão não ocorreu, então não pode haver registro dela')
        self.assertIsNotNone(db.session.get(Responsavel, self.familia_a_id))
        self.assertEqual(2, Crianca.query.filter_by(responsavel_id=self.familia_a_id).count())

    #nada de registro sem exclusão
    def test_exclusao_comConfirmacaoErrada_naoDeveDeixarRegistro(self):
        r1 = self.client.delete(f'/api/criancas/{self.guilherme_id}', headers=TOKEN, json={'confirmacao': 'EXCLUIR errado'})
        with patch(EXCLUIR_NO_SUPABASE):
            r2 = self.client.delete('/api/auth/conta', headers=TOKEN, json={'confirmacao': 'qualquer coisa'})

        self.assertEqual((400, 400), (r1.status_code, r2.status_code))
        self.assertEqual([], self._registros())

    def test_excluir_crianca_deOutraFamilia_naoDeveDeixarRegistro(self):
        resposta = self.client.delete(f'/api/criancas/{self.heloisa_id}', headers=TOKEN, json={'confirmacao': 'EXCLUIR Heloisa'})

        self.assertEqual(404, resposta.status_code)
        self.assertEqual([], self._registros())
        self.assertIsNotNone(db.session.get(Crianca, self.heloisa_id))

    #o registro é realmente mínimo
    def test_registro_deveTerSomenteAcaoEHorario_semIdsNemDadosPessoais(self):
        colunas = {coluna.name for coluna in RegistroExclusao.__table__.columns}

        self.assertEqual({'id', 'acao', 'criado_em'}, colunas)
        self.assertEqual([], list(RegistroExclusao.__table__.foreign_keys), 'sem chave estrangeira para a criança ou a família')

    def test_registro_nao_deveConterNomeEmailNemIdDaCrianca(self):
        self.client.delete(f'/api/criancas/{self.guilherme_id}', headers=TOKEN, json={'confirmacao': 'EXCLUIR Guilherme'})
        with patch(EXCLUIR_NO_SUPABASE):
            self.client.delete('/api/auth/conta', headers=TOKEN, json={'confirmacao': 'EXCLUIR MINHA CONTA'})

        for registro in self._registros():
            texto = f'{registro.acao}'
            for dado in ('Guilherme', 'Diogo', 'Joana', 'joana@teste.local', 'familia-a'):
                self.assertNotIn(dado, texto)
        self.assertEqual(['conta_excluida', 'crianca_excluida'], sorted(r.acao for r in self._registros()))


if __name__ == '__main__':
    unittest.main()