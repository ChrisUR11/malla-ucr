// --- Identificador de Cursos Cuello de Botella ---

const UMBRAL_CUELLO_BOTELLA_DIRECTOS = 3;
const UMBRAL_CUELLO_BOTELLA_TOTALES = 5;

function obtenerCursosParaAnalisisCuelloBotella() {
    const cursos = [];
    const codigosAgregados = new Set();

    obtenerSeccionesProgreso().forEach(seccion => {
        const ciclos = Array.isArray(seccion.ciclos) ? seccion.ciclos : [];

        ciclos.forEach(bloque => {
            const listaCursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

            listaCursos.forEach(curso => {
                if (!curso?.codigo || codigosAgregados.has(curso.codigo)) return;

                codigosAgregados.add(curso.codigo);

                cursos.push({
                    codigo: curso.codigo,
                    nombre: curso.nombre,
                    creditos: Number(curso.creditos) || 0,
                    requisitos: Array.isArray(curso.requisitos) ? curso.requisitos : [],
                    correquisitos: Array.isArray(curso.correquisitos) ? curso.correquisitos : [],
                    tipo: curso.tipo || 'Regular',
                    ciclo: bloque.ciclo ?? bloque.titulo ?? 'Sin ciclo'
                });
            });
        });
    });

    return cursos;
}

function crearMapaDependenciasCursos() {
    const cursos = obtenerCursosParaAnalisisCuelloBotella();
    const dependenciasDirectas = new Map();

    cursos.forEach(curso => {
        if (!dependenciasDirectas.has(curso.codigo)) {
            dependenciasDirectas.set(curso.codigo, new Set());
        }
    });

    cursos.forEach(curso => {
        curso.requisitos.forEach(requisito => {
            if (!dependenciasDirectas.has(requisito)) {
                dependenciasDirectas.set(requisito, new Set());
            }

            dependenciasDirectas.get(requisito).add(curso.codigo);
        });
    });

    return dependenciasDirectas;
}

function obtenerDependenciasIndirectas(codigoCurso, dependenciasDirectas, visitados = new Set()) {
    const dependientes = dependenciasDirectas.get(codigoCurso) || new Set();

    dependientes.forEach(codigoDependiente => {
        if (visitados.has(codigoDependiente)) return;

        visitados.add(codigoDependiente);
        obtenerDependenciasIndirectas(codigoDependiente, dependenciasDirectas, visitados);
    });

    return visitados;
}

function obtenerMapaCursosCuelloBotella() {
    const cursos = obtenerCursosParaAnalisisCuelloBotella();
    const dependenciasDirectas = crearMapaDependenciasCursos();
    const mapaAnalisis = new Map();

    cursos.forEach(curso => {
        const directos = dependenciasDirectas.get(curso.codigo) || new Set();
        const indirectos = obtenerDependenciasIndirectas(curso.codigo, dependenciasDirectas);
        const totalRelacionados = indirectos.size;

        const esCritico =
            directos.size >= UMBRAL_CUELLO_BOTELLA_DIRECTOS ||
            totalRelacionados >= UMBRAL_CUELLO_BOTELLA_TOTALES;

        let nivel = 'normal';

        if (totalRelacionados >= 8 || directos.size >= 5) {
            nivel = 'alto';
        } else if (esCritico) {
            nivel = 'medio';
        }

        mapaAnalisis.set(curso.codigo, {
            codigo: curso.codigo,
            nombre: curso.nombre,
            dependientesDirectos: directos.size,
            dependientesTotales: totalRelacionados,
            esCritico,
            nivel
        });
    });

    return mapaAnalisis;
}

function obtenerResumenCuelloBotella() {
    const mapa = obtenerMapaCursosCuelloBotella();

    return Array.from(mapa.values())
        .filter(item => item.esCritico)
        .sort((a, b) => {
            if (b.dependientesTotales !== a.dependientesTotales) {
                return b.dependientesTotales - a.dependientesTotales;
            }

            return b.dependientesDirectos - a.dependientesDirectos;
        });
}