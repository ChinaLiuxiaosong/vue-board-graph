import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig(({ mode }) => {
    const isLib = mode === 'lib'

    const shared = {
        plugins: [vue()],
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
            },
        },
    }

    if (isLib) {
        return {
            ...shared,
            build: {
                lib: {
                    entry: resolve(__dirname, 'src/index.ts'),
                    name: 'VueBoardGraph',
                    fileName: (format) => (format === 'es' ? 'vue-board-graph.mjs' : 'vue-board-graph.cjs'),
                    formats: ['es', 'cjs'],
                },
                rollupOptions: {
                    external: ['vue', 'hammerjs'],
                    output: {
                        exports: 'named',
                        globals: {
                            vue: 'Vue',
                            hammerjs: 'Hammer',
                        },
                    },
                },
                outDir: 'dist',
                emptyOutDir: true,
                cssCodeSplit: false,
            },
        }
    }

    return {
        ...shared,
        root: resolve(__dirname, 'demo'),
        base: '/vue-board-graph/',
        build: {
            outDir: resolve(__dirname, 'dist-demo'),
            emptyOutDir: true,
        },
        resolve: {
            alias: {
                '@': resolve(__dirname, 'src'),
                'vue-board-graph': resolve(__dirname, 'src/index.ts'),
            },
        },
    }
})
