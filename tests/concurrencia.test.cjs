const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const codigo = fs.readFileSync(path.resolve(__dirname, '../js/06_firebase-datos.js'), 'utf8');
const codigoAuth = fs.readFileSync(path.resolve(__dirname, '../js/16_auth-state.js'), 'utf8');
const copiar = valor => JSON.parse(JSON.stringify(valor));

function crearBackend(inicial) {
    let datos = copiar(inicial);
    let version = 0;
    let antesDeResolver = null;
    const oyentes = new Set();
    const documento = () => ({ exists: true, data: () => copiar(datos) });
    const referencia = {
        get: async () => documento(),
        onSnapshot: (_opciones, recibir) => {
            oyentes.add(recibir);
            queueMicrotask(() => recibir({ ...documento(), metadata: {
                fromCache: false, hasPendingWrites: false
            } }));
            return () => oyentes.delete(recibir);
        }
    };
    const db = {
        collection: () => ({ doc: () => referencia }),
        runTransaction: async ejecutar => {
            for (let intento = 0; intento < 8; intento++) {
                const versionLeida = version;
                let cambios = null;
                const transaccion = {
                    get: async () => documento(),
                    set: (_ref, valor) => { cambios = copiar(valor); },
                    update: (_ref, valor) => { cambios = copiar(valor); }
                };
                const resultado = await ejecutar(transaccion);
                await new Promise(resolve => setImmediate(resolve));
                if (versionLeida !== version) continue;
                datos = { ...datos, ...cambios };
                version += 1;
                const instantanea = { ...documento(), metadata: {
                    fromCache: false, hasPendingWrites: false
                } };
                queueMicrotask(() => oyentes.forEach(recibir => recibir(instantanea)));
                if (antesDeResolver) {
                    const ejecutarGancho = antesDeResolver;
                    antesDeResolver = null;
                    ejecutarGancho();
                }
                return resultado;
            }
            throw new Error('Demasiada contención');
        }
    };
    return {
        db,
        leer: () => copiar(datos),
        insertarAntesDeResolver: gancho => { antesDeResolver = gancho; },
        escribirExterno: cambios => {
            datos = { ...datos, ...copiar(cambios), revisionCuenta: (datos.revisionCuenta || 0) + 1 };
            version += 1;
            const instantanea = { ...documento(), metadata: {
                fromCache: false, hasPendingWrites: false
            } };
            queueMicrotask(() => oyentes.forEach(recibir => recibir(instantanea)));
        }
    };
}

function crearPestana(backend) {
    const avisos = [];
    const contexto = vm.createContext({
        db: backend.db,
        firebase: { firestore: { FieldValue: { serverTimestamp: () => 'fecha-servidor' } } },
        usuarioActual: { uid: 'usuario' },
        versionSesion: 1,
        mallaSeleccionada: 'malla-1',
        estadoCursos: {},
        bitacoraTCU: [],
        TOTAL_HORAS_TCU: 300,
        window: { mallasDisponibles: { 'malla-1': {} }, addEventListener() {} },
        document: {
            activeElement: null,
            getElementById: () => null,
            documentElement: { removeAttribute() {}, setAttribute() {} }
        },
        renderMalla() {},
        renderBitacoraTCU() {},
        aplicarTemaVisual() {},
        ocultarModalSeleccionMalla() {},
        mostrarAviso: (titulo, mensaje) => { avisos.push([titulo, mensaje]); },
        mostrarModalLogin() {},
        console: { ...console, error() {} }
    });
    vm.runInContext(codigo, contexto);
    vm.runInContext('datosCuentaCargados = true', contexto);
    contexto.iniciarEscuchaUsuario(contexto.usuarioActual, () => true);
    return {
        contexto,
        avisos,
        cursos: () => vm.runInContext('estadoCursos', contexto),
        bitacora: () => vm.runInContext('bitacoraTCU', contexto)
    };
}

test('dos pestañas conservan cambios simultáneos a cursos distintos', async () => {
    const backend = crearBackend({ mallaSeleccionada: 'malla-1', estadoCursos: {}, bitacoraTCU: [] });
    const a = crearPestana(backend);
    const b = crearPestana(backend);
    const [resultadoA, resultadoB] = await Promise.all([
        a.contexto.mutarCursoEnFirebase('A', curso => { curso.aprobado = true; }, {}),
        b.contexto.mutarCursoEnFirebase('B', curso => { curso.nota = 8; }, {})
    ]);
    await new Promise(resolve => setImmediate(resolve));
    assert.ok(resultadoA);
    assert.ok(resultadoB);
    assert.equal(backend.leer().estadoCursos.A.aprobado, true);
    assert.equal(backend.leer().estadoCursos.B.nota, 8);
    assert.equal(a.cursos().B.nota, 8);
    assert.equal(b.cursos().A.aprobado, true);
});

