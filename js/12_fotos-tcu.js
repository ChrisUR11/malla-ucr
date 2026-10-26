// Cada foto se guarda en un documento propio de Firestore. IndexedDB conserva
// fotos anteriores y copias pendientes hasta que el servidor confirma el envío.
const TCU_FOTOS_DB = 'malla-ucr-fotos-tcu';
const TCU_FOTOS_ALMACEN = 'fotos';
const TCU_MAX_FOTOS_ENTRADA = 5;
const TCU_MAX_BYTES_ORIGINAL = 12 * 1024 * 1024;
const TCU_MAX_BYTES_GUARDADA = 600 * 1024;
const TCU_TIPOS_FOTO = new Set(['image/jpeg', 'image/png', 'image/webp']);
let conexionFotosTCU = null;
let versionFotosTCU = 0;
let detenerEscuchaFotosTCU = null;
const urlsFotosTCU = new Set();
const sincronizacionesFotosTCU = new Map();
const depuracionesFotosTCU = new Map();
const revisionesFotosTCU = new Map();
const ultimaRevisionFotosTCU = new Map();

function crearIdTCU() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
}

function coleccionFotosTCU(uid) {
    return db.collection('usuarios').doc(uid).collection('fotosTCU');
}

function documentoUsuarioFotosTCU(uid) {
    return db.collection('usuarios').doc(uid);
}

function sesionFotosTCUValida(uid) {
    return Boolean(uid && usuarioActual?.uid === uid);
}

function abrirFotosTCU() {
    if (!('indexedDB' in globalThis)) {
        return Promise.reject(new Error('IndexedDB no está disponible'));
    }

    if (!conexionFotosTCU) {
        conexionFotosTCU = new Promise((resolve, reject) => {
            const solicitud = indexedDB.open(TCU_FOTOS_DB, 1);

            solicitud.onupgradeneeded = () => {
                const base = solicitud.result;
                const almacen = base.createObjectStore(TCU_FOTOS_ALMACEN, { keyPath: 'id' });
                almacen.createIndex('porEntrada', ['uid', 'entradaId']);
                almacen.createIndex('porUsuario', 'uid');
            };
            solicitud.onsuccess = () => {
                const base = solicitud.result;
                base.onversionchange = () => {
                    base.close();
                    conexionFotosTCU = null;
                };
                resolve(base);
            };
            solicitud.onerror = () => reject(solicitud.error);
            solicitud.onblocked = () => reject(new Error('La base de fotos está abierta en otra pestaña'));
        }).catch(error => {
            conexionFotosTCU = null;
            throw error;
        });
    }

    return conexionFotosTCU;
}

async function consultarFotosTCU(indice, clave) {
    const base = await abrirFotosTCU();
    return new Promise((resolve, reject) => {
        const transaccion = base.transaction(TCU_FOTOS_ALMACEN, 'readonly');
        const solicitud = transaccion.objectStore(TCU_FOTOS_ALMACEN).index(indice).getAll(IDBKeyRange.only(clave));
        solicitud.onsuccess = () => resolve(solicitud.result);
        solicitud.onerror = () => reject(solicitud.error);
        transaccion.onerror = () => reject(transaccion.error);
    });
}

function cargarImagenTCU(archivo) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(archivo);
        const imagen = new Image();
        imagen.onload = () => {
            URL.revokeObjectURL(url);
            resolve(imagen);
        };
        imagen.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error('No se pudo leer una de las imágenes seleccionadas'));
        };
        imagen.src = url;
    });
}

function crearJpegTCU(lienzo, calidad) {
    return new Promise(resolve => lienzo.toBlob(resolve, 'image/jpeg', calidad));
}

async function comprimirFotoTCU(archivo) {
    const imagen = await cargarImagenTCU(archivo);
    const lienzo = document.createElement('canvas');
    const contexto = lienzo.getContext('2d');
    if (!contexto) throw new Error('No se pudo procesar la imagen');

    let ladoMayor = Math.min(1600, Math.max(imagen.naturalWidth, imagen.naturalHeight));
    try {
        for (let intento = 0; intento < 8; intento += 1) {
            const escala = ladoMayor / Math.max(imagen.naturalWidth, imagen.naturalHeight);
            lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
            lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
            contexto.fillStyle = '#ffffff';
            contexto.fillRect(0, 0, lienzo.width, lienzo.height);
            contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

            for (const calidad of [0.82, 0.68, 0.52]) {
                const foto = await crearJpegTCU(lienzo, calidad);
                if (foto && foto.size <= TCU_MAX_BYTES_GUARDADA) return foto;
            }
            ladoMayor = Math.max(320, Math.round(ladoMayor * 0.78));
        }
    } finally {
        lienzo.width = 0;
        lienzo.height = 0;
    }
    throw new Error('Una foto sigue siendo demasiado grande después de reducirla');
}

