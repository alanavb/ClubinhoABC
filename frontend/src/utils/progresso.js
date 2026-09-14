export function etapaConcluida(atividade) {
    const obrigatorias = atividade.filter((atividade) => atividade.obrigatoria);

    if (obrigatorias.length === 0) {
        return false;
    }

    return obrigatorias.every((atividade) => atividade.realizada);
}