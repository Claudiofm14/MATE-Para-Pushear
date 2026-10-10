import React, { useState } from 'react';
import { ChevronDown, FileSpreadsheet } from 'lucide-react';

export const StudentImportFormatGuide: React.FC = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-4 rounded-md border border-blue-200 bg-blue-50/80 dark:border-blue-900/60 dark:bg-blue-950/30">
      <button
        type="button"
        onClick={() => setOpen(value => !value)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm font-semibold text-blue-900 hover:bg-blue-100/70 dark:text-blue-100 dark:hover:bg-blue-900/30"
        aria-expanded={open}
      >
        <span className="inline-flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4" />
          Ver formato esperado del Excel
        </span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <div className="border-t border-blue-200 px-3 pb-3 pt-3 dark:border-blue-900/60">
          <div className="overflow-x-auto rounded-md border border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950">
            <table className="min-w-[980px] w-full text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-950 dark:bg-slate-800 dark:text-slate-100">
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold dark:border-slate-700">
                    Legajo
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold dark:border-slate-700">
                    Alumno
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold dark:border-slate-700">
                    Estado
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold dark:border-slate-700">
                    Instancias
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold dark:border-slate-700">
                    Email
                  </th>
                  <th className="border border-slate-300 px-3 py-2 text-center font-bold dark:border-slate-700">
                    Telefono
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="text-slate-800 dark:text-slate-100">
                  <td className="border border-slate-300 px-3 py-2 font-mono dark:border-slate-700">
                    12345678
                  </td>
                  <td className="border border-slate-300 px-3 py-2 dark:border-slate-700">
                    APELLIDO, NOMBRE
                  </td>
                  <td className="border border-slate-300 px-3 py-2 dark:border-slate-700">
                    Aceptada
                  </td>
                  <td className="border border-slate-300 px-3 py-2 dark:border-slate-700">
                    Regularidad/Promocion
                  </td>
                  <td className="border border-slate-300 px-3 py-2 dark:border-slate-700">
                    Email Principal: alumno.ejemplo@correo.com
                  </td>
                  <td className="border border-slate-300 px-3 py-2 dark:border-slate-700">
                    Telefono Celular: (11) 12345678
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-3 grid gap-2 text-xs text-blue-950 dark:text-blue-100 sm:grid-cols-2">
            <p>
              Columnas usadas: <strong>Legajo</strong>, <strong>Alumno</strong>{' '}
              y <strong>Email</strong>.
            </p>
            <p>
              Tambien acepta archivos con <strong>Nombre</strong>,{' '}
              <strong>Apellido</strong>, <strong>Email</strong> y{' '}
              <strong>Legajo/DNI</strong> como columnas separadas.
            </p>
            <p>
              El email puede venir con texto adicional, por ejemplo "Email
              Principal: usuario@mail.com".
            </p>
            <p>
              Las columnas Estado, Instancias y Telefono pueden estar presentes,
              pero se ignoran para el alta.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentImportFormatGuide;
