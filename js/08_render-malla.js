// --- Render de la malla ---
function renderTabsMalla() {
    const contenedorTabs = $('malla-tabs');

    if (!contenedorTabs) return;

    contenedorTabs.innerHTML = '';

    if (!mallaSecciones || mallaSecciones.length <= 1) {
        contenedorTabs.style.display = 'none';
        return;
    }

    contenedorTabs.style.display = 'flex';

    mallaSecciones.forEach(seccion => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'malla-tab';
        boton.textContent = seccion.titulo;

        if (seccion.id === seccionActivaMalla) {
            boton.classList.add('activo');
        }

        boton.addEventListener('click', () => cambiarSeccionMalla(seccion.id));
        contenedorTabs.appendChild(boton);
    });
}

function cambiarSeccionMalla(idSeccion) {
    const seccion = mallaSecciones.find(item => item.id === idSeccion);

    if (!seccion) return;
    if (seccionActivaMalla === idSeccion) return;

    const seccionAnterior = seccionActivaMalla;
    seccionActivaMalla = idSeccion;

    registrarEvento('cambiar_seccion_malla', {
        seccion_anterior: seccionAnterior || 'sin_seccion',
        seccion_destino: idSeccion,
        titulo_seccion: seccion.titulo || 'Sin título'
    });

    renderMalla();
}

function renderInfoLicenciatura() {
    const banner = $('malla-info-banner');

    if (!banner) return;

    const licenciatura = datosMallaActual?.licenciatura;

    if (!licenciatura?.tiene) {
        banner.style.display = 'none';
        banner.innerHTML = '';
        return;
    }

    banner.style.display = 'block';
    banner.innerHTML = `
        <strong>Licenciatura:</strong>
        ${licenciatura.ubicacion || 'Esta malla incluye tramo de licenciatura.'}
        ${licenciatura.descripcion ? `<span>${licenciatura.descripcion}</span>` : ''}
    `;
}

function calcularResumenProgreso() {
    const codigosContados = new Set();
    let creditosAprobados = 0;
    let sumaNotas = 0;
    let sumaCreditosNotas = 0;

    obtenerSeccionesProgreso().forEach(seccion => {
        const ciclos = Array.isArray(seccion.ciclos) ? seccion.ciclos : [];

        ciclos.forEach(bloque => {
            const cursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

            cursos.forEach(curso => {
                if (!curso?.codigo || codigosContados.has(curso.codigo)) return;

                codigosContados.add(curso.codigo);

                const creditos = Number(curso.creditos) || 0;
                const estado = estadoCursos[curso.codigo] || {};

                if (estado.aprobado) {
                    creditosAprobados += creditos;

                    if (creditos > 0 && estado.nota != null && estado.nota !== '') {
                        sumaNotas += Number(estado.nota) * creditos;
                        sumaCreditosNotas += creditos;
                    }
                }
            });
        });
    });

    const promedioGlobal = sumaCreditosNotas > 0 ? sumaNotas / sumaCreditosNotas : 0;
    const creditosFaltantes = Math.max(totalCreditosCarrera - creditosAprobados, 0);
    const porcentajeAvance = totalCreditosCarrera > 0
        ? Math.min((creditosAprobados / totalCreditosCarrera) * 100, 100)
        : 0;

    return {
        creditosAprobados,
        creditosFaltantes,
        promedioGlobal,
        porcentajeAvance
    };
}

function actualizarResumenAcademico() {
    const resumen = calcularResumenProgreso();

    setText('creditos-aprobados', resumen.creditosAprobados);
    setText('creditos-faltantes', resumen.creditosFaltantes);
    setText('promedio', resumen.promedioGlobal.toFixed(2).replace('.', ','));
    setText('porcentaje-avance', `${resumen.porcentajeAvance.toFixed(1).replace('.', ',')}%`);
    setText('total-creditos-carrera', totalCreditosCarrera);

    const progressBar = $('progress-bar-fill');

    if (progressBar) {
        progressBar.style.width = `${resumen.porcentajeAvance}%`;
    }
}

