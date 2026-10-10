// Tipos de bloques disponibles
export type BlockType =
  | 'text'
  | 'link'
  | 'commands'
  | 'list'
  | 'html-markdown'
  | 'image'
  | 'file'
  | 'material-academico-ref';

// Interfaz base para todos los bloques
export interface BaseBlock {
  id: string;
  type: BlockType;
}

// Bloque de texto con secciones
export interface TextBlock extends BaseBlock {
  type: 'text';
  data: {
    titulo: string;
    contenido: string;
    emoji?: string;
    fontFamily?: string;
    fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    titleFontSize?: 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl';
    titleAlign?: 'left' | 'center' | 'right' | 'justify';
    titleColorPreset?: string;
    colorPreset?: string;
    color?: string;
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    align?: 'left' | 'center' | 'right' | 'justify';
  };
}

// Bloque de enlace externo
export interface LinkBlock extends BaseBlock {
  type: 'link';
  data: {
    titulo: string;
    url: string;
    descripcion?: string;
    textoBoton?: string;
  };
}

// Bloque de comandos
export interface CommandsBlock extends BaseBlock {
  type: 'commands';
  data: {
    titulo?: string;
    commands: Array<{
      comando: string;
      descripcion: string;
    }>;
  };
}

// Bloque de lista
export interface ListBlock extends BaseBlock {
  type: 'list';
  data: {
    titulo?: string;
    items: Array<{
      texto: string;
    }>;
  };
}

// Bloque de contenido escrito en Markdown o HTML seguro
export interface HtmlMarkdownBlock extends BaseBlock {
  type: 'html-markdown';
  data: {
    titulo?: string;
    formato: 'markdown' | 'html';
    contenido: string;
  };
}

// Bloque de imagen
export interface ImageBlock extends BaseBlock {
  type: 'image';
  data: {
    titulo?: string;
    descripcion?: string;
    fileName: string;
    fileType: string;
    base64Data: string;
    alt?: string;
    size?: 'small' | 'medium' | 'large' | 'full';
  };
}

// Bloque de archivo
export interface FileBlock extends BaseBlock {
  type: 'file';
  data: {
    titulo?: string;
    descripcion?: string;
    fileName: string;
    fileType: string;
    base64Data: string;
    fileSize?: number;
  };
}

// Bloque de referencia a material académico
export interface MaterialAcademicoRefBlock extends BaseBlock {
  type: 'material-academico-ref';
  data: {
    materialId: number;
    titulo?: string; // Cache del título del material
    categoria?: string; // Cache de la categoría
  };
}

// Unión de todos los tipos de bloques
export type ContentBlock =
  | TextBlock
  | LinkBlock
  | CommandsBlock
  | ListBlock
  | HtmlMarkdownBlock
  | ImageBlock
  | FileBlock
  | MaterialAcademicoRefBlock;

// Estructura del contenido completo
export interface MaterialContent {
  blocks: ContentBlock[];
}

// Helper para crear un bloque vacío
export const createEmptyBlock = (type: BlockType): ContentBlock => {
  const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);

  switch (type) {
    case 'text':
      return {
        id,
        type: 'text',
        data: {
          titulo: '',
          contenido: '',
          emoji: '',
          fontFamily: 'sans',
          fontSize: 'base',
          titleFontSize: 'lg',
          titleAlign: 'left',
          titleColorPreset: 'neutral',
          colorPreset: 'slate',
          bold: false,
          italic: false,
          underline: false,
          align: 'left',
        },
      };
    case 'link':
      return {
        id,
        type: 'link',
        data: {
          titulo: '',
          url: '',
          descripcion: '',
          textoBoton: 'Ver Recurso',
        },
      };
    case 'commands':
      return {
        id,
        type: 'commands',
        data: { titulo: '', commands: [] },
      };
    case 'list':
      return {
        id,
        type: 'list',
        data: { titulo: '', items: [] },
      };
    case 'html-markdown':
      return {
        id,
        type: 'html-markdown',
        data: { titulo: '', formato: 'markdown', contenido: '' },
      };
    case 'image':
      return {
        id,
        type: 'image',
        data: {
          titulo: '',
          descripcion: '',
          fileName: '',
          fileType: '',
          base64Data: '',
          alt: '',
          size: 'full',
        },
      };
    case 'file':
      return {
        id,
        type: 'file',
        data: {
          titulo: '',
          descripcion: '',
          fileName: '',
          fileType: '',
          base64Data: '',
          fileSize: 0,
        },
      };
    case 'material-academico-ref':
      return {
        id,
        type: 'material-academico-ref',
        data: {
          materialId: 0,
          titulo: '',
          categoria: '',
        },
      };
  }
};

// Helper para obtener el icono de cada tipo de bloque
export const getBlockIcon = (type: BlockType): string => {
  const icons: Record<BlockType, string> = {
    text: '📝',
    link: '🔗',
    commands: '💻',
    list: '📋',
    image: '🖼️',
    file: '📎',
    'html-markdown': '⌨️',
    'material-academico-ref': '📚',
  };
  return icons[type];
};

// Helper para obtener el nombre de cada tipo de bloque
export const getBlockTypeName = (type: BlockType): string => {
  const names: Record<BlockType, string> = {
    text: 'Texto',
    link: 'Enlace',
    commands: 'Comandos',
    list: 'Lista',
    image: 'Imagen',
    file: 'Archivo',
    'html-markdown': 'HTML / Markdown',
    'material-academico-ref': 'Material Académico',
  };
  return names[type];
};
