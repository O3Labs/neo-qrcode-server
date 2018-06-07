import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';
// import image from 'rollup-plugin-image';

export default {
  input: './src/index.js',
  output: {
    file: 'lib/index.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    // image(),
    babel(babelrc({
      path: './.babelrc-build'
    }))
  ]
};