function obtenerTituloCiclo(bloque) {
    if (bloque.titulo) return bloque.titulo;

    return typeof bloque.ciclo === 'number'
        ? `Ciclo ${bloque.ciclo}`
        : String(bloque.ciclo || 'Bloque de cursos');
}

function obtenerClaseTipoCurso(curso) {
    const tipo = obtenerTexto(curso.tipo).toLowerCase();

    if (tipo.includes('opt')) return 'optativo';
    if (tipo.includes('complement')) return 'complementario';
    if (tipo.includes('licenciatura')) return 'licenciatura';
    if (curso.codigo?.startsWith('OPT')) return 'optativo';
    if (curso.codigo?.startsWith('RP-')) return 'complementario';

    return '';
}

function renderMalla() {
    const contenedor = $('malla');

    if (!contenedor) return;

    contenedor.innerHTML = '';
    renderTabsMalla();
    renderInfoLicenciatura();
    actualizarResumenAcademico();

    if (typeof actualizarEstadoBotonTCU === 'function') {
        actualizarEstadoBotonTCU();
    }

    const seccionActiva = obtenerSeccionActiva();
    const ciclosMostrar = Array.isArray(seccionActiva?.ciclos) ? seccionActiva.ciclos : [];

    const tituloSeccion = $('titulo-seccion-malla');
    if (tituloSeccion) {
        tituloSeccion.textContent = seccionActiva?.titulo || 'Ciclos y cursos';
    }

    if (!seccionActiva || ciclosMostrar.length === 0) {
        const mensaje = document.createElement('div');
        mensaje.className = 'ciclo mensaje-vacio';
        mensaje.innerHTML = `
            <div class="ciclo-header">
                <div class="ciclo-header-text">
                    <h2>${mallaSeleccionada ? 'Sin cursos en esta sección' : 'Selecciona una malla'}</h2>
                    <div class="ciclo-info">
                        <span>${mallaSeleccionada ? 'Esta sección no tiene cursos registrados.' : 'Inicia sesión y selecciona tu carrera para cargar los cursos.'}</span>
                    </div>
                </div>
            </div>
        `;

        contenedor.appendChild(mensaje);
        return;
    }

    if (seccionActiva.descripcion) {
        const descripcion = document.createElement('div');
        descripcion.className = 'seccion-descripcion';
        descripcion.textContent = seccionActiva.descripcion;
        contenedor.appendChild(descripcion);
    }

    const resumenCiclos = ciclosMostrar.map(bloque => {
        let totalCreditos = 0;
        let creditosAprobados = 0;

        const cursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

        cursos.forEach(curso => {
            const creditos = Number(curso.creditos) || 0;
            totalCreditos += creditos;

            const estado = estadoCursos[curso.codigo] || {};

            if (estado.aprobado) {
                creditosAprobados += creditos;
            }
        });

        const datosPonderado = calcularPonderadoBloque(bloque);

        return {
            ciclo: bloque.ciclo,
            totalCreditos,
            creditosAprobados,
            ponderado: datosPonderado.ponderado,
            cursosConNota: datosPonderado.cursosConNota,
            totalCursosConCredito: datosPonderado.totalCursosConCredito
        };
    });

    ciclosMostrar.forEach((bloque, index) => {
        const divCiclo = document.createElement('div');
        divCiclo.className = 'ciclo';

        const header = document.createElement('div');
        header.className = 'ciclo-header';

        const headerText = document.createElement('div');
        headerText.className = 'ciclo-header-text';

        const titulo = document.createElement('h2');
        titulo.textContent = obtenerTituloCiclo(bloque);

        const info = document.createElement('div');
        info.className = 'ciclo-info';
        info.innerHTML = `
            <span><strong>Créditos:</strong> ${resumenCiclos[index].totalCreditos}</span>
            <span><strong>Ponderado aprobado:</strong> ${formatearPonderado(resumenCiclos[index].ponderado)}</span>
        `;
        headerText.appendChild(titulo);
        headerText.appendChild(info);

        header.appendChild(headerText);

        //if (seccionActiva.mostrarPromedio && typeof bloque.ciclo === 'number') {
        //    const btnPromedio = document.createElement('button');
        //    btnPromedio.type = 'button';
        //    btnPromedio.className = 'btn-promedio-header';
        //    btnPromedio.textContent = 'Ponderado del ciclo';
        //    btnPromedio.addEventListener('click', () => abrirModalPromedio(bloque.ciclo));
        //   header.appendChild(btnPromedio);
        //}

        divCiclo.appendChild(header);

        const cursos = Array.isArray(bloque.cursos) ? bloque.cursos : [];

        cursos.forEach(curso => {
            const estado = estadoCursos[curso.codigo] || { aprobado: false, nota: '' };
            const puedeTomarse = puedeTomarseCurso(curso);
            const claseTipo = obtenerClaseTipoCurso(curso);

            const divCurso = document.createElement('div');
            divCurso.className = 'curso';

            if (!puedeTomarse) divCurso.classList.add('bloqueado');
            if (estado.aprobado) divCurso.classList.add('aprobado');
            if (claseTipo) divCurso.classList.add(claseTipo);

            const cursoMain = document.createElement('div');
            cursoMain.className = 'curso-main';

            const label = document.createElement('label');
            label.className = 'nombre';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = Boolean(estado.aprobado);
            checkbox.addEventListener('change', () => toggleCurso(curso.codigo, checkbox.checked));

            const nombre = document.createElement('span');
            nombre.className = 'curso-nombre';
            nombre.textContent = curso.nombre;

            const codigo = document.createElement('span');
            codigo.className = 'curso-codigo';
            codigo.textContent = `(${curso.codigo})`;

            label.appendChild(checkbox);
            label.appendChild(nombre);
            label.appendChild(codigo);
            cursoMain.appendChild(label);

            if (curso.tipo) {
                const tipo = document.createElement('div');
                tipo.className = 'curso-tipo';
                tipo.textContent = curso.tipo;
                cursoMain.appendChild(tipo);
            }

            const requisitosTexto = [];

            if (curso.requisitos) requisitosTexto.push(`Req: ${curso.requisitos.join(', ')}`);
            if (curso.correquisitos) requisitosTexto.push(`Co-req: ${curso.correquisitos.join(', ')}`);

            if (requisitosTexto.length > 0) {
                const requisitos = document.createElement('div');
                requisitos.className = 'requisitos';
                requisitos.textContent = requisitosTexto.join(' | ');
                cursoMain.appendChild(requisitos);
            }

            const cursoSide = document.createElement('div');
            cursoSide.className = 'curso-side';

            const creditos = document.createElement('div');
            creditos.className = 'creditos';
            creditos.textContent = `${curso.creditos} créditos`;

            cursoSide.appendChild(creditos);

            const notaDiv = document.createElement('div');
            notaDiv.className = 'nota';

            if (curso.creditos > 0) {
                const btnNota = document.createElement('button');
                btnNota.type = 'button';
                btnNota.className = 'btn-nota';

                const tieneNota = tieneNotaRegistrada(curso.codigo);

                btnNota.textContent = tieneNota
                    ? formatearNota(estado.nota)
                    : estado.aprobado
                        ? 'Agregar nota'
                        : 'Aprobar primero';

                if (!estado.aprobado && !tieneNota) {
                    btnNota.disabled = true;
                    btnNota.classList.add('btn-nota-disabled');
                    btnNota.title = 'Primero debes marcar el curso como aprobado para agregar una nota.';
                } else {
                    btnNota.addEventListener('click', () => abrirModal(curso.codigo, curso.nombre));
                }

                notaDiv.appendChild(btnNota);
            } else {
                notaDiv.textContent = 'Sin nota';
                notaDiv.style.fontSize = '0.75rem';
                notaDiv.style.color = '#78909c';
                notaDiv.style.textAlign = 'right';
                notaDiv.style.marginTop = '6px';
                notaDiv.style.fontWeight = '500';
            }

            cursoSide.appendChild(notaDiv);

            divCurso.appendChild(cursoMain);
            divCurso.appendChild(cursoSide);
            divCiclo.appendChild(divCurso);
        });

        contenedor.appendChild(divCiclo);
    });
}

