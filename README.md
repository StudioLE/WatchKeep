# WatchKeep

An NPM module to retrieve and parse S3 and CloudFront logs.

## Installation

Installation via [npm](https://www.npmjs.com/package/watchkeep)

```js
npm install --save watchkeep
```

## Usage

```js
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

var params = {
  // [Optional] Date prefix filter
  date: '2016-12',
  // [Optional] date prefix filter for current month
  date: today.getFullYear() + '-' + today.getMonth() + 1,
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

## Advanced usage

There are a couple of additional features that can be taken advantage of.

### Custom logger

WatchKeep defaults to logging output to the console via `console.log`, `console.error` & `console.debug` but you can specify a custom logging utility via the third config argument.

For instance if you're using Sails.js you can take advantage of [captains-log](https://github.com/balderdashy/captains-log) with the following:

```js
watchkeep = require('watchkeep')(s3Config, logConfig, sails.log)
```

### Storing logs to a database

You'll need two database tables: the first to store the logs, the second to keep a record of the log files we have already fetched.

I won't go into the full code just yet but the gist of it is:

```js
var params = {
  exclude: YOUR_DATABASE_DRIVER.get('fetchedLogFiles')
}

watchkeep.run(params, function(err, results, paths) {
  if(err) throw err
  YOUR_DATABASE_DRIVER.put('logs', results)
  YOUR_DATABASE_DRIVER.put('fetchedLogFiles', paths)
})
``` 

## Tests

To run tests with mocha

```
npm test
```

However you'll need to set the variables for your environment first

```
set AWS_KEY=YOUR_AWS_ACCESS_KEY_ID& set AWS_SECRET=YOUR_AWS_SECRET_KEY_ID& set CF_BUCKET=YOUR_CF_LOG_BUCKET& set CF_PREFIX=path/to/logs/DISTRIBUTION_ID.& set S3_BUCKET=YOUR_S3_LOG_BUCKET& set S3_PREFIX=path/to/logs/
```

## Credit

This module is, in a vague way, a fork of [SpotCheck](https://github.com/spanishdict/spotcheck): a simple command line utility to retrieve and parse S3, CloudFront and CloudTrail logs.

I've gutted it's innards and hacked it to pieces to do something very different but they definitely deserve credit for showing me how to do the hard bits.
