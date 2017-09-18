'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
// var reject = require('reject');

/**
 * Expose `Youbora` integration.
 */

var Youbora = module.exports = integration('Youbora')
  .option('accountCode', '')
  .tag('<script src="http://smartplugin.youbora.com/v5/javascript/libs/5.4.6/youboralib.js">');

/**
 * Initialize.
 *
 * @api public
 */

Youbora.prototype.initialize = function() {
  // put your initialization logic here
  self = this;
  this.load(function() {
    window.$YB.plugins.Segment = function(options) {
      this.pluginName = 'segment';
      this.pluginVersion = '5.4.6-1.0-segment';
      this.startMonitoring(null, options);
    };
    window.$YB.plugins.Segment.prototype = new window.$YB.plugins.Generic;
    window.plugin = new window.$YB.plugins.Segment(null, { accountCode: self.options.accountCode });
    self.ready();
  });
};

/**
 * Loaded?
 *
 * @api public
 * @return {boolean}
 */

Youbora.prototype.loaded = function() {
  // what are required properties or functions that you need available on the `window`
  // before the integration marks itself as ready?
  return !!window.plugin;
};

/**
 * Track
 *
 * @api public
 */

// Youbora.prototype.track = function(track) {
//   // send event data
  
// };

Youbora.prototype.videoContentStarted = function(track) {
  window.plugin.viewManager.sendStart({
    System: this.options.accountCode,
    live: track.proxy('properties.livestream'),
    title: track.proxy('properties.title')
  });
};
