import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

/**
 * Configuracion de Vitest.
 *
 * El entorno es `jsdom` porque las pruebas cubren componentes React y el
 * subsistema de sesion, que usa `sessionStorage`.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
    coverage: {
      reporter: ['text', 'html'],
      include: ['src/domain/**', 'src/services/**'],
    },
  },
})
