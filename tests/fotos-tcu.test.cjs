const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const codigo = fs.readFileSync(path.resolve(__dirname, '../js/12_fotos-tcu.js'), 'utf8');

function prepararContexto() {
    const usuario = { bitacoraTCU: [{ id: 'entrada-1' }] };
    const fotos = new Map();
    const usuarioRef = { tipo: 'usuario' };
    const fotoRef = id => ({ tipo: 'foto', id });
    const instantanea = ref => {
        if (ref.tipo === 'usuario') return { exists: true, data: () => usuario };
        const datos = fotos.get(ref.id);
        return { exists: Boolean(datos), data: () => datos, id: ref.id, ref };
    };
    const coleccion = {
        doc: fotoRef,
        where: (campo, operador, valor) => ({
            get: async () => ({
                docs: [...fotos.entries()]
                    .filter(([, datos]) => datos[campo] === valor)
                    .map(([id]) => instantanea(fotoRef(id)))
            })
        }),
        get: async () => ({ docs: [...fotos.keys()].map(id => instantanea(fotoRef(id))) })
    };
    const db = {
        collection: () => ({
            doc: () => ({
                ...usuarioRef,
                collection: () => coleccion,
                get: async () => instantanea(usuarioRef)
            })
        }),
        runTransaction: async accion => {
            const cambios = [];
            const transaccion = {
                get: async ref => instantanea(ref),
                set: (ref, datos) => cambios.push(() => fotos.set(ref.id, datos)),
                delete: ref => cambios.push(() => fotos.delete(ref.id))
            };
            const resultado = await accion(transaccion);
            cambios.forEach(cambio => cambio());
            return resultado;
        }
    };
    const contexto = vm.createContext({
        Blob,
        Uint8Array,
        crypto: webcrypto,
        db,
        firebase: {
            firestore: {
                Blob: {
                    fromUint8Array: bytes => ({ toUint8Array: () => bytes })
                }
            }
        },
        usuarioActual: { uid: 'cuenta-1' },
        console
    });
    vm.runInContext(codigo, contexto, { filename: 'js/12_fotos-tcu.js' });
    vm.runInContext('fotosPendientesTCU = async () => []', contexto);
    vm.runInContext('eliminarFotoLocalTCU = async () => {}', contexto);
    return { contexto, usuario, fotos };
}

function foto(id = 'foto-1') {
    return {
        id,
        uid: 'cuenta-1',
        entradaId: 'entrada-1',
        nombre: 'evidencia.jpg',
        creadaEn: 1000,
        blob: new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' })
    };
}

test('la eliminación deja una marca y un reintento no revive la foto', async () => {
    const { contexto, fotos } = prepararContexto();
    await contexto.subirFotoTCU(foto());
    assert.equal(fotos.get('foto-1').eliminada, false);
    await contexto.eliminarFotoTCU('cuenta-1', 'entrada-1', 'foto-1');
    assert.equal(fotos.get('foto-1').eliminada, true);
    assert.equal(fotos.get('foto-1').bytes.toUint8Array().length, 0);
    await assert.rejects(contexto.subirFotoTCU(foto()), /eliminada/);
    assert.equal(fotos.get('foto-1').eliminada, true);
});

test('no migra una foto si su actividad fue borrada en otra pestaña', async () => {
    const { contexto, usuario, fotos } = prepararContexto();
    usuario.bitacoraTCU = [];
    await assert.rejects(contexto.subirFotoTCU(foto()), /actividad ya no existe/);
    assert.equal(fotos.size, 0);
});

test('si falla la copia local no inicia una carga que podría quedar a medias', async () => {
    const { contexto, fotos } = prepararContexto();
    vm.runInContext('guardarFotosLocalesTCU = async () => { throw new Error("Sin espacio"); }', contexto);
    await assert.rejects(contexto.guardarFotosTCU([foto()]), error => {
        assert.equal(error.fotosEnEspera, false);
        return true;
    });
    assert.equal(fotos.size, 0);
});

test('si falla la red después de conservar la copia local, queda pendiente de sincronizar', async () => {
    const { contexto } = prepararContexto();
    vm.runInContext('guardarFotosLocalesTCU = async () => {}; subirFotoTCU = async () => { throw new Error("Sin red"); }', contexto);
    await assert.rejects(contexto.guardarFotosTCU([foto()]), error => {
        assert.equal(error.fotosEnEspera, true);
        return true;
    });
});

test('restablecer borra fotos huérfanas pero conserva las de una actividad nueva en otra pestaña', async () => {
    const { contexto, fotos } = prepararContexto();
    fotos.set('anterior', { entradaId: 'entrada-borrada', eliminada: false });
    fotos.set('nueva', { entradaId: 'entrada-1', eliminada: false });
    await contexto.eliminarFotosTCUDeUsuario('cuenta-1');
    assert.equal(fotos.has('anterior'), false);
    assert.equal(fotos.has('nueva'), true);
});

test('la limpieza local relee el servidor después de encontrar una foto nueva en otra pestaña', async () => {
    const { contexto, usuario } = prepararContexto();
    usuario.bitacoraTCU = [];
    contexto.estadoPrueba = usuario;
    contexto.eliminadasLocales = [];
    vm.runInContext(`
        fotosPendientesTCU = async () => {
            estadoPrueba.bitacoraTCU = [{ id: 'entrada-nueva' }];
            return [{ id: 'foto-nueva', entradaId: 'entrada-nueva' }];
        };
        eliminarFotoLocalTCU = async (_uid, _entradaId, id) => { eliminadasLocales.push(id); };
    `, contexto);
    await contexto.eliminarFotosTCUDeUsuario('cuenta-1');
    assert.deepEqual(contexto.eliminadasLocales, []);
});
