import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  StudentPreviewProvider,
  useStudentPreview,
} from './StudentPreviewContext';

function Harness() {
  const navigate = useNavigate();
  const { selection, startPreview, stopPreview } = useStudentPreview();
  return (
    <>
      <output>{selection?.comisionNombre || 'sin vista previa'}</output>
      <button
        onClick={() =>
          startPreview({
            materiaId: 4,
            cursadaId: 7,
            comisionId: 2,
            comisionNombre: 'Comisión 1',
          })
        }
      >
        iniciar
      </button>
      <button onClick={stopPreview}>salir</button>
      <button onClick={() => navigate('/materias')}>otra pantalla</button>
    </>
  );
}

describe('StudentPreviewContext', () => {
  beforeEach(() => sessionStorage.clear());

  it('conserva la comisión durante la navegación de la materia y permite salir', () => {
    render(
      <MemoryRouter initialEntries={['/materia/4']}>
        <StudentPreviewProvider>
          <Harness />
        </StudentPreviewProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('iniciar'));
    expect(screen.getByText('Comisión 1')).toBeInTheDocument();
    expect(sessionStorage.getItem('unahur.student-preview')).toContain(
      'Comisión 1'
    );
    fireEvent.click(screen.getByText('salir'));
    expect(screen.getByText('sin vista previa')).toBeInTheDocument();
  });

  it('finaliza automáticamente al abandonar la materia', async () => {
    render(
      <MemoryRouter initialEntries={['/materia/4/semanas']}>
        <StudentPreviewProvider>
          <Harness />
        </StudentPreviewProvider>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByText('iniciar'));
    fireEvent.click(screen.getByText('otra pantalla'));

    await waitFor(() =>
      expect(screen.getByText('sin vista previa')).toBeInTheDocument()
    );
    expect(sessionStorage.getItem('unahur.student-preview')).toBeNull();
  });
});
