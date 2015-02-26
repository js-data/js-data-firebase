/*
 * js-data-firebase
 * http://github.com/js-data/js-data-firebase
 *
 * Copyright (c) 2014 Jason Dobry <http://www.js-data.io/js-data-firebase>
 * Licensed under the MIT license. <https://github.com/js-data/js-data-firebase/blob/master/LICENSE>
 */
module.exports = function (grunt) {
  'use strict';

  require('jit-grunt')(grunt, {
    coveralls: 'grunt-karma-coveralls'
  });
  require('time-grunt')(grunt);

  var pkg = grunt.file.readJSON('package.json');

  // Project configuration.
  grunt.initConfig({
    pkg: pkg,
    clean: {
      coverage: ['coverage/'],
      dist: ['dist/']
    },
    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js', 'test/*.js'],
      jshintrc: '.jshintrc'
    },
    watch: {
      dist: {
        files: ['src/**/*.js'],
        tasks: ['build']
      }
    },
    uglify: {
      main: {
        options: {
          sourceMap: true,
          sourceMapName: 'dist/js-data-firebase.min.map',
          banner: '/**\n' +
            '* @author Jason Dobry <jason.dobry@gmail.com>\n' +
            '* @file js-data-firebase.min.js\n' +
            '* @version <%= pkg.version %> - Homepage <http://wwwjs-data.io/js-data-firebase>\n' +
            '* @copyright (c) 2014 Jason Dobry\n' +
            '* @license MIT <https://github.com/js-data/js-data-firebase/blob/master/LICENSE>\n' +
            '*\n' +
            '* @overview Firebase adapter for js-data.\n' +
            '*/\n'
        },
        files: {
          'dist/js-data-firebase.min.js': ['dist/js-data-firebase.js']
        }
      }
    },
    browserify: {
      options: {
        browserifyOptions: {
          standalone: 'DSFirebaseAdapter'
        },
        external: ['firebase', 'js-data']
      },
      dist: {
        files: {
          'dist/js-data-firebase.js': ['src/index.js']
        }
      }
    },
    karma: {
      options: {
        configFile: './karma.conf.js'
      },
      dev: {
        browsers: ['Chrome'],
        autoWatch: true,
        singleRun: false,
        reporters: ['spec'],
        preprocessors: {}
      },
      min: {
        browsers: ['Firefox'],
        options: {
          files: [
            'bower_components/firebase/firebase.js',
            'bower_components/js-data/dist/js-data.js',
            'dist/js-data-firebase.min.js',
            'karma.start.js',
            'test/**/*.js'
          ]
        }
      },
      ci: {
        browsers: ['Firefox']
      }
    },
    coveralls: {
      options: {
        coverage_dir: 'coverage'
      }
    }
  });

  grunt.registerTask('version', function (filePath) {
    var file = grunt.file.read(filePath);

    file = file.replace(/<%= pkg\.version %>/gi, pkg.version);

    grunt.file.write(filePath, file);
  });

  grunt.registerTask('banner', function () {
    var file = grunt.file.read('dist/js-data-firebase.js');

    var banner = '/**\n' +
      '* @author Jason Dobry <jason.dobry@gmail.com>\n' +
      '* @file js-data-firebase.js\n' +
      '* @version ' + pkg.version + ' - Homepage <http://www.js-data.iojs-data-firebase/>\n' +
      '* @copyright (c) 2014 Jason Dobry \n' +
      '* @license MIT <https://github.com/js-data/js-data-firebase/blob/master/LICENSE>\n' +
      '*\n' +
      '* @overview Firebase adapter for js-data.\n' +
      '*/\n';

    file = banner + file;

    grunt.file.write('dist/js-data-firebase.js', file);
  });

  grunt.registerTask('test', ['build', 'karma:ci', 'karma:min']);
  grunt.registerTask('build', [
    'clean',
    'jshint',
    'browserify',
    'banner',
    'uglify:main'
  ]);
  grunt.registerTask('go', ['build', 'watch:dist']);
  grunt.registerTask('default', ['build']);
};
