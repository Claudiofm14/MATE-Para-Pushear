import { readFileSync } from 'fs';
import { join } from 'path';

export class MockUtils {
  private static mockInicio: any[];
  private static mockMaterial: any[];
  private static mockContrato: any[];
  private static mockCursadas: any[];

  private static loadMocks() {
    if (!this.mockInicio) {
      try {
        const mockInicioPath = join(__dirname, '../mock/mockInicio.json');
        const mockMaterialPath = join(__dirname, '../mock/mockMaterial.json');
        const mockContratoPath = join(
          __dirname,
          '../mock/contrato_pedagogico.json',
        );
        const mockCursadasPath = join(__dirname, '../mock/mockCursadas.json');

        this.mockInicio = JSON.parse(readFileSync(mockInicioPath, 'utf8'));
        this.mockMaterial = JSON.parse(readFileSync(mockMaterialPath, 'utf8'));
        this.mockContrato = JSON.parse(readFileSync(mockContratoPath, 'utf8'));
        this.mockCursadas = JSON.parse(readFileSync(mockCursadasPath, 'utf8'));
      } catch (error) {
        this.mockInicio = [
          {
            titulo: 'Programación con Objetos 2',
            contenedores: [
              {
                titulo: 'Bienvenidos a Programación Orientada a Objetos II',
                subtitulo:
                  'Les damos la bienvenida a este cuatrimestre en la materia',
                tipo: 'bienvenida',
              },
            ],
          },
        ];
        this.mockMaterial = [
          {
            titulo: 'Material Introductorio - Programación con Objetos',
            contenedores: [
              {
                titulo: 'Conceptos Básicos',
                subtitulo: 'Introducción a la programación orientada a objetos',
                tipo: 'bienvenida',
              },
            ],
          },
        ];
        this.mockContrato = [
          {
            titulo: 'Contrato Pedagógico - Objetos I',
            secciones: [
              {
                titulo: 'Aclaraciones',
                subtitulo:
                  'Todo lo aquí expuesto está en consonancia con las normativas de la Universidad',
                tipo: 'subNivel',
              },
            ],
          },
        ];
      }
    }
  }

  static getInicioExample() {
    this.loadMocks();
    return this.mockInicio[0];
  }

  static getInicioCreateExample() {
    const example = this.getInicioExample();
    return {
      titulo: example.titulo,
      contenedores: example.contenedores,
    };
  }

  static getInicioResponseExample() {
    const example = this.getInicioExample();
    return {
      id: 1,
      titulo: example.titulo,
      fechaCreacion: '2024-09-20T10:00:00.000Z',
      fechaActualizacion: '2024-09-20T10:00:00.000Z',
      contenedores: example.contenedores.map((contenedor, index) => ({
        id: index + 1,
        ...contenedor,
        hijos: contenedor.hijos?.map((hijo, hijoIndex) => ({
          id: (index + 1) * 10 + hijoIndex + 1,
          ...hijo,
        })),
      })),
    };
  }

  static getInicioListExample() {
    return [this.getInicioResponseExample()];
  }

  static getMaterialExample() {
    this.loadMocks();
    return this.mockMaterial[0];
  }

  static getMaterialCreateExample() {
    const example = this.getMaterialExample();
    return {
      titulo: example.titulo,
      contenedores: example.contenedores,
    };
  }

  static getMaterialResponseExample() {
    const example = this.getMaterialExample();
    return {
      id: 1,
      titulo: example.titulo,
      fechaCreacion: '2024-09-20T10:00:00.000Z',
      fechaActualizacion: '2024-09-20T10:00:00.000Z',
      contenedores: example.contenedores.map((contenedor, index) => ({
        id: index + 1,
        ...contenedor,
        hijos: contenedor.hijos?.map((hijo, hijoIndex) => ({
          id: (index + 1) * 10 + hijoIndex + 1,
          ...hijo,
        })),
      })),
    };
  }