async function fotosPendientesTCU(uid) {
    try {
        return await consultarFotosTCU('porUsuario', uid);
    } catch (error) {
        console.warn('No se pudieron consultar las fotos locales de TCU:', error);
        return [];
    }
}

async function prepararFotosTCU(uid, entradaId, archivos) {
    if (!archivos.length) return [];
    if (!sesionFotosTCUValida(uid)) throw new Error('La sesión cambió. Inténtalo de nuevo.');

    // El identificador estable evita que la edición de la actividad duplique sus fotos.
    const remotas = await coleccionFotosTCU(uid).where('entradaId', '==', entradaId).get();
    const pendientes = await fotosPendientesTCU(uid);
    const existentes = new Set(remotas.docs
        .filter(documento => !documento.data()?.eliminada)
        .map(documento => documento.id));
    pendientes.filter(foto => foto.entradaId === entradaId).forEach(foto => existentes.add(foto.id));
    if (existentes.size + archivos.length > TCU_MAX_FOTOS_ENTRADA) {
        throw new Error(`Se permiten hasta ${TCU_MAX_FOTOS_ENTRADA} fotos por actividad`);
    }

    const preparadas = [];
    for (const archivo of archivos) {
        if (!TCU_TIPOS_FOTO.has(archivo.type)) throw new Error('Usa fotos JPG, PNG o WebP');
        if (archivo.size > TCU_MAX_BYTES_ORIGINAL) throw new Error('Cada archivo debe ocupar menos de 12 MB');
        preparadas.push({
            id: crearIdTCU(),
            uid,
            entradaId,
            nombre: (archivo.name || 'foto-tcu').slice(0, 160),
            blob: await comprimirFotoTCU(archivo),
            creadaEn: Date.now()
        });
    }
    return preparadas;
}

async function guardarFotosLocalesTCU(fotos) {
    if (!fotos.length) return;
    const base = await abrirFotosTCU();
    return new Promise((resolve, reject) => {
        const transaccion = base.transaction(TCU_FOTOS_ALMACEN, 'readwrite');
        const almacen = transaccion.objectStore(TCU_FOTOS_ALMACEN);
        fotos.forEach(foto => almacen.put(foto));
        transaccion.oncomplete = () => resolve();
        transaccion.onerror = () => reject(transaccion.error);
        transaccion.onabort = () => reject(transaccion.error || new Error('No hay espacio para guardar las fotos'));
    });
}

async function eliminarFotoLocalTCU(uid, entradaId, fotoId) {
    const base = await abrirFotosTCU();
    return new Promise((resolve, reject) => {
        const transaccion = base.transaction(TCU_FOTOS_ALMACEN, 'readwrite');
        const almacen = transaccion.objectStore(TCU_FOTOS_ALMACEN);
        const solicitud = almacen.get(fotoId);
        solicitud.onsuccess = () => {
            const foto = solicitud.result;
            if (foto?.uid === uid && foto.entradaId === entradaId) almacen.delete(fotoId);
        };
        transaccion.oncomplete = () => resolve();
        transaccion.onerror = () => reject(transaccion.error);
        transaccion.onabort = () => reject(transaccion.error);
    });
}

async function eliminarFotosTCUPorIndice(indice, clave) {
    const base = await abrirFotosTCU();
    return new Promise((resolve, reject) => {
        const transaccion = base.transaction(TCU_FOTOS_ALMACEN, 'readwrite');
        const almacen = transaccion.objectStore(TCU_FOTOS_ALMACEN);
        const cursor = almacen.index(indice).openKeyCursor(IDBKeyRange.only(clave));
        cursor.onsuccess = () => {
            const actual = cursor.result;
            if (actual) {
                almacen.delete(actual.primaryKey);
                actual.continue();
            }
        };
        transaccion.oncomplete = () => resolve();
        transaccion.onerror = () => reject(transaccion.error);
        transaccion.onabort = () => reject(transaccion.error);
    });
}

