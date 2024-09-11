const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");

const app = express();


app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'public')));

mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });

const userSchema = new mongoose.Schema({
    name: String,
    age: Number
});

const userModel = mongoose.model("users", userSchema);


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});



app.post("/search",(req,res)=>{
    const searchName = req.body.name;

    userModel.findOne({ name: searchName })
        .then((user) => {
            if (user) {
                
                res.render(path.join(__dirname, "search.ejs"), { name: user.name, age: user.age });
            } else {
                res.send("User not found!");
            }
        })
        .catch((err) => res.status(500).send("Error searching data: " + err));
})


app.post("/delete",(req,res)=>{
    const deleteName = req.body.name;

    userModel.findOneAndDelete({ name: deleteName })
        .then((result) => {
            if (result) {
                res.render(path.join(__dirname, "delete.ejs"), { name: result.name});
            } else {
                res.send("User not found!");
            }
        })
        .catch((err) => res.status(500).send("Error deleting user: " + err));
})

app.post("/alldata", (req, res) => {
    userModel.find({})
        .then((users) => {
            res.render(path.join(__dirname, "alldata.ejs"), { users: users });
        })
        .catch((err) => res.status(500).send("Error fetching data: " + err));
});


app.post("/upload", (req, res) => {
    const n = req.body.name;
    const a = req.body.age;
    
    const newUser = new userModel({ name: n, age: a });
    newUser.save()
        .then(() => res.render(path.join(__dirname, "user.ejs"),{name:n,age:a}))
        .catch((err) => res.status(500).send("Error uploading data: " + err));
});




app.listen(3003, () => {
    console.log("Server is running on port 3003");
});
