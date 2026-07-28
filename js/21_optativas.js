// --- js/21_optativas.js ---

function sincronizarOptativas() {
    if (!mallaSecciones || mallaSecciones.length === 0) return;

    const codigosGenericas = [];
    const codigosEspecificas = [];

    // 1. Separar genéricas (pestaña principal) de específicas (catálogos)
    mallaSecciones.forEach((seccion, index) => {
        seccion.ciclos.forEach(ciclo => {
            ciclo.cursos.forEach(curso => {
                if (index === 0 && (curso.tipo === 'Optativa' || curso.nombre.toLowerCase().includes('optativa'))) {
                    codigosGenericas.push(curso.codigo);
                } else if (index > 0) {
                    codigosEspecificas.push(curso.codigo);
                }
            });
        });
    });

    // 2. Limpiar herencias previas (Reinicio seguro para Firebase)
    codigosGenericas.forEach(codigo => {
        if (estadoCursos[codigo] && estadoCursos[codigo].heredado) {
            // Le enviamos la orden destructiva a Firebase para limpiar la casilla genérica
            estadoCursos[codigo] = {
                aprobado: false,
                nota: firebase.firestore.FieldValue.delete(),
                heredado: firebase.firestore.FieldValue.delete(),
                origen: firebase.firestore.FieldValue.delete()
            };
        }
    });

    // 3. Buscar cuáles específicas del catálogo tienen el "check"
    const especificasAprobadas = codigosEspecificas.filter(codigo =>
        estadoCursos[codigo] && estadoCursos[codigo].aprobado
    );

    // 4. Asignar las específicas a las genéricas libres
    let indexEsp = 0;
    codigosGenericas.forEach(codigoGen => {
        const estadoGen = estadoCursos[codigoGen];

        // Si la genérica no ha sido aprobada a mano por el usuario...
        if (!estadoGen || !estadoGen.aprobado) {
            if (indexEsp < especificasAprobadas.length) {
                const codEsp = especificasAprobadas[indexEsp];
                const estadoEsp = estadoCursos[codEsp];

                estadoCursos[codigoGen] = {
                    aprobado: true,
                    nota: estadoEsp.nota || '',
                    heredado: true, // Marca de seguridad clave
                    origen: codEsp
                };
                indexEsp++;
            }
        }
    });

    // 5. Evitar el doble conteo de créditos en la base de datos
    const codigosUsados = codigosGenericas
        .map(codigo => estadoCursos[codigo] && estadoCursos[codigo].origen)
        .filter(Boolean);

    codigosEspecificas.forEach(codigo => {
        if (estadoCursos[codigo]) {
            // Si la usamos para rellenar una genérica, la escondemos de los cálculos globales
            estadoCursos[codigo].ignorarEnCalculo = codigosUsados.includes(codigo);
        }
    });
}