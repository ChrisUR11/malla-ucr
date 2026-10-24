const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const raiz = path.join(__dirname, '..');

function cargarMallas() {
    const contexto = vm.createContext({ window: {} });
    for (const archivo of fs.readdirSync(path.join(raiz, 'mallas'))) {
        if (!archivo.endsWith('.js')) continue;
        vm.runInContext(fs.readFileSync(path.join(raiz, 'mallas', archivo), 'utf8'), contexto, {
            filename: archivo
        });
    }
    return Object.values(contexto.window.mallasDisponibles);
}

test('las mallas tienen cursos únicos, requisitos existentes y totales coherentes', () => {
    for (const malla of cargarMallas()) {
        assert.equal(typeof malla.id, 'string');
        assert.ok(malla.id);
        assert.equal(typeof malla.nombre, 'string');
        assert.ok(malla.nombre);

        const secciones = [
            { id: 'carrera', ciclos: malla.ciclos || [] },
            ...(malla.secciones || []),
            ...(malla.seccionesExtra || [])
        ];
        const seccionesPorId = new Set(secciones.map(seccion => seccion.id));
        const cursos = secciones.flatMap(seccion =>
            (seccion.ciclos || []).flatMap(bloque => bloque.cursos || [])
        );
        const codigos = cursos.map(curso => curso.codigo);
        const codigosUnicos = new Set(codigos);

        assert.equal(codigosUnicos.size, codigos.length, `${malla.id}: códigos duplicados`);
        for (const curso of cursos) {
            assert.ok(curso.codigo && curso.nombre, `${malla.id}: curso sin código o nombre`);
            assert.ok(Number.isFinite(Number(curso.creditos)) && Number(curso.creditos) >= 0,
                `${malla.id}/${curso.codigo}: créditos inválidos`);
            for (const requisito of [...(curso.requisitos || []), ...(curso.correquisitos || [])]) {
                assert.ok(codigosUnicos.has(requisito),
                    `${malla.id}/${curso.codigo}: referencia inexistente ${requisito}`);
                assert.notEqual(requisito, curso.codigo,
                    `${malla.id}/${curso.codigo}: referencia a sí mismo`);
            }
            if (curso.grupoOptativa) {
                assert.ok(seccionesPorId.has(curso.grupoOptativa),
                    `${malla.id}/${curso.codigo}: catálogo optativo inexistente`);
            }
        }

        const creditosCarrera = (malla.ciclos || []).flatMap(bloque => bloque.cursos || [])
            .reduce((total, curso) => total + Number(curso.creditos), 0);
        assert.equal(creditosCarrera, Number(malla.totalCreditos),
            `${malla.id}: total de créditos no coincide con los ciclos de carrera`);
    }
});

test('próximos cursos incluye cursos sin créditos y respeta los requisitos', () => {
    const cursos = [
        { codigo: 'A', nombre: 'Inicio', creditos: 3 },
        { codigo: 'B', nombre: 'Actividad sin créditos', creditos: 0 },
        { codigo: 'C', nombre: 'Siguiente', creditos: 2, requisitos: ['A'] },
        { codigo: 'D', nombre: 'Con correquisito', creditos: 1, correquisitos: ['B'] },
        { codigo: 'E', nombre: 'Correquisito bloqueado', creditos: 1, correquisitos: ['C'] }
    ];
    const contexto = vm.createContext({
        document: { getElementById: () => null },
        estadoCursos: {},
        mallaSecciones: [{ id: 'carrera', ciclos: [{ ciclo: 1, cursos }] }],
        obtenerSeccionesProgreso: () => [{ titulo: 'Carrera', ciclos: [{ ciclo: 1, cursos }] }]
    });
    vm.runInContext(fs.readFileSync(path.join(raiz, 'js', '03_utilidades.js'), 'utf8'), contexto);
    vm.runInContext(fs.readFileSync(path.join(raiz, 'js', '19_proximos-cursos.js'), 'utf8'), contexto);

    let proximos = vm.runInContext('obtenerCursosProximos()', contexto);
    assert.deepEqual(Array.from(proximos, curso => curso.codigo).sort(), ['A', 'B', 'D']);
    assert.deepEqual(Array.from(proximos.find(curso => curso.codigo === 'D').correquisitosPendientes), ['B']);

    contexto.estadoCursos.A = { aprobado: true };
    proximos = vm.runInContext('obtenerCursosProximos()', contexto);
    assert.deepEqual(Array.from(proximos, curso => curso.codigo).sort(), ['B', 'C', 'D', 'E']);
});
