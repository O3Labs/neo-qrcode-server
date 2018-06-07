import babel from 'rollup-plugin-babel';
import babelrc from 'babelrc-rollup';

export default {
  input: './src/index.js',
  output: {
    file: 'lib/index.js',
    format: 'cjs',
    sourcemap: true
  },
  plugins: [
    babel(babelrc({
      path: './.babelrc-build'
    }))
  ]
};
