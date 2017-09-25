'use strict';

var Analytics = require('@segment/analytics.js-core').constructor;
var integrationTester = require('@segment/analytics.js-integration-tester');
var integration = require('@segment/analytics.js-integration');
var sandbox = require('@segment/clear-env');
var Youbora = require('../lib/'); // FIXME

describe('Youbora', function() { // FIXME
  var analytics;
  var youbora; // FIXME
  var options = {};

  beforeEach(function() {
    analytics = new Analytics();
    youbora = new Youbora(options); // FIXME
    analytics.use(integrationTester);
    analytics.use(Youbora); // FIXME
    analytics.add(youbora); // FIXME
  });

  afterEach(function() {
    analytics.restore();
    analytics.reset();
    youbora.reset(); // FIXME
    sandbox();
  });

  it('should have the correct options', function() { // FIXME
    analytics.compare(Youbora, integration('Youbora')
    .option('accountCode', ''));
  });

  describe('before loading', function() {
    beforeEach(function() {
      analytics.stub(youbora, 'load'); // FIXME
    });

    describe('#initialize', function() {
      // write assertions here if you do any logic to create or set things in the `.initialize()` function

      it('should call load', function() {
        analytics.initialize();
      });
    });
  });

  describe('loading', function() {
    it('should load', function(done) {
      analytics.load(youbora, done); // FIXME
    });
  });

  describe('after loading', function() {
    beforeEach(function(done) {
      analytics.once('ready', done);
      analytics.initialize();
    });

    // write all your post-load assertions and unit tests here such 
    describe('#track', function() {
      describe('#content events', function() {
        var props;
        beforeEach(function() {
          analytics.spy(window.plugin.viewManager, 'sendStart');
          analytics.spy(window.plugin.viewManager, 'sendPing');
          analytics.spy(window.plugin.viewManager, 'sendStop');
        });
        it('should correctly map props for video content started', function() {
          props = {
            userId: 32,
            livestream: false,
            asset_id: '29802',
            title: 'Justin\'s video',
            genre: 'documentary',
            publisher: 'Justin',
            total_length: 400
          };
          analytics.track('Video Content Started', props, {
            integrations: {
              Youbora: {
                transactionType: 'rental',
                quality: '1080p',
                contentType: 'Movie',
                totalBytes: 3200,
                rendition: '4',
                cdn: '1',
                contentMetadata: {
                  filename: 'justin_video',
                  language: 'English',
                  year: 2017,
                  cast: 'Justin, Jim',
                  director: 'Rick',
                  parental: 'R',
                  price: 4,
                  rating: 4,
                  audioType: 'Dolby',
                  audioChannels: 5.1
                },
                device: {
                  year: 2015,
                  firmware: 3.0
                }
              }
            },
            page: {
              url: 'justin.com'
            },
            device: {
              id: '432',
              manufacturer: 'LG',
              model: 'iphone 4'
            }
          });
          analytics.assert(window.firstBuffer === true);
          var args = window.plugin.viewManager.sendStart.args;
          analytics.deepEqual(args[0][0], {
            live: false,
            User: 32,
            totalBytes: 3200,
            Rendition: '4',
            Referrer: 'justin.com',
            duration: 400,
            deviceId: '432',
            cdn: '1',
            properties: {
              filename: 'justin_video',
              content_id: '29802',
              content_metadata: {
                title: 'Justin\'s video',
                genre: 'documentary',
                language: 'English',
                year: 2017,
                cast: 'Justin, Jim',
                director: 'Rick',
                owner: 'Justin',
                parental: 'R',
                price: 4,
                rating: 4,
                audioType: 'Dolby',
                audioChannels: 5.1
              },
              transaction_type: 'rental',
              quality: '1080p',
              content_type: 'Movie',
              device: {
                manufacturer: 'LG',
                type: 'iphone 4',
                year: 2015,
                firmware: 3.0
              }
            }
          });
        });
        it('should correctly map props for video content playing', function() {
          props = {
            position: 42
          };
          analytics.track('Video Content Playing', props, {
            integrations: {
              Youbora: {
                throughput: 40,
                bitrate: 32,
                totalBytes: 324,
                dataType: 0
              }
            }
          });
          var args = window.plugin.viewManager.sendPing.args;
          analytics.deepEqual(args[0][0], {
            time: 42,
            throughput: 40,
            bitrate: 32,
            totalBytes: 324,
            dataType: 0
          });
        });
        it('should send a sendstop when video content completed', function() {
          analytics.track('Video Content Completed');
          analytics.called(window.plugin.viewManager.sendStop);
        });
      });

      describe('#playback events', function() {
        beforeEach(function() {
          analytics.spy(window.plugin.viewManager, 'sendJoin');
          analytics.spy(window.plugin.viewManager, 'sendBufferEnd');
          analytics.spy(window.plugin.viewManager, 'sendPause');
          analytics.spy(window.plugin.viewManager, 'sendResume');
          analytics.spy(window.plugin.viewManager, 'sendSeekStart');
          analytics.spy(window.plugin.viewManager, 'sendSeekEnd');
        });

        it('should send a join on first buffer', function() {
          window.adPlaying = false;
          window.firstBuffer = true;
          analytics.track('Video Playback Buffer Started');
          analytics.track('Video Playback Buffer Completed', { position: 0 }, {
            integrations: {
              Youbora: {
                duration: 5
              }
            }
          });
          var args = window.plugin.viewManager.sendJoin.args;
          analytics.deepEqual(args[0][0], {
            eventTime: 0,
            time: 5
          });
        });

        it('should correctly map props for buffering events', function() {
          window.adPlaying = false;
          window.firstBuffer = false;
          analytics.track('Video Playback Buffer Started');
          analytics.track('Video Playback Buffer Completed', { position: 10 }, {
            integrations: {
              Youbora: {
                duration: 5
              }
            }
          });
          var args = window.plugin.viewManager.sendBufferEnd.args;
          analytics.deepEqual(args[0][0], {
            time: 10,
            duration: 5
          });
        });

        it('should send a pause for playback pause event', function() {
          window.adPlaying = false;
          analytics.track('Video Playback Paused');
          analytics.called(window.plugin.viewManager.sendPause);
        });

        it('should send a resume for playback resume event', function() {
          window.adPlaying = false;
          analytics.track('Video Playback Resumed');
          analytics.called(window.plugin.viewManager.sendResume);
        });

        it('should correctly map props for seek events', function() {
          analytics.track('Video Playback Seek Started');
          analytics.track('Video Playback Seek Completed', {}, {
            integrations: {
              Youbora: {
                duration: 5
              }
            }
          });
          analytics.called(window.plugin.viewManager.sendSeekStart);
          var args = window.plugin.viewManager.sendSeekEnd.args;
          analytics.deepEqual(args[0][0], { duration: 5 });
        }); 
      });

      describe('#ad playback events', function() {
        var props;
        beforeEach(function() {
          analytics.spy(window.plugin.viewManager, 'sendAdStart');
          analytics.spy(window.plugin.viewManager, 'sendAdJoin');
          analytics.spy(window.plugin.viewManager, 'sendAdBufferEnd');
          analytics.spy(window.plugin.viewManager, 'sendAdBufferStart');
          analytics.spy(window.plugin.viewManager, 'sendPing');
          analytics.spy(window.plugin.viewManager, 'sendAdStop');
        });

        it('should correctly map props for video ad started event', function() {
          props = {
            type: 'mid-roll',
            title: 'Justin\'s ad',
            total_length: 32
          };
          analytics.track('Video Ad Started', props, {
            integrations: {
              Youbora: {
                adNumber: 1,
                adResource: 'justin.mp4',
                adCampaign: 'Campaign 1'
              }
            }
          });
          var args = window.plugin.viewManager.sendAdStart.args;
          analytics.deepEqual(args[0][0], {
            adPosition: 'mid',
            adNumber: 1,
            adResource: 'justin.mp4',
            adCampaign: 'Campaign 1',
            adTitle: 'Justin\'s ad',
            adDuration: 32
          });
          analytics.assert(window.adPlaying === true);
          analytics.assert(window.firstAdBuffer === true);
        });

        it('should send a join for first ad buffer event', function() {
          window.adPlaying = true;
          window.firstAdBuffer = true;
          analytics.track('Video Playback Buffer Started');
          analytics.track('Video Playback Buffer Completed', {}, {
            integrations: {
              Youbora: {
                duration: 4
              }
            }
          });
          var args = window.plugin.viewManager.sendAdJoin.args;
          analytics.deepEqual(args[0][0], {
            adJoinDuration: 4
          });
          analytics.assert(window.firstAdBuffer === false);
        });

        it('should correctly map props for ad buffer events', function() {
          window.adPlaying = true;
          window.firstAdBuffer = false;
          analytics.track('Video Playback Buffer Started');
          analytics.track('Video Playback Buffer Completed', { position: 19 }, {
            integrations: {
              Youbora: {
                duration: 4
              }
            }
          });
          analytics.called(window.plugin.viewManager.sendAdBufferStart);
          var args = window.plugin.viewManager.sendAdBufferEnd.args;
          analytics.deepEqual(args[0][0], {
            adBufferDuration: 4,
            adPlayhead: 19
          });
        });
        
        it('should correctly map props for video ad playing', function() {
          props = {
            position: 42
          };
          analytics.track('Video Ad Playing', props, {
            integrations: {
              Youbora: {
                throughput: 40,
                bitrate: 32,
                totalBytes: 324,
                dataType: 0
              }
            }
          });
          var args = window.plugin.viewManager.sendPing.args;
          analytics.deepEqual(args[0][0], {
            time: 42,
            throughput: 40,
            bitrate: 32,
            totalBytes: 324,
            dataType: 0
          });
        });
        
        it('video ad completed event', function() {
          analytics.track('Video Ad Completed', { position: 43 }, {
            integrations: {
              Youbora: {
                bitrate: 32
              }
            }
          });
          var args = window.plugin.viewManager.sendAdStop.args;
          analytics.deepEqual(args[0][0], {
            adPlayhead: 43,
            adBitrate: 32
          });
        });
      });
    });
  });
});
