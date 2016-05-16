var babel = require('rollup-plugin-babel')

module.exports = {
  moduleName: 'JSDataFirebase',
  moduleId: 'js-data-firebase',
  exports: 'named',
  external: [
    'js-data',
    'js-data-adapter',
    'firebase'
  ],
  globals: {
    'js-data': 'JSData',
    'js-data-adapter': 'Adapter',
    'firebase': 'Firebase'
  },
  plugins: [
    babel()
  ]
}
