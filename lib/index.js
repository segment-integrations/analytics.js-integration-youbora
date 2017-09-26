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
  self = this;
  this.load(function() {
    self.adPlaying = false;
    self.firstAdBuffer = true;
    var YB = window.$YB;
  
    // initialize main plugin
    YB.plugins.Segment = function(options) {
      this.pluginName = 'segment';
      this.pluginVersion = '5.4.6-1.0-segment';
      this.startMonitoring(null, options);
    };
    YB.plugins.Segment.prototype = new YB.plugins.Generic;
    window.plugin = new YB.plugins.Segment({ accountCode: self.options.accountCode });

    // initialize ads plugin
    YB.adnalyzers.SegmentAds = function(plugin) {
      this.adnalyzerVersion = '5.4.6-1.0-segmentAds';
      this.startMonitoring(plugin);
    };
    YB.adnalyzers.SegmentAds.prototype = new YB.adnalyzers.Generic();
    window.adnalyzer = new YB.adnalyzers.SegmentAds(window.plugin);
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
  return window.plugin && window.adnalyzer;
};

Youbora.prototype.videoPlaybackStarted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);
  var startProps = {
    live: track.proxy('properties.livestream'),
    properties: {
      filename: youboraOpts.contentMetadata.filename,
      content_id: youboraOpts.contentId,
      content_metadata: {
        title: youboraOpts.contentMetadata.title,
        genre: youboraOpts.contentMetadata.genre,
        language: youboraOpts.contentMetadata.language,
        year: youboraOpts.contentMetadata.year,
        cast: youboraOpts.contentMetadata.cast,
        director: youboraOpts.contentMetadata.director,
        owner: youboraOpts.contentMetadata.owner,
        parental: youboraOpts.contentMetadata.parental,
        price: youboraOpts.contentMetadata.price,
        rating: youboraOpts.contentMetadata.rating,
        audioType: youboraOpts.contentMetadata.audioType,
        audioChannels: youboraOpts.contentMetadata.audioChannels
      },
      transaction_type: youboraOpts.transactionType,
      quality: track.proxy('properties.quality'),
      content_type: youboraOpts.contentType,
      device: {
        manufacturer: track.proxy('context.device.manufacturer'),
        type: track.proxy('context.device.model'),
        year: youboraOpts.device.year,
        firmware: youboraOpts.device.firmware
      }
    },
    User: track.proxy('context.userId'),
    totalBytes: youboraOpts.totalBytes,
    Rendition: youboraOpts.rendition,
    Referrer: track.proxy('context.page.url'),
    duration: track.proxy('properties.total_length'),
    deviceId: track.proxy('context.device.id'),
    cdn: youboraOpts.cdn
  };
  window.plugin.viewManager.sendStart(startProps);
};

Youbora.prototype.videoContentStarted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);
  window.plugin.viewManager.sendJoin({
    time: youboraOpts.joinTime,  // optional, calculated internally by youbora
    eventTime: track.proxy('properties.position')
  });
};

Youbora.prototype.videoPlaybackBufferStarted = function() {
  if (this.adPlaying) {
    if (!this.firstAdBuffer) {
      window.plugin.viewManager.sendAdBufferStart();
    }
  } else {
    window.plugin.viewManager.sendBufferStart();
  }
};

Youbora.prototype.videoPlaybackBufferCompleted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);  
  if (this.adPlaying) {
    if (this.firstAdBuffer) {
      window.plugin.viewManager.sendAdJoin({
        adJoinDuration: youboraOpts.duration  // optional, calculated internally by youbora
      });
      this.firstAdBuffer = false;
    } else {
      window.plugin.viewManager.sendAdBufferEnd({
        adBufferDuration: youboraOpts.duration,  // optional, calculated internally by youbora
        adPlayhead: track.proxy('properties.position')
      });
    }
  } else {
    window.plugin.viewManager.sendBufferEnd({
      time: track.proxy('properties.position'),
      duration: youboraOpts.duration  // optional, calculated internally by youbora
    });
  }
};

Youbora.prototype.videoPlaybackPaused = function(track) {
  if (this.adPlaying) {
    window.plugin.viewManager.sendAdPause({
      System: track.proxy('properties.position')
    });
  } else {
    window.plugin.viewManager.sendPause({
      System: track.proxy('properties.position')
    });
  }
};

Youbora.prototype.videoPlaybackResumed = function() {
  if (this.adPlaying) {
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
    duration: youboraOpts.duration  // optional, youbora already calculates this internally
  });
};

Youbora.prototype.videoContentPlaying = function(track) {
  var youboraOpts = this.getYouboraOpts(track);  
  var pingProps = {
    time: track.proxy('properties.position'),
    throughput: youboraOpts.throughput,
    bitrate: youboraOpts.bitrate,
    totalBytes: youboraOpts.totalBytes,
    dataType: youboraOpts.dataType
  };
  window.plugin.viewManager.sendPing(pingProps);
};

Youbora.prototype.videoPlaybackCompleted = function() {
  window.plugin.viewManager.sendStop();
};

Youbora.prototype.videoAdStarted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);  
  var type = track.proxy('properties.type');
  if (type) type = type.replace('-roll', '');

  var adStartProps = {
    adPosition: type,
    adNumber: youboraOpts.adNumber,
    adResource: youboraOpts.adResource,
    adCampaign: youboraOpts.adCampaign,
    adTitle: track.proxy('properties.title'),
    adDuration: track.proxy('properties.total_length')
  };

  window.plugin.viewManager.sendAdStart(adStartProps);
  this.adPlaying = true;
  this.firstAdBuffer = true;
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
  this.adPlaying = false;
};

Youbora.prototype.videoPlaybackInterrupted = function(track) {
  var youboraOpts = this.getYouboraOpts(track);
  window.plugin.viewManager.sendError({
    errorCode: youboraOpts.errorCode,
    msg: track.proxy('properties.method')
  });
};

// retrieve youbora specific options
Youbora.prototype.getYouboraOpts = function(track) {
  var youboraOpts = track.options(this.name) || {};
  youboraOpts.device = youboraOpts.device || {};
  youboraOpts.contentMetadata = youboraOpts.contentMetadata || {};
  return youboraOpts;
};
