import { Component, type ErrorInfo, type ReactNode } from 'react';

export class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('No se pudo renderizar la aplicación:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <main role="alert" className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-slate-900">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold">No pudimos cargar esta pantalla</h1>
            <p className="mt-3">Ocurrió un error inesperado. Recarga la página para volver a intentarlo.</p>
            <button
              type="button"
              className="mt-6 rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white"
              onClick={() => window.location.reload()}
            >
              Recargar página
            </button>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}
