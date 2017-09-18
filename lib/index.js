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

Youbora.prototype.videoPlaybackStarted = function(track) {
  window.plugin.viewManager.sendStart({
    System: this.options.accountCode,
    live: track.proxy('properties.livestream'),
    title: track.proxy('properties.title')
  });
};

Youbora.prototype.videoPlaybackBufferStarted = function() {
  window.plugin.viewManager.sendBufferStart();
};

Youbora.prototype.videoPlaybackBufferCompleted = function() {
  window.plugin.viewManager.sendBufferEnd();
};

Youbora.prototype.videoPlaybackPaused = function(track) {
  window.plugin.viewManager.sendPause({
    System: track.proxy('properties.position')
  });
};

Youbora.prototype.videoContentStarted = function() {
  window.plugin.viewManager.sendJoin();
};

Youbora.prototype.videoPlaybackResumed = function(track) {
  window.plugin.viewManager.sendResume({
    playhead: track.proxy('properties.position')
  });
};

Youbora.prototype.videoPlaybackSeekStarted = function() {
  window.plugin.viewManager.sendSeekStart();
};

Youbora.prototype.videoPlaybackSeekCompleted = function() {
  window.plugin.viewManager.sendSeekEnd();
};

Youbora.prototype.videoContentPlaying = function(track) {
  window.plugin.viewManager.sendPing({
    playhead: track.proxy('properties.position')
  });
};

Youbora.prototype.videoPlaybackCompleted = function() {
  window.plugin.viewManager.sendStop();
};
