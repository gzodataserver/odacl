var querystring = require("querystring");
var remote = require('gzhelpers').remote;

// Setup logging
// =============

var log = console.log.bind(console);
var debug = console.log.bind(console, 'DEBUG');
var info = console.info.bind(console, 'INFO');
var error = console.error.bind(console, 'ERROR');

// Tests
// =====

var A1 = {
  email: 'john@example.com',
  accountId: '1a51f7dab9af',
  password: 'kF/QTtSmrydE'
};

var A2 = {
  email: 'tine@example.com',
  accountId: 'd72d36dd3d1b',
  password: 'Wg+5EDqCYbxj'
};

var SYS_PATH = '/s';

// Tests
// =====

var createOptions = function (accountId, password, path, method) {
  return {
    hostname: 'localhost',
    port: 3000,
    path: path,
    method: method,
    headers: {
      user: accountId,
      password: password
    }
  }
};

log('A web server should be running on localhost:3000');

log('\n!!unmatched request is expected!!\n')
remote.request(createOptions(A1.accountId, A1.password, '/help', 'GET'))
  .then(function (res) {
    log(res);

    // GRANT
    var path = '/' + A1.accountId + '/s/grant_bucket';
    debug(path);
    return remote.request(createOptions(A1.accountId, A1.password, path, 'POST'), {
      name: 'b_mybucket', // previously tableName
      verbs: ['select', 'insert', 'update', 'delete'],
      accountId: A1.accountId
    });
  })
  .then(function (res) {
    log(res);

    // CREATE BUCKET
    var path = '/' + A1.accountId + '/s/create_bucket';
    debug(path);
    return remote.request(createOptions(A1.accountId, A1.password, path, 'POST'), {
      name: 'b_mybucket'
    });
  })
  .then(function (res) {
    log(res);

    // WRITE TO BUCKET
    var path = '/' + A1.accountId + '/b_mybucket';
    debug(path);
    return remote.request(createOptions(A1.accountId, A1.password, path, 'POST'), 'Some data to write to the bucket...');
  })
  .then(function (res) {
    log(res);

    // SELECT FROM BUCKET
    var path = '/' + A1.accountId + '/b_mybucket';
    debug(path);
    return remote.request(createOptions(A1.accountId, A1.password, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // REVOKE
    var path = '/' + A1.accountId + '/s/revoke_bucket';
    debug(path);
    return remote.request(createOptions(A1.accountId, A1.password, path, 'POST'), {
      name: 'b_mybucket', // previously tableName
      verbs: ['select', 'insert', 'update', 'delete'],
      accountId: A1.accountId
    });
  })
  .then(function (res) {
    log(res);

    // WRITE TO BUCKET
    var path = '/' + A1.accountId + '/b_mybucket';
    debug(path);
    return remote.request(createOptions(A1.accountId, A1.password, path, 'POST'), 'Some data to write to the bucket...');
  })
  .then(function (res) {
    log(res);

    // SELECT FROM BUCKET
    var path = '/' + A1.accountId + '/b_mybucket';
    debug(path);
    return remote.request(createOptions(A1.accountId, A1.password, path, 'GET'), null);
  })
  .then(function (res) {
    log(res);

    // DROP BUCKET
    var path = '/' + A1.accountId + '/s/drop_bucket';
    debug(path);
    return remote.request(createOptions(A1.accountId, A1.password, path, 'POST'), {
      name: 'b_mybucket'
    });
  })
  .done(log, log);
