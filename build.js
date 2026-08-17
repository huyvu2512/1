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

  const distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const outPath = path.join(distDir, 'index.js');
  fs.writeFileSync(outPath, babelResult.code, 'utf8');

  // Tạo manifest.json chuẩn cho TizenBrew Module Manager
  const manifest = {
    schemaVersion: 1,
    name: "tizenbrew-iptv-drm",
    displayName: "IPTV Player DRM",
    version: "1.2.1",
    description: "IPTV Player DRM for TizenBrew with ClearKey DRM & EPG Support",
    targetUrl: "https://localhost",
    assets: {
      scripts: [
        "index.js"
      ],
      styles: []
    },
    capabilities: {
      tvKeys: {
        arrows: true,
        enter: true,
        back: true,
        playPause: true
      },
      performance: {
        removeAnimations: false,
        lazyMedia: false,
        hideComments: false,
        memorySaver: false
      }
    }
  };

  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log('3. Build complete! Output size:', (babelResult.code.length / 1024).toFixed(2), 'KB');
  console.log('   Generated dist/index.js and dist/manifest.json');
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
