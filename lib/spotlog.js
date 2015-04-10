// A lot of this has been ripped from spotcheck
// But I've hacked it to pieces to do something else
// https://github.com/spanishdict/spotcheck

// Node modules
var fs = require('fs')
var path = require('path')

// Package modules
var zlib = require('zlib')
var split = require('split')
var async = require('async')
var moment = require('moment')
var AWS = require('aws-sdk')

/**
 * Logs
 *
 * @param {Object} s3Config which contains s3 `key` & `secret`
 * @param {Object} logConfig which contains `bucket`, `prefix` & `format`
 * @param {Object} Custom logger
 * @return {Object}
 */
module.exports = function(s3Config, logConfig, log) {

  if( ! log) {
    log = {
      verbose: console.log,
      error: console.error
    }
  }

  if( ! s3Config) {
    log.error('s3Config is required')
    return false
  }

  if( ! logConfig) {
    log.error('logConfig is required')
    return false
  }

  AWS.config.update({
    "accessKeyId": s3Config.key,
    "secretAccessKey": s3Config.secret
  })

  var s3 = new AWS.S3()

  // Init
  var app = {}
  var formats = require('./formats')
  var rootDir = process.cwd()
  var start = moment('2015-04-08')
  var end = null
  var format  = formats[logConfig.format]

  var results = []

  /**
   * Download from S3, gunzip, and convert to JSON.
   *
   * @param {String} file path
   * @param {Function} callback
   * @return void
   */
  app.processFile = function(filePath, cb) {
    if (filePath && filePath.length > 1) {
      log.verbose('processing', filePath)

      var params = {
        Bucket: logConfig.bucket,
        Key: filePath
      }

      var read = s3.getObject(params).createReadStream()
      var gunzip = zlib.createGunzip()

      var reader = read

      if (format.gzip) {
        read.pipe(gunzip)
        reader = gunzip
      }

      var json = reader.pipe(split())
      // split() makes each line a chunk
      json.on('data', function(row) {
        var data = format.toJson(row)
        if(data) results.push(data)
      })

      json.on('error', function(err) {
        cb(err)
      })

      json.on('end', function() {
        cb()
      })

    }
  }

  /**
   * List files in bucket that match prefix.
   *
   * @param {Object} params
   * @param {Function} callback
   * @return void
   */
  app.listFiles = function(params, cb) {
    s3.listObjects(params, function(err, data) {
      if (err) return log.error(err)

      // Get list of file paths.
      var paths = []
      data.Contents.forEach(function(filePath) {
        paths.push(filePath.Key)
      })

      // Iterate to the next batch.
      var lastPath = paths[paths.length - 1]
      if (data.IsTruncated) {
        params.Marker = lastPath
        var endMarker = logConfig.prefix + end.format(format.fileDateFormat)
        if (lastPath < endMarker) {
          app.listFiles(params, function(morePaths){
            paths = paths.concat(morePaths)
            cb(paths)
          })
        } else {
          cb(paths)
        }
      } else {
        cb(paths)
      }
    })
  }

  /**
   * Run
   *
   * @param {Function} callback
   * @return void
   */
  app.run = function(callback) {

    var listParams = {
      Bucket: logConfig.bucket,
      MaxKeys: 1000,
      Prefix: logConfig.prefix + start.format(format.fileDateFormat)
    }

    app.listFiles(listParams, function(paths){
      // Process each file path.
      async.eachSeries(paths, app.processFile, function(err) {
        if (err) callback(err)

        return callback(null, results, paths)
      })
    })
  }

  return app
}
