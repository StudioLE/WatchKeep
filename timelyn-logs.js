var spotlog = require('./lib/spotlog');

spotlog.readConfig('config/cf.json', '04-07-2015')

spotlog.run(function(err, results) {
  console.log(results)
})