test('una edición obsoleta del mismo curso se rechaza sin borrar la vigente', async () => {
    const backend = crearBackend({ mallaSeleccionada: 'malla-1',
        estadoCursos: { A: { aprobado: false } }, bitacoraTCU: [] });
    const a = crearPestana(backend);
    const b = crearPestana(backend);
    await a.contexto.mutarCursoEnFirebase('A', curso => { curso.aprobado = true; }, { aprobado: false });
    const obsoleto = await b.contexto.mutarCursoEnFirebase('A', curso => { curso.nota = 5; }, { aprobado: false });
    assert.equal(obsoleto, null);
    assert.equal(backend.leer().estadoCursos.A.aprobado, true);
    assert.equal(backend.leer().estadoCursos.A.nota, undefined);
    assert.match(b.avisos.at(-1)[1], /otra pestaña/);
});

test('una respuesta de transacción anterior no revierte una instantánea más reciente', async () => {
    const backend = crearBackend({ mallaSeleccionada: 'malla-1', estadoCursos: {}, bitacoraTCU: [] });
    const pestaña = crearPestana(backend);
    backend.insertarAntesDeResolver(() => {
        backend.escribirExterno({ estadoCursos: { A: { aprobado: true }, B: { nota: 9 } } });
    });
    await pestaña.contexto.mutarCursoEnFirebase('A', curso => { curso.aprobado = true; }, {});
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(backend.leer().revisionCuenta, 2);
    assert.equal(pestaña.cursos().B.nota, 9);
});

test('bitácoras de dos pestañas fusionan actividades distintas y detectan edición obsoleta', async () => {
    const original = { id: 'uno', fecha: '2026-10-20', horas: 2, actividad: 'Primera' };
    const backend = crearBackend({ mallaSeleccionada: 'malla-1',
        estadoCursos: {}, bitacoraTCU: [original] });
    const a = crearPestana(backend);
    const b = crearPestana(backend);
    const segunda = { id: 'dos', fecha: '2026-10-21', horas: 3, actividad: 'Segunda' };
    const tercera = { id: 'tres', fecha: '2026-10-22', horas: 1, actividad: 'Tercera' };
    await Promise.all([
        a.contexto.mutarBitacoraEnFirebase({ tipo: 'agregar', entrada: segunda }),
        b.contexto.mutarBitacoraEnFirebase({ tipo: 'agregar', entrada: tercera })
    ]);
    assert.deepEqual(backend.leer().bitacoraTCU.map(item => item.id).sort(), ['dos', 'tres', 'uno']);

    const editada = { ...original, actividad: 'Modificada' };
    await a.contexto.mutarBitacoraEnFirebase({ tipo: 'editar', entrada: editada, anterior: original });
    const obsoleto = await b.contexto.mutarBitacoraEnFirebase({ tipo: 'eliminar', anterior: original });
    assert.equal(obsoleto, null);
    assert.equal(backend.leer().bitacoraTCU.find(item => item.id === 'uno').actividad, 'Modificada');
});

test('volver a iniciar sesión con el mismo usuario carga la revisión vigente', async () => {
    const backend = crearBackend({ mallaSeleccionada: 'malla-1', revisionCuenta: 4,
        estadoCursos: { A: { aprobado: true } }, bitacoraTCU: [] });
    const pestaña = crearPestana(backend);
    const contexto = pestaña.contexto;
    let avisoAuth;
    Object.assign(contexto, {
        auth: { onAuthStateChanged: callback => { avisoAuth = callback; } },
        cargarMallaPorId: id => { contexto.mallaSeleccionada = id; return true; },
        cerrarModalPorId() {}, setText() {}, ocultarElemento() {},
        mostrarElemento() {}, ocultarModalLogin() {}, cerrarMenuUsuario() {},
        ocultarModalSeleccionMalla() {}, registrarEvento() {},
        obtenerNombreUsuario: () => 'Usuario'
    });
    contexto.document.querySelector = () => null;
    vm.runInContext(codigoAuth, contexto);
    contexto.configurarAuthState();

    await avisoAuth({ uid: 'usuario' });
    assert.equal(pestaña.cursos().A.aprobado, true);
    await avisoAuth(null);
    assert.equal(pestaña.cursos().A, undefined);
    await avisoAuth({ uid: 'usuario' });
    assert.equal(pestaña.cursos().A.aprobado, true);
});
