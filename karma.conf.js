'use strict'

var customLaunchers = {
  bs_ie9_windows7: {
    base: 'BrowserStack',
    browser: 'ie',
    browser_version: '9.0',
    os: 'Windows',
    os_version: '7'
  },
  bs_safari7_osxmavericks: {
    base: 'BrowserStack',
    browser: 'safari',
    browser_version: '7.1',
    os: 'OS X',
    os_version: 'Mavericks'
  },
  bs_firefox41_windows7: {
    base: 'BrowserStack',
    browser: 'firefox',
    browser_version: '41.0',
    os: 'Windows',
    os_version: '7'
  },
  bs_chrome46_windows7: {
    base: 'BrowserStack',
    browser: 'chrome',
    browser_version: '46.0',
    os: 'Windows',
    os_version: '7'
  }
}

var browsers = ['PhantomJS']
if (process.env.BROWSERSTACK_USERNAME && process.env.BROWSERSTACK_ACCESS_KEY) {
  browsers = browsers.concat(Object.keys(customLaunchers))
}

module.exports = function (config) {
  config.set({
    basePath: './',
    frameworks: ['chai', 'mocha', 'sinon'],
    plugins: [
      'karma-chai',
      'karma-mocha',
      'karma-sinon',
      'karma-phantomjs-launcher',
      'karma-coverage',
      'karma-browserstack-launcher'
    ],
    client: {
      mocha: {
        // reporter: 'html', // change Karma's debug.html to the mocha web reporter
        timeout: 10000 // had to increase the delay due to timeouts with firebase
      }
    },
    autoWatch: false,
    autoWatchBatchDelay: 4000,
    browsers: browsers,
    files: [
      'node_modules/babel-polyfill/dist/polyfill.js',
      'node_modules/js-data/dist/js-data.js',
      'bower_components/firebase/firebase.js',
      'dist/js-data-firebase.js',
      'node_modules/js-data-adapter-tests/dist/js-data-adapter-tests.js',
      'karma.start.js'
    ],
    reporters: ['dots', 'coverage'],
    preprocessors: {
      'dist/js-data-firebase.js': ['coverage']
    },
    coverageReporter: {
      type: 'lcov',
      dir: 'coverage/',
      instrumenterOptions: {
        istanbul: { noCompact: true }
      }
    },
    browserStack: {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY
    },
    customLaunchers: customLaunchers,
    browserNoActivityTimeout: 90000,
    port: 9876,
    runnerPort: 9100,
    colors: true,
    logLevel: config.LOG_INFO,
    captureTimeout: 90000,
    singleRun: true
  })
}
