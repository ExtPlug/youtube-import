define(function (require, exports, module) {

  const Plugin = require('extplug/Plugin')
  const remoteMediaFacade = require('plug/facades/remoteMediaFacade')
  const YTPlaylistOriginal = require('plug/actions/youtube/YouTubePlaylistService')
  const YTPlaylistService = require('./YouTubePlaylistService')
  const YTImportOriginal = require('plug/actions/youtube/YouTubeImportService')
  const YTImportService = require('./YouTubeImportService')

  const PLAYLIST_URL = 'https://www.youtube.com/playlist?list='

  const YouTubeImport = Plugin.extend({
    name: 'YouTube Import',
    description: 'Mostly working YouTube importing functions.',

    enable() {
      // plug only instantiates these once, and only if the properties are not
      // set. so we can just set the properties without overriding anything
      // else \o/
      remoteMediaFacade.ytImportService = new YTImportService()
      remoteMediaFacade.ytPlaylistService = new YTPlaylistService()
    },

    disable() {
      remoteMediaFacade.ytImportService = new YTImportOriginal()
      remoteMediaFacade.ytPlaylistService = new YTPlaylistOriginal()
    }
  })

  module.exports = YouTubeImport

})