async function subirFotoTCU(foto) {
    if (!sesionFotosTCUValida(foto.uid)) throw new Error('La sesión cambió. Inténtalo de nuevo.');
    let imagen = foto.blob;
    if (!(imagen instanceof globalThis.Blob)) throw new Error('Una foto local no se pudo leer');
    if (imagen.size > TCU_MAX_BYTES_GUARDADA || imagen.type !== 'image/jpeg') {
        imagen = await comprimirFotoTCU(imagen);
    }
    const bytes = firebase.firestore.Blob.fromUint8Array(new Uint8Array(await imagen.arrayBuffer()));
    const usuarioRef = documentoUsuarioFotosTCU(foto.uid);
    const fotoRef = coleccionFotosTCU(foto.uid).doc(foto.id);
    await db.runTransaction(async transaccion => {
        const usuario = await transaccion.get(usuarioRef);
        const existente = await transaccion.get(fotoRef);
        if (!usuario.exists || !usuario.data()?.bitacoraTCU?.some(entrada => entrada.id === foto.entradaId)) {
            throw new Error('La actividad ya no existe. No se sincronizó su foto.');
        }
        if (existente.exists) {
            const datos = existente.data();
            if (datos.eliminada) {
                const error = new Error('La foto fue eliminada en otro dispositivo.');
                error.fotoEliminada = true;
                throw error;
            }
            if (datos.entradaId !== foto.entradaId) throw new Error('El identificador de la foto ya está en uso.');
            return;
        }
        transaccion.set(fotoRef, {
            entradaId: foto.entradaId,
            nombre: (foto.nombre || 'foto-tcu').slice(0, 160),
            creadaEn: Number(foto.creadaEn) || Date.now(),
            bytes,
            eliminada: false
        });
    });
}

async function guardarFotosTCU(fotos) {
    if (!fotos.length) return;
    // Si el navegador admite IndexedDB, la copia pendiente sobrevive a un fallo de red.
    try {
        await guardarFotosLocalesTCU(fotos);
    } catch (error) {
        const fallo = new Error('No se pudieron conservar las fotos en este navegador. Inténtalo de nuevo.');
        fallo.cause = error;
        fallo.fotosEnEspera = false;
        throw fallo;
    }

    let primerError = null;
    for (const foto of fotos) {
        try {
            await subirFotoTCU(foto);
            try {
                await eliminarFotoLocalTCU(foto.uid, foto.entradaId, foto.id);
            } catch (error) {
                // Un reintento posterior escribe en el mismo documento, sin duplicar la foto.
                console.warn('La foto sincronizada aún tiene una copia local:', error);
            }
        } catch (error) {
            primerError ||= error;
        }
    }
    if (primerError) {
        primerError.fotosEnEspera = true;
        throw primerError;
    }
}

async function sincronizarFotosLocalesTCU(uid, entradasVigentes) {
    if (sincronizacionesFotosTCU.has(uid)) return sincronizacionesFotosTCU.get(uid);
    const operacion = (async () => {
        const pendientes = await fotosPendientesTCU(uid);
        let sincronizadas = 0;
        const noVigentes = pendientes.filter(foto => !entradasVigentes.has(foto.entradaId));
        if (noVigentes.length) {
            try {
                const usuarioServidor = await documentoUsuarioFotosTCU(uid).get({ source: 'server' });
                if (usuarioServidor.exists && sesionFotosTCUValida(uid)) {
                    const idsServidor = new Set(
                        (usuarioServidor.data()?.bitacoraTCU || []).map(entrada => entrada.id)
                    );
                    for (const foto of noVigentes) {
                        if (!idsServidor.has(foto.entradaId)) {
                            await eliminarFotoLocalTCU(uid, foto.entradaId, foto.id);
                        }
                    }
                }
            } catch (error) {
                // Si no se pudo verificar el servidor, se preservan las fotos locales.
                console.warn('No se pudieron verificar las fotos locales de entradas eliminadas:', error);
            }
        }
        for (const foto of pendientes) {
            // Nunca se recuperan en la nube fotos de entradas eliminadas en otra pestaña.
            if (!entradasVigentes.has(foto.entradaId)) continue;
            if (!sesionFotosTCUValida(uid)) break;
            try {
                await subirFotoTCU(foto);
                await eliminarFotoLocalTCU(uid, foto.entradaId, foto.id);
                sincronizadas += 1;
            } catch (error) {
                if (error.fotoEliminada) {
                    try {
                        await eliminarFotoLocalTCU(uid, foto.entradaId, foto.id);
                        sincronizadas += 1;
                    } catch (errorLocal) {
                        console.warn('No se pudo borrar la copia de una foto ya eliminada:', errorLocal);
                    }
                    continue;
                }
                console.warn('La foto de TCU sigue pendiente de sincronizar:', error);
            }
        }
        return sincronizadas;
    })();
    sincronizacionesFotosTCU.set(uid, operacion);
    try {
        return await operacion;
    } finally {
        if (sincronizacionesFotosTCU.get(uid) === operacion) sincronizacionesFotosTCU.delete(uid);
    }
}

