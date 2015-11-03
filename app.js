var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();
var GAVAGAI_API_ENDPOINT = '/v3';

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(require('node-sass-middleware')({
  src: path.join(__dirname, 'public'),
  dest: path.join(__dirname, 'public'),
  indentedSyntax: true,
  sourceMap: true
}));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

app.use(GAVAGAI_API_ENDPOINT, function(req, res, next) {
    var options = {
        hostname: 'api.gavagai.se/',
        port: 443,
        path: GAVAGAI_API_ENDPOINT + req.url,
        method: 'POST',
        headers: {
            'Content-Type': CONTENT_TYPE
        }
    },
    body = '';

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    console.log(new Date(), ' -- Rquest Received:', req.body, req.url);

    var requ = https.request(options, function(https_res) {
        console.log(new Date(), 'statusCode: ', https_res.statusCode);
        console.log(new Date(), 'headers: ', https_res.headers);

        https_res.on('data', function(d) {
            body += d;
        });

        https_res.on('end', function() {
            res.send(body);
            console.log(new Date(), 'Sent request: ', req.body);
            next();
        });

    });

    requ.write(JSON.stringify(req.body));
    requ.end();
});


module.exports = app;
