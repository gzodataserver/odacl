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
  return {
    host: this.options.host,
    user: req.headers.user,
    password: req.headers.password,
    database: this.options.database
  };
}

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
  debug(result)
  res.write(JSON.stringify(result));
  res.end();
};

A.prototype.handleRequest = function () {
  var self = this;
  
  return function (req, res, next) {
    if (!req.ast) throw new Error('req.ast is missing!');

    debug(req.ast);

    // only bucket operations are managed here
    if (!req.ast.bucketOp) {
      next();
      return;
    }

    
    if (req.ast.queryType === 'grant') {
      handleRequest(req, res)
        .then(function (data) {
          var acl = new Acl(self.table, self.createOptions_(req));
          return acl.grant(data.name, data.verbs, req.params.accountid, req)
        })
        .then(writeRes.bind(self, res), writeRes.bind(self, res));
    } else if (req.ast.queryType === 'revoke') {
      handleRequest(req, res)
        .then(function (data) {
          var acl = new Acl(self.table, self.createOptions_(req));
          return acl.revoke(data.name, data.verbs, req.params.accountid, req)
        })
        .then(writeRes.bind(self, res), writeRes.bind(self, res));
    } else {
      var acl = new Acl(self.table, self.createOptions_(req));
      acl.init();

      acl.isAllowed(req.url, req.method, req.headers.user)
        .then(function (result) {
          if (!result) {
            self.handleError(req, res, next, 'Operation not allowed! ' + req.method + ' ' + req.url + ' user:' + req.headers.user);
            return;
          }
          next();
        })
        .catch(function (err) {
          self.handleError(req, res, next, 'Internal error: ' + err);
        });

    }

  }
};

module.exports = A;
