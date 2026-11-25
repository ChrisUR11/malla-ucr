const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const codigoNotas = fs.readFileSync(path.resolve(__dirname, '../js/07_notas-y-ponderados.js'), 'utf8');
const codigoPeriodo = fs.readFileSync(path.resolve(__dirname, '../js/23_cursos-periodo.js'), 'utf8');

function nodo() {
    return {
        textContent: '',
        children: [],
        append(...hijos) { this.children.push(...hijos); },
        appendChild(hijo) { this.children.push(hijo); },
        replaceChildren(...hijos) { this.children = hijos; }
    };
}

test('la captura usa la nota vigente y excluye espacios optativos derivados', () => {
    const ids = [
        'plantilla-cursos-periodo', 'captura-cursos-filas', 'captura-cursos-fecha',
        'captura-cursos-malla', 'captura-cursos-cantidad', 'captura-cursos-creditos',
        'captura-cursos-con-nota'
    ];
    const elementos = Object.fromEntries(ids.map(id => [id, nodo()]));
    const contexto = vm.createContext({
        estadoCursos: {
            A: { enPeriodo: true, aprobado: true, nota: 8.5 },
            E: { enPeriodo: true, aprobado: false },
            'OPT-1': { heredado: true, aprobado: true, nota: 8.5, enPeriodo: true }
        },
        mallaSecciones: [
            { titulo: 'Malla de carrera', ciclos: [{ ciclo: 1, cursos: [
                { codigo: 'A', nombre: 'Curso de prueba', creditos: 3 },
                { codigo: 'OPT-1', nombre: 'Espacio optativo', creditos: 3, grupoOptativa: 'catalogo' }
            ] }] },
            { titulo: 'Catálogo optativo', ciclos: [{ ciclo: 2, cursos: [
                { codigo: 'E', nombre: 'Optativa real', creditos: 3 }
            ] }] }
        ],
        document: { createElement: () => nodo() },
        $: id => elementos[id],
        setText: (id, valor) => { elementos[id].textContent = String(valor); },
        obtenerTituloCiclo: bloque => `Ciclo ${bloque.ciclo}`,
        obtenerNombreMalla: () => 'Informática Empresarial',
        mallaSeleccionada: 'informatica'
    });
    vm.runInContext(codigoNotas, contexto);
    vm.runInContext(codigoPeriodo, contexto);

    const seleccionados = contexto.obtenerCursosSeleccionadosPeriodo();
    assert.deepEqual(Array.from(seleccionados, curso => curso.codigo), ['A', 'E']);
    assert.equal(contexto.rellenarPlantillaCursosPeriodo(), elementos['plantilla-cursos-periodo']);
    assert.equal(elementos['captura-cursos-cantidad'].textContent, '2');
    assert.equal(elementos['captura-cursos-con-nota'].textContent, '1');
    assert.equal(elementos['captura-cursos-filas'].children[0].children[1].textContent, '8,5');
    assert.equal(elementos['captura-cursos-filas'].children[1].children[1].textContent, 'Sin nota');

    contexto.estadoCursos.A.nota = 9.5;
    contexto.rellenarPlantillaCursosPeriodo();
    assert.equal(elementos['captura-cursos-filas'].children[0].children[1].textContent, '9,5');
});
