const esbuild = require('esbuild');
const babel = require('@babel/core');
const fs = require('fs');
const path = require('path');

async function build() {
  console.log('1. Bundling with esbuild...');
  const bundleResult = await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    write: false,
    format: 'iife'
  });

  const bundledCode = bundleResult.outputFiles[0].text;

  console.log('2. Transpiling with Babel to Chrome 47 / Tizen 3 (ES5)...');
  const babelResult = await babel.transformAsync(bundledCode, {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: { chrome: '47' },
          modules: false
        }
      ]
    ],
    minified: true,
    compact: true
  });

  const outPath = path.join(__dirname, 'dist', 'index.js');
  if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
  }

  fs.writeFileSync(outPath, babelResult.code, 'utf8');
  console.log('3. Build complete! Output size:', (babelResult.code.length / 1024).toFixed(2), 'KB');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
