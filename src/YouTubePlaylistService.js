define(function (require, exports, module) {

  const Base = require('plug/actions/youtube/YouTubePlaylistService')
  const Events = require('plug/core/Events')

  const CHANNEL_URL = 'https://www.youtube.com/channel/'
  const USER_URL = 'https://www.youtube.com/user/'

  const YouTubePlaylistService = Base.extend({
    // accept user and channel URLs in the import field
    load(username, cb) {
      // strip channel URL prefix
      if (username.indexOf(CHANNEL_URL) === 0) {
        username = username.slice(CHANNEL_URL.length)
      }
      if (username.indexOf(USER_URL) === 0) {
        username = username.slice(USER_URL.length)
      }
      // strip URL suffixes like /videos, /playlists
      if (username.indexOf('/') !== -1) {
        username = username.split('/')[0]
      }
      this.pageToken = null
      return this._super(username, cb)
    },

    onChannel({ result }) {
      if (result.items.length > 0) {
        this.channelId = result.items[0].id
        this.loadLists()
      }
      else if (this.username) {
        this.channelId = this.username
        this.setUsername().then(() => {
          Events.trigger('import:ytplaylists', this.username)
          this.loadLists()
        })
      }
      else {
        this.errorBind()
      }
    },

    loadLists() {
      gapi.client.youtube.playlists.list({
        part: 'snippet',
        maxResults: 50,
        channelId: this.channelId,
        pageToken: this.pageToken,
        fields: 'nextPageToken,items(id,snippet/title)'
      }).then(this.listBind, this.errorBind)
    },

    setUsername(cb) {
      return gapi.client.youtube.channels.list({
        part: 'snippet',
        id: this.channelId,
        fields: 'items(snippet/title)',
        maxResults: 1
      }).then(
        ({ result }) => {
          if (result.items.length && result.items[0].snippet) {
            this.username = result.items[0].snippet.title
          }
          return this.username
        },
        // if we can't find a username, we'll just use the channel ID instead
        () => {
          this.username = this.channelId
          return this.username
        }
      )
    },

    onComplete(e) {
      if (e.result.nextPageToken) {
        this.pageToken = e.result.nextPageToken
      }
      return this._super(e)
    }
  })

  module.exports = YouTubePlaylistService

})
