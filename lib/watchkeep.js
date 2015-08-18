// Node modules
var fs = require('fs')
var path = require('path')

// Package modules
var zlib = require('zlib')
var _ = require('underscore')
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
      error: console.error,
      debug: console.debug,
      warn: console.debug
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
  var wk = {}
  var formats = require('./formats')
  var rootDir = process.cwd()
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
  wk.processFile = function(filePath, cb) {
    if (filePath && filePath.length > 1) {
      log.verbose('Processing', filePath)

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
  wk.listFiles = function(params, cb) {
    s3.listObjects(params, function(err, data) {
      if (err) return log.error(err)

      // Get list of file paths.
      var paths = []
      data.Contents.forEach(function(filePath) {
        paths.push(filePath.Key)
      })

      // Iterate to the next batch.
      // s3.listObjects is limited to 1000 keys.
      // This requests the next batch
      // @todo Fix truncation
      // var lastPath = paths[paths.length - 1]
      if (data.IsTruncated) {
        log.warn('listObjects has been truncated. You are not getting all objects.')
        cb(paths)
        // params.Marker = lastPath
        // var endMarker = logConfig.prefix + end.format(format.fileDateFormat)
        // if (lastPath < endMarker) {
        //   wk.listFiles(params, function(morePaths){
        //     paths = paths.concat(morePaths)
        //     cb(paths)
        //   })
        // } else {
        //   cb(paths)
        // }
      } else {
        cb(paths)
      }
    })
  }

  /**
   * Run
   *
   * @param {String} date filter
   * @param {Array} paths to exclude
   * @param {Function} callback
   * @return void
   */
  wk.run = function(runConfig, callback) {

    if( ! runConfig.date) {
      // @todo if not date specified use this month '2015-04'
      runConfig.date = '2015-04'
    }

    var listParams = {
      Bucket: logConfig.bucket,
      MaxKeys: 1000,
      Prefix: logConfig.prefix + runConfig.date
    }

    wk.listFiles(listParams, function(paths) {
      // Exclude paths that have already been fetch
      if(runConfig.exclude) {
        log.verbose('%d paths before exclude', paths.length)
        log.verbose('%d paths in exclude list', runConfig.exclude.length)
        var before = paths.length
        // Exclude paths where they match
        paths = _.filter(paths, function(path) {
          return ! _.contains(runConfig.exclude, path)
        })
        log.debug('%d paths to be processed', paths.length)
        log.debug('%d paths have been excluded', before - paths.length)
      }

      // Process each file path.
      async.eachSeries(paths, wk.processFile, function(err) {
        if (err) callback(err)
        return callback(null, results, paths)
      })
    })
  }

  return wk
}
