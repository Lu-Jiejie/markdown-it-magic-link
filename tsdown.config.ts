import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: [
    './src/index.ts',
  ],
  clean: true,
  platform: 'neutral',
  format: ['esm', 'cjs'],
})
