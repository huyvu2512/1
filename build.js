var esbuild = require('esbuild');
var babel = require('@babel/core');
var fs = require('fs');
var path = require('path');

async function build() {
  console.log('1. Bundling with esbuild (including Shaka Player)...');
  var bundleResult = await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    write: false,
    format: 'iife'
  });

  var bundledCode = bundleResult.outputFiles[0].text;

  console.log('2. Transpiling with Babel to pure ES5 for Tizen 3 / Chrome 38+...');
  var babelResult = await babel.transformAsync(bundledCode, {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: { browsers: ['chrome >= 38', 'ie >= 11'] },
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
    name: pkg.name || "tizenbrew-iptv-drm",
    displayName: pkg.displayName || "TizenBrew IPTV DRM",
    version: pkg.version || "1.0.1",
    description: pkg.description || "TizenBrew IPTV DRM for Samsung Smart TV with ClearKey DRM & EPG Support",
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
  console.log('   Generated dist/index.js and dist/manifest.json (name: ' + manifest.name + ' v' + manifest.version + ')');
}

build().catch(function(err) {
  console.error('Build failed:', err);
  process.exit(1);
});
