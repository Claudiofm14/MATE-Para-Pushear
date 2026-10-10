import React from 'react';
import { Button, Card, Badge, Spinner, Alert } from 'flowbite-react';
import { Ejemplo } from '../types/ejemplo.types';

interface EjemploListProps {
  ejemplos: Ejemplo[];
  loading: boolean;
  error: string | null;
  onEdit: (ejemplo: Ejemplo) => void;
  onDelete: (id: number) => void;
  onView: (ejemplo: Ejemplo) => void;
}

export const EjemploList: React.FC<EjemploListProps> = ({
  ejemplos,
  loading,
  error,
  onEdit,
  onDelete,
  onView,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spinner size="xl" />
        <span className="ml-3 text-lg text-gray-600">Cargando ejemplos...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert color="failure" className="mb-6">
        <span className="font-medium">Error:</span> {error}
      </Alert>
    );
  }

  if (ejemplos.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 text-lg mb-4">
          No hay ejemplos disponibles
        </div>
        <p className="text-gray-400">Comienza creando tu primer ejemplo</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {ejemplos.map(ejemplo => (
        <Card
          key={ejemplo.id}
          className="hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <h5 className="text-xl font-bold tracking-tight text-gray-900 truncate">
              {ejemplo.nombre}
            </h5>
            <Badge color="info" size="sm">
              #{ejemplo.id}
            </Badge>
          </div>

          {ejemplo.descripcion && (
            <p className="font-normal text-gray-700 mb-4 line-clamp-3">
              {ejemplo.descripcion}
            </p>
          )}

          <div className="text-sm text-gray-500 mb-4">
            <div>
              <strong>Creado:</strong> {formatDate(ejemplo.createdAt)}
            </div>
            {ejemplo.updatedAt !== ejemplo.createdAt && (
              <div>
                <strong>Actualizado:</strong> {formatDate(ejemplo.updatedAt)}
              </div>
            )}
          </div>

          <div className="flex justify-between items-center">
            <Button
              size="sm"
              color="blue"
              onClick={() => onView(ejemplo)}
              className="flex items-center"
            >
              <span className="w-4 h-4 mr-1">👁️</span>
              Ver
            </Button>
            <div className="flex space-x-2">
              <Button
                size="sm"
                color="yellow"
                onClick={() => onEdit(ejemplo)}
                className="flex items-center"
              >
                <span className="w-4 h-4 mr-1">✏️</span>
                Editar
              </Button>
              <Button
                size="sm"
                color="red"
                onClick={() => onDelete(ejemplo.id)}
                className="flex items-center"
              >
                <span className="w-4 h-4 mr-1">🗑️</span>
                Eliminar
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
