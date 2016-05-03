var babel = require('rollup-plugin-babel')

module.exports = {
  moduleName: 'JSDataFirebase',
  moduleId: 'js-data-firebase',
  external: [
    'js-data',
    'firebase'
  ],
  globals: {
    'js-data': 'JSData',
    'firebase': 'Firebase'
  },
  plugins: [
    babel()
  ]
}
