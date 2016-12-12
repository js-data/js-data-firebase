import babel from 'rollup-plugin-babel'

export default {
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
      plugins: [
        'babel-plugin-external-helpers'
      ],
      presets: [
        [
          'es2015',
          {
            modules: false
          }
        ]
      ]
    })
  ]
}
