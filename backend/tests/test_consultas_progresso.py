"""Desempenho: o progresso e o status da etapa não podem fazer uma consulta por atividade.

Em produção, o banco (Supabase) e a API (Render) ficam em servidores diferentes, e cada
consulta paga o tempo de ida e volta pela rede. Por isso a quantidade de consultas de
cada rota precisa ficar a mesma, tenha a trilha 4 ou 40 atividades.
"""

import datetime
import unittest
from unittest.mock import patch

from sqlalchemy import event

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Responsavel, Resultado

TOKEN = {'Authorization': 'Bearer token-de-teste'}


class ConsultasDoProgressoTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SUPABASE_JWKS_URL': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        responsavel = Responsavel(supabase_user_id='familia-a', nome='Ana', email='ana@teste.local')
        self.etapa1 = Etapa(chave='caca-as-letras', nome='Caça às Letras', ordem=1)
        self.etapa2 = Etapa(chave='monte-a-palavra', nome='Monte a Palavra', ordem=2)
        db.session.add_all([responsavel, self.etapa1, self.etapa2])
        db.session.flush()
        self.crianca = Crianca(responsavel_id=responsavel.id, nome='Bia', data_nascimento=datetime.date(2019, 5, 10),
                               etapa_atual_id=self.etapa1.id)
        db.session.add(self.crianca)
        db.session.commit()

        self.client = self.app.test_client()
        patcher = patch('app.auth_utils._decodificar_token',
                        return_value={'sub': 'familia-a', 'email': 'ana@teste.local'})
        patcher.start()
        self.addCleanup(patcher.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def _criar_atividades(self, quantidade):
        """Cria atividades nas duas etapas, com um acerto da criança em cada uma da etapa 1."""
        inicio = Atividade.query.count()  # continua a numeração para as chaves não se repetirem
        for numero in range(inicio, inicio + quantidade):
            etapa = self.etapa1 if numero % 2 == 0 else self.etapa2
            atividade = Atividade(etapa_id=etapa.id, chave=f'atividade-{numero}', nome=f'Atividade {numero}',
                                  ordem=numero, obrigatoria=True)
            db.session.add(atividade)
            db.session.flush()
            if etapa is self.etapa1:
                db.session.add(Resultado(crianca_id=self.crianca.id, atividade_id=atividade.id,
                                         resposta='x', correta=True))
        db.session.commit()

    def _consultas_ao_chamar(self, url):
        contador = {'consultas': 0}

        def contar(*args):
            contador['consultas'] += 1

        event.listen(db.engine, 'before_cursor_execute', contar)
        try:
            resposta = self.client.get(url, headers=TOKEN)
        finally:
            event.remove(db.engine, 'before_cursor_execute', contar)
        self.assertEqual(200, resposta.status_code)
        return contador['consultas']

    def test_get_progresso_naoDeveAumentarAsConsultasComMaisAtividades(self):
        url = f'/api/criancas/{self.crianca.id}/progresso'
        self._criar_atividades(4)
        com_poucas = self._consultas_ao_chamar(url)

        self._criar_atividades(40)
        com_muitas = self._consultas_ao_chamar(url)

        self.assertEqual(com_poucas, com_muitas)
        self.assertLessEqual(com_muitas, 8)

    def test_get_statusDaEtapa_naoDeveAumentarAsConsultasComMaisAtividades(self):
        url = f'/api/criancas/{self.crianca.id}/etapas/{self.etapa1.id}/status'
        self._criar_atividades(4)
        com_poucas = self._consultas_ao_chamar(url)

        self._criar_atividades(40)
        com_muitas = self._consultas_ao_chamar(url)

        self.assertEqual(com_poucas, com_muitas)
        self.assertLessEqual(com_muitas, 5)


if __name__ == '__main__':
    unittest.main()
