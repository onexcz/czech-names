import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import vueDevTools from 'vite-plugin-vue-devtools'
import dsv from '@rollup/plugin-dsv';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    vueDevTools(),
    dsv({
      processRow: (row, id) => {
          const keys = Object.keys(row);
          if (keys.length === 2 && !isNaN(Number(row[keys[0]]))) {
              // Check if the row structure is like "number,string" and the first element is a number
              return {
                  count: Number(row[keys[0]]), // Convert the first element to a number
                  name: row[keys[1]], // Keep the second element as a string
              };
          } else {
              return row;
          }
      },
  }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
