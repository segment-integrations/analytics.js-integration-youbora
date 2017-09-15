'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var INTEGRATION_NAME = require('../lib/'); // FIXME

describe('<INTEGRATION_NAME>', function() { // FIXME
  var analytics;
  var integration_name; // FIXME
  var options = {};

  beforeEach(function() {
    analytics = new Analytics();
    integration_name = new INTEGRATION_NAME(options); // FIXME
    analytics.use(integrationTester);
    analytics.use(INTEGRATION_NAME); //FIXME
    analytics.add(integration_name); // FIXME
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    integration_name.reset(); // FIXME
    sandbox();
  });

  it('should have the correct options', function() { // FIXME
    analytics.compare(INTEGRATION_NAME, integration('INTEGRATION_NAME')
    .option('apiKey', '')
    .tag('<script src="">'));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(integration_name, 'load'); // FIXME
    });

    describe('#initialize', function() {
      // write assertions here if you do any logic to create or set things in the `.initialize()` function

      it('should call load', function() {
        analytics.initialize();
        analytics.called(castle.load);
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(integration_name, done); // FIXME
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    // write all your post-load assertions and unit tests here such 

    describe('#identify', function() {
    });

    describe('#page', function() {
    });

    describe('#track', function() {
    });

    describe('#group', function() {
    });

    describe('#alias', function() {
    });
  });
});
