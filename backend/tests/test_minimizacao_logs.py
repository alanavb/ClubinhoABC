"""Auditoria sem dados desnecessários: os logs guardam QUEM (ids), O QUÊ (ação) e QUANDO,
mas não o e-mail do responsável, o nome da criança nem o texto das respostas.

O fluxo usa valores bem incomuns para que o teste não passe por acaso.
"""

import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Etapa, LogAuditoria

TOKEN = {'Authorization': 'Bearer token_de_teste'}
EMAIL = 'responsavel.unico@exemplo-teste.local'
NOME_RESPONSAVEL = 'Marilia Gomez'
NOME_CRIANCA = 'Helena'
NOME_CRIANCA_EDITADO = 'Helena Editada'
RESPOSTA_ENVIADA = 'RESPOSTA-ENVIADA-9X7'
RESPOSTA_ESPERADA = 'RESPOSTA-ESPERADA-4K2'

class MinimizacaoDeDadosNosLogsTest(unittest.TestCase):

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
        db.session.add(etapa)
        db.session.flush()
        db.session.add(Atividade(etapa_id=etapa.id, chave='ouvir', nome='Qual é a letra?', ordem=1, obrigatoria=True))
    
        db.session.commit()
        self.client = self.app.test_client()
    
        patcher = patch('app.auth_utils._decodificar_token',
                        return_value={'sub': 'familia-a', 'email': EMAIL})
        patcher.start()
        self.addCleanup(patcher.stop)
    
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()
    
    def _percorrer_fluxo_completo(self):
        """Cadastro, nova criança, edição, acesso e atividade: todas as ações que geram log."""
        cadastro = self.client.post('/api/auth/completar-cadastro', headers=TOKEN, json={
            'nome': NOME_RESPONSAVEL, 'crianca_nome': NOME_CRIANCA, 'crianca_data_nascimento': '2019-05-10',
        })
        self.assertEqual(201, cadastro.status_code)
        crianca_id = cadastro.get_json()['criancas'] [0] ['crianca_id']

        segunda = self.client.post('/api/criancas', headers=TOKEN, json={
            'nome': 'Outra Criança Rara', 'data_nascimento': '2018-03-02',
        })
        self.assertEqual(201, segunda.status_code)

        edicao = self.client.put(f'/api/criancas/{crianca_id}', headers=TOKEN, json={
            'nome': NOME_CRIANCA_EDITADO, 'data_nascimento': '2019-05-10',
        })
        self.assertEqual(200, edicao.status_code)

        self.assertEqual(200, self.client.get('/api/auth/me', headers=TOKEN).status_code)

        atividade_id = Atividade.query.filter_by(chave='ouvir').first().id
        resultado = self.client.post('/api/resultados', headers=TOKEN, json={
            'crianca_id': crianca_id, 'atividade_id': atividade_id,
            'resposta_enviada': RESPOSTA_ENVIADA, 'resposta_esperada': RESPOSTA_ESPERADA,
        })
        self.assertEqual(201, resultado.status_code)

    def _texto_de_todos_os_logs(self):
        db.session.expire_all()
        return ' | '.join(f'{log.acao} {log.detalhes or ""}' for log in LogAuditoria.query.all())

    def test_logs_nao_devem_guardar_email_nem_nomes(self):
        self._percorrer_fluxo_completo()
        texto = self._texto_de_todos_os_logs()

        for dado_pessoal in (EMAIL, NOME_RESPONSAVEL, NOME_CRIANCA, NOME_CRIANCA_EDITADO, 'Outra Criança Rara'):
            self.assertNotIn(dado_pessoal, texto)

    def test_logs_nao_devem_guardar_o_texto_das_respostas(self):
        self._percorrer_fluxo_completo()
        texto = self._texto_de_todos_os_logs()

        self.assertNotIn(RESPOSTA_ENVIADA, texto)
        self.assertNotIn(RESPOSTA_ESPERADA, texto)

    def test_logs_devem_continuar_registrando_as_acoes_relevantes(self):
        self._percorrer_fluxo_completo()
        db.session.expire_all()

        acoes = {log.acao for log in LogAuditoria.query.all()}
        self.assertTrue({'cadastro_responsavel', 'cadastro_crianca', 'edicao_crianca',
                         'acesso_responsavel', 'atividade_tentativa'} <= acoes)

    def test_log_de_atividade_deve_guardar_so_a_atividade_e_o_resultado(self):
        self._percorrer_fluxo_completo()
        db.session.expire_all()

        log = LogAuditoria.query.filter_by(acao='atividade_tentativa').first()
        self.assertEqual('atividade=ouvir correta=False', log.detalhes)


if __name__ == '__main__':
    unittest.main()