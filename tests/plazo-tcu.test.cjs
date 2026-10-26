const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const codigoDatos = fs.readFileSync(path.resolve(__dirname, '../js/06_firebase-datos.js'), 'utf8');
const codigoTCU = fs.readFileSync(path.resolve(__dirname, '../js/12_bitacora-tcu.js'), 'utf8');

function crearContexto(extra = {}) {
    const contexto = vm.createContext({
        fechaValida: fecha => /^\d{4}-\d{2}-\d{2}$/.test(fecha),
        ...extra
    });
    vm.runInContext(codigoDatos, contexto);
    vm.runInContext(codigoTCU, contexto);
    return contexto;
}

test('el plazo usa días de calendario y coincide con 10 de 360 días', () => {
    const contexto = crearContexto();
    const plazo = { inicio: '2026-10-15', limite: '2027-10-10' };
    const leer = fecha => JSON.parse(JSON.stringify(contexto.calcularResumenPlazoTCU(plazo, fecha)));

    assert.deepEqual(leer(new Date(2026, 9, 25)), {
        totalDias: 360, diasTranscurridos: 10, diasRestantes: 350
    });
    assert.equal(leer(new Date(2026, 9, 10)).diasTranscurridos, 0);
    assert.equal(leer(new Date(2027, 9, 11)).diasTranscurridos, 361);
    assert.equal(leer(new Date(2027, 9, 11)).diasRestantes, 0);
    assert.equal(contexto.calcularResumenPlazoTCU({ inicio: '2026-10-15', limite: '2026-10-15' }), null);

    const cruceHorario = contexto.calcularResumenPlazoTCU(
        { inicio: '2026-03-07', limite: '2026-03-09' }, new Date(2026, 2, 8)
    );
    assert.equal(cruceHorario.totalDias, 2);
    assert.equal(cruceHorario.diasTranscurridos, 1);
});

test('un cambio remoto de fechas no se sobrescribe sin revisar el plazo nuevo', async () => {
    const elementos = {
        'tcu-editor-fechas': { hidden: true },
        'tcu-fecha-inicio': { value: '', focus() {} },
        'tcu-fecha-limite': { value: '' },
        'tcu-guardar-fechas': { disabled: false },
        'tcu-quitar-fechas': { hidden: false }
    };
    const avisos = [];
    const conflictos = [];
    const contexto = crearContexto({
        $: id => elementos[id],
        requiereSesion: () => true,
        usuarioActual: { uid: 'cuenta-1' },
        versionSesion: 1,
        mostrarAviso: async (titulo, mensaje) => { avisos.push([titulo, mensaje]); }
    });
    contexto.renderResumenTCU = () => {};
    const servidor = { plazoTCU: { inicio: '2026-10-15', limite: '2027-10-10' } };
    vm.runInContext("plazoTCU = { inicio: '2026-10-15', limite: '2027-10-10' }", contexto);
    contexto.alternarEditorFechasTCU();
    assert.equal(elementos['tcu-editor-fechas'].hidden, false);

    servidor.plazoTCU = { inicio: '2026-10-15', limite: '2027-10-15' };
    vm.runInContext("plazoTCU = { inicio: '2026-10-15', limite: '2027-10-15' }", contexto);
    elementos['tcu-fecha-limite'].value = '2027-10-20';
    contexto.transaccionDatosUsuario = async transformar => {
        try {
            Object.assign(servidor, transformar(servidor));
            vm.runInContext(`plazoTCU = ${JSON.stringify(servidor.plazoTCU)}`, contexto);
            return servidor;
        } catch (error) {
            conflictos.push(error);
            return null;
        }
    };

    await contexto.guardarFechasTCU();
    assert.equal(conflictos.length, 1);
    assert.equal(conflictos[0].esConflicto, true);
    assert.equal(servidor.plazoTCU.limite, '2027-10-15');
    assert.equal(elementos['tcu-editor-fechas'].hidden, false);

    await contexto.guardarFechasTCU();
    assert.equal(conflictos.length, 2);
    assert.equal(servidor.plazoTCU.limite, '2027-10-15');

    contexto.cerrarEditorFechasTCU();
    contexto.alternarEditorFechasTCU();
    assert.equal(elementos['tcu-fecha-limite'].value, '2027-10-15');
    elementos['tcu-fecha-limite'].value = '2027-10-20';
    await contexto.guardarFechasTCU();
    assert.equal(servidor.plazoTCU.limite, '2027-10-20');
    assert.equal(elementos['tcu-editor-fechas'].hidden, true);
    assert.equal(elementos['tcu-guardar-fechas'].disabled, false);
    assert.equal(avisos.length, 0);

    contexto.alternarEditorFechasTCU();
    await contexto.quitarFechasTCU();
    assert.deepEqual(JSON.parse(JSON.stringify(servidor.plazoTCU)), { inicio: '', limite: '' });
    assert.equal(elementos['tcu-editor-fechas'].hidden, true);

    contexto.alternarEditorFechasTCU();
    elementos['tcu-fecha-inicio'].value = '2026-10-15';
    await contexto.guardarFechasTCU();
    assert.equal(avisos.at(-1)[0], 'Fechas incompletas');
    assert.deepEqual(JSON.parse(JSON.stringify(servidor.plazoTCU)), { inicio: '', limite: '' });
});

test('una sesión anterior no desbloquea el guardado de fechas de la sesión nueva', async () => {
    const elementos = {
        'tcu-editor-fechas': { hidden: true },
        'tcu-fecha-inicio': { value: '', focus() {} },
        'tcu-fecha-limite': { value: '' },
        'tcu-guardar-fechas': { disabled: false }
    };
    const contexto = crearContexto({
        $: id => elementos[id],
        requiereSesion: () => true,
        usuarioActual: { uid: 'cuenta-1' },
        versionSesion: 1,
        mostrarAviso: async () => {}
    });
    contexto.renderResumenTCU = () => {};
    const resolver = [];
    contexto.transaccionDatosUsuario = () => new Promise(resolve => { resolver.push(resolve); });

    contexto.alternarEditorFechasTCU();
    elementos['tcu-fecha-inicio'].value = '2026-10-15';
    elementos['tcu-fecha-limite'].value = '2027-10-10';
    const anterior = contexto.guardarFechasTCU();
    assert.equal(elementos['tcu-guardar-fechas'].disabled, true);

    contexto.versionSesion = 2;
    contexto.usuarioActual = { uid: 'cuenta-2' };
    contexto.invalidarGuardadoBitacoraTCU();
    contexto.alternarEditorFechasTCU();
    elementos['tcu-fecha-inicio'].value = '2026-10-15';
    elementos['tcu-fecha-limite'].value = '2027-10-10';
    const nueva = contexto.guardarFechasTCU();
    assert.equal(resolver.length, 2);

    resolver[0]({ plazoTCU: { inicio: '2026-10-15', limite: '2027-10-10' } });
    await anterior;
    assert.equal(elementos['tcu-guardar-fechas'].disabled, true);
    assert.equal(vm.runInContext('guardandoFechasTCU', contexto), true);

    resolver[1]({ plazoTCU: { inicio: '2026-10-15', limite: '2027-10-10' } });
    await nueva;
    assert.equal(elementos['tcu-guardar-fechas'].disabled, false);
    assert.equal(vm.runInContext('guardandoFechasTCU', contexto), false);
});
