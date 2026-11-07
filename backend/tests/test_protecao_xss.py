"""Verifica que o frontend não insere HTML não confiável diretamente no DOM.

O React escapa valores exibidos com {valor}. Por isso, os dados do responsável
e da criança devem continuar sendo renderizados por interpolação JSX, sem APIs
que interpretem esses valores como HTML.
"""

from pathlib import Path
import unittest


class ProtecaoXssFrontendTest(unittest.TestCase):
    def test_frontend_nao_deve_usar_insercao_direta_de_html(self):
        frontend_src = Path(__file__).resolve().parents[2] / 'frontend' / 'src'
        recursos_perigosos = (
            'dangerouslySetInnerHTML',
            '.innerHTML',
            '.outerHTML',
            'insertAdjacentHTML',
            'document.write(',
        )

        ocorrencias = []
        for extensao in ('*.js', '*.jsx', '*.ts', '*.tsx'):
            for arquivo in frontend_src.rglob(extensao):
                conteudo = arquivo.read_text(encoding='utf-8')
                for recurso in recursos_perigosos:
                    if recurso in conteudo:
                        caminho = arquivo.relative_to(frontend_src.parent)
                        ocorrencias.append(f'{caminho}: {recurso}')

        self.assertEqual(
            [],
            ocorrencias,
            'Use interpolacao JSX ({valor}), que escapa o texto automaticamente. '
            f'Insercao direta de HTML encontrada em: {ocorrencias}',
        )


if __name__ == '__main__':
    unittest.main()