  static getMaterialListExample() {
    return [this.getMaterialResponseExample()];
  }

  static getContenedoresExample() {
    const inicioExample = this.getInicioExample();
    return inicioExample.contenedores;
  }

  static getMaterialUpdateExample() {
    return {
      titulo: 'Material Avanzado - Estructuras de Datos',
      contenedores: [
        {
          titulo: 'Algoritmos de Ordenamiento',
          subtitulo:
            'Implementación y análisis de complejidad de algoritmos de ordenamiento',
          tipo: 'detalleCursada',
          hijos: [
            {
              titulo: 'Bubble Sort',
              subtitulo: 'Algoritmo básico de ordenamiento por burbuja',
              tipo: 'subNivel',
            },
            {
              titulo: 'Quick Sort',
              subtitulo: 'Algoritmo eficiente de ordenamiento por partición',
              tipo: 'subNivel',
            },
          ],
        },
      ],
    };
  }

  /**
   * Obtiene el primer ejemplo de contrato pedagógico del mock
   */
  static getContratoExample() {
    this.loadMocks();
    return this.mockContrato[0];
  }

  /**
   * Obtiene un ejemplo simplificado de contrato sin IDs para requests
   */
  static getContratoCreateExample() {
    const example = this.getContratoExample();
    return {
      titulo: example.titulo,
      secciones: example.secciones,
    };
  }

  /**
   * Obtiene un ejemplo de respuesta de contrato con IDs simulados
   */
  static getContratoResponseExample() {
    const example = this.getContratoExample();
    return {
      id: 1,
      titulo: example.titulo,
      fechaCreacion: '2024-09-20T10:00:00.000Z',
      fechaActualizacion: '2024-09-20T10:00:00.000Z',
      secciones: example.secciones.map((seccion, index) => ({
        id: index + 1,
        ...seccion,
        hijos:
          seccion.hijos?.map((hijo, hijoIndex) => ({
            id: (index + 1) * 10 + hijoIndex + 1,
            ...hijo,
          })) || [],
      })),
    };
  }

  /**
   * Obtiene una lista de ejemplos de contrato para el endpoint findAll
   */
  static getContratoListExample() {
    return [this.getContratoResponseExample()];
  }

  /**
   * Obtiene un ejemplo de secciones simplificado para DTOs
   */
  static getSeccionesExample() {
    const contratoExample = this.getContratoExample();
    return contratoExample.secciones;
  }

  /**
   * Obtiene el primer ejemplo de cursada del mock
   */
  static getCursadaExample() {
    this.loadMocks();
    return this.mockCursadas[0];
  }

  /**
   * Obtiene todos los ejemplos de cursadas
   */
  static getAllCursadasExamples() {
    this.loadMocks();
    return this.mockCursadas;
  }

  /**
   * Obtiene un ejemplo de creación de cursada
   */
  static getCursadaCreateExample() {
    const example = this.getCursadaExample();
    return {
      titulo: example.titulo,
      descripcion: example.descripcion,
      materiaId: example.materiaId,
    };
  }

  /**
   * Obtiene un ejemplo de comisión
   */
  static getComisionExample() {
    const cursada = this.getCursadaExample();
    return cursada.comisiones[0];
  }

  /**
   * Obtiene un ejemplo de semana completo
   */
  static getSemanaExample() {
    const cursada = this.getCursadaExample();
    return cursada.semanas[0];
  }

  /**
   * Obtiene un ejemplo de video
   */
  static getVideoExample() {
    const semana = this.getSemanaExample();
    return semana.videos[0];
  }

  /**
   * Obtiene un ejemplo de ejercicio
   */
  static getEjercicioExample() {
    const semana = this.getSemanaExample();
    return semana.ejercicios[0];
  }

  /**
   * Obtiene un ejemplo de horario
   */
  static getHorarioExample() {
    const semana = this.getSemanaExample();
    return semana.horarios[0];
  }
}
