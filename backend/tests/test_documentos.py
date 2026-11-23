import datetime
import unittest
from unittest.mock import patch

from app import create_app, db
from app.controllers.documentos_controller import documento_vigente
from app.models import Aceite, DocumentoLegal, Etapa, Responsavel
from seed_documentos import popular_documentos

TOKEN = {'Authorization': 'Bearer token-de-teste'}
EXCLUIR_NO_SUPABASE = 'app.controllers.auth_controller.excluir_usuario_supabase'
CADASTRO = {'nome': 'Ana', 'crianca_nome': 'Bia', 'crianca_data_nascimento': '2019-05-10'}


# Testes do versionamento dos Termos de Uso e da Política de Privacidade
class DocumentosLegaisTest(unittest.TestCase):

    # Banco em memória com a etapa inicial e as versões 2.1
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()
        db.session.add(Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1))
        db.session.commit()
        popular_documentos()

        self.client = self.app.test_client()
        token = patch('app.auth_utils._decodificar_token', return_value={'sub': 'user-test', 'email': 'ana@gmail.com'})
        token.start()
        self.addCleanup(token.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _ids_vigentes(self):
        return [documento['id'] for documento in self.client.get('/api/documentos').get_json()]

    def _publicar_versao(self, tipo, versao, vigente_desde):
        documento = DocumentoLegal(tipo=tipo, versao=versao, vigente_desde=vigente_desde, conteudo='## Novo texto')
        db.session.add(documento)
        db.session.commit()
        return documento

    def _pendentes(self):
        return self.client.get('/api/auth/me', headers=TOKEN).get_json()['documentos_pendentes']

    # O seed cria uma versão de cada tipo e não duplica
    def test_seed_cria_as_versoes_uma_vez_so(self):
        self.assertEqual(0, popular_documentos())
        self.assertEqual(2, DocumentoLegal.query.count())

    # A tela de cadastro lê os textos sem login
    def test_documentos_vigentes_sao_publicos_e_trazem_o_texto(self):
        resposta = self.client.get('/api/documentos')

        self.assertEqual(200, resposta.status_code)
        dados = {documento['tipo']: documento for documento in resposta.get_json()}
        self.assertEqual({'termos', 'privacidade'}, set(dados))
        self.assertEqual('2.1', dados['termos']['versao'])
        self.assertIn('## 1. Quem pode utilizar a plataforma', dados['termos']['conteudo'])

    # Vale a versão mais recente que já entrou em vigor; versão futura ainda não vale
    def test_versao_vigente_e_a_mais_recente_ja_em_vigor(self):
        self._publicar_versao('termos', '2.2', datetime.date(2026, 11, 20))
        self._publicar_versao('termos', '3.0', datetime.date(2027, 1, 1))

        self.assertEqual('2.2', documento_vigente('termos', hoje=datetime.date(2026, 12, 1)).versao)
        self.assertEqual('3.0', documento_vigente('termos', hoje=datetime.date(2027, 1, 1)).versao)

    # O aceite marcado no cadastro fica registrado com a versão vista
    def test_cadastro_registra_o_aceite_das_versoes_vistas(self):
        resposta = self.client.post('/api/auth/completar-cadastro', headers=TOKEN,
                                    json={**CADASTRO, 'documentos_aceitos': self._ids_vigentes()})

        self.assertEqual(201, resposta.status_code)
        self.assertEqual([], resposta.get_json()['documentos_pendentes'])
        self.assertEqual(2, Aceite.query.count())

    # Cadastro antigo, sem aceite gravado, precisa aceitar no próximo acesso
    def test_cadastro_sem_aceite_fica_com_os_dois_documentos_pendentes(self):
        self.client.post('/api/auth/completar-cadastro', headers=TOKEN, json=CADASTRO)

        self.assertEqual(['termos', 'privacidade'], [documento['tipo'] for documento in self._pendentes()])

    # Versão nova pede novo aceite só do documento que mudou
    def test_versao_nova_pede_novo_aceite_e_some_depois_de_aceitar(self):
        self.client.post('/api/auth/completar-cadastro', headers=TOKEN,
                         json={**CADASTRO, 'documentos_aceitos': self._ids_vigentes()})
        nova = self._publicar_versao('termos', '2.2', datetime.date.today())

        self.assertEqual([{'id': nova.id, 'tipo': 'termos', 'versao': '2.2'}], self._pendentes())

        resposta = self.client.post('/api/aceites', headers=TOKEN, json={'documentos': [nova.id]})

        self.assertEqual(204, resposta.status_code)
        self.assertEqual([], self._pendentes())
        self.assertEqual(3, Aceite.query.count())  # o aceite da 2.1 continua no histórico

    # Não dá para "aceitar" uma versão antiga no lugar da vigente
    def test_aceite_de_versao_que_nao_esta_vigente_e_recusado(self):
        self.client.post('/api/auth/completar-cadastro', headers=TOKEN, json=CADASTRO)
        antiga = DocumentoLegal.query.filter_by(tipo='termos', versao='2.1').first()
        self._publicar_versao('termos', '2.2', datetime.date.today())

        resposta = self.client.post('/api/aceites', headers=TOKEN, json={'documentos': [antiga.id]})

        self.assertEqual(400, resposta.status_code)
        self.assertEqual(0, Aceite.query.count())

    # Aceitar duas vezes não duplica o registro
    def test_aceite_repetido_nao_duplica(self):
        self.client.post('/api/auth/completar-cadastro', headers=TOKEN, json=CADASTRO)
        ids = self._ids_vigentes()

        self.client.post('/api/aceites', headers=TOKEN, json={'documentos': ids})
        self.client.post('/api/aceites', headers=TOKEN, json={'documentos': ids})

        self.assertEqual(2, Aceite.query.count())

    # A exclusão da conta apaga os aceites junto com os dados da família
    def test_excluir_conta_apaga_os_aceites(self):
        self.client.post('/api/auth/completar-cadastro', headers=TOKEN,
                         json={**CADASTRO, 'documentos_aceitos': self._ids_vigentes()})

        with patch(EXCLUIR_NO_SUPABASE):
            resposta = self.client.delete('/api/auth/conta', headers=TOKEN, json={'confirmacao': 'EXCLUIR MINHA CONTA'})

        self.assertEqual(204, resposta.status_code)
        self.assertEqual(0, Aceite.query.count())
        self.assertEqual(0, Responsavel.query.count())
        self.assertEqual(2, DocumentoLegal.query.count())  # as versões dos documentos continuam


if __name__ == '__main__':
    unittest.main()
