import babel from 'rollup-plugin-babel'

export default {
  name: 'JSDataFirebase',
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
        'external-helpers'
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
