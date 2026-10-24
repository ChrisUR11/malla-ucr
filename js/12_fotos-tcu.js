// Las fotos son privadas de este navegador. Firestore solo guarda los datos de la entrada.
const TCU_FOTOS_DB = 'malla-ucr-fotos-tcu';
const TCU_FOTOS_ALMACEN = 'fotos';
const TCU_MAX_FOTOS_ENTRADA = 5;
const TCU_MAX_BYTES_ORIGINAL = 12 * 1024 * 1024;
const TCU_MAX_BYTES_GUARDADA = 2 * 1024 * 1024;
const TCU_TIPOS_FOTO = new Set(['image/jpeg', 'image/png', 'image/webp']);
let conexionFotosTCU = null;
let versionFotosTCU = 0;
const urlsFotosTCU = new Set();

function crearIdTCU() {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    const bytes = new Uint8Array(16);
    globalThis.crypto.getRandomValues(bytes);
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
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

async function comprimirFotoTCU(archivo) {
    const imagen = await cargarImagenTCU(archivo);
    const escala = Math.min(1, 1600 / Math.max(imagen.naturalWidth, imagen.naturalHeight));
    const lienzo = document.createElement('canvas');
    lienzo.width = Math.max(1, Math.round(imagen.naturalWidth * escala));
    lienzo.height = Math.max(1, Math.round(imagen.naturalHeight * escala));
    const contexto = lienzo.getContext('2d');
    if (!contexto) throw new Error('No se pudo procesar la imagen');
    contexto.fillStyle = '#ffffff';
    contexto.fillRect(0, 0, lienzo.width, lienzo.height);
    contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);
    const foto = await new Promise(resolve => lienzo.toBlob(resolve, 'image/jpeg', 0.82));
    lienzo.width = 0;
    lienzo.height = 0;
    if (!foto || foto.size > TCU_MAX_BYTES_GUARDADA) {
        throw new Error('Una foto sigue siendo demasiado grande después de reducirla');
    }
    return foto;
}

async function prepararFotosTCU(uid, entradaId, archivos) {
    if (!archivos.length) return [];
    const existentes = await consultarFotosTCU('porEntrada', [uid, entradaId]);
    if (existentes.length + archivos.length > TCU_MAX_FOTOS_ENTRADA) {
        throw new Error(`Se permiten hasta ${TCU_MAX_FOTOS_ENTRADA} fotos por actividad`);
    }

    const preparadas = [];
    for (const archivo of archivos) {
        if (!TCU_TIPOS_FOTO.has(archivo.type)) {
            throw new Error('Usa fotos JPG, PNG o WebP');
        }
        if (archivo.size > TCU_MAX_BYTES_ORIGINAL) {
            throw new Error('Cada archivo debe ocupar menos de 12 MB');
        }
        preparadas.push({
            id: crearIdTCU(),
            uid,
            entradaId,
            nombre: archivo.name,
            blob: await comprimirFotoTCU(archivo),
            creadaEn: Date.now()
        });
    }
    return preparadas;
}

async function guardarFotosTCU(fotos) {
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

function eliminarFotosTCUDeEntrada(uid, entradaId) {
    return eliminarFotosTCUPorIndice('porEntrada', [uid, entradaId]);
}

function eliminarFotosTCUDeUsuario(uid) {
    return eliminarFotosTCUPorIndice('porUsuario', uid);
}

async function eliminarFotoTCU(uid, entradaId, fotoId) {
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

function limpiarURLsFotosTCU() {
    versionFotosTCU += 1;
    urlsFotosTCU.forEach(url => URL.revokeObjectURL(url));
    urlsFotosTCU.clear();
}

async function pintarFotosTCU(contenedores, uid) {
    limpiarURLsFotosTCU();
    if (!uid || !contenedores.size) return;
    const version = versionFotosTCU;

    try {
        const fotos = await consultarFotosTCU('porUsuario', uid);
        if (version !== versionFotosTCU || usuarioActual?.uid !== uid) return;

        fotos.sort((a, b) => a.creadaEn - b.creadaEn);
        for (const foto of fotos) {
            const contenedor = contenedores.get(foto.entradaId);
            if (!contenedor || !(foto.blob instanceof Blob)) continue;
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
                    mensaje: '¿Quieres eliminar esta foto guardada en este navegador?',
                    textoAceptar: 'Eliminar',
                    peligro: true
                });
                if (!confirmado) return;
                if (usuarioActual?.uid !== uid) return;
                try {
                    await eliminarFotoTCU(uid, foto.entradaId, foto.id);
                    if (usuarioActual?.uid === uid) renderBitacoraTCU();
                } catch (error) {
                    console.error('Error eliminando foto TCU:', error);
                    mostrarAviso('No se pudo eliminar la foto', 'Revisa el almacenamiento de este navegador e inténtalo de nuevo.');
                }
            });
            acciones.append(descargar, eliminar);
            figura.append(enlace, acciones);
            contenedor.appendChild(figura);
        }
    } catch (error) {
        if (version !== versionFotosTCU) return;
        console.error('Error cargando fotos TCU:', error);
        contenedores.forEach(contenedor => {
            contenedor.textContent = 'No se pudieron cargar las fotos locales en este navegador.';
        });
    }
}
