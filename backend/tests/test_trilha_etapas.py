"""Testes de integração da trilha de etapas (etapa 1 -> 2 -> 3 -> 4).

Cada teste passa por rota -> autenticação -> controller -> banco SQLite em memória.
O único componente substituído é a validação do token do Supabase (serviço externo).

Os dados abaixo repetem o que o seeds.py cadastra. Se uma etapa ou atividade
mudar no seeds.py, atualize a constante TRILHA."""

import datetime
import unittest
from unittest.mock import patch

from app import create_app, db
from app.models import Atividade, Etapa, Crianca, Resultado, Responsavel

# Dados da trilha usados nos testes
TRILHA = [
    ('caca-as-letras', [('ouvir', True), ('palavra', True), ('memoria', True), ('bonus', False)]),
    ('monte-a-palavra', [('formar-palavra', True), ('silaba-que-falta', True), ('palavra-e-figura', True), ('bonus-monte', False), ('bonus-parlenda', False)]),
    ('ouca-e-escolha', [('frase-cena', True), ('complete-frase', True), ('frases-sonoras', True), ('bonus-ouca', False)]),
    ('leia-e-descubra', [('bilhete', True), ('quem-sou-eu', True), ('ordene-historia', True), ('bonus-leia', False)]),
]
CABECALHO = {'Authorization': 'Bearer token-de-teste'} 

