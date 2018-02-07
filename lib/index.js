'use strict';

/**
 * Module dependencies.
 */

var integration = require('@segment/analytics.js-integration');
var pickBy = require('lodash.pickby');
var isEqual = require('lodash.isequal');
var youbora = require('youboralib');
youbora.adapters.Html5 = require('youbora-adapter-html5');
youbora.adapters.DashJS = require('youbora-adapter-dashjs');
youbora.adapters.JWPlayer7 = require('youbora-adapter-jwplayer7');
youbora.adapters.TheoPlayer2 = require('youbora-adapter-theoplayer2');
youbora.adapters.ThePlatform = require('youbora-adapter-theplatform');
youbora.adapters.Videojs5 = require('youbora-adapter-videojs5');

/**
 * Expose `Youbora` integration.
 */

var Youbora = module.exports = integration('Youbora')
  .option('accountCode', '');

/**
 * Initialize.
 *
 * @api public
 */

Youbora.prototype.initialize = function() {
  this.hookPlayers(window.plugin);
  this.pluginMap = {};
  this.ready();
};

/**
 * Video Playback/Content Events
 * http://developer.nicepeopleatwork.com/wp-content/uploads/2017/01/Ingestion_API_Product-Doc_YOUBORA-2.pdf
 * @param {Facade} Track
 */

Youbora.prototype.videoPlaybackStarted = function(track) {
  var sessionId = track.proxy('properties.session_id');
  var plugin = new youbora.Plugin({ accountCode: this.options.accountCode, username: this.analytics.user().id() });

  plugin.setAdapter(new youbora.Adapter());
  plugin.setAdsAdapter(new youbora.Adapter());
  var adapter = plugin.getAdapter();  
  this.pluginMap[sessionId] = plugin;

  var options = pickBy({  // filter out undefined values
    'content.isLive': track.proxy('properties.livestream'),
    'content.resource': track.proxy('context.page.url')
  }, function(prop) { return prop !== undefined; });

  plugin.setOptions(options);
  adapter.monitorPlayhead();
  adapter.fireStart();  
};

Youbora.prototype.videoContentStarted = function(track) {
  var sessionId = track.proxy('properties.session_id');
  var plugin = this.pluginMap[sessionId];
  if (!plugin) return;

  var adapter = plugin.getAdapter();

  var metadata = pickBy({ // filter out undefined values
    content_id: track.proxy('properties.asset_id'),
    genre: track.proxy('properties.genre'),
    owner: track.proxy('properties.publisher')
  }, function(prop) { return prop !== undefined; });

  var options = pickBy({  // filter out undefined values and empty object values
    'content.title': track.proxy('properties.title'),
    'content.title2': track.proxy('properties.program'),
    'content.duration': track.proxy('properties.total_length'),
    'content.metadata': metadata
  }, function(prop) { return prop !== undefined && !isEqual(prop, {}); });

  plugin.setOptions(options);
  adapter.fireJoin();  
};

Youbora.prototype.videoPlaybackBufferStarted = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {
    plugin.getAdsAdapter().fireBufferBegin();
  } else {
    plugin.getAdapter().fireBufferBegin();
  }
};

Youbora.prototype.videoPlaybackBufferCompleted = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {
    plugin.getAdsAdapter().fireBufferEnd();
  } else {
    plugin.getAdapter().fireBufferEnd();    
  }
};

Youbora.prototype.videoPlaybackPaused = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;
  if (track.proxy('properties.ad_asset_id')) {  
    plugin.getAdsAdapter().firePause();
  } else {
    plugin.getAdapter().firePause();
  }
};

Youbora.prototype.videoPlaybackResumed = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {  
    plugin.getAdsAdapter().fireResume();
  } else {
    plugin.getAdapter().fireResume();
  }
};

Youbora.prototype.videoPlaybackSeekStarted = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {  
    plugin.getAdsAdapter().fireSeekBegin();
  } else {
    plugin.getAdapter().fireSeekBegin();
  }
};

Youbora.prototype.videoPlaybackSeekCompleted = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  if (track.proxy('properties.ad_asset_id')) {  
    plugin.getAdsAdapter().fireSeekEnd();
  } else {
    plugin.getAdapter().fireSeekEnd();
  }
};

Youbora.prototype.videoPlaybackCompleted = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  plugin.fireStop();
};

Youbora.prototype.videoPlaybackInterrupted = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  plugin.fireError();
};

// /**
//  * Video Ad Events
//  * http://developer.nicepeopleatwork.com/data-services/collection/data-collection-api-reference/?module=nqs7#/Smart_Ads
//  * @param {Facade} Track
//  */

Youbora.prototype.videoAdStarted = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  plugin.setOptions({
    'ad.title': track.proxy('properties.title')
  });
  plugin.getAdsAdapter().fireStart();
};

Youbora.prototype.videoAdCompleted = function(track) {
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  plugin.getAdsAdapter().fireStop();    
};

// use track only for video ad clicked events since it's not on our spec
Youbora.prototype.track = function(track) {
  if (track.event() !== 'Video Ad Clicked') return;
  var plugin = this.pluginMap[track.proxy('properties.session_id')];
  if (!plugin) return;

  plugin.getAdsAdapter().fireClick();
};

/**
 * Hook Players
 * Connect Youbora to Video Players
 */

Youbora.prototype.hookPlayers = function() {
  var self = this;
  if (!this.options.players) return;
  var players = this.options.players;

  if (Array.isArray(players.dashjs)) {
    players.dashjs.forEach(function(playerObj) {
      self.hookPlayer(playerObj.options, new youbora.adapters.DashJS(playerObj.player));
    });
  }
  if (Array.isArray(players.html5)) {
    players.html5.forEach(function(playerObj) {
      self.hookPlayer(playerObj.options, new youbora.adapters.Html5(playerObj.player));
    });
  }
  if (Array.isArray(players.jwplayer)) {
    players.jwplayer.forEach(function(playerObj) {
      self.hookPlayer(playerObj.options, new youbora.adapters.JWPlayer7(playerObj.player), new youbora.adapters.JWPlayer7.GenericAdsAdapter(playerObj.player));
    });
  }
  if (Array.isArray(players.theoplayer)) {
    players.theoplayer.forEach(function(playerObj) {
      self.hookPlayer(playerObj.options, new youbora.adapters.TheoPlayer2(playerObj.player));
    });
  }
  if (Array.isArray(players.theplatform)) {
    players.theplatform.forEach(function(playerObj) {
      self.hookPlayer(playerObj.options, new youbora.adapters.ThePlatform(playerObj.player), new youbora.adapters.ThePlatform.GenericAdsAdapter(playerObj.player));
    });
  }
  if (Array.isArray(players.videojs)) {
    players.videojs.forEach(function(playerObj) {
      self.hookPlayer(playerObj.options, new youbora.adapters.Videojs5(playerObj.player), new youbora.adapters.Videojs5.GenericAdsAdapter(playerObj.player));
    });
  }
};

/**
 * Hook Player
 * Connect Youbora to a video player
 */

Youbora.prototype.hookPlayer = function(playerOptions, adapter, adsAdapter) {
  var plugin = new youbora.Plugin({ accountCode: this.options.accountCode, username: this.analytics.user().id() });
  plugin.setOptions(playerOptions);
  plugin.setAdapter(adapter);
  if (adsAdapter) plugin.setAdsAdapter(adsAdapter);
};
