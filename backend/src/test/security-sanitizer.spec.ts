import { sanitizeRichContent, sanitizeRichHtml } from '../utils/html-sanitizer';

describe('backend HTML sanitization', () => {
  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)><circle /></svg>',
    '<a href="javascript:alert(1)">click</a>',
    '<a href="data:text/html,<script>alert(1)</script>">click</a>',
  ])('removes dangerous payload %s', (payload) => {
    const sanitized = sanitizeRichHtml(payload) || '';

    expect(sanitized).not.toMatch(
      /<script|onerror|onload|javascript:|data:|<svg/i,
    );
  });

  it('keeps safe rich text tags and safe links', () => {
    expect(
      sanitizeRichHtml(
        '<p><strong>Ok</strong> <a href="https://unahur.edu.ar">UNAHUR</a></p>',
      ),
    ).toContain('https://unahur.edu.ar');
  });

  it('sanitizes nested rich content recursively', () => {
    const sanitized = sanitizeRichContent({
      blocks: [
        { text: '<img src=x onerror=alert(1)><p>safe</p>' },
        { children: ['<script>alert(1)</script>'] },
      ],
    });

    expect(JSON.stringify(sanitized)).not.toMatch(/onerror|<script/i);
    expect(JSON.stringify(sanitized)).toContain('safe');
  });
});
