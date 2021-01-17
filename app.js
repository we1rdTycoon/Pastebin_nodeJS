const express = require('express');
const session = require('express-session');
const FileStore = require('session-file-store')(session);
const passport = require('passport');
const mysql = require("mysql2");
var crypto = require('crypto');
const fs = require('fs');
require('dotenv').config();

const app = express();
const port = 3000;
app.set("view engine", "ejs");

const connection = mysql.createConnection({
  host: process.env.LOCALHOST,
  user: process.env.USERDB,
  database: process.env.DATABASE,
  password: process.env.PASSWORD
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(
  session({
    secret: 'hghtyNN23h',
    store: new FileStore(),
    cookie: {
      path: '/',
      httpOnly: true,
      maxAge: 60 * 60 * 1000,
    },
    resave: false,
    saveUninitialized: false,
  })
);

require('./config-passport');
app.use(passport.initialize());
app.use(passport.session());

app.get("/", function(request, response){    
  let b = new Date();
  let data = [b];
  const sql = `SELECT * FROM paste WHERE expPaste > ? AND acsPaste = 1 ORDER BY idPaste DESC;`;
  connection.query(sql, data, function(err, results, f) {
    if(request.user){
      results.nameuser = request.user.email;
    };
        response.render("index", {
          results: results,
        });
  });
});

app.post("/send", function(request, response){   
  let iduser; 
  if(request.isAuthenticated()){
     iduser = request.session.passport.user;
  }else{
     iduser = undefined;
  }
  title = request.body.title;
  comment = request.body.comment;
  access = request.body.access;
  var CurrentTime = new Date();
  CurrentTime.setMinutes(CurrentTime.getMinutes() + Number.parseInt(request.body.expiration));
  expiration = CurrentTime;
  url = crypto.createHash('md5').update(comment + new Date().toString()).digest("hex").toString();
  let data = [url, comment, expiration, access, title, iduser];
  const sql = `INSERT INTO paste(urlPaste, textPaste, expPaste, acsPaste, titlePaste, idUser) VALUES(?, ?, ?, ?, ?, ?)`;   
  connection.query(sql, data, function(err, results) {
    if(request.user){
      console.log("fdsf");
      response.redirect('/account/'+url);
    }else{ 
    response.redirect('/'+url);
    }
  });
});

app.get('/login', (req, res) => {
  res.render("login");
});

app.post('/login', (req, res, next) => {
  passport.authenticate('local', function(err, user) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.render("login", null);
    }
    req.logIn(user, function(err) {
      if (err) {
        return next(err);
      }
      return res.redirect('/');
    });
  })(req, res, next);
});

const auth = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  } else {
    return res.redirect('/');
  }
};

app.get('/account', auth, (req, res) => {
  let b = new Date();
  let a = req.session.passport.user;
  let data = [b,a];
  const sql = `SELECT * FROM paste WHERE expPaste > ? AND idUser = ?`;
  connection.query(sql, data, function(err, results, f) {
      if(results.length>0){
        res.render("account", {
              results: results,
          });
      }else{
        res.render("account", {
          results: results,
        });
      }
  });
});

app.get("/account/*", auth, function(req, res){
  let b = new Date();
  let a = req.session.passport.user;
  let c = (req.path).substring(9);
  let data = [b,c, a];
  const sql = `SELECT * FROM paste WHERE expPaste > ? AND urlPaste = ? AND idUser = ?`;
  connection.query(sql, data, function(err, results, f) { 
    if(results.length>0){
      res.render("singlepaste", {
      comment: results[0].textPaste,
      title: results[0].titlePaste,
     });
     }else{
      res.redirect('/');
      }
      
  });
});

app.get('/logout', (req, res) => {
  req.logOut();
  res.redirect('/');
});

app.get("/*", function (request, response) {
  let a = (request.path).substring(1);
  let b = new Date();
  let data = [a, b];
  const sql = `SELECT * FROM paste WHERE urlPaste = ? AND expPaste > ? AND acsPaste=1`;
  connection.query(sql, data, function(err, results, f) {
      if(results.length>0){
       response.render("singlepaste", {
       comment: results[0].textPaste,
       title: results[0].titlePaste,
      });
      }else{
       response.redirect('/');
       }
  });
});

app.listen(port, () => console.log(`Example app listening on port ${port}!`));
