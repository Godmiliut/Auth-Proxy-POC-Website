var createError = require('http-errors');
var express = require('express');
var session = require('express-session')
var path = require('path');
var favicon = require('serve-favicon')
var path = require('path')
var jwt_decode = require("jwt-decode"); // NOTE: This will not work in docker environment; Need to build and run backend app locally after installing jwt-decode through npm.
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const { runInNewContext } = require('vm');

var userName;
var token = null;

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', function(req, res, next) {
  res.render("index", {loggedIn: token != null ? true : false})
})

app.get('/auth/userInfo', function(req, res, next) {
  console.log("HEADERS:")
  console.log(req.headers);
  console.log("COOKIES")
  console.log(req.cookies);

  if (token == null)
  {
    token = req.headers["x-ms-token-aad-claims-token"] ? jwt_decode(req.headers["x-ms-token-aad-claims-token"]) : null;
  }

  userName = token != null && token.preferred_username != null ? token.preferred_username : "Empty";
  res.redirect(`/auth/users/${userName}`);
});

app.get('/auth/users/:username', function(req, res, next) {
  var username = req.params.username;

  if (token == null)
  {
    token = req.headers["x-ms-token-aad-claims-token"] ? jwt_decode(req.headers["x-ms-token-aad-claims-token"]) : null;
  }

  if (token != null)
  {
    userName = token.preferred_username;
  }

  if(userName != username)
  {
    if (token.roles.indexOf("Admin") < 0)
    {
    res.redirect("/unauthorized");
    }
  }

  username = token != null && token.name != null ? token.name : "None";
  var userGroups = token != null  && token.groups != null ? token.groups : "None";
  var userRoles = token != null && token.roles != null ? token.roles : "None";
  var userEmail = token != null && token.preferred_username != null ? token.preferred_username : "None";
  var userSub = req.headers["x-ms-claim-aad-sub"] ? req.headers["x-ms-claim-aad-sub"] : "None";
  res.render("userInfo",{user: username, email: userEmail, sub: userSub, roles: userRoles, groups: userGroups})
})

app.get('/auth/userList', function(req, res, next) {

  if (token == null)
  {
    token = req.headers["x-ms-token-aad-claims-token"] ? jwt_decode(req.headers["x-ms-token-aad-claims-token"]) : null;
  }

  res.render("userList");
})

app.get('/auth/siteInfo', function(req, res, next) {
  if (token == null)
  {
    token = req.headers["x-ms-token-aad-claims-token"] ? jwt_decode(req.headers["x-ms-token-aad-claims-token"]) : null;
  }
  console.log("SITE INFO ENDPOINT")
  console.log("HEADERS:")
  console.log(req.headers);
  console.log("COOKIES")
  console.log(req.cookies);
  var userEmail = token != null && token.preferred_username != null ? token.preferred_username : "None";
  res.render("siteInfo", {user: userEmail, loggedIn: token != null ? true : false})
});

app.get('/login', function (req, res, next) {
  console.log(req.cookies.session);
  res.redirect("/auth/");
});

app.get('/auth/deniedAction', function (req, res, next) {
  console.log(req.cookies.session);
  res.redirect("/auth/signout");
});

app.get('/denyActionPage', function (req, res, next) {
  res.render('denyActionPage');
})

app.get('/logout-aad', function (req, res, next) {
  console.log(req.cookies.session);
  res.redirect("/auth/signout-remote");
});

app.get('/unauthorized', function(req, res, next) {
  console.log(req.cookies.session);
  var userEmail = token != null && token.preferred_username != null ? token.preferred_username : "Unknown user"
  res.render("unauthorized", {user: userEmail});
})

app.get('/logout', function (req, res, next) {
  console.log(req.cookies.session);
  res.redirect("/auth/signout");
})

app.get('/loggedOut', function (req, res, next) {
  console.log(req.cookies.session);
  token = null;
  res.render("loggedOut");
})

app.get('/auth/', function(req, res, next) {
  if (token == null)
  {
    token = req.headers["x-ms-token-aad-claims-token"] ? jwt_decode(req.headers["x-ms-token-aad-claims-token"]) : null;
  }
  res.redirect("/");
});

app.get('/privacyNotice', function(req, res, next) {
  res.render("privacyNotice", {loggedIn: token != null ? true : false});
})

app.get('/termsOfService', function(req, res, next) {
  res.render("termsOfService", {loggedIn: token != null ? true : false});
})

app.get('/deleteAcc', function(req, res, next) {
  res.render("deleteAcc", {loggedIn: token != null ? true : false});
})

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});




module.exports = app;