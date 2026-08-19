import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'

// The background entry differs per engine: Firefox uses a modifier-aware
// browserAction on an event page, Chromium a side panel in a service worker.
const target = process.env.TARGET === 'chromium' ? 'chromium' : 'main';

export default {
  input: `./src/background/${target}.ts`,
  output: {
    file: './app/js/background.js',
    format: 'iife',
  },
  plugins: [resolve(), commonjs(), typescript({tsconfig: './tsconfig.json'})],
};
