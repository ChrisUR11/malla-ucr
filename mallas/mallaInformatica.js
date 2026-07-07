window.mallasDisponibles = window.mallasDisponibles || {};

window.mallasDisponibles.informatica_empresarial = {
    id: 'informatica_empresarial',
    nombre: 'Informática Empresarial',
    subtitulo: 'Bachillerato en Informática Empresarial - UCR',
    totalCreditos: 140,
    ciclos: [
        {
            ciclo: 1,
            cursos: [
                { codigo: 'EG-', nombre: 'Curso de Arte', creditos: 2 },
                { codigo: 'EG-I', nombre: 'Curso Integrado de Humanidades I', creditos: 6 },
                { codigo: 'IF1300', nombre: 'Introducción a la Computación e Informática', creditos: 4 },
                { codigo: 'IF1400', nombre: 'Lógica para Informáticos', creditos: 2 },
                { codigo: 'LM1030', nombre: 'Estrategias de Lectura en Inglés I', creditos: 4 }
            ]
        },
        {
            ciclo: 2,
            cursos: [
                { codigo: 'EF-', nombre: 'Actividad Deportiva', creditos: 0 },
                { codigo: 'EG-II', nombre: 'Curso Integrado de Humanidades II', creditos: 6, requisitos: ['EG-I'] },
                { codigo: 'IF2000', nombre: 'Programación I', creditos: 4, requisitos: ['IF1300'] },
                { codigo: 'LM1032', nombre: 'Estrategias de Lectura en Inglés II', creditos: 4, requisitos: ['LM1030'] },
                { codigo: 'MA0320', nombre: 'Estructuras Matemáticas Discretas', creditos: 4 }
            ]
        },
        {
            ciclo: 3,
            cursos: [
                { codigo: 'IF3000', nombre: 'Programación II', creditos: 4, requisitos: ['IF2000'] },
                { codigo: 'IF3001', nombre: 'Algoritmos y Estructuras de Datos', creditos: 4, requisitos: ['IF2000'] },
                { codigo: 'IF3100', nombre: 'Introducción a Sistemas de Información', creditos: 3, requisitos: ['IF1300'] },
                { codigo: 'MA0321', nombre: 'Cálculo Diferencial e Integral', creditos: 4 },
                { codigo: 'XS0105', nombre: 'Estadística para Informáticos', creditos: 3 }
            ]
        },
        {
            ciclo: 4,
            cursos: [
                { codigo: 'IF4000', nombre: 'Arquitectura de Computadores', creditos: 3, requisitos: ['IF3000'] },
                { codigo: 'IF4001', nombre: 'Sistemas Operativos', creditos: 4, requisitos: ['IF3000', 'IF3001'] },
                { codigo: 'IF4100', nombre: 'Fundamentos de Bases de Datos', creditos: 4, requisitos: ['IF3000'] },
                { codigo: 'IF5200', nombre: 'Fundamentos de las Organizaciones', creditos: 3, requisitos: ['IF3100'] },
                { codigo: 'MA0322', nombre: 'Álgebra Lineal', creditos: 4, requisitos: ['MA0320', 'MA0321'] }
            ]
        },
        {
            ciclo: 5,
            cursos: [
                { codigo: 'IF4101', nombre: 'Lenguajes para Aplicaciones Comerciales', creditos: 4, requisitos: ['IF3100', 'IF4100'] },
                { codigo: 'IF5000', nombre: 'Redes y Comunicaciones de Datos', creditos: 4, requisitos: ['IF4001'] },
                { codigo: 'IF5100', nombre: 'Administración de Bases de Datos', creditos: 4, requisitos: ['IF4100'] },
                { codigo: 'MA0323', nombre: 'Métodos Numéricos', creditos: 4, requisitos: ['MA0322'] },
                { codigo: 'SR-I', nombre: 'Seminario de Realidad Nacional I', creditos: 2 }
            ]
        },
        {
            ciclo: 6,
            cursos: [
                { codigo: 'IF6000', nombre: 'Redes en los Negocios', creditos: 4, requisitos: ['IF5000'] },
                { codigo: 'IF6100', nombre: 'Análisis y Diseño de Sistemas', creditos: 4, requisitos: ['IF5100'] },
                { codigo: 'IF6200', nombre: 'Economía de la Computación', creditos: 3, requisitos: ['MA0323'] },
                { codigo: 'IF6201', nombre: 'Informática Aplicada a los Negocios', creditos: 3, requisitos: ['IF5200'] },
                { codigo: 'SR-II', nombre: 'Seminario de Realidad Nacional II', creditos: 2, requisitos: ['SR-I'] }
            ]
        },
        {
            ciclo: 7,
            cursos: [
                { codigo: 'IF7100', nombre: 'Ingeniería de Software', creditos: 4, requisitos: ['IF6100'] },
                { codigo: 'IF7101', nombre: 'Compromiso Social de la Informática', creditos: 2, correquisitos: ['IF7100'] },
                { codigo: 'IF7200', nombre: 'Métodos Cuantitativos para la Toma de Decisiones', creditos: 4, requisitos: ['IF6000', 'IF6200'] },
                { codigo: 'IF7201', nombre: 'Gestión de Proyectos', creditos: 4, requisitos: ['IF6200'] },
                { codigo: 'OPT453', nombre: 'Optativo de Temas Especiales', creditos: 3 }
            ]
        },
        {
            ciclo: 8,
            cursos: [
                { codigo: 'IF8100', nombre: 'Práctica Empresarial Supervisada', creditos: 6, requisitos: ['IF7100', 'IF7201'] },
                { codigo: 'IF8200', nombre: 'Auditoría Informática', creditos: 4, requisitos: ['IF7100', 'IF7201'] },
                { codigo: 'IF8201', nombre: 'Planificación Informática', creditos: 4, requisitos: ['IF7201'] },
                { codigo: 'RP-1', nombre: 'Repertorio', creditos: 3 }
            ]
        }
    ]
    
};