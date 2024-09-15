require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const session = require('express-session');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const app = express();
const dns = require('dns');
dns.setDefaultResultOrder('ipv4first');
dns.setServers(['8.8.8.8']); // Google's public DNS server

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

 // Load environment variables

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

  


const userSchema = new mongoose.Schema({
    name: String,
    password: String
});
const adminSchema = new mongoose.Schema({
    googleId: String,
    name: String,
    email: String,
});

const userModel = mongoose.model("users", userSchema);
const adminModel = mongoose.model("admins", adminSchema);

app.use(session({
    secret: 'vasanth123',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());


passport.use(new GoogleStrategy({
    clientID: '39478335314-d40ugph8lrn0m3eqnvebhlb2mll9b5q0.apps.googleusercontent.com',  
    clientSecret: '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',  
    callbackURL: "https://friendlist3.vercel.app/auth/google/callback",
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await adminModel.findOne({ googleId: profile.id });

      if (!user) {
        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
        user = await new adminModel({
          googleId: profile.id,
          name: profile.displayName,
          email: email  
        }).save();
      }

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  }
));
passport.deserializeUser(async function(id, done) {
    try {
        const user = await adminModel.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

passport.serializeUser(function (user, done) {
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {
    adminModel.findById(id, (err, user) => {
        done(err, user);
    });
});

app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile','email'] })
);
app.get('/auth/google/callback',
    passport.authenticate('google', { failureRedirect: '/' }),
    (req, res) => {
        res.redirect('/home');
    }
);

app.get('/home', (req, res) => {
    if (req.isAuthenticated()) {
        res.render(path.join(__dirname, "index.ejs"), { user: req.user.name});
    } else {
        res.redirect('/');
    }
});

app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) return next(err);
        res.redirect('/');
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "home.html"));
});



app.post("/search",(req,res)=>{
    const searchName = req.body.name;
    const error1="Please try again";
    userModel.findOne({ name: searchName })
        .then((user) => {
            if (user) {
                
                res.render(path.join(__dirname, "./public/data/search.ejs"), { name: user.name, password: user.password });
            } else {
                res.render(path.join(__dirname, "./public/error/errfetch.ejs"), { error: error1});
            }
        })
        .catch((err) => res.status(500).send("Error searching data: " + err));
})

app.post("/update",(req,res)=>{
    const key = req.body.key;
    res.render(path.join(__dirname, "./public/data/update.ejs"),{upname : key})
})
app.post("/updatesucc",(req,res)=>{
    const n = req.body.key;
    const error1 = "please try again";
    if(!n){
        res.send("please enter the values!");
    }
    else {
        if(n==="name"){
            const n1 = req.body.n1;
            const n2 = req.body.n2;
            
            userModel.findOneAndUpdate({ name: n1 }, { name: n2 })
            .then((updatedUser) => {
                if(updatedUser){
                    res.render(path.join(__dirname, "./public/data/updsucc.ejs") ,{name:n2,password:updatedUser.password});
                }
                else {
                    res.render(path.join(__dirname, "./public/error/errfetch.ejs"), { error: error1});
                }
                
            })
            .catch((err) => {
                res.status(500).send("Error updating name: " + err);
            });
        }
        else if(n==="password"){
            const n1 = req.body.n1;
            const p1 = req.body.p1;
            userModel.findOneAndUpdate({ name: n1 }, { password: p1 })
            .then((updatedUser) => {
                if(updatedUser){
                    res.render(path.join(__dirname, "./public/data/updsucc.ejs") ,{name:updatedUser.name,password:p1});
                }
                else {
                    res.render(path.join(__dirname, "./public/error/errfetch.ejs"), { error: error1});
                }

                
            })
            .catch((err) => {
                res.status(500).send("Error updating password: " + err);
            });

        }
    }
})


app.post("/delete",(req,res)=>{
    const deleteName = req.body.name;
    const error1 = "Please try again";
    userModel.findOneAndDelete({ name: deleteName })
        .then((result) => {
            if (result) {
                res.render(path.join(__dirname, "./public/data/delete.ejs"), { name: result.name});
            } else {
                res.render(path.join(__dirname, "./public/error/errfetch.ejs"), { error: error1});
            }
        })
        .catch((err) => res.status(500).send("Error deleting user: " + err));
})

app.post("/alldata", (req, res) => {
    userModel.find({})
        .then((users) => {
            res.render(path.join(__dirname, "./public/data/alldata.ejs"), { users: users });
        })
        .catch((err) => res.status(500).send("Error fetching data: " + err));
});


app.post("/upload", (req, res) => {
    const n = req.body.name;
    const a = req.body.password;
    const error1 = "Please try again";
    userModel.findOne({ name: n })
        .then((existingUser) => {
            if (existingUser) {
                res.render(path.join(__dirname, "./public/error/errupload.ejs"), { error: error1});
            } else {
                
                const newUser = new userModel({ name: n, password: a });
                newUser.save()
                    .then(() => res.render(path.join(__dirname, "./public/data/user.ejs"), { name: n, password: a }))
                    .catch((err) => res.status(500).send("Error uploading data: " + err));
            }
        })
        .catch((err) => res.status(500).send("Error fetching data: " + err));
});





app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
