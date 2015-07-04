define(function (require, exports, module) {

  const Plugin = require('extplug/Plugin')
  const PlaylistImporter = require('./PlaylistImporter')
  const YouTubeImporter = require('./YouTubeImporter')
  const YTPlaylistService = require('plug/actions/youtube/YouTubePlaylistService')
  const YTImportService = require('plug/actions/youtube/YouTubeImportService')
  const { around } = require('meld')

  const YouTubeImport = Plugin.extend({
    name: 'YouTube Import',
    description: 'Working YouTube importing functions.',

    enable() {
      this.plAdvice = around(YTPlaylistService.prototype, 'load', joinpoint => {
        let [ username, cb ] = joinpoint.args
        new YouTubeImporter(username).loadAll((err, result) => {
          cb(result)
        })
      })
      this.imAdvice = around(YTImportService.prototype, 'load', joinpoint => {
        let [ playlist, isFaves, cb ] = joinpoint.args
        new PlaylistImporter(playlist).loadAll((err, result) => {
          cb(result)
        })
      })
    },

    disable() {
      this.plAdvice.remove()
      this.imAdvice.remove()
    }
  })

  module.exports = YouTubeImport

})
