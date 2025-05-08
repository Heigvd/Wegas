import { defineConfig } from 'cypress'

export default defineConfig({
  env: {
    'cypress-react-selector': {
      root: '#root',
    },
  },
  reporter: 'junit',
  reporterOptions: {
    mochaFile:
      '../../../target/surefire-reports/TEST-ch.wegas.client.tests.e2e.CypressTest.[hash].xml',
    rootSuiteTitle: 'ch.wegas.tests.e2e',
    testsuitesTitle: 'Wegas Client Test Suite',
    suiteTitleSeparatedBy: '.',
    useFullSuiteTitle: true,
    jenkinsMode: true,
    testCaseSwitchClassnameAndName: true,
  },
  e2e: {
    // We've imported your old cypress plugins here.
    // You may want to clean this up later by importing these.
    setupNodeEvents(on, config) {
      return require('./cypress/plugins/index.js')(on, config)
    },
    excludeSpecPattern: '**/*.todo',
  },
})
