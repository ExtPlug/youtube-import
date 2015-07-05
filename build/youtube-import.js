

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

define('extplug/youtube-import/PlaylistImporter',['require','exports','module','plug/util/util','backbone','underscore'],function (require, exports, module) {

  var util = require('plug/util/util');

  var _require = require('backbone');

  var Collection = _require.Collection;
  var Events = _require.Events;

  var _require2 = require('underscore');

  var find = _require2.find;
  var extend = _require2.extend;

  var ISO8601 = /PT(\d+H)?(\d+M)?(\d+S)?/;
  var parseDuration = function parseDuration(iso) {
    var duration = 0;

    var _slice$map = (ISO8601.exec(iso) || []).slice(1).map(function (n) {
      return parseInt(n, 10) || 0;
    });

    var _slice$map2 = _slicedToArray(_slice$map, 3);

    var hours = _slice$map2[0];
    var minutes = _slice$map2[1];
    var seconds = _slice$map2[2];

    return hours * 3600 + minutes * 60 + seconds;
  };

  var PlaylistImporter = (function () {
    function PlaylistImporter(id) {
      _classCallCheck(this, PlaylistImporter);

      extend(this, Events);
      this.id = id;
      this.items = [];
      this.done = false;
    }

    _createClass(PlaylistImporter, [{
      key: 'nextPage',
      value: function nextPage(cb) {
        var _this = this;

        var opts = {
          part: 'snippet',
          playlistId: this.id,
          maxResults: 50
        };
        if (this.nextPageToken) {
          opts.pageToken = this.nextPageToken;
        }
        var request = gapi.client.youtube.playlistItems.list(opts);
        request.execute(function (res) {
          _this.nextPageToken = res.result.nextPageToken;
          var media = res.result.items.map(function (x) {
            return x.snippet;
          });
          var videoIds = media.map(function (x) {
            return x.resourceId.videoId;
          });
          // get durations
          var request = gapi.client.youtube.videos.list({
            id: videoIds.join(','),
            part: 'contentDetails'
          });
          request.execute(function (res) {
            var details = res.result.items.map(function (x) {
              return {
                id: x.id,
                duration: x.contentDetails.duration
              };
            });
            var items = media.map(function (item) {
              var video = find(details, function (d) {
                return d.id === item.resourceId.videoId;
              });
              if (video) {
                item.duration = video.duration;
              }
              return item;
            }).filter(function (item) {
              return item.duration;
            });
            _this.items = _this.items.concat(items);
            cb(null, items);
          });
        });
      }
    }, {
      key: 'loadAll',
      value: function loadAll(cb) {
        var _this2 = this;

        if (this.items.length > 0) {
          this.trigger('load', this.toMediaItems());
        }
        if (this.done) {
          return this.trigger('finish', this.toMediaItems());
        }
        this.nextPage(function (e, items) {
          if (e) {
            _this2.trigger('error', e);
            return cb && cb(e);
          }
          _this2.trigger('load', _this2.toMediaItems(items));
          if (_this2.nextPageToken) {
            _this2.loadAll(cb);
          } else {
            _this2.done = true;
            var media = _this2.toMediaItems();
            _this2.trigger('finish', media);
            cb && cb(null, media);
          }
        });
      }
    }, {
      key: 'importTo',
      value: function importTo(collection, cb) {
        this.on('load', function (items) {
          collection.add(items);
        });
        this.loadAll(cb);
      }
    }, {
      key: 'toMediaItems',
      value: function toMediaItems() {
        var items = arguments[0] === undefined ? this.items : arguments[0];

        return items.map(function (item) {
          var at = util.authorTitle(item.title);
          return {
            id: null,
            format: 1,
            cid: item.resourceId.videoId,
            author: at.author || item.channelTitle,
            title: at.title,
            image: item.thumbnails['default'].url,
            duration: parseDuration(item.duration)
          };
        });
      }
    }]);

    return PlaylistImporter;
  })();

  module.exports = PlaylistImporter;
});

// get rid of full match;


var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

