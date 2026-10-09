import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    build: {
        chunkSizeWarningLimit: 1000,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react-dom') || id.includes('/react/')) {
                            return 'react-vendor';
                        }
                        if (id.includes('@mui') || id.includes('@emotion')) {
                            return 'mui-vendor';
                        }
                        if (id.includes('recharts') || id.includes('d3-')) {
                            return 'charts-vendor';
                        }
                        return 'vendor';
                    }
                },
            },
        },
    },
});