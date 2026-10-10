import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { BlockRenderer } from './BlockRenderer';
import { MaterialContent } from '../types/content-blocks';

const markdownContent: MaterialContent = {
  blocks: [
    {
      id: 'intro-js',
      type: 'html-markdown',
      data: {
        titulo: 'Introducción a JavaScript',
        formato: 'markdown',
        contenido: '# Contenido extenso\n\nTexto para estudiantes.',
      },
    },
  ],
};

const renderBlock = (collapseMarkdown: boolean) =>
  render(
    <MemoryRouter>
      <BlockRenderer
        content={markdownContent}
        collapseMarkdown={collapseMarkdown}
      />
    </MemoryRouter>
  );

describe('BlockRenderer markdown', () => {
  it('starts collapsed and lets the student expand and collapse the block', () => {
    renderBlock(true);

    const toggle = screen.getByRole('button', {
      name: /ver contenido de introducción a javascript/i,
    });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('heading', { name: 'Contenido extenso' })
    ).not.toBeInTheDocument();

    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      screen.getByRole('heading', { name: 'Contenido extenso' })
    ).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(
      screen.queryByRole('heading', { name: 'Contenido extenso' })
    ).not.toBeInTheDocument();
  });

  it('keeps markdown visible by default in other BlockRenderer views', () => {
    renderBlock(false);

    expect(
      screen.getByRole('heading', { name: 'Contenido extenso' })
    ).toBeInTheDocument();
  });
});
