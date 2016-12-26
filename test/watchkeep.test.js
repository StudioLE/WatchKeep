var expect = require('chai').expect
var watchkeep = require('../lib/watchkeep')

var s3Config = {
  key: process.env.AWS_KEY,
  secret: process.env.AWS_SECRET
}

var logConfig = {
  // For CloudFront logs
  cf: {
    bucket: process.env.CF_BUCKET,
    prefix: process.env.CF_PREFIX,
    format: 'cloudfront',
    limit: 10
  },

  // For S3 logs
  s3: {
    bucket: process.env.S3_BUCKET,
    prefix: process.env.S3_PREFIX,
    format: 's3',
    limit: 10
  }
}

var justReturn = function(str) {
  return str
}

var log = {
  verbose: justReturn,
  error: justReturn,
  debug: justReturn,
  warn: justReturn
}


// log = {
//   verbose: console.log,
//   error: console.error,
//   debug: console.debug,
//   warn: console.debug
// }

var output = {}

describe('WatchKeep', function() {

  describe('module()', function() {

    it('should return false when no config sent',function() {
      expect(watchkeep(undefined, undefined, log)).to.be.false
    })

    var wk = watchkeep(s3Config, logConfig.cf, log)

    it('should return an object', function() {
      expect(wk).to.be.an('object')
    })

    describe('processFile()', function() {
      it('should be a function', function() {
        expect(wk.processFile).to.be.a('function')
      })
    })

    describe('listFiles()', function() {
      it('should be a function', function() {
        expect(wk.listFiles).to.be.a('function')
      })
    })

    describe('run()', function() {
      it('should be a function', function() {
        expect(wk.run).to.be.a('function')
      })

      describe('invalid credential', function() {
        var err, results, paths

        before(function(done) {
          this.timeout(5000)
          watchkeep({
            key: 'not',
            secret: 'valid'
          }, logConfig.s3, log).run({}, function(a, b, c) {
            err = a
            results = b
            paths = c
            done()
          })
        })

        it('should return InvalidAccessKeyId error',function() {
          expect(err.code).to.equal('InvalidAccessKeyId')
        })
      })

      describe('CloudFront', function() {
        var err, results, paths

        before(function(done) {
          this.timeout(10000)
          wk.run({}, function(a, b, c) {
            err = a
            results = b
            paths = c
            output.cf = results[0]
            done()
          })
        })

        it('should not return an error', function() {
          expect(err).to.be.null
        })
        it('should return multiple results', function() {
          expect(results.length).to.be.above(1)
        })
        it('should return multiple paths', function() {
          expect(paths.length).to.be.above(1)
        })

        describe('first result', function() {
          it('should have 19 fields', function() {
            expect(Object.keys(results[0]).length).to.equal(19)
          })
          it('should have no empty fields', function() {
            Object.keys(results[0]).forEach(function(key) {
              expect(results[0][key]).to.not.be.empty
            })
          })
        })
      })

      describe('S3', function() {
        var err, results, paths

        before(function(done) {
          this.timeout(30000)
          watchkeep(s3Config, logConfig.s3, log).run({}, function(a, b, c) {
            err = a
            results = b
            paths = c
            output.s3 = results[0]
            done()
          })
        })

        it('should not return an error', function() {
          expect(err).to.be.null
        })
        it('should return multiple results', function() {
          expect(results.length).to.be.above(1)
        })
        it('should return multiple paths', function() {
          expect(paths.length).to.be.above(1)
        })

        describe('first result', function() {
          it('should have 19 fields', function() {
            expect(Object.keys(results[0]).length).to.equal(19)
          })
          it('should have no empty fields', function() {
            Object.keys(results[0]).forEach(function(key) {
              expect(results[0][key]).to.not.be.empty
            })
          })
        })
      })
    })

  })

})

after(function() {
  console.log('CloudFront first result:\n', output.cf)
  console.log('S3 first result:\n', output.s3)
})