// Vincula cursos aprobados de cada catálogo con los espacios optativos de su área.
// La relación se declara en cada espacio con grupoOptativa (ID de la sección catálogo).
function sincronizarOptativas() {
    if (!Array.isArray(mallaSecciones) || mallaSecciones.length === 0) return;

    const seccionCarrera = obtenerSeccionCarrera();
    const espaciosPorGrupo = new Map();

    (seccionCarrera?.ciclos || []).forEach(bloque => {
        (bloque.cursos || []).forEach(curso => {
            if (!curso.grupoOptativa) return;

            if (!espaciosPorGrupo.has(curso.grupoOptativa)) {
                espaciosPorGrupo.set(curso.grupoOptativa, []);
            }

            espaciosPorGrupo.get(curso.grupoOptativa).push(curso);

            // Los valores heredados se reconstruyen cada vez. Así, desmarcar una
            // opción también elimina su vínculo anterior y su nota del guardado.
            if (estadoCursos[curso.codigo]?.heredado) {
                delete estadoCursos[curso.codigo];
            }
        });
    });

    mallaSecciones.forEach(seccion => {
        const espacios = espaciosPorGrupo.get(seccion.id);
        if (!espacios) return;

        const opcionesAprobadas = (seccion.ciclos || [])
            .flatMap(bloque => bloque.cursos || [])
            .filter(curso => estadoCursos[curso.codigo]?.aprobado && Number(curso.creditos) > 0);
        const opcionesUsadas = new Set();

        espacios.forEach(espacio => {
            // La aprobación manual de un espacio se conserva por compatibilidad
            // con los datos que ya hayan guardado los usuarios.
            if (estadoCursos[espacio.codigo]?.aprobado) return;

            const creditosNecesarios = Number(espacio.creditos) || 0;
            const disponibles = opcionesAprobadas.filter(curso => !opcionesUsadas.has(curso.codigo));
            const seleccion = elegirOpcionesParaEspacio(disponibles, creditosNecesarios);
            if (!seleccion) return;

            seleccion.forEach(curso => opcionesUsadas.add(curso.codigo));

            const notas = seleccion.map(curso => obtenerNotaNumerica(curso.codigo));
            const tieneTodasLasNotas = notas.every(nota => nota !== null && nota >= 7);
            const nuevoEstado = {
                aprobado: true,
                heredado: true,
                origenes: seleccion.map(curso => curso.codigo)
            };

            if (tieneTodasLasNotas) {
                const creditosTotales = seleccion.reduce((total, curso) => total + Number(curso.creditos), 0);
                nuevoEstado.nota = seleccion.reduce((total, curso, index) => {
                    return total + notas[index] * Number(curso.creditos);
                }, 0) / creditosTotales;
            }

            estadoCursos[espacio.codigo] = nuevoEstado;
        });
    });

    // Las secciones catálogo no suman al progreso general; el indicador antiguo
    // puede impedir que aparezcan sus notas en los cálculos de su propia sección.
    mallaSecciones
        .filter(seccion => espaciosPorGrupo.has(seccion.id))
        .forEach(seccion => (seccion.ciclos || []).forEach(bloque => {
            (bloque.cursos || []).forEach(curso => {
                if (estadoCursos[curso.codigo]) {
                    delete estadoCursos[curso.codigo].ignorarEnCalculo;
                }
            });
        }));
}

function elegirOpcionesParaEspacio(opciones, creditosNecesarios) {
    if (creditosNecesarios <= 0) return null;

    // Solo completar el espacio con una suma exacta. Una materia de más
    // créditos no prueba por sí sola la equivalencia curricular de ese bloque.
    const combinaciones = new Map([[0, []]]);

    opciones.forEach(curso => {
        const creditos = Number(curso.creditos);
        if (!Number.isFinite(creditos) || creditos <= 0) return;

        // Copia de las sumas previas para que un mismo curso no se use dos veces.
        [...combinaciones.entries()].forEach(([suma, seleccion]) => {
            const nuevaSuma = suma + creditos;
            if (nuevaSuma > creditosNecesarios) return;

            const anterior = combinaciones.get(nuevaSuma);
            if (!anterior || anterior.length > seleccion.length + 1) {
                combinaciones.set(nuevaSuma, [...seleccion, curso]);
            }
        });
    });

    return combinaciones.get(creditosNecesarios) || null;
}
