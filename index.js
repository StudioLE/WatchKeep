//you don't have to specify the particular dissector here - but we do
var dissector = require('node-log-dissector').dissectors.cf

var stream = fs.createReadStream('./my_s3.log', {flags: 'r', encoding: 'utf-8', autoClose: true}).on('readable', function() {
    self.read(0)
});

stream.on('data', function(data) {
    console.log(dissector.dissect(data))
})