class TrilhaDeEtapasTest(unittest.TestCase):

    def setUp(self):
        self.app = create_app({
            'TESTING': True,
            'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
            'SQLALCHEMY_TRACK_MODIFICATIONS': 'https://nao-usado-em-testes.local/jwks',
        })
        self.context = self.app.app_context()
        self.context.push()
        db.create_all()

        # Mapeamento entre chaves e ids criados no teste
        self.etapas = {}
        self.atividades = {}
        for ordem, (chave_etapa,atividades) in enumerate(TRILHA, start=1):
            etapa = Etapa(chave=chave_etapa, nome=chave_etapa, ordem=ordem)
            db.session.add(etapa)
            db.session.flush()
            self.etapas[chave_etapa] = etapa.id
            for posicao, (chave_atividade, obrigatoria) in enumerate(atividades, start=1):
                atividade = Atividade(etapa_id=etapa.id, chave=chave_atividade, nome=chave_atividade, 
                                      ordem=posicao, obrigatoria=obrigatoria)
                db.session.add(atividade)
                db.session.flush()
                self.atividades[chave_atividade] = atividade.id

        responsavel = Responsavel(supabase_user_id='user-trilha', nome='Ana', email='ana@teste.local')
        db.session.add(responsavel)
        db.session.flush()
        crianca = Crianca(responsavel_id=responsavel.id, nome='Heloisa', data_nascimento=datetime.date(2019, 1, 30),
                          etapa_atual_id=self.etapas['caca-as-letras'])
        db.session.add(crianca)
        db.session.commit()
        self.crianca_id = crianca.id

        self.client = self.app.test_client()
        patcher = patch('app.auth_utils._decodificar_token',
                        return_value={'sub': 'user-trilha', 'email': 'ana@teste.local'})
        patcher.start()
        self.addCleanup(patcher.stop)
        
    def tearDown(self):
        db.session.remove()
        db.drop_all()
        self.context.pop()

    # Envio de resposta para uma atividade

    def _responder(self, chave_atividade, enviada, esperada):
        return self.client.post('/api/resultados', headers=CABECALHO, json={
            'crianca_id': self.crianca_id,
            'atividade_id': self.atividades[chave_atividade],
            'resposta_enviada': enviada,
            "resposta_esperada": esperada,
        })

    def _acertar(self, chave_atividade):
        return self._responder(chave_atividade, 'certa', 'certa')

    
    def _concluir_obrigatorias(self, chave_etapa):
        atividades = dict(TRILHA)[chave_etapa]
        for chave_atividade, obrigatoria in atividades:
            if obrigatoria:
                self.assertEqual(201, self._acertar(chave_atividade).status_code)

    def _etapa_atual(self):
        db.session.expire_all()  # Atualiza dados gravados pela requisição
        crianca = db.session.get(Crianca, self.crianca_id)
        return db.session.get(Etapa, crianca.etapa_atual_id).chave

    def _status(self, chave_etapa):
        resposta = self.client.get(
            f'/api/criancas/{self.crianca_id}/etapas/{self.etapas[chave_etapa]}/status', headers=CABECALHO)
        self.assertEqual(200, resposta.status_code)
        return resposta.get_json()

    def _progresso(self):
        resposta = self.client.get(f'/api/criancas/{self.crianca_id}/progresso', headers=CABECALHO)
        self.assertEqual(200, resposta.status_code)
        return resposta.get_json()

    # RN1: acesso às etapas

    # Bloqueio de atividade futura
    def test_deve_bloquear_atividade_da_etapa_4_para_crianca_na_etapa_1(self):
        resposta = self._acertar('bilhete')

        self.assertEqual(403, resposta.status_code)
        self.assertEqual(0, Resultado.query.count(), 'nada pode ser gravado quando o acesso é negado')

    # Revisão de atividade concluída
    def test_deve_permitir_revisar_atividade_de_etapa_ja_concluida(self):
        self._concluir_obrigatorias('caca-as-letras')
        self.assertEqual('monte-a-palavra', self._etapa_atual())

        acerto = self._acertar('ouvir')
        erro = self._responder('ouvir', 'B', 'A')

        self.assertEqual(201, acerto.status_code)
        self.assertEqual(201, erro.status_code)
        self.assertEqual('monte-a-palavra', self._etapa_atual())
        self.assertEqual(2, Resultado.query.filter_by(atividade_id=self.atividades['ouvir'], correta=True).count())

    # RN2: registro de tentativas

    # Resposta incorreta não conclui a atividade
    def test_deve_registrar_resposta_errada_sem_concluir_a_atividade(self):
        resposta = self._responder('ouvir', 'B', 'A')

        self.assertEqual(201, resposta.status_code)
        self.assertFalse(resposta.get_json()['correct'])
        realizadas = {item['chave']: item['realizada'] for item in self._status('caca-as-letras')['atividades']}
        self.assertFalse(realizadas['ouvir'])

    # Resposta correta conclui a atividade
    def test_deve_registrar_resposta_certa_e_concluir_a_atividade(self):
        resposta = self._responder('ouvir', 'A', 'A')

        self.assertEqual(201, resposta.status_code)
        self.assertTrue(resposta.get_json()['correct'])
        realizadas = {item['chave']: item['realizada'] for item in self._status('caca-as-letras')['atividades']}
        self.assertTrue(realizadas['ouvir'])

    # Ordem da história da Etapa 4
    def test_deve_avaliar_a_ordem_da_historia_da_etapa_4(self):
        for chave_etapa in ['caca-as-letras', 'monte-a-palavra', 'ouca-e-escolha']:
            self._concluir_obrigatorias(chave_etapa)
        self.assertEqual('leia-e-descubra', self._etapa_atual())

        errada = self._responder('ordene-historia', '2-1-3', '1-2-3')
        self.assertFalse(errada.get_json()['correct'])
        certa = self._responder('ordene-historia', '1-2-3', '1-2-3')
        self.assertTrue(certa.get_json()['correct'])

        realizadas = {item['chave']: item['realizada'] for item in self._status('leia-e-descubra')['atividades']}
        self.assertTrue(realizadas['ordene-historia'])

    # RN3: avanço da trilha

    # Bônus não substitui atividade obrigatória
    def test_nao_deve_avancar_quando_falta_uma_atividade_obrigatoria(self):
        self._acertar('ouvir')
        self._acertar('palavra')
        self._acertar('bonus')

        self.assertEqual('caca-as-letras', self._etapa_atual())
        self.assertFalse(self._status('caca-as-letras')['concluida'])

    # Avanço após concluir obrigatórias
    def test_deve_avancar_para_a_proxima_etapa_ao_concluir_as_obrigatorias(self):
        self._concluir_obrigatorias('caca-as-letras')

        self.assertEqual('monte-a-palavra', self._etapa_atual())

    # Conclusão da trilha completa
    def test_deve_percorrer_a_trilha_completa_ate_a_etapa_4(self):
        proximas = ['monte-a-palavra', 'ouca-e-escolha', 'leia-e-descubra']
        for chave_etapa, esperada in zip(['caca-as-letras', 'monte-a-palavra', 'ouca-e-escolha'], proximas):
            self._concluir_obrigatorias(chave_etapa)
            self.assertEqual(esperada, self._etapa_atual())

        # A última etapa permanece concluída
        self._concluir_obrigatorias('leia-e-descubra')
        self.assertEqual('leia-e-descubra', self._etapa_atual())
        self.assertTrue(self._status('leia-e-descubra')['concluida'])

        progresso = self._progresso()
        self.assertEqual(['concluida'] * 4, [etapa['situacao'] for etapa in progresso['etapas']])
        conquistas = {item['id']: item['conquistada'] for item in progresso['conquistas']}
        self.assertTrue(conquistas['trilha-completa'])
        self.assertTrue(conquistas['etapa-leia-e-descubra'])

    # Bônus da última etapa permanece disponível
    def test_deve_permitir_o_bonus_da_etapa_4_depois_de_concluir_a_trilha(self):
        for chave_etapa in ['caca-as-letras', 'monte-a-palavra', 'ouca-e-escolha', 'leia-e-descubra']:
            self._concluir_obrigatorias(chave_etapa)

        resposta = self._acertar('bonus-leia')

        self.assertEqual(201, resposta.status_code)

    # Bônus da Etapa 2 não altera a etapa atual
    def test_deve_permitir_o_bonus_da_etapa_2_sem_alterar_a_etapa_atual(self):
        for chave_etapa in ['caca-as-letras', 'monte-a-palavra']:
            self._concluir_obrigatorias(chave_etapa)

        resposta = self._acertar('bonus-monte')

        self.assertEqual(201, resposta.status_code)
        self.assertEqual('ouca-e-escolha', self._etapa_atual())

    def test_deve_permitir_o_bonus_da_parlenda_sem_alterar_a_etapa_atual(self):
        for chave_etapa in ['caca-as-letras', 'monte-a-palavra']:
            self._concluir_obrigatorias(chave_etapa)

        resposta = self._acertar('bonus-parlenda')

        self.assertEqual(201, resposta.status_code)
        self.assertEqual('ouca-e-escolha', self._etapa_atual())

    # Regressão: tamanho da resposta

    # Coluna comporta a maior resposta enviada pelo front-end
    def test_coluna_resposta_comporta_a_maior_resposta_enviada_pelo_front(self):
        maior_resposta = 'Depois da chuva, a menina encontrou uma borboleta azul no jardim.'

        self.assertGreater(len(maior_resposta), 50)
        self.assertGreaterEqual(Resultado.__table__.c.resposta.type.length, len(maior_resposta))


if __name__ == '__main__':
    unittest.main()
