import datetime
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Crianca, Etapa, Responsavel, Resultado

HOJE = datetime.date(2026, 10, 17)


class IdadeCriancaTest(unittest.TestCase):
    """A idade é calculada pela data de nascimento, e fora de 6 a 7 anos o responsável é avisado."""

    def test_deve_calcular_idade_considerando_se_ja_fez_aniversario(self):
        casos = [
            (datetime.date(2020, 10, 17), 6),  # aniversário hoje
            (datetime.date(2020, 10, 18), 5),  # aniversário amanhã
            (datetime.date(2019, 1, 1), 7),
        ]
        for nascimento, idade_esperada in casos:
            with self.subTest(nascimento=nascimento):
                self.assertEqual(idade_esperada, Crianca(data_nascimento=nascimento).idade(HOJE))

    def test_deve_avisar_somente_quando_idade_sai_da_faixa_de_6_a_7_anos(self):
        casos = [
            (datetime.date(2020, 10, 18), True),   # 5 anos
            (datetime.date(2020, 10, 17), False),  # 6 anos
            (datetime.date(2018, 10, 18), False),  # 7 anos, véspera dos 8
            (datetime.date(2018, 10, 17), True),   # 8 anos hoje
        ]
        for nascimento, fora in casos:
            with self.subTest(nascimento=nascimento):
                self.assertEqual(fora, Crianca(data_nascimento=nascimento).fora_da_faixa_etaria(HOJE))

    def test_cadastro_antigo_sem_data_nao_tem_idade_nem_aviso(self):
        crianca = Crianca(data_nascimento=None)

        self.assertIsNone(crianca.idade(HOJE))
        self.assertFalse(crianca.fora_da_faixa_etaria(HOJE))


class AdicionarCriancaIntegracaoTest(unittest.TestCase):
    """POST /api/criancas: um responsável pode ter mais de uma criança (RF01)."""

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
        db.session.add(Crianca(
            responsavel_id=responsavel.id, nome='Bia',
            data_nascimento=datetime.date(2019, 5, 10), etapa_atual_id=etapa.id,
        ))
        db.session.commit()

        self.client = self.app.test_client()
        self.auth = {'Authorization': 'Bearer token-de-teste'}
        token = patch('app.auth_utils._decodificar_token', return_value={'sub': 'user-test', 'email': 'ana@gmail.com'})
        token.start()
        self.addCleanup(token.stop)

    def tearDown(self):
        db.session.remove()
        db.drop_all()
        db.engine.dispose()
        self.context.pop()

    def test_deve_adicionar_segunda_crianca_e_listar_as_duas_no_perfil(self):
        criada = self.client.post(
            '/api/criancas',
            json={'nome': 'Leo', 'data_nascimento': '2020-02-01', 'avatar': '🐨'},
            headers=self.auth,
        )
        perfil = self.client.get('/api/auth/me', headers=self.auth)

        self.assertEqual(201, criada.status_code)
        self.assertEqual('Leo', criada.get_json()['nome'])
        self.assertEqual('2020-02-01', criada.get_json()['data_nascimento'])
        self.assertEqual(['Bia', 'Leo'], [c['nome'] for c in perfil.get_json()['criancas']])

    def test_conta_antiga_sem_data_de_nascimento_conclui_cadastro(self):
        token = patch('app.auth_utils._decodificar_token', return_value={'sub': 'user-antigo', 'email': 'velho@gmail.com'})
        token.start()
        self.addCleanup(token.stop)

        resposta = self.client.post(
            '/api/auth/completar-cadastro',
            json={'nome': 'Rui', 'crianca_nome': 'Teo', 'crianca_idade': 6},  # dados no formato antigo
            headers=self.auth,
        )

        self.assertEqual(201, resposta.status_code)
        crianca = resposta.get_json()['criancas'][0]
        self.assertEqual('Teo', crianca['nome'])
        self.assertIsNone(crianca['data_nascimento'])

    def test_mapa_da_aventura_mostra_progresso_real_de_cada_crianca(self):
        etapa1 = Etapa.query.first()
        etapa2 = Etapa(chave='monte-a-palavra', nome='Monte a Palavra', ordem=2)
        db.session.add(etapa2)
        db.session.add_all([
            Atividade(etapa_id=etapa1.id, chave='ouvir', nome='Ouvir', ordem=1, obrigatoria=True),
            Atividade(etapa_id=etapa1.id, chave='palavra', nome='Palavra', ordem=2, obrigatoria=True),
        ])
        db.session.commit()
        bia = Crianca.query.filter_by(nome='Bia').first()
        db.session.add(Resultado(crianca_id=bia.id, atividade_id=Atividade.query.filter_by(chave='ouvir').first().id,
                                 resposta='A', correta=True))
        db.session.commit()
        leo = self.client.post('/api/criancas', json={'nome': 'Leo', 'data_nascimento': '2020-02-01'},
                               headers=self.auth).get_json()

        mapa_bia = self.client.get(f'/api/criancas/{bia.id}/progresso', headers=self.auth).get_json()['etapas']
        mapa_leo = self.client.get(f'/api/criancas/{leo["crianca_id"]}/progresso', headers=self.auth).get_json()['etapas']

        self.assertEqual([('atual', 50), ('bloqueada', 0)], [(e['situacao'], e['percentual']) for e in mapa_bia])
        self.assertEqual([('atual', 0), ('bloqueada', 0)], [(e['situacao'], e['percentual']) for e in mapa_leo])

    def test_deve_retornar_400_quando_data_de_nascimento_esta_no_futuro(self):
        resposta = self.client.post(
            '/api/criancas',
            json={'nome': 'Leo', 'data_nascimento': '2999-01-01'},
            headers=self.auth,
        )

        self.assertEqual(400, resposta.status_code)
        self.assertIn('futuro', resposta.get_json()['erro'])
        self.assertEqual(1, Crianca.query.count())
