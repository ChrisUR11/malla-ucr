// Este archivo solo contiene los datos de la malla nueva de Informática Empresarial.
// Guarda este archivo en: mallas/mallaInformaticaNueva.js
// Luego agrégalo en index.html antes de script.js:
// <script src="mallas/mallaInformaticaNueva.js"></script>

window.mallasDisponibles = window.mallasDisponibles || {};

window.mallasDisponibles.informatica_empresarial_nueva = {
    id: 'informatica_empresarial_nueva',
    nombre: 'Informática Empresarial (Plan nuevo)',
    subtitulo: 'Bachillerato en Informática Empresarial - UCR - Plan 07',
    totalCreditos: 144,
    licenciatura: {
        tiene: false,
        ubicacion: 'Esta malla corresponde al Bachillerato en Informática Empresarial, código 600002, Plan 07.'
    },
    ciclos: [
        {
            ciclo: 1,
            cursos: [
                { codigo: 'EG-I', nombre: 'Curso Integrado de Humanidades I', creditos: 6 },
                { codigo: 'IF-0001', nombre: 'Desarrollo de Software I', creditos: 4 },
                { codigo: 'IF-0002', nombre: 'Introducción a la Informática Empresarial', creditos: 3 },
                { codigo: 'IF-0003', nombre: 'Matemática Básica para Informática Empresarial', creditos: 3 }
            ]
        },
        {
            ciclo: 2,
            cursos: [
                { codigo: 'EG-II', nombre: 'Curso Integrado de Humanidades II', creditos: 6, requisitos: ['EG-I'] },
                { codigo: 'EG-', nombre: 'Curso de Arte', creditos: 2 },
                { codigo: 'EF-', nombre: 'Actividad Deportiva', creditos: 0 },
                { codigo: 'IF-0004', nombre: 'Desarrollo de Software II', creditos: 4, requisitos: ['IF-0001'] },
                { codigo: 'IF-0005', nombre: 'Matemáticas Discretas para Informática Empresarial', creditos: 4, requisitos: ['IF-0003'] }
            ]
        },
        {
            ciclo: 3,
            cursos: [
                { codigo: 'SR-I', nombre: 'Seminario de Realidad Nacional I', creditos: 2, requisitos: ['EG-II'] },
                { codigo: 'IF-0006', nombre: 'Desarrollo de Software III', creditos: 4, requisitos: ['IF-0004'] },
                { codigo: 'IF-0007', nombre: 'Bases de Datos I', creditos: 4, requisitos: ['IF-0004'] },
                { codigo: 'IF-0008', nombre: 'Cálculo I para Informática Empresarial', creditos: 4, requisitos: ['IF-0003'] },
                { codigo: 'IF-3001', nombre: 'Algoritmos y Estructuras de Datos', creditos: 4, requisitos: ['IF-0004'] }
            ]
        },
        {
            ciclo: 4,
            cursos: [
                { codigo: 'SR-II', nombre: 'Seminario de Realidad Nacional II', creditos: 2, requisitos: ['SR-I'] },
                { codigo: 'IF-0009', nombre: 'Desarrollo de Software IV', creditos: 4, requisitos: ['IF-0006'] },
                { codigo: 'IF-0010', nombre: 'Bases de Datos II', creditos: 4, requisitos: ['IF-0007'] },
                { codigo: 'IF-0011', nombre: 'Redes de Computadoras', creditos: 4, requisitos: ['IF-0006'] },
                { codigo: 'IF-0012', nombre: 'Álgebra Lineal para Informática Empresarial', creditos: 4, requisitos: ['IF-0008'] }
            ]
        },
        {
            ciclo: 5,
            titulo: 'Ciclo 5 - Verano',
            cursos: [
                { codigo: 'IF-0013', nombre: 'Inglés I para Informática Empresarial', creditos: 4 }
            ]
        },
        {
            ciclo: 6,
            cursos: [
                { codigo: 'IF-0014', nombre: 'Inglés II para Informática Empresarial', creditos: 4, requisitos: ['IF-0013'] },
                { codigo: 'IF-0015', nombre: 'Introducción a la Administración de Negocios', creditos: 4, requisitos: ['IF-0002'] },
                { codigo: 'IF-0016', nombre: 'Introducción a la Estadística y Análisis de Datos', creditos: 4, requisitos: ['IF-0010'] },
                { codigo: 'IF-0017', nombre: 'Métodos Numéricos y Análisis Computacional', creditos: 3, requisitos: ['IF-0012'] },
                { codigo: 'OPT-AISC-VI', nombre: 'Área de Tendencias de Arquitectura e Infraestructura de Sistemas Computacionales', creditos: 4, tipo: 'Optativa de área' }
            ]
        },
        {
            ciclo: 7,
            cursos: [
                { codigo: 'IF-0018', nombre: 'Inglés III para Informática Empresarial', creditos: 4, requisitos: ['IF-0014'] },
                { codigo: 'IF-0019', nombre: 'Seguridad en Sistemas Informáticos', creditos: 4, requisitos: ['OPT-AISC-VI'] },
                { codigo: 'OPT-DESARROLLO-VII', nombre: 'Área de Tendencias de Desarrollo de Software', creditos: 4, tipo: 'Optativa de área' },
                { codigo: 'OPT-DATOS-VII', nombre: 'Área de Tendencias de Ingeniería de Datos', creditos: 4, tipo: 'Optativa de área' }
            ]
        },
        {
            ciclo: 8,
            titulo: 'Ciclo 8 - Verano',
            cursos: [
                { codigo: 'IF-0020', nombre: 'Inglés IV para Informática Empresarial', creditos: 4, requisitos: ['IF-0018'] }
            ]
        },
        {
            ciclo: 9,
            cursos: [
                { codigo: 'RP-', nombre: 'Repertorio', creditos: 3, tipo: 'Complementaria' },
                { codigo: 'IF-7201', nombre: 'Gestión de Proyectos', creditos: 3, requisitos: ['IF-0015'] },
                { codigo: 'OPT-GESTION-IX', nombre: 'Área de Tendencias de Gestión de la Informática en las Organizaciones', creditos: 3, tipo: 'Optativa de área' },
                { codigo: 'OPT-AISC-IX', nombre: 'Área de Tendencias de Arquitectura e Infraestructura de Sistemas Computacionales', creditos: 4, tipo: 'Optativa de área' },
                { codigo: 'OPT-DESARROLLO-IX', nombre: 'Área de Tendencias de Desarrollo de Software', creditos: 4, tipo: 'Optativa de área' }
            ]
        },
        {
            ciclo: 10,
            cursos: [
                { codigo: 'IF-0021', nombre: 'Ética y Responsabilidad Profesional', creditos: 2, requisitos: ['OPT-GESTION-IX'] },
                { codigo: 'IF-0022', nombre: 'Práctica Empresarial Supervisada', creditos: 11, requisitos: ['IF-0016', 'IF-0020', 'IF-7201', 'OPT-DESARROLLO-VII', 'OPT-AISC-VI'] },
                { codigo: 'OPT-GESTION-X', nombre: 'Área de Tendencias de Gestión de la Informática en las Organizaciones', creditos: 3, tipo: 'Optativa de área' }
            ]
        }
    ],
    seccionesExtra: [
        {
            id: 'optativas-gestion-informatica',
            titulo: 'Optativas de gestión de la informática',
            descripcion: 'Catálogo del área de tendencias de Gestión de la Informática en las Organizaciones. No suma créditos al avance porque los créditos ya están representados en la malla principal.',
            cuentaEnProgreso: false,
            mostrarPromedio: false,
            ciclos: [
                {
                    ciclo: 'GESTIÓN',
                    titulo: 'Área de Tendencias de Gestión de la Informática en las Organizaciones',
                    cursos: [
                        { codigo: 'IF-0023', nombre: 'Gobernanza de Tecnologías de Información', creditos: 3, requisitos: ['IF-0015'], tipo: 'Opción de gestión' },
                        { codigo: 'IF-0024', nombre: 'Emprendimiento y Desarrollo de Negocios', creditos: 3, requisitos: ['IF-7201'], tipo: 'Opción de gestión' },
                        { codigo: 'IF-6201', nombre: 'Informática Aplicada a los Negocios', creditos: 3, requisitos: ['IF-0015'], tipo: 'Opción de gestión' }
                    ]
                }
            ]
        },
        {
            id: 'optativas-desarrollo-software',
            titulo: 'Optativas de desarrollo de software',
            descripcion: 'Catálogo del área de tendencias de Desarrollo de Software. No suma créditos al avance porque los créditos ya están representados en la malla principal.',
            cuentaEnProgreso: false,
            mostrarPromedio: false,
            ciclos: [
                {
                    ciclo: 'DESARROLLO',
                    titulo: 'Área de Tendencias de Desarrollo de Software',
                    cursos: [
                        { codigo: 'IF-0025', nombre: 'Aseguramiento de la Calidad en la Ingeniería del Software', creditos: 4, requisitos: ['IF-0009'], tipo: 'Opción de desarrollo' },
                        { codigo: 'IF-0026', nombre: 'Interacción Humano Computador', creditos: 4, requisitos: ['IF-0009'], tipo: 'Opción de desarrollo' },
                        { codigo: 'IF-7100', nombre: 'Ingeniería de Software', creditos: 4, requisitos: ['IF-0009'], tipo: 'Opción de desarrollo' }
                    ]
                }
            ]
        },
        {
            id: 'optativas-ingenieria-datos',
            titulo: 'Optativas de ingeniería de datos',
            descripcion: 'Catálogo del área de tendencias de Ingeniería de Datos. No suma créditos al avance porque los créditos ya están representados en la malla principal.',
            cuentaEnProgreso: false,
            mostrarPromedio: false,
            ciclos: [
                {
                    ciclo: 'DATOS',
                    titulo: 'Área de Tendencias de Ingeniería de Datos',
                    cursos: [
                        { codigo: 'IF-0027', nombre: 'Inteligencia de Negocios', creditos: 4, requisitos: ['IF-0016'], tipo: 'Opción de datos' },
                        { codigo: 'IF-0028', nombre: 'Minería de Datos', creditos: 4, requisitos: ['IF-0016'], tipo: 'Opción de datos' }
                    ]
                }
            ]
        },
        {
            id: 'optativas-arquitectura-infraestructura',
            titulo: 'Optativas de arquitectura e infraestructura',
            descripcion: 'Catálogo del área de tendencias de Arquitectura e Infraestructura de Sistemas Computacionales. No suma créditos al avance porque los créditos ya están representados en la malla principal.',
            cuentaEnProgreso: false,
            mostrarPromedio: false,
            ciclos: [
                {
                    ciclo: 'ARQUITECTURA',
                    titulo: 'Área de Tendencias de Arquitectura e Infraestructura de Sistemas Computacionales',
                    cursos: [
                        { codigo: 'IF-0029', nombre: 'Sistemas Operativos y Distribuidos', creditos: 4, requisitos: ['IF-0011'], tipo: 'Opción de arquitectura' },
                        { codigo: 'IF-0030', nombre: 'Diseño de Sistemas Automatizados', creditos: 4, requisitos: ['IF-0019'], tipo: 'Opción de arquitectura' }
                    ]
                }
            ]
        }
    ]
};
