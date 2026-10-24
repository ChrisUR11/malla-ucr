const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('el plan se exporta como imagen sin mostrar la plantilla en la página', async () => {
    const elementos = new Map();
    const enlaces = [];
    const crearElemento = etiqueta => ({
        etiqueta,
        style: {},
        children: [],
        classList: { add() {}, toggle() {} },
        appendChild(hijo) { this.children.push(hijo); },
        append(...hijos) { this.children.push(...hijos); },
        replaceChildren() { this.children = []; },
        click() { enlaces.push(this); }
    });
    for (const id of [
        'btn-exportar-plan', 'export-plan-fecha', 'export-plan-malla',
        'export-plan-tbody', 'export-plan-total-creditos', 'plantilla-exportar-plan',
        'proximos-correquisitos-faltantes'
    ]) elementos.set(id, crearElemento('div'));
    elementos.get('btn-exportar-plan').textContent = 'Exportar plan';
    elementos.get('plantilla-exportar-plan').style.display = 'none';

    const check = {
        checked: true,
        value: 'A',
        dataset: { nombre: '<Curso de prueba>', creditos: '0', ciclo: 'Ciclo 1' }
    };
    const checks = [check];
    let plantillaClonada;
    const documento = {
        getElementById: id => elementos.get(id) || null,
        querySelectorAll: selector => selector === '.proximo-check' ? checks : [],
        createElement: crearElemento
    };
    const contexto = vm.createContext({
        document: documento,
        $: documento.getElementById,
        mallaSeleccionada: 'malla-prueba',
        obtenerNombreMalla: () => 'Malla de prueba',
        puedeTomarseCurso: () => true,
        requiereSesion: () => true,
        setText() {},
        registrarEvento() {},
        mostrarAviso: async mensaje => { throw new Error(mensaje); },
        html2canvas: async (plantilla, opciones) => {
            assert.equal(plantilla, elementos.get('plantilla-exportar-plan'));
            assert.equal(plantilla.style.display, 'none');
            plantillaClonada = crearElemento('div');
            plantillaClonada.style.display = 'none';
            const cuerpoClonado = crearElemento('body');
            opciones.onclone({
                getElementById: () => plantillaClonada,
                body: cuerpoClonado
            });
            assert.equal(cuerpoClonado.children[0], plantillaClonada);
            return { toDataURL: () => 'data:image/png;base64,AAAA' };
        }
    });

    const archivo = path.join(__dirname, '..', 'js', '19_proximos-cursos.js');
    vm.runInContext(fs.readFileSync(archivo, 'utf8'), contexto);
    await vm.runInContext('exportarPlanProximoImagen()', contexto);

    assert.equal(plantillaClonada.style.display, 'block');
    assert.equal(elementos.get('plantilla-exportar-plan').style.display, 'none');
    assert.equal(elementos.get('btn-exportar-plan').disabled, false);
    assert.equal(enlaces.length, 1);
    assert.match(enlaces[0].download, /^plan_matricula_malla_de_prueba_\d{4}-\d{2}-\d{2}\.png$/);
    assert.equal(elementos.get('export-plan-total-creditos').textContent, '0 créditos');
    const celdaNombre = elementos.get('export-plan-tbody').children[0].children[0];
    assert.equal(celdaNombre.textContent, '<Curso de prueba>');

    check.dataset.correquisitos = '["B"]';
    const correquisito = {
        checked: false,
        value: 'B',
        dataset: { nombre: 'Curso B', creditos: '2', ciclo: 'Ciclo 1' }
    };
    checks.push(correquisito);
    vm.runInContext('actualizarResumenPlanProximo()', contexto);
    assert.equal(elementos.get('btn-exportar-plan').disabled, true);
    assert.equal(elementos.get('proximos-correquisitos-faltantes').hidden, false);
    assert.match(elementos.get('proximos-correquisitos-faltantes').textContent, /Curso B/);

    correquisito.checked = true;
    vm.runInContext('actualizarResumenPlanProximo()', contexto);
    assert.equal(elementos.get('btn-exportar-plan').disabled, false);
    assert.equal(elementos.get('proximos-correquisitos-faltantes').hidden, true);
});
