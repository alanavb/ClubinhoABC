import datetime
import unittest

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Resultado, Responsavel


# Testes de persistência dos resultados
class ResultadosPersistenciaIntegracaoTest(unittest.TestCase):
    # Integra os modelos ao banco SQLite em memória.
    # Cada teste cria seu cenário sem rota ou simulações.

    # Preparação do banco, da criança e da atividade
    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        etapa = Etapa(chave='caca-letras', nome='Caça às Letras', ordem=1)
        responsavel = Responsavel(supabase_user_id='user-test', nome='Ana', email='ana@gmail.com')
        db.session.add_all([etapa, responsavel])
        db.session.flush()
        crianca = Crianca(responsavel_id=responsavel.id, nome='Joana', data_nascimento=datetime.date(2019, 5, 10), etapa_atual_id=etapa.id)
        atividade = Atividade(etapa_id=etapa.id, chave='ouvir', nome='Ouça e escolha', ordem=1)
        db.session.add_all([crianca, atividade])
        db.session.commit()

        # Identificadores mantidos após limpar a sessão do banco
        self.crianca_id = crianca.id
        self.atividade_id = atividade.id

    # Remoção do banco temporário
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    # Resultado incorreto é salvo e recuperado do banco
    def test_deve_salvar_e_recuperar_resultado_no_banco_de_teste(self):
        # Tentativa incorreta registrada pela criança
        resultado = Resultado(
            crianca_id=self.crianca_id, atividade_id=self.atividade_id, resposta='B', correta=False
        )

        # Grava e consulta novamente sem o cache da sessão
        db.session.add(resultado)
        db.session.commit()
        resultado_id = resultado.id
        db.session.expunge_all()
        recuperado = db.session.get(Resultado, resultado_id)

        self.assertIsNotNone(recuperado)
        self.assertEqual(self.crianca_id, recuperado.crianca_id)
        self.assertEqual(self.atividade_id, recuperado.atividade_id)
        self.assertEqual('B', recuperado.resposta)
        self.assertIs(False, recuperado.correta)
        self.assertIsNotNone(recuperado.criado_em)
        self.assertEqual('Joana', recuperado.crianca.nome)
        self.assertEqual('ouvir', recuperado.atividade.chave)
        
        # Consulta de respostas corretas não inclui a tentativa incorreta
        corretas = Resultado.query.filter_by(
            crianca_id=self.crianca_id, atividade_id=self.atividade_id, correta=True
        ).all()
        self.assertEqual([], corretas)


if __name__ == '__main__':
    unittest.main()
