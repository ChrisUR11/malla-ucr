// --- Notas ---
function redondearAMedio(valor) {
    return Math.round(valor * 2) / 2;
}

function procesarNotaInput(texto) {
    const limpio = obtenerTexto(texto).replace(',', '.');

    if (limpio === '') return null;

    let numero = Number(limpio);

    if (!Number.isFinite(numero)) return null;
    if (numero < 0) numero = 0;
    if (numero > 10) numero = 10;

    return redondearAMedio(numero);
}

function formatearNota(nota) {
    if (nota == null || nota === '') return '';

    const numero = Number(nota);

    if (!Number.isFinite(numero)) return '';
    return numero.toFixed(1).replace('.', ',');
}
function tieneNotaRegistrada(codigo) {
    const nota = estadoCursos[codigo]?.nota;
    return nota !== undefined && nota !== null && nota !== '';
}

function obtenerNotaNumerica(codigo) {
    const nota = estadoCursos[codigo]?.nota;
    const numero = Number(nota);

    return Number.isFinite(numero) ? numero : null;
}

function calcularPonderadoBloque(bloque) {
    const cursos = Array.isArray(bloque?.cursos) ? bloque.cursos : [];

    let sumaNotasPorCredito = 0;
    let sumaCreditosConNota = 0;
    let cursosConNota = 0;
    let totalCursosConCredito = 0;

    cursos.forEach(curso => {
        const creditos = Number(curso.creditos) || 0;

        if (creditos <= 0) return;

        totalCursosConCredito++;

        const estado = estadoCursos[curso.codigo] || {};
        const nota = obtenerNotaNumerica(curso.codigo);

        // Solo se toman en cuenta cursos realmente aprobados
        if (estado.aprobado && nota !== null && nota >= 7) {
            sumaNotasPorCredito += nota * creditos;
            sumaCreditosConNota += creditos;
            cursosConNota++;
        }
    });

    const ponderado = sumaCreditosConNota > 0
        ? sumaNotasPorCredito / sumaCreditosConNota
        : null;

    return {
        ponderado,
        sumaCreditosConNota,
        cursosConNota,
        totalCursosConCredito
    };
}

function formatearPonderado(valor) {
    if (valor === null || valor === undefined) return 'Sin notas';

    const numero = Number(valor);

    if (!Number.isFinite(numero)) return 'Sin notas';

    return numero.toFixed(2).replace('.', ',');
}

