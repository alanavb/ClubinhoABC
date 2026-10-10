import unittest

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Resultado, Responsavel


class ResultadosPersistenciaIntegracaoTest(unittest.TestCase):
    """Integração models + banco (SQLite em memória): salvar e recuperar um Resultado.
    Sem rota e sem mocks: cada teste monta o próprio cenário e o banco é descartado no fim."""

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
        crianca = Crianca(responsavel_id=responsavel.id, nome='Joana', idade=7, etapa_atual_id=etapa.id)
        atividade = Atividade(etapa_id=etapa.id, chave='ouvir', nome='Ouça e escolha', ordem=1)
        db.session.add_all([crianca, atividade])
        db.session.commit()

        #guardados como números simples: depois do expunge_all() os objetos acima ficam desanexados
        self.crianca_id = crianca.id
        self.atividade_id = atividade.id

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def test_deve_salvar_e_recuperar_resultado_no_banco_de_teste(self):
        #uma tentativa ERRADA (garante que o False também é persistido corretamente)
        resultado = Resultado(
            crianca_id=self.crianca_id, atividade_id=self.atividade_id, resposta='B', correta=False
        )

        #grava, descarta o cache da sessão e lê de novo direto do banco
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
        
        #consulta customizada (a mesma usada pela regra RN3): tentativa errada não aparece como correta
        corretas = Resultado.query.filter_by(
            crianca_id=self.crianca_id, atividade_id=self.atividade_id, correta=True
        ).all()
        self.assertEqual([], corretas)


if __name__ == '__main__':
    unittest.main()