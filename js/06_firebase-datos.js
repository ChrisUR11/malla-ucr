// --- Variables Globales ---
let nombreTCU = '';
let temaOscuro = false;
const colasGuardadoPorUsuario = new Map();
const ultimaRevisionCuentaPorUsuario = new Map();
let detenerEscuchaUsuario = null;
let datosCuentaCargados = false;
let guardandoTema = false;

function copiarDatos(valor) {
    return JSON.parse(JSON.stringify(valor));
}

function sonDatosIguales(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b || !a || !b || typeof a !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    const clavesA = Object.keys(a).sort();
    const clavesB = Object.keys(b).sort();
    return clavesA.length === clavesB.length &&
        clavesA.every((clave, index) => clave === clavesB[index] && sonDatosIguales(a[clave], b[clave]));
}

function crearErrorConflicto(mensaje) {
    const error = new Error(mensaje);
    error.esConflicto = true;
    return error;
}

// La función transformar no modifica variables globales: Firestore puede
// ejecutarla varias veces si otra pestaña cambió el documento entretanto.
async function transaccionDatosUsuario(transformar, mallaEsperada = mallaSeleccionada) {
    if (!usuarioActual) {
        mostrarModalLogin();
        return null;
    }
    if (!datosCuentaCargados) {
        mostrarAviso('Datos no cargados', 'Espera a que termine de cargarse tu cuenta antes de guardar cambios.');
        return null;
    }

    const uid = usuarioActual.uid;
    const versionInicial = versionSesion;
    const referencia = db.collection('usuarios').doc(uid);
    try {
        const colaAnterior = colasGuardadoPorUsuario.get(uid) || Promise.resolve();
        const operacion = colaAnterior.then(() => db.runTransaction(async transaccion => {
            const documento = await transaccion.get(referencia);
            const remoto = documento.exists ? documento.data() : {};
            if ((remoto.mallaSeleccionada || null) !== (mallaEsperada || null)) {
                throw crearErrorConflicto('La malla cambió en otra pestaña. Revisa los datos actualizados antes de continuar.');
            }
            const cambios = transformar(remoto);
            if (!cambios || typeof cambios !== 'object' || Array.isArray(cambios)) {
                throw new Error('No se produjeron cambios válidos.');
            }
            const datos = {
                ...cambios,
                revisionCuenta: (Number.isSafeInteger(remoto.revisionCuenta) && remoto.revisionCuenta >= 0
                    ? remoto.revisionCuenta : 0) + 1,
                actualizadoEn: firebase.firestore.FieldValue.serverTimestamp()
            };
            transaccion.set(referencia, datos, { mergeFields: Object.keys(datos) });
            return { ...remoto, ...cambios, revisionCuenta: datos.revisionCuenta };
        }));
        const colaSiguiente = operacion.catch(() => {});
        colasGuardadoPorUsuario.set(uid, colaSiguiente);
        colaSiguiente.then(() => {
            if (colasGuardadoPorUsuario.get(uid) === colaSiguiente) {
                colasGuardadoPorUsuario.delete(uid);
            }
        });
        const resultado = await operacion;
        if (usuarioActual?.uid !== uid || versionSesion !== versionInicial) return null;
        aplicarDatosCuentaRemotos(resultado);
        return resultado;
    } catch (error) {
        if (usuarioActual?.uid === uid && versionSesion === versionInicial) {
            console.error('Error guardando en Firebase:', error);
            if (error.esConflicto) {
                try {
                    const documento = await referencia.get({ source: 'server' });
                    if (usuarioActual?.uid === uid && versionSesion === versionInicial) {
                        aplicarDatosCuentaRemotos(documento.exists ? documento.data() : {});
                    }
                } catch (recargaError) {
                    console.error('No se pudieron actualizar los datos después del conflicto:', recargaError);
                }
                mostrarAviso('Cambio simultáneo', error.message);
            } else {
                mostrarAviso('Error al guardar', 'No se pudieron guardar los datos. Revisa tu conexión e inténtalo de nuevo.');
            }
        }
        return null;
    }
}

async function guardarDatosEnFirebase(datosParaGuardar) {
    if (!datosParaGuardar || typeof datosParaGuardar !== 'object') {
        throw new Error('Indica los campos concretos que se deben guardar.');
    }
    const datos = { ...datosParaGuardar };
    if ('estadoCursos' in datos) datos.estadoCursos = copiarDatos(datos.estadoCursos);
    if ('bitacoraTCU' in datos) datos.bitacoraTCU = copiarDatos(datos.bitacoraTCU);
    return Boolean(await transaccionDatosUsuario(() => datos));
}