async function eliminarDocumentosFotosTCU(consulta) {
    const instantanea = await consulta.get();
    for (let inicio = 0; inicio < instantanea.docs.length; inicio += 450) {
        const lote = db.batch();
        instantanea.docs.slice(inicio, inicio + 450).forEach(documento => lote.delete(documento.ref));
        await lote.commit();
    }
}

async function eliminarFotosTCUDeEntrada(uid, entradaId) {
    if (!sesionFotosTCUValida(uid)) return;
    await eliminarDocumentosFotosTCU(coleccionFotosTCU(uid).where('entradaId', '==', entradaId));
    try {
        await eliminarFotosTCUPorIndice('porEntrada', [uid, entradaId]);
    } catch (error) {
        console.warn('No se pudieron borrar las copias locales de esta entrada:', error);
    }
}

async function eliminarFotosTCUDeUsuario(uid) {
    if (!sesionFotosTCUValida(uid)) return;
    // Otra pestaña puede agregar una actividad después del restablecimiento.
    // Cada borrado verifica el documento padre actual antes de tocar su foto.
    const fotos = await coleccionFotosTCU(uid).get();
    for (const documento of fotos.docs) {
        if (!sesionFotosTCUValida(uid)) return;
        await eliminarFotoHuerfanaTCU(uid, documento.ref);
    }
    const fotosLocales = await fotosPendientesTCU(uid);
    for (const foto of fotosLocales) {
        if (!sesionFotosTCUValida(uid)) return;
        // La lista local pudo incluir una foto recién agregada en otra pestaña.
        // Su entrada se guarda en Firestore antes de guardar esa foto en IndexedDB.
        const usuarioServidor = await documentoUsuarioFotosTCU(uid).get({ source: 'server' });
        if (!usuarioServidor.exists || !sesionFotosTCUValida(uid)) return;
        const idsVigentes = new Set(
            (usuarioServidor.data()?.bitacoraTCU || []).map(entrada => entrada.id)
        );
        if (!idsVigentes.has(foto.entradaId)) {
            await eliminarFotoLocalTCU(uid, foto.entradaId, foto.id);
        }
    }
}

async function eliminarFotoTCU(uid, entradaId, fotoId) {
    if (!sesionFotosTCUValida(uid)) return;
    const documento = coleccionFotosTCU(uid).doc(fotoId);
    const pendientes = await fotosPendientesTCU(uid);
    const copia = pendientes.find(foto => foto.id === fotoId && foto.entradaId === entradaId);
    await db.runTransaction(async transaccion => {
        const instantanea = await transaccion.get(documento);
        if (instantanea.exists && instantanea.data()?.entradaId !== entradaId) return;
        const datos = instantanea.exists ? instantanea.data() : {
            entradaId,
            nombre: (copia?.nombre || 'foto-tcu').slice(0, 160),
            creadaEn: Number(copia?.creadaEn) || Date.now()
        };
        if (datos.eliminada) return;
        transaccion.set(documento, {
            entradaId: datos.entradaId,
            nombre: datos.nombre,
            creadaEn: datos.creadaEn,
            bytes: firebase.firestore.Blob.fromUint8Array(new Uint8Array()),
            eliminada: true
        });
    });
    try {
        await eliminarFotoLocalTCU(uid, entradaId, fotoId);
    } catch (error) {
        console.warn('No se pudo borrar la copia local de la foto:', error);
    }
}

function revocarURLsFotosTCU() {
    urlsFotosTCU.forEach(url => URL.revokeObjectURL(url));
    urlsFotosTCU.clear();
}

