// Keep the entry point independent of React so failed module downloads are caught.
window.addEventListener('error', (event) => {
  console.error('[Startup] Error del cliente:', event.error ?? event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Startup] Promesa rechazada:', event.reason);
});

async function start() {
  try {
    console.log('[Startup] Iniciando aplicación', window.location.pathname);
    if (!document.getElementById('root')) throw new Error('Falta el elemento #root');
    await import('./bootstrap');
    console.log('[Startup] Aplicación cargada; render solicitado');
  } catch (error) {
    console.error('[Startup] No se pudo iniciar la aplicación:', error);
    const container = document.getElementById('root') ?? document.body;
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = 'No pudimos cargar la aplicación. Comprueba tu conexión y recarga la página.';
    const reload = document.createElement('button');
    reload.type = 'button';
    reload.textContent = 'Recargar página';
    reload.addEventListener('click', () => window.location.reload());
    container.replaceChildren(message, reload);
  }
}

void start();
