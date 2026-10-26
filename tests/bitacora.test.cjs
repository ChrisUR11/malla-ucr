const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const codigo = fs.readFileSync(path.resolve(__dirname, '../js/12_bitacora-tcu.js'), 'utf8');

function prepararContexto() {
    const elementos = {
        'tcu-fecha': { value: '2026-10-24' },
        'tcu-horas': { value: '1.5' },
        'tcu-actividad': { value: 'Actividad TCU' },
        'tcu-fotos': { files: [], value: '' },
        'btn-guardar-tcu': { disabled: false }
    };
    const avisos = [];
    const guardados = [];
    const fotosGuardadas = [];
    const fotosEliminadas = [];
    let aceptarGuardado = true;
    const contexto = vm.createContext({
        bitacoraTCU: [],
        editandoTCUIndex: -1,
        usuarioActual: { uid: 'cuenta-1' },
        versionSesion: 1,
        mallaSeleccionada: 'informatica',
        TOTAL_HORAS_TCU: 300,
        $: id => elementos[id],
        requiereSesion: () => true,
        obtenerTexto: valor => String(valor ?? '').trim(),
        fechaValida: fecha => /^\d{4}-\d{2}-\d{2}$/.test(fecha),
        mostrarAviso: (titulo, mensaje) => { avisos.push([titulo, mensaje]); return Promise.resolve(); },
        mostrarConfirmacion: async () => true,
        mostrarModalSeleccionMalla() {},
        crearIdTCU: () => 'id-generado',
        prepararFotosTCU: async (uid, entradaId, archivos) => [{ uid, entradaId, archivos }],
        guardarFotosTCU: async fotos => { fotosGuardadas.push(...fotos); },
        eliminarFotosTCUDeEntrada: async (uid, entradaId) => { fotosEliminadas.push([uid, entradaId]); },
        copiarDatos: datos => JSON.parse(JSON.stringify(datos)),
        mutarBitacoraEnFirebase: async operacion => {
            guardados.push(JSON.parse(JSON.stringify(operacion)));
            if (!aceptarGuardado) return null;
            const lista = [...contexto.bitacoraTCU];
            if (operacion.tipo === 'agregar') lista.push(operacion.entrada);
            if (operacion.tipo === 'editar') {
                const indice = lista.findIndex(item => item.id === operacion.anterior.id);
                lista[indice] = operacion.entrada;
            }
            if (operacion.tipo === 'eliminar') {
                const indice = lista.findIndex(item => item.id === operacion.anterior.id);
                lista.splice(indice, 1);
            }
            contexto.bitacoraTCU = lista;
            return { bitacoraTCU: lista };
        },
        registrarEvento() {},
        obtenerTotalHorasTCU: () => contexto.bitacoraTCU.reduce((total, entrada) => total + entrada.horas, 0),
        limpiarFormularioTCU: () => { contexto.editandoTCUIndex = -1; },
        console
    });
    vm.runInContext(codigo, contexto, { filename: 'js/12_bitacora-tcu.js' });
    vm.runInContext('renderBitacoraTCU = () => {}', contexto);
    return { contexto, elementos, avisos, guardados, fotosGuardadas, fotosEliminadas, setGuardado: valor => { aceptarGuardado = valor; } };
}

test('TCU conserva el estado anterior si falla el guardado remoto', async () => {
    const caso = prepararContexto();
    caso.setGuardado(false);
    await caso.contexto.agregarEntradaTCU();
    assert.equal(caso.guardados.length, 1);
    assert.equal(caso.contexto.bitacoraTCU.length, 0);
    assert.equal(caso.elementos['btn-guardar-tcu'].disabled, false);
});

test('TCU valida medias horas y asocia fotos a entradas anteriores al editar', async () => {
    const caso = prepararContexto();
    caso.elementos['tcu-horas'].value = '1.25';
    await caso.contexto.agregarEntradaTCU();
    assert.equal(caso.guardados.length, 0);
    assert.match(caso.avisos[0][1], /0,5/);

    caso.contexto.bitacoraTCU = [{ fecha: '2026-10-23', horas: 2, actividad: 'Anterior' }];
    caso.contexto.editandoTCUIndex = 0;
    caso.elementos['tcu-horas'].value = '2.5';
    caso.elementos['tcu-fotos'].files = [{ name: 'foto.jpg' }];
    await caso.contexto.agregarEntradaTCU();
    assert.equal(caso.contexto.bitacoraTCU.length, 1);
    assert.equal(caso.contexto.bitacoraTCU[0].id, 'id-generado');
    assert.equal(caso.guardados[0].entrada.id, 'id-generado');
    assert.equal(caso.fotosGuardadas[0].entradaId, 'id-generado');
});

test('TCU no borra la entrada ni sus fotos si falla el guardado remoto', async () => {
    const caso = prepararContexto();
    caso.contexto.bitacoraTCU = [{ id: 'entrada-1', fecha: '2026-10-24', horas: 1, actividad: 'Actividad' }];
    caso.setGuardado(false);
    await caso.contexto.eliminarEntradaTCU(0);
    assert.equal(caso.contexto.bitacoraTCU.length, 1);
    assert.equal(caso.contexto.bitacoraTCU[0].id, 'entrada-1');
    assert.equal(caso.fotosEliminadas.length, 0);
});
