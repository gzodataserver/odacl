// imports
// ========

var ConnectLight = require('connectlight');
var OdParser = require('odparser').OdParser;
var OdAcl = require('./odacl.js');

// Setup logging
// =============

var log = console.log.bind(console);
var info = console.info.bind(console, 'INFO');
var error = console.error.bind(console, 'ERROR');

var DEV_MODE = true;
var debug;
if (DEV_MODE) {
  debug = console.log.bind(console, 'DEBUG');
} else {
  debug = function () {};
}

// Setup OdAcl module
// ==================

var mws = new ConnectLight();

mws.use('/help', function (req, res, next) {
  res.write('/help matched!!');
  res.end();
  log('Matched /help - got request: ', req.url);
});

mws.use(OdParser.handleRequest);

var handleError = function (req, res, next, err) {
  res.writeHead(406, {
    "Content-Type": "application/json"
  });
  res.write(err);
  res.end();

  debug(err);
};

var acl = new OdAcl('perms', {
  host: 'localhost'
}, handleError);
mws.use(acl.handleRequest());


mws.use('/', function (req, res, next) {
  res.write('Unmatched request:' + req.url);
  res.end();
});

mws.listen(3000);

process.on('SIGINT', function () {
  log("Caught interrupt signal");
  mws.close();
  setTimeout(process.exit, 1000);
});

process.on('exit', function (code) {
  log('About to exit with code:', code);
});

log('server running on port 3000');