async function mutarCursoEnFirebase(codigo, cambiarCurso, cursoEsperado) {
    return transaccionDatosUsuario(remoto => {
        const cursos = remoto.estadoCursos && typeof remoto.estadoCursos === 'object' &&
            !Array.isArray(remoto.estadoCursos) ? copiarDatos(remoto.estadoCursos) : {};
        if (typeof sincronizarOptativas === 'function') sincronizarOptativas(cursos);
        const cursoRemoto = cursos[codigo] || {};
        if (!sonDatosIguales(cursoRemoto, cursoEsperado || {})) {
            throw crearErrorConflicto('Este curso cambió en otra pestaña. Revisa su estado actualizado antes de editarlo.');
        }
        if (cursoRemoto.heredado) {
            throw crearErrorConflicto('Esta optativa ya está vinculada. Revisa la malla actualizada.');
        }
        const curso = { ...cursoRemoto };
        cambiarCurso(curso);
        cursos[codigo] = curso;
        if (typeof sincronizarOptativas === 'function') sincronizarOptativas(cursos);
        return { estadoCursos: cursos };
    });
}

async function mutarBitacoraEnFirebase({ tipo, entrada, anterior }) {
    return transaccionDatosUsuario(remoto => {
        const lista = Array.isArray(remoto.bitacoraTCU) ? copiarDatos(remoto.bitacoraTCU) : [];
        if (tipo === 'agregar') {
            if (lista.some(item => item.id === entrada.id)) {
                throw crearErrorConflicto('Esta actividad ya existe. Revisa la bitácora actualizada.');
            }
            lista.push(copiarDatos(entrada));
        } else {
            const indice = lista.findIndex(item => item.id === anterior?.id);
            if (indice < 0 || !sonDatosIguales(lista[indice], anterior)) {
                throw crearErrorConflicto('Esta actividad cambió en otra pestaña. Revisa la bitácora actualizada antes de editarla.');
            }
            if (tipo === 'editar') lista[indice] = copiarDatos(entrada);
            else if (tipo === 'eliminar') lista.splice(indice, 1);
            else throw new Error('Operación de bitácora desconocida.');
        }
        const totalHoras = lista.reduce((total, item) => total + Number(item.horas || 0), 0);
        if (!Number.isFinite(totalHoras) || totalHoras > TOTAL_HORAS_TCU) {
            throw crearErrorConflicto('El total de horas supera 300 tras los cambios de otra pestaña. Revisa la bitácora actualizada.');
        }
        return { bitacoraTCU: lista };
    });
}

function aplicarDatosCuentaRemotos(datos) {
    const uid = usuarioActual?.uid;
    const revision = Number.isSafeInteger(datos.revisionCuenta) && datos.revisionCuenta >= 0
        ? datos.revisionCuenta : 0;
    const revisionAnterior = uid ? ultimaRevisionCuentaPorUsuario.get(uid) : undefined;
    if (revisionAnterior !== undefined && revision <= revisionAnterior) return true;

    const mallaRemota = datos.mallaSeleccionada || null;
    if (mallaRemota && !window.mallasDisponibles?.[mallaRemota]) {
        console.error('La malla guardada no está disponible:', mallaRemota);
        datosCuentaCargados = false;
        return false;
    }

    if (mallaRemota !== mallaSeleccionada) {
        if (document.getElementById('modal-tcu')?.style.display === 'flex' &&
            typeof cerrarModalTCU === 'function') cerrarModalTCU();
        if (mallaRemota && !cargarMallaPorId(mallaRemota)) return false;
        if (!mallaRemota) {
            reiniciarEstadoLocal();
            datosCuentaCargados = true;
        }
        if (typeof limpiarFormularioTCU === 'function') limpiarFormularioTCU();
    }

    const bitacoraAnterior = bitacoraTCU;
    estadoCursos = datos.estadoCursos && typeof datos.estadoCursos === 'object' &&
        !Array.isArray(datos.estadoCursos) ? copiarDatos(datos.estadoCursos) : {};
    bitacoraTCU = Array.isArray(datos.bitacoraTCU) ? copiarDatos(datos.bitacoraTCU) : [];
    nombreTCU = typeof datos.nombreTCU === 'string' ? datos.nombreTCU : '';
    temaOscuro = datos.temaOscuro === true;
    aplicarTemaVisual();
    if (typeof sincronizarOptativas === 'function') sincronizarOptativas();
    if (mallaRemota) ocultarModalSeleccionMalla();
    renderMalla();
    if (!sonDatosIguales(bitacoraAnterior, bitacoraTCU) &&
        document.getElementById('modal-tcu')?.style.display === 'flex' &&
        typeof renderBitacoraTCU === 'function') renderBitacoraTCU();
    const inputNombre = document.getElementById('tcu-nombre-proyecto');
    if (inputNombre && document.activeElement !== inputNombre) {
        inputNombre.value = nombreTCU;
        inputNombre.dataset.valorOriginal = nombreTCU;
    }
    if (uid) ultimaRevisionCuentaPorUsuario.set(uid, revision);
    return true;
}

