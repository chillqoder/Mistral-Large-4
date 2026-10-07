import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';

await build({
    absWorkingDir: fileURLToPath(new URL('../', import.meta.url)),
    entryPoints: ['main.js'],
    outfile: 'aquarium.bundle.js',
    bundle: true,
    format: 'iife',
    platform: 'browser',
    target: ['es2020'],
    minify: true,
    legalComments: 'eof',
    metafile: true,
}).then(result => {
    const external = Object.values(result.metafile.outputs).flatMap(output => output.imports);
    if (external.length) throw new Error('Offline bundle contains external imports');
    console.log('Offline aquarium.bundle.js built successfully.');
});
