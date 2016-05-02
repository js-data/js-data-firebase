var babel = require('rollup-plugin-babel')
var commonjs = require('rollup-plugin-commonjs')
var nodeResolve = require('rollup-plugin-node-resolve')

module.exports = {
  moduleName: 'JSDataFirebase',
  moduleId: 'js-data-firebase',
  external: [
    'js-data',
    'firebase'
  ],
  globals: {
    'js-data': 'JSData'
  },
  plugins: [
    babel({
      exclude: ['bower_components/firebase/**/*']
    }),
    nodeResolve({
      jsnext: false,
      main: true
    }),
    commonjs({
      include: 'node_modules/mout/**',
      sourceMap: true
    })
  ]
}