function limpiarURLsFotosTCU() {
    versionFotosTCU += 1;
    if (detenerEscuchaFotosTCU) detenerEscuchaFotosTCU();
    detenerEscuchaFotosTCU = null;
    revocarURLsFotosTCU();
}

function crearTarjetaFotoTCU(foto, uid, pendiente) {
    if (!(foto.blob instanceof globalThis.Blob)) return null;
    const url = URL.createObjectURL(foto.blob);
    urlsFotosTCU.add(url);

    const figura = document.createElement('div');
    figura.className = 'tcu-foto';
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.target = '_blank';
    enlace.rel = 'noopener noreferrer';
    enlace.setAttribute('aria-label', `Abrir foto ${foto.nombre}`);
    const imagen = document.createElement('img');
    imagen.src = url;
    imagen.alt = foto.nombre || 'Foto de la actividad';
    imagen.loading = 'lazy';
    enlace.appendChild(imagen);

    const acciones = document.createElement('div');
    acciones.className = 'tcu-foto-acciones';
    const descargar = document.createElement('a');
    descargar.href = url;
    descargar.download = `${(foto.nombre || 'foto-tcu').replace(/[\\/]/g, '_').replace(/\.[^.]+$/, '')}.jpg`;
    descargar.textContent = 'Descargar';
    const eliminar = document.createElement('button');
    eliminar.type = 'button';
    eliminar.textContent = 'Eliminar';
    eliminar.setAttribute('aria-label', `Eliminar foto ${foto.nombre}`);
    eliminar.addEventListener('click', async () => {
        const confirmado = await mostrarConfirmacion({
            titulo: 'Eliminar foto',
            mensaje: '¿Quieres eliminar esta foto de tu cuenta y de este navegador?',
            textoAceptar: 'Eliminar',
            peligro: true
        });
        if (!confirmado || !sesionFotosTCUValida(uid)) return;
        try {
            await eliminarFotoTCU(uid, foto.entradaId, foto.id);
            if (sesionFotosTCUValida(uid)) renderBitacoraTCU();
        } catch (error) {
            console.error('Error eliminando foto TCU:', error);
            mostrarAviso('No se pudo eliminar la foto', 'Comprueba la conexión y vuelve a intentarlo.');
        }
    });
    acciones.append(descargar, eliminar);
    figura.append(enlace, acciones);
    if (pendiente) {
        const aviso = document.createElement('small');
        aviso.className = 'tcu-foto-pendiente';
        aviso.textContent = 'Pendiente de sincronizar';
        figura.appendChild(aviso);
    }
    return figura;
}

function convertirFotosRemotasTCU(instantanea) {
    return instantanea.docs.flatMap(documento => {
        const datos = documento.data();
        if (!datos?.entradaId || datos.eliminada || !datos.bytes?.toUint8Array) return [];
        return [{
            id: documento.id,
            entradaId: datos.entradaId,
            nombre: datos.nombre || 'foto-tcu',
            creadaEn: Number(datos.creadaEn) || 0,
            blob: new globalThis.Blob([datos.bytes.toUint8Array()], { type: 'image/jpeg' })
        }];
    });
}

function eliminarFotoHuerfanaTCU(uid, referenciaFoto) {
    return db.runTransaction(async transaccion => {
        const usuario = await transaccion.get(documentoUsuarioFotosTCU(uid));
        const foto = await transaccion.get(referenciaFoto);
        if (!foto.exists) return false;
        const entradaId = foto.data()?.entradaId;
        if (usuario.exists && usuario.data()?.bitacoraTCU?.some(entrada => entrada.id === entradaId)) return false;
        transaccion.delete(referenciaFoto);
        return true;
    });
}

async function depurarFotosHuerfanasTCU(uid, documentos, entradasVigentes) {
    if (depuracionesFotosTCU.has(uid)) return depuracionesFotosTCU.get(uid);
    const candidatas = documentos.filter(documento => !entradasVigentes.has(documento.data()?.entradaId));
    if (!candidatas.length) return 0;
    const operacion = (async () => {
        let eliminadas = 0;
        for (const documento of candidatas) {
            if (!sesionFotosTCUValida(uid)) break;
            try {
                if (await eliminarFotoHuerfanaTCU(uid, documento.ref)) eliminadas += 1;
            } catch (error) {
                console.warn('No se pudo depurar una foto de una actividad eliminada:', error);
            }
        }
        return eliminadas;
    })();
    depuracionesFotosTCU.set(uid, operacion);
    try {
        return await operacion;
    } finally {
        if (depuracionesFotosTCU.get(uid) === operacion) depuracionesFotosTCU.delete(uid);
    }
}

