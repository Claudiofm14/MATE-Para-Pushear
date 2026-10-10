import sanitizeHtml = require('sanitize-html');

const allowedTags = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'ul',
  'ol',
  'li',
  'blockquote',
  'code',
  'pre',
  'span',
  'a',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
];

const allowedAttributes = {
  a: ['href', 'title', 'target', 'rel'],
  span: ['class'],
  code: ['class'],
  pre: ['class'],
};

export function sanitizeRichHtml(value?: string | null): string | null {
  if (value === undefined || value === null) return value ?? null;

  return sanitizeHtml(value, {
    allowedTags,
    allowedAttributes,
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
      img: ['https'],
    },
    allowProtocolRelative: false,
    transformTags: {
      a: sanitizeHtml.simpleTransform('a', {
        rel: 'noopener noreferrer',
      }),
    },
  });
}

export function sanitizeRichContent<T>(value: T): T {
  if (typeof value === 'string') {
    return sanitizeRichHtml(value) as T;
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeRichContent(item)) as T;
  }

  if (value && typeof value === 'object') {
    const sanitized: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      sanitized[key] = sanitizeRichContent(item);
    }
    return sanitized as T;
  }

  return value;
}
