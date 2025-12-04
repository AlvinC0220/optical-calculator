import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        // 關鍵變動 1：將 base 設為 '/' 或直接刪除，讓 Netlify 根目錄解析
        base: '/', 
        // ********************************************
        server: {
            port: 3000,
            host: '0.0.0.0',
        },
        plugins: [react()],
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        },
        // *** 關鍵變動 2：強制 Assets 不在子資料夾中 (解決 404) ***
        build: {
            outDir: 'dist',
            rollupOptions: {
                output: {
                    // 將所有檔案都輸出到 dist 根目錄，而不是 dist/assets
                    entryFileNames: '[name].js',
                    chunkFileNames: '[name].js',
                    assetFileNames: '[name].[ext]'
                }
            }
        }
        // ******************************************************
    };
});