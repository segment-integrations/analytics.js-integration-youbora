'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');

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
    window.adPlaying = false;
    window.firstAdBuffer = true;
    window.firstBuffer = true;

    // initialize main plugin
    window.$YB.plugins.Segment = function(options) {
      this.pluginName = 'segment';
      this.pluginVersion = '5.4.6-1.0-segment';
      this.startMonitoring(null, options);
    };
    window.$YB.plugins.Segment.prototype = new window.$YB.plugins.Generic;
    window.plugin = new window.$YB.plugins.Segment({ accountCode: self.options.accountCode });

    // initialize ads plugin
    window.$YB.adnalyzers.SegmentAds = function(plugin) {
      this.adnalyzerVersion = '5.4.6-1.0-segmentAds';
      this.startMonitoring(plugin);
    };
    window.$YB.adnalyzers.SegmentAds.prototype = new window.$YB.adnalyzers.Generic();
    window.adnalyzer = new window.$YB.adnalyzers.SegmentAds(window.plugin);
    window.plugin.adnalyzer = window.adnalyzer;

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
  return window.plugin && window.adnalyzer;
};

Youbora.prototype.videoContentStarted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);
  window.plugin.viewManager.sendStart({
    live: track.proxy('properties.livestream'),
    properties: {
      filename: youboraOpts.contentMetadata.filename,
      content_id: track.proxy('properties.asset_id'),
      content_metadata: {
        title: track.proxy('properties.title'),
        genre: track.proxy('properties.genre'),
        language: youboraOpts.contentMetadata.language,
        year: youboraOpts.contentMetadata.year,
        cast: youboraOpts.contentMetadata.cast,
        director: youboraOpts.contentMetadata.director,
        owner: track.proxy('properties.publisher'),
        parental: youboraOpts.contentMetadata.parental,
        price: youboraOpts.contentMetadata.price,
        rating: youboraOpts.contentMetadata.rating,
        audioType: youboraOpts.contentMetadata.audioType,
        audioChannels: youboraOpts.contentMetadata.audioChannels
      },
      transaction_type: youboraOpts.transactionType,
      quality: youboraOpts.quality,
      content_type: youboraOpts.contentType,
      device: {
        manufacturer: track.proxy('context.device.manufacturer'),
        type: track.proxy('context.device.model'),
        year: youboraOpts.device.year,
        firmware: youboraOpts.device.firmware
      }
    },
    User: track.proxy('properties.userId'),
    totalBytes: youboraOpts.totalBytes,
    Rendition: youboraOpts.rendition,
    Referrer: track.proxy('context.page.url'),
    duration: track.proxy('properties.total_length'),
    deviceId: track.proxy('context.device.id'),
    cdn: youboraOpts.cdn
  });

  window.firstBuffer = true;
};

Youbora.prototype.videoPlaybackBufferStarted = function() {
  if (window.adPlaying) {
    if (!window.firstAdBuffer) {
      window.plugin.viewManager.sendAdBufferStart();
    }
  } else if (!window.firstBuffer) {
    window.plugin.viewManager.sendBufferStart();
  }
};

Youbora.prototype.videoPlaybackBufferCompleted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);  
  if (window.adPlaying) {
    if (window.firstAdBuffer) {
      window.plugin.viewManager.sendAdJoin({
        adJoinDuration: youboraOpts.duration
      });
      window.firstAdBuffer = false;
    } else {
      window.plugin.viewManager.sendAdBufferEnd({
        adBufferDuration: youboraOpts.duration,
        adPlayhead: track.proxy('properties.position')
      });
    }
  } else if (window.firstBuffer) {
    window.plugin.viewManager.sendJoin({
      eventTime: track.proxy('properties.position'),
      time: youboraOpts.duration
    });
    window.firstBuffer = false;
  } else {
    window.plugin.viewManager.sendBufferEnd({
      time: track.proxy('properties.position'),
      duration: youboraOpts.duration
    });
  }
};

Youbora.prototype.videoPlaybackPaused = function(track) {
  if (window.adPlaying) {
    window.plugin.viewManager.sendAdPause();
  } else {
    window.plugin.viewManager.sendPause({
      System: track.proxy('properties.position')
    });
  }
};

Youbora.prototype.videoPlaybackResumed = function() {
  if (window.adPlaying) {
    window.plugin.viewManager.sendAdResume();
  } else {
    window.plugin.viewManager.sendResume();
  }
};

Youbora.prototype.videoPlaybackSeekStarted = function() {
  window.plugin.viewManager.sendSeekStart();
};

Youbora.prototype.videoPlaybackSeekCompleted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);
  window.plugin.viewManager.sendSeekEnd({
    duration: youboraOpts.duration
  });
};

Youbora.prototype.videoContentPlaying = function(track) {
  var youboraOpts = this.getYouboraOpts(track);  
  window.plugin.viewManager.sendPing({
    time: track.proxy('properties.position'),
    throughput: youboraOpts.throughput,
    bitrate: youboraOpts.bitrate,
    totalBytes: youboraOpts.totalBytes,
    dataType: youboraOpts.dataType
  });
};

Youbora.prototype.videoContentCompleted = function() {
  window.plugin.viewManager.sendStop();
};

Youbora.prototype.videoAdStarted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);  
  var type;
  switch (track.proxy('properties.type')) {
  case 'pre-roll':
    type = 'pre';
    break;
  case 'mid-roll':
    type = 'mid';
    break;
  case 'post-roll':
    type = 'post';
    break;
  default:
    type = '';
  }

  window.plugin.viewManager.sendAdStart({
    adPosition: type,
    adNumber: youboraOpts.adNumber,
    adResource: youboraOpts.adResource,
    adCampaign: youboraOpts.adCampaign,
    adTitle: track.proxy('properties.title'),
    adDuration: track.proxy('properties.total_length')
  });
  window.adPlaying = true;
  window.firstAdBuffer = true;
};

Youbora.prototype.videoAdPlaying = function(track) {
  this.videoContentPlaying(track);
};

Youbora.prototype.videoAdCompleted = function(track) {
  var youboraOpts = this.getYouboraOpts(track); 
  window.plugin.viewManager.sendAdStop({
    adPlayhead: track.proxy('properties.position'),
    adBitrate: youboraOpts.bitrate
  });
  window.adPlaying = false;
};

// retrieve youbora specific options
Youbora.prototype.getYouboraOpts = function(track) {
  var youboraOpts = track.options(this.name) || {};
  youboraOpts.device = youboraOpts.device || {};
  youboraOpts.contentMetadata = youboraOpts.contentMetadata || {};
  return youboraOpts;
};
