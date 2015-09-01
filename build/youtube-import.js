

define('extplug/youtube-import/YouTubePlaylistService',['require','exports','module','plug/actions/youtube/YouTubePlaylistService','plug/core/Events'],function (require, exports, module) {

  var Base = require('plug/actions/youtube/YouTubePlaylistService');
  var Events = require('plug/core/Events');

  var CHANNEL_URL = 'https://www.youtube.com/channel/';
  var USER_URL = 'https://www.youtube.com/user/';

  var YouTubePlaylistService = Base.extend({
    // accept user and channel URLs in the import field
    load: function load(username, cb) {
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
      this.pageToken = null;
      return this._super(username, cb);
    },

    onChannel: function onChannel(_ref) {
      var _this = this;

      var result = _ref.result;

      if (result.items.length > 0) {
        this.channelId = result.items[0].id;
        this.loadLists();
      } else if (this.username) {
        this.channelId = this.username;
        this.setUsername().then(function () {
          Events.trigger('import:ytplaylists', _this.username);
          _this.loadLists();
        });
      } else {
        this.errorBind();
      }
    },

    loadLists: function loadLists() {
      gapi.client.youtube.playlists.list({
        part: 'snippet',
        maxResults: 50,
        channelId: this.channelId,
        pageToken: this.pageToken,
        fields: 'nextPageToken,items(id,snippet/title)'
      }).then(this.listBind, this.errorBind);
    },

    setUsername: function setUsername(cb) {
      var _this2 = this;

      return gapi.client.youtube.channels.list({
        part: 'snippet',
        id: this.channelId,
        fields: 'items(snippet/title)',
        maxResults: 1
      }).then(function (_ref2) {
        var result = _ref2.result;

        if (result.items.length && result.items[0].snippet) {
          _this2.username = result.items[0].snippet.title;
        }
        return _this2.username;
      },
      // if we can't find a username, we'll just use the channel ID instead
      function () {
        _this2.username = _this2.channelId;
        return _this2.username;
      });
    },

    onComplete: function onComplete(e) {
      if (e.result.nextPageToken) {
        this.pageToken = e.result.nextPageToken;
      }
      return this._super(e);
    }
  });

  module.exports = YouTubePlaylistService;
});


define('extplug/youtube-import/YouTubeImportService',['require','exports','module','plug/actions/youtube/YouTubeImportService'],function (require, exports, module) {

  var Base = require('plug/actions/youtube/YouTubeImportService');

  var YouTubeImportService = Base.extend({});

  module.exports = YouTubeImportService;
});


define('extplug/youtube-import/main',['require','exports','module','extplug/Plugin','plug/facades/remoteMediaFacade','plug/actions/youtube/YouTubePlaylistService','./YouTubePlaylistService','plug/actions/youtube/YouTubeImportService','./YouTubeImportService'],function (require, exports, module) {

  var Plugin = require('extplug/Plugin');
  var remoteMediaFacade = require('plug/facades/remoteMediaFacade');
  var YTPlaylistOriginal = require('plug/actions/youtube/YouTubePlaylistService');
  var YTPlaylistService = require('./YouTubePlaylistService');
  var YTImportOriginal = require('plug/actions/youtube/YouTubeImportService');
  var YTImportService = require('./YouTubeImportService');

  var PLAYLIST_URL = 'https://www.youtube.com/playlist?list=';

  var YouTubeImport = Plugin.extend({
    name: 'YouTube Import',
    description: 'Mostly working YouTube importing functions.',

    enable: function enable() {
      // plug only instantiates these once, and only if the properties are not
      // set. so we can just set the properties without overriding anything
      // else \o/
      remoteMediaFacade.ytImportService = new YTImportService();
      remoteMediaFacade.ytPlaylistService = new YTPlaylistService();
    },

    disable: function disable() {
      remoteMediaFacade.ytImportService = new YTImportOriginal();
      remoteMediaFacade.ytPlaylistService = new YTPlaylistOriginal();
    }
  });

  module.exports = YouTubeImport;
});
