define(function (require, exports, module) {

  const { authorTitle } = require('plug/util/util')
  const { Collection, Events } = require('backbone')
  const { find, extend } = require('underscore')

  const parseDuration = iso => {
    let duration = 0
    let [ minutes, seconds ] = (/PT(?:(\d+)M)?(\d+)S/.exec(iso) || []).slice(1).map(n => parseInt(n, 10) || 0)
    return minutes * 60 + seconds
  }

  class PlaylistImporter {
    constructor(id) {
      extend(this, Events)
      this.id = id
      this.items = []
      this.done = false
    }

    nextPage(cb) {
      let opts = {
        part: 'snippet',
        playlistId: this.id,
        maxResults: 50
      }
      if (this.nextPageToken) {
        opts.pageToken = this.nextPageToken
      }
      let request = gapi.client.youtube.playlistItems.list(opts)
      request.execute(res => {
        this.nextPageToken = res.result.nextPageToken
        let media = res.result.items.map(x => x.snippet)
        let videoIds = media.map(x => x.resourceId.videoId)
        // get durations
        let request = gapi.client.youtube.videos.list({
          id: videoIds.join(','),
          part: 'contentDetails'
        })
        request.execute(res => {
          let details = res.result.items.map(x => ({
            id: x.id,
            duration: x.contentDetails.duration
          }))
          let items = media.map(item => {
            let video = find(details, d => d.id === item.resourceId.videoId)
            if (video) {
              item.duration = video.duration
            }
            return item
          }).filter(item => item.duration)
          this.items = this.items.concat(items)
          cb(null, items)
        })
      })
    }

    loadAll(cb) {
      if (this.items.length > 0) {
        this.trigger('load', this.toMediaItems())
      }
      if (this.done) {
        return this.trigger('finish', this.toMediaItems())
      }
      this.nextPage((e, items) => {
        if (e) {
          this.trigger('error', e)
          return cb && cb(e)
        }
        this.trigger('load', this.toMediaItems(items))
        if (this.nextPageToken) {
          this.loadAll(cb)
        }
        else {
          this.done = true
          let media = this.toMediaItems()
          this.trigger('finish', media)
          cb && cb(null, media)
        }
      })
    }

    importTo(collection, cb) {
      this.on('load', items => {
        collection.add(items)
      })
      this.loadAll(cb)
    }

    toMediaItems(items = this.items) {
      return items.map(item => {
        let at = authorTitle(item.title)
        return {
          id: null,
          format: 1,
          cid: item.resourceId.videoId,
          author: at.author || item.channelTitle,
          title: at.title,
          image: item.thumbnails.default.url,
          duration: parseDuration(item.duration)
        }
      })
    }
  }

  module.exports = PlaylistImporter

})
