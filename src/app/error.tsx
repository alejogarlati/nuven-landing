'use client';

import { Button } from '@/src/components/shadcn/button';

interface ErrorBoundaryProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorBoundaryProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-3xl font-bold text-gray-900">
        Ha ocurrido un error inesperado
      </h1>
      <p className="mt-2 text-gray-600 max-w-md">
        Lamentamos los inconvenientes. Nuestro equipo ha sido notificado y
        estamos trabajando para solucionarlo.
      </p>
      {error?.digest && (
        <p className="mt-3 text-xs text-gray-500">
          Código de referencia: {error.digest}
        </p>
      )}
      <div className="flex gap-4 mt-6">
        <Button
          className="shadow-md hover:shadow-lg transition-all duration-200"
          onClick={reset}
        >
          Intentar nuevamente
        </Button>
      </div>
    </div>
  );
}
