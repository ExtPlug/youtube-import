define(function (require, exports, module) {

  const Class = require('plug/core/Class')
  const { Collection, Events } = require('backbone')
  const { find, extend } = require('underscore')

  class PlaylistLister {
    constructor(id) {
      extend(this, Events)
      this.id = id
      this.items = []
    }

    nextPage(cb) {
      let opts = {
        part: 'id,snippet,contentDetails',
        channelId: this.id,
        maxResults: 50
      }
      if (this.nextPageToken) {
        opts.pageToken = this.nextPageToken
      }
      let request = gapi.client.youtube.playlists.list(opts)
      request.execute(res => {
        this.nextPageToken = res.result.nextPageToken
        this.items = this.items.concat(res.result.items)
        cb(null, res.result.items)
      })
    }

    loadAll(cb) {
      if (this.items.length > 0) {
        this.trigger('load', this.toPlaylistItems())
      }
      if (this.done) {
        return this.trigger('finish', this.toPlaylistItems())
      }
      this.nextPage((e, items) => {
        if (e) {
          this.trigger('error', e)
          return cb && cb(e)
        }
        this.trigger('load', this.toPlaylistItems(items))
        if (this.nextPageToken) {
          this.loadAll(cb)
        }
        else {
          this.done = true
          let playlists = this.toPlaylistItems()
          this.trigger('finish', playlists)
          cb && cb(null, playlists)
        }
      })
    }

    toPlaylistItems() {
      return this.items.map(item => ({
        name: item.snippet.title,
        username: this.id,
        playlistID: item.id,
        count: item.contentDetails.itemCount
      }))
    }
  }

  module.exports = PlaylistLister

})
