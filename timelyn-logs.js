var spotcheck = require('./lib/spotlog');

spotcheck.readConfig('config/cf.json', '04-07-2015');
spotcheck.run();
