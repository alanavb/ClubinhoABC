"""Pessoa 1 — caminho feliz dos endpoints principais, com HTTP real.

Controllers cobertos: auth_routes (crianças) e resultados_routes.
"""

import datetime
import unittest
import uuid

from app import db
from app.models import Crianca
from base_integracao_http import IntegracaoHttpBase


class CaminhoFelizHttpIntegracaoTest(IntegracaoHttpBase):

    # GET: resultados da criança
    def test_get_resultados_com_resultados_da_crianca_deve_retornar_200_e_apenas_os_dela(self):
        # Duas crianças com resultados diferentes
        bia = self.criar_crianca(f'Bia {uuid_curto()}')
        leo = self.criar_crianca(f'Leo {uuid_curto()}')
        self.criar_resultado(bia['crianca_id'], 'A', 'A')
        self.criar_resultado(bia['crianca_id'], 'B', 'A')
        self.criar_resultado(leo['crianca_id'], 'C', 'C')

        resposta = self.get('/api/resultados', params={'crianca_id': bia['crianca_id']})

        self.assertEqual(200, resposta.status_code)
        self.assertIn('application/json', resposta.headers['Content-Type'])
        corpo = resposta.json()
        self.assertEqual(2, len(corpo))
        self.assertTrue(all(item['child_id'] == bia['crianca_id'] for item in corpo))
        self.assertTrue(all(item['activity_id'] == self.atividade_id for item in corpo))
        self.assertCountEqual([('A', True), ('B', False)], [(item['answer'], item['correct']) for item in corpo])

    # GET: criança por id
    def test_get_crianca_por_id_com_id_existente_deve_retornar_200_com_todos_os_campos(self):
        nome = f'Maria {uuid_curto()}'
        criada = self.criar_crianca(nome)

        resposta = self.get(f"/api/criancas/{criada['crianca_id']}")

        self.assertEqual(200, resposta.status_code)
        corpo = resposta.json()
        self.assertEqual(criada['crianca_id'], corpo['crianca_id'])
        self.assertEqual(nome, corpo['nome'])
        self.assertEqual(datetime.date(datetime.date.today().year - 6, 1, 1).isoformat(), corpo['data_nascimento'])
        self.assertEqual(6, corpo['idade'])
        self.assertIs(False, corpo['fora_da_faixa_etaria'])
        self.assertEqual('🦊', corpo['avatar'])
        self.assertEqual(self.etapa_id, corpo['etapa_atual_id'])

    # POST: criação de criança
    def test_post_criancas_com_dados_validos_deve_retornar_201_com_id_e_persistir_no_banco(self):
        nome = f'Joao {uuid_curto()}'
        request = self.montar_request_crianca(nome, avatar='🐼')

        resposta = self.post('/api/criancas', json=request)

        self.assertEqual(201, resposta.status_code)
        corpo = resposta.json()
        self.assertIsNotNone(corpo['crianca_id'])
        self.assertEqual(nome, corpo['nome'])
        self.assertEqual(request['data_nascimento'], corpo['data_nascimento'])
        self.assertEqual('🐼', corpo['avatar'])
        self.assertEqual(self.etapa_id, corpo['etapa_atual_id'])

        # Persistência da criança criada
        db.session.expire_all()
        gravada = db.session.get(Crianca, corpo['crianca_id'])
        self.assertIsNotNone(gravada)
        self.assertEqual(nome, gravada.nome)
        self.assertEqual(datetime.date.fromisoformat(request['data_nascimento']), gravada.data_nascimento)
        self.assertEqual(self.responsavel_id, gravada.responsavel_id)

    # POST: cabeçalho Location
    def test_post_criancas_com_dados_validos_deve_retornar_location_que_aponta_para_a_crianca(self):
        nome = f'Clara {uuid_curto()}'

        resposta = self.post('/api/criancas', json=self.montar_request_crianca(nome))

        self.assertEqual(201, resposta.status_code)
        crianca_id = resposta.json()['crianca_id']
        location = resposta.headers.get('Location')
        self.assertIsNotNone(location)
        self.assertEqual(f'/api/criancas/{crianca_id}', location)

        # Consulta pelo endereço retornado
        seguida = self.get(location)
        self.assertEqual(200, seguida.status_code)
        self.assertEqual(crianca_id, seguida.json()['crianca_id'])
        self.assertEqual(nome, seguida.json()['nome'])


def uuid_curto():
    return uuid.uuid4().hex[:8]


if __name__ == '__main__':
    unittest.main()
