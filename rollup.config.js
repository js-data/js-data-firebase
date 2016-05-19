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
    'firebase': 'firebase'
  },
  plugins: [
    babel({
      babelrc: false,
      presets: [
        'es2015-rollup'
      ]
    })
  ]
}
