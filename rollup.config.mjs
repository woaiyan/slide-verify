import html from 'rollup-plugin-html';
import terser from '@rollup/plugin-terser';

export default {
    input: 'src/index.js',
    plugins: [
        html(),
        terser()
    ],
    output: {
        file: 'dist/bundle.js',
        format: 'umd'
    }
};