// Los registros anteriores a las fotos no tenían ID. Se les asigna uno dentro
// de una transacción para que editar/eliminar identifique la actividad exacta.
async function asignarIdsEntradasAntiguas(referencia, datosIniciales) {
    const entradas = datosIniciales?.bitacoraTCU;
    if (!Array.isArray(entradas) || entradas.every(entrada => entrada?.id)) return datosIniciales;
    return db.runTransaction(async transaccion => {
        const documento = await transaccion.get(referencia);
        if (!documento.exists) return {};
        const datos = documento.data();
        const lista = Array.isArray(datos.bitacoraTCU) ? copiarDatos(datos.bitacoraTCU) : [];
        if (lista.every(entrada => entrada?.id)) return datos;
        const ids = new Set(lista.map(entrada => entrada.id).filter(Boolean));
        lista.forEach(entrada => {
            if (entrada.id) return;
            let id;
            do { id = crearIdTCU(); } while (ids.has(id));
            entrada.id = id;
            ids.add(id);
        });
        const revisionCuenta = (Number.isSafeInteger(datos.revisionCuenta) && datos.revisionCuenta >= 0
            ? datos.revisionCuenta : 0) + 1;
        transaccion.update(referencia, { bitacoraTCU: lista, revisionCuenta });
        return { ...datos, bitacoraTCU: lista, revisionCuenta };
    });
}

async function cargarDatosDesdeFirebase(user, sesionVigente = () => usuarioActual?.uid === user.uid) {
    try {
        const referencia = db.collection('usuarios').doc(user.uid);
        const documento = await referencia.get({ source: 'server' });
        if (!sesionVigente()) return false;
        const datos = documento.exists
            ? await asignarIdsEntradasAntiguas(referencia, documento.data())
            : {};
        if (!sesionVigente()) return false;
        const aplicado = aplicarDatosCuentaRemotos(datos);
        if (aplicado && !datos.mallaSeleccionada) mostrarModalSeleccionMalla();
        return aplicado;
    } catch (error) {
        if (!sesionVigente()) return false;
        console.error('Error cargando desde Firebase:', error);
        reiniciarEstadoLocal({ mostrarSeleccion: false });
        return false;
    }
}

function iniciarEscuchaUsuario(user, sesionVigente) {
    if (detenerEscuchaUsuario) detenerEscuchaUsuario();
    detenerEscuchaUsuario = db.collection('usuarios').doc(user.uid).onSnapshot(
        { includeMetadataChanges: true },
        documento => {
            if (!sesionVigente() || !datosCuentaCargados ||
                documento.metadata.fromCache || documento.metadata.hasPendingWrites) return;
            aplicarDatosCuentaRemotos(documento.exists ? documento.data() : {});
        },
        error => {
            if (!sesionVigente()) return;
            console.error('Se perdió la sincronización de la cuenta:', error);
            datosCuentaCargados = false;
            mostrarAviso('Sincronización interrumpida', 'No se pueden recibir cambios de tu cuenta. Recarga la página para volver a sincronizar.');
        }
    );
}

function reiniciarEstadoLocal({ mostrarSeleccion = true } = {}) {
    datosCuentaCargados = false;
    document.title = 'Malla Interactiva';
    const subtitulo = document.querySelector('.header-title p');
    if (subtitulo) subtitulo.textContent = 'Selecciona tu malla curricular';

    mallaSeleccionada = null;
    mallaActual = [];
    mallaSecciones = [];
    datosMallaActual = null;
    seccionActivaMalla = 'carrera';
    totalCreditosCarrera = 0;
    estadoCursos = {};
    bitacoraTCU = [];
    nombreTCU = '';
    temaOscuro = false;
    editandoTCUIndex = -1;

    if (typeof reiniciarEstadoMotivacion === 'function') {
        reiniciarEstadoMotivacion();
    }

    aplicarTemaVisual();
    renderMalla();
    if (mostrarSeleccion) {
        mostrarModalSeleccionMalla();
    } else {
        ocultarModalSeleccionMalla();
    }
}

// --- Lógica del Modo Oscuro ---
async function toggleTemaOscuro() {
    if (!requiereSesion()) return;
    if (guardandoTema) return;

    const uid = usuarioActual.uid;
    const versionInicial = versionSesion;
    const temaAnterior = temaOscuro;
    guardandoTema = true;
    temaOscuro = !temaOscuro;
    aplicarTemaVisual();

    try {
        if (!await guardarDatosEnFirebase({ temaOscuro }) &&
            usuarioActual?.uid === uid && versionSesion === versionInicial) {
            temaOscuro = temaAnterior;
            aplicarTemaVisual();
        }
    } finally {
        if (versionSesion === versionInicial) guardandoTema = false;
    }
}

function aplicarTemaVisual() {
    const btn = document.getElementById('btn-modo-oscuro');
    if (temaOscuro) {
        document.documentElement.setAttribute('data-bs-theme', 'dark');
        if (btn) btn.textContent = 'Activar Modo Claro';
    } else {
        document.documentElement.removeAttribute('data-bs-theme');
        if (btn) btn.textContent = 'Activar Modo Oscuro';
    }
}