define('extplug/youtube-import/YouTubeImporter',['require','exports','module','plug/core/Class','backbone','underscore'],function (require, exports, module) {

  var Class = require('plug/core/Class');

  var _require = require('backbone');

  var Collection = _require.Collection;
  var Events = _require.Events;

  var _require2 = require('underscore');

  var find = _require2.find;
  var extend = _require2.extend;

  var PlaylistLister = (function () {
    function PlaylistLister(id) {
      _classCallCheck(this, PlaylistLister);

      extend(this, Events);
      this.id = id;
      this.items = [];
    }

    _createClass(PlaylistLister, [{
      key: 'nextPage',
      value: function nextPage(cb) {
        var _this = this;

        var opts = {
          part: 'id,snippet,contentDetails',
          channelId: this.id,
          maxResults: 50
        };
        if (this.nextPageToken) {
          opts.pageToken = this.nextPageToken;
        }
        var request = gapi.client.youtube.playlists.list(opts);
        request.execute(function (res) {
          _this.nextPageToken = res.result.nextPageToken;
          _this.items = _this.items.concat(res.result.items);
          cb(null, res.result.items);
        });
      }
    }, {
      key: 'loadAll',
      value: function loadAll(cb) {
        var _this2 = this;

        if (this.items.length > 0) {
          this.trigger('load', this.toPlaylistItems());
        }
        if (this.done) {
          return this.trigger('finish', this.toPlaylistItems());
        }
        this.nextPage(function (e, items) {
          if (e) {
            _this2.trigger('error', e);
            return cb && cb(e);
          }
          _this2.trigger('load', _this2.toPlaylistItems(items));
          if (_this2.nextPageToken) {
            _this2.loadAll(cb);
          } else {
            _this2.done = true;
            var playlists = _this2.toPlaylistItems();
            _this2.trigger('finish', playlists);
            cb && cb(null, playlists);
          }
        });
      }
    }, {
      key: 'toPlaylistItems',
      value: function toPlaylistItems() {
        var _this3 = this;

        return this.items.map(function (item) {
          return {
            name: item.snippet.title,
            username: _this3.id,
            playlistID: item.id,
            count: item.contentDetails.itemCount
          };
        });
      }
    }]);

    return PlaylistLister;
  })();

  module.exports = PlaylistLister;
});


function _slicedToArray(arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }

define('extplug/youtube-import/main',['require','exports','module','extplug/Plugin','./PlaylistImporter','./YouTubeImporter','plug/actions/youtube/YouTubePlaylistService','plug/actions/youtube/YouTubeImportService','meld'],function (require, exports, module) {

  var Plugin = require('extplug/Plugin');
  var PlaylistImporter = require('./PlaylistImporter');
  var YouTubeImporter = require('./YouTubeImporter');
  var YTPlaylistService = require('plug/actions/youtube/YouTubePlaylistService');
  var YTImportService = require('plug/actions/youtube/YouTubeImportService');

  var _require = require('meld');

  var around = _require.around;

  var PLAYLIST_URL = 'https://www.youtube.com/playlist?list=';
  var CHANNEL_URL = 'https://www.youtube.com/channel/';
  var USER_URL = 'https://www.youtube.com/user/';

  var YouTubeImport = Plugin.extend({
    name: 'YouTube Import',
    description: 'Mostly working YouTube importing functions.',

    enable: function enable() {
      var _this = this;

      this.plAdvice = around(YTPlaylistService.prototype, 'load', function (joinpoint) {
        var _joinpoint$args = _slicedToArray(joinpoint.args, 2);

        var username = _joinpoint$args[0];
        var cb = _joinpoint$args[1];

        // strip channel URL prefix
        if (username.indexOf(CHANNEL_URL) === 0) {
          username = username.slice(CHANNEL_URL.length);
        }
        if (username.indexOf(USER_URL) === 0) {
          username = username.slice(USER_URL.length);
        }
        // strip URL suffixes like /videos, /playlists
        if (username.indexOf('/') !== -1) {
          username = username.split('/')[0];
        }
        _this.resolveChannelId(username, function (err, channelId) {
          new YouTubeImporter(channelId).loadAll(function (err, result) {
            cb(result);
          });
        });
      });
      this.imAdvice = around(YTImportService.prototype, 'load', function (joinpoint) {
        var _joinpoint$args2 = _slicedToArray(joinpoint.args, 3);

        var playlist = _joinpoint$args2[0];
        var isFaves = _joinpoint$args2[1];
        var cb = _joinpoint$args2[2];

        new PlaylistImporter(playlist).loadAll(function (err, result) {
          cb(result);
        });
      });
    },

    disable: function disable() {
      this.plAdvice.remove();
      this.imAdvice.remove();
    },

    resolveChannelId: function resolveChannelId(username, cb) {
      var request = gapi.client.youtube.channels.list({
        part: 'id',
        forUsername: username
      });
      request.execute(function (res) {
        if (res.items.length > 0) {
          cb(null, res.items[0].id);
        } else {
          cb(null, username);
        }
      });
    }
  });

  module.exports = YouTubeImport;
});
