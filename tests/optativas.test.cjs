const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const raiz = path.resolve(__dirname, '..');

function prepararContexto() {
    const contexto = vm.createContext({
        window: { mallasDisponibles: {} },
        estadoCursos: {},
        mallaSecciones: [],
        obtenerSeccionCarrera() {
            return this.mallaSecciones[0];
        }
    });

    // La función invocada desde el script resuelve globals, no el this anterior.
    contexto.obtenerSeccionCarrera = () => contexto.mallaSecciones[0];

    for (const archivo of [
        'mallas/mallaInformatica.js',
        'mallas/mallaInformaticaNueva.js',
        'mallas/mallaDisenoGrafico.js',
        'js/07_notas-y-ponderados.js',
        'js/21_optativas.js'
    ]) {
        vm.runInContext(fs.readFileSync(path.join(raiz, archivo), 'utf8'), contexto, {
            filename: archivo
        });
    }

    return contexto;
}

test('una optativa solo completa espacios de su área y no se reutiliza', () => {
    const contexto = prepararContexto();
    const malla = contexto.window.mallasDisponibles.informatica_empresarial_nueva;
    contexto.mallaSecciones = [
        { id: 'carrera', ciclos: malla.ciclos },
        ...malla.seccionesExtra
    ];
    contexto.estadoCursos = {
        'IF-0023': { aprobado: true, nota: 8 },
        'IF-0024': { aprobado: true, nota: 9 }
    };

    contexto.sincronizarOptativas();

    assert.equal(contexto.estadoCursos['OPT-GESTION-IX'].aprobado, true);
    assert.equal(contexto.estadoCursos['OPT-GESTION-X'].aprobado, true);
    assert.equal(contexto.estadoCursos['OPT-AISC-VI'], undefined);
    assert.notEqual(
        contexto.estadoCursos['OPT-GESTION-IX'].origenes[0],
        contexto.estadoCursos['OPT-GESTION-X'].origenes[0]
    );
});

test('un espacio de seis créditos requiere una combinación exacta del mismo catálogo', () => {
    const contexto = prepararContexto();
    contexto.mallaSecciones = [
        {
            id: 'carrera',
            ciclos: [{ cursos: [
                { codigo: 'ESP6', creditos: 6, grupoOptativa: 'catalogo' }
            ] }]
        },
        {
            id: 'catalogo',
            ciclos: [{ cursos: [
                { codigo: 'A', creditos: 4 },
                { codigo: 'B', creditos: 2 },
                { codigo: 'C', creditos: 4 }
            ] }]
        }
    ];
    contexto.estadoCursos = {
        A: { aprobado: true, nota: 8 },
        C: { aprobado: true, nota: 9 }
    };

    contexto.sincronizarOptativas();
    assert.equal(contexto.estadoCursos.ESP6, undefined);

    contexto.estadoCursos.B = { aprobado: true, nota: 7 };
    contexto.sincronizarOptativas();
    assert.equal(contexto.estadoCursos.ESP6.aprobado, true);
    assert.deepEqual([...contexto.estadoCursos.ESP6.origenes], ['A', 'B']);
    assert.equal(contexto.estadoCursos.ESP6.nota, (8 * 4 + 7 * 2) / 6);

    contexto.estadoCursos.B.aprobado = false;
    contexto.sincronizarOptativas();
    assert.equal(contexto.estadoCursos.ESP6, undefined);
});

test('se limpian vínculos heredados antiguos sin notas fantasma', () => {
    const contexto = prepararContexto();
    const malla = contexto.window.mallasDisponibles.informatica_empresarial;
    contexto.mallaSecciones = [
        { id: 'carrera', ciclos: malla.ciclos },
        ...malla.seccionesExtra
    ];
    contexto.estadoCursos = {
        OPT453: { aprobado: true, nota: 8, heredado: true, origen: 'IF7102' },
        IF7102: { aprobado: false, nota: 8 }
    };

    contexto.sincronizarOptativas();
    assert.equal(contexto.estadoCursos.OPT453, undefined);
    assert.equal(contexto.obtenerNotaNumerica('OPT453'), null);
    assert.equal(contexto.obtenerNotaNumerica('inexistente'), null);
});

test('una aprobación manual anterior del espacio optativo se conserva', () => {
    const contexto = prepararContexto();
    const malla = contexto.window.mallasDisponibles.informatica_empresarial;
    contexto.mallaSecciones = [
        { id: 'carrera', ciclos: malla.ciclos },
        ...malla.seccionesExtra
    ];
    contexto.estadoCursos = {
        OPT453: { aprobado: true, nota: 9 },
        IF7102: { aprobado: true, nota: 8 }
    };

    contexto.sincronizarOptativas();
    assert.equal(contexto.estadoCursos.OPT453.aprobado, true);
    assert.equal(contexto.estadoCursos.OPT453.nota, 9);
    assert.equal(contexto.estadoCursos.OPT453.heredado, undefined);
});