async function reintentarFotosTCU(uid) {
    if (!sesionFotosTCUValida(uid)) return;
    if (revisionesFotosTCU.has(uid)) return revisionesFotosTCU.get(uid);
    if (Date.now() - (ultimaRevisionFotosTCU.get(uid) || 0) < 60_000) return;
    const operacion = (async () => {
        const entradasVigentes = new Set((bitacoraTCU || []).map(entrada => entrada.id).filter(Boolean));
        const instantanea = await coleccionFotosTCU(uid).get({ source: 'server' });
        if (!sesionFotosTCUValida(uid)) return;
        await depurarFotosHuerfanasTCU(uid, instantanea.docs, entradasVigentes);
        await sincronizarFotosLocalesTCU(uid, entradasVigentes);
        ultimaRevisionFotosTCU.set(uid, Date.now());
    })();
    const controlada = operacion.catch(error => {
        console.warn('Las fotos de TCU siguen pendientes de sincronizar o limpiar:', error);
    }).finally(() => {
        if (revisionesFotosTCU.get(uid) === controlada) revisionesFotosTCU.delete(uid);
    });
    revisionesFotosTCU.set(uid, controlada);
    return controlada;
}

function pintarFotosTCU(contenedores, uid) {
    limpiarURLsFotosTCU();
    if (!uid || !sesionFotosTCUValida(uid)) return;
    const version = versionFotosTCU;
    const entradasVigentes = new Set(contenedores.keys());
    let remotas = [];
    let errorRemoto = null;
    let versionVista = 0;

    async function actualizarVista() {
        const actual = ++versionVista;
        const locales = await fotosPendientesTCU(uid);
        if (actual !== versionVista || version !== versionFotosTCU || !sesionFotosTCUValida(uid)) return;
        revocarURLsFotosTCU();
        contenedores.forEach(contenedor => { contenedor.textContent = ''; });
        const fotosRemotas = new Set(remotas.map(foto => foto.id));
        const fotos = [
            ...remotas.map(foto => ({ ...foto, pendiente: false })),
            ...locales
                .filter(foto => entradasVigentes.has(foto.entradaId) && !fotosRemotas.has(foto.id))
                .map(foto => ({ ...foto, pendiente: true }))
        ].sort((a, b) => a.creadaEn - b.creadaEn);
        for (const foto of fotos) {
            const contenedor = contenedores.get(foto.entradaId);
            if (!contenedor) continue;
            const tarjeta = crearTarjetaFotoTCU(foto, uid, foto.pendiente);
            if (tarjeta) contenedor.appendChild(tarjeta);
        }
        if (errorRemoto) {
            contenedores.forEach(contenedor => {
                const aviso = document.createElement('small');
                aviso.className = 'tcu-foto-pendiente';
                aviso.textContent = errorRemoto.code === 'permission-denied'
                    ? 'El guardado de fotos no está habilitado. Contacta al administrador.'
                    : 'No se pudieron cargar las fotos sincronizadas. Revisa la conexión.';
                contenedor.appendChild(aviso);
            });
        }
    }

    detenerEscuchaFotosTCU = coleccionFotosTCU(uid).onSnapshot(
        instantanea => {
            if (version !== versionFotosTCU || !sesionFotosTCUValida(uid)) return;
            remotas = convertirFotosRemotasTCU(instantanea);
            errorRemoto = null;
            actualizarVista();
            depurarFotosHuerfanasTCU(uid, instantanea.docs, entradasVigentes);
        },
        error => {
            if (version !== versionFotosTCU) return;
            console.error('Error sincronizando fotos TCU:', error);
            errorRemoto = error;
            actualizarVista();
        }
    );
    actualizarVista();
    sincronizarFotosLocalesTCU(uid, entradasVigentes).then(cantidad => {
        if (cantidad && version === versionFotosTCU) actualizarVista();
    }).catch(error => {
        console.warn('No se pudieron reintentar las fotos pendientes de TCU:', error);
    });
}
