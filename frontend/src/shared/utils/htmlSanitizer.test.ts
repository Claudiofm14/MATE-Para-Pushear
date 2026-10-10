import { describe, expect, it } from 'vitest';
import { sanitizeRichHtml } from './htmlSanitizer';

describe('frontend HTML sanitization', () => {
  it.each([
    '<script>alert(1)</script>',
    '<img src=x onerror=alert(1)>',
    '<svg onload=alert(1)><circle /></svg>',
    '<a href="javascript:alert(1)">click</a>',
    '<a href="data:text/html,<script>alert(1)</script>">click</a>',
  ])('removes dangerous payload %s', payload => {
    const sanitized = sanitizeRichHtml(payload);

    expect(sanitized).not.toMatch(
      /<script|onerror|onload|javascript:|data:|<svg/i
    );
  });

  it('keeps safe rich text and https links', () => {
    const sanitized = sanitizeRichHtml(
      '<p><strong>Texto</strong> <a href="https://unahur.edu.ar">UNAHUR</a></p>'
    );

    expect(sanitized).toContain('<strong>Texto</strong>');
    expect(sanitized).toContain('https://unahur.edu.ar');
  });
});
