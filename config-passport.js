const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const fs = require('fs');

passport.serializeUser(function(user1, done) {
  done(null, user1.id);
});

passport.deserializeUser(function(id, done) {
  const text1 = fs.readFileSync('users.json', 'utf8');
  const a = JSON.parse(text1);
  let user = false;
  for (let i = 0; i < a.length; i++){
    if (a[i].id==id){
      user = a[i];
      break;
    }
  }
  done(null, user);
});

passport.use(
  new LocalStrategy({ usernameField: 'email' }, function(
    email,
    password,
    done
  ) {
    const text = fs.readFileSync('users.json', 'utf8');
    const a = JSON.parse(text);
    for (var i = 0; i < a.length; i++) {
      console.log(a[i].email);
      if (email === a[i].email && password === a[i].password) {
        return done(null, a[i]);
      }
    }
    return done(null, false);
  })
);
