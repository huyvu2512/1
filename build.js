var esbuild = require('esbuild');
var babel = require('@babel/core');
var fs = require('fs');
var path = require('path');

async function build() {
  console.log('1. Bundling with esbuild (NO Shaka Player)...');
  var bundleResult = await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    write: false,
    format: 'iife',
    external: ['shaka-player', 'shaka-player/*']
  });

  var bundledCode = bundleResult.outputFiles[0].text;

  console.log('2. Transpiling with Babel to Chrome 47 / Tizen 3 (ES5)...');
  var babelResult = await babel.transformAsync(bundledCode, {
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

  var distDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  var outPath = path.join(distDir, 'index.js');
  fs.writeFileSync(outPath, babelResult.code, 'utf8');

  var pkg = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

  var manifest = {
    schemaVersion: 1,
    name: pkg.name || "iptv-vn",
    displayName: pkg.appName || "IPTV Player DRM",
    version: pkg.version || "1.0.0",
    description: pkg.description || "IPTV Player for TizenBrew",
    targetUrl: "https://localhost",
    assets: {
      scripts: ["index.js"],
      styles: []
    },
    capabilities: {
      tvKeys: {
        arrows: true,
        enter: true,
        back: true,
        playPause: true
      }
    }
  };

  fs.writeFileSync(path.join(distDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

  console.log('3. Build complete! Output size:', (babelResult.code.length / 1024).toFixed(2), 'KB');
  console.log('   Generated dist/index.js and dist/manifest.json (name: ' + manifest.name + ')');
}

build().catch(function(err) {
  console.error('Build failed:', err);
  process.exit(1);
});
