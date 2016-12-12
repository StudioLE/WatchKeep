var s3Config = {
  'key': 'YOUR_AWS_ACCESS_KEY_ID',
  'secret': 'YOUR_AWS_SECRET_KEY_ID'
}

// For CloudFront logs
var logConfig = {
  bucket: 'YOUR_S3_LOG_BUCKET',
  prefix: 'path/to/logs/DISTRIBUTION_ID.',
  format: 'cloudfront'
}

// For S3 logs
var logConfig = {
  bucket: 'YOUR_S3_LOG_BUCKET',
  prefix: 'path/to/logs/',
  format: 's3'
}

watchkeep = require('watchkeep')(s3Config, logConfig)

var today = new Date()

var params = {
  // [Optional] Date prefix filter
  date: '2016-12',
  // [Optional] date prefix filter for current month
  date: today.getFullYear() + '-' + today.getMonth() + 1,
  // [Optional] array of paths to ignore
  exclude: [
    'path/to/logs/DISTRIBUTION_ID.2015-04-10-11.abcdefgh.gz',
    'path/to/logs/DISTRIBUTION_ID.2015-04-10-12.hgfedcba.gz'
  ]
}

watchkeep.run(params, function(err, results, paths) {
  if(err) throw err
  console.log(results)
})
