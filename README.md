# WatchKeep

An NPM module to retrieve and parse S3 and CloudFront logs.

## Installation

Installation via [npm](https://www.npmjs.com/package/watchkeep)

```
npm install --save watchkeep
```

## Usage

```js
var s3Config = {
  'key': 'YOUR_AWS_ACCESS_KEY_ID',
  'secret': 'YOUR_AWS_SECRET_KEY_ID',
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

var params = {
  // [Optional] Date prefix filter
  date: '2015-04',
  // [Optional] Array of paths to ignore
  exclude: [
    'path/to/logs/DISTRIBUTION_ID.2015-04-10-11.abcdefgh.gz',
    'path/to/logs/DISTRIBUTION_ID.2015-04-10-12.hgfedcba.gz'
  ]
}

watchkeep.run(params, function(err, results, paths) {
  if(err) throw err
  console.log(results)
})
```

## Credit

This module is, in a vague way, a fork of [SpotCheck](https://github.com/spanishdict/spotcheck): a simple command line utility to retrieve and parse S3, CloudFront and CloudTrail logs.

I've gutted it's innards and hacked it to pieces to do something very different but they definitely deserve credit for showing me how to do the hard bits.
