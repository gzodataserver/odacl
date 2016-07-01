// imports
// ========

var Acl = require('mysqlacl');

// Setup logging
// =============

var log = console.log.bind(console);
var debug = console.log.bind(console, 'DEBUG');
var info = console.info.bind(console, 'INFO');
var error = console.error.bind(console, 'ERROR');

// Class definition
// ================

var A = function (table, options, handleError) {
  if (!table || !options || !handleError)
    throw new Error('table, options and handleError and mandatory!');

  this.table = table;
  this.options = options;
  this.handleError = handleError;
};


A.prototype.createOptions_ = function (req) {
  var c = {
    host: this.options.host,
    user: req.headers.user,
    password: req.headers.password,
    database: this.options.database
  };

  if (this.options.parseChar) c['parseChar'] = this.options.parseChar;
  if (this.options.connectFromHost) c.connectFromHost = this.options.connectFromHost;

  return c;
};

var handleRequest_ = function (req, res) {
  return new Promise(function (fullfil, reject) {

    var buffer = '';
    req.on('data', function (chunk) {
      chunk = chunk.toString();
      buffer += chunk;
    });

    req.on('end', function () {
      try {
        var data = JSON.parse(buffer);
        fullfil(data);
      } catch (err) {
        var result = {
          error: 'ERROR parsing input, likely malformed/missing JSON: ' + err
        };
        res.write(JSON.stringify(result));
        res.end();
        reject(err);
      }
    });
  });
};

var writeRes = function (res, result) {
  res.write(JSON.stringify(result));
  res.end();
};

A.prototype.handleRequest = function () {
  var self = this;

  return function (req, res, next) {
    if (!req.ast) {
      if (next) next();
      return;
    }

    var acl = new Acl(self.table, self.createOptions_(req));
    acl.init()
      .then(function () {

        // grant
        if (req.ast.queryType === 'grant_bucket') {
          handleRequest_(req, res)
            .then(function (data) {
              return acl.grant(data.name, data.verbs, data.accountId, true)
            })
            .then(writeRes.bind(self, res), writeRes.bind(self, res));

        }

        // revoke
        else if (req.ast.queryType === 'revoke_bucket') {
          handleRequest_(req, res)
            .then(function (data) {
              return acl.revoke(data.name, data.verbs, data.accountId)
            })
            .then(writeRes.bind(self, res), writeRes.bind(self, res));
        }

        // only bucket operations are managed here
        else if (!req.ast.bucketOp) {
          next();
          return;
        }

        // bucket operation
        else {
          acl.isAllowed(req.ast.table, req.ast.queryType, req.headers.user, req.ast.schema)
            .then(function (result) {
              if (!result) {
                var err = {
                  err: 'Operation not allowed! ' + req.method + ' ' + req.url + ' user:' + req.headers.user
                };
                writeRes(res, err);
                return;
              }
              next();
            })
            .catch(function (err) {
              self.handleError(req, res, next, 'Internal error: ' + err);
              error(err);
            });
        }
      })
      .catch(function (err) {
        writeRes(res, err)
      })

  }
};

module.exports = A;
