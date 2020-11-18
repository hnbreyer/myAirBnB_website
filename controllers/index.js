const express = require("express");
var nodemailer = require("nodemailer");
var multer = require("multer");
const app = express.Router();
var upload = multer();
const Usr = require('../models/usersModel');

app.get("/", function(req, res){
    res.render('home', {layout: false});
});

app.get("/room_listing", function(req, res){
    res.render('room_listing', {layout: false});
});

app.get("/details_page", function(req, res){
    res.render('details_page', {layout: false});
});

app.get("/owner_upload", function(req, res){
   res.render('owner_upload', {layout: false});
});

app.get("/confirmation", function(req, res){
    res.render('confirmation', {layout: false});
});

app.get("/signup-error", function(req, res){
    res.render('signup-error', {layout: false});
})

//email setup
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hnb.web322@gmail.com',
        pass: 'web322iscool'
    }
});

app.get("/dashboard", function(req, res){
    var someData = FORM_DATA;
    res.render('dashboard', {
        data: someData,
        layout: false
    });
});

//////////////////////
//register-user is the action of the form
app.post("/register-user", upload.none(), (req, res) => {
    const FORM_DATA = req.body;

    //EMAIL STUFF//
    var mailOptions = {
        from: 'hnb.web322@gmail.com',
        to: FORM_DATA.email,
        subject: 'Test email from NODE.js using nodemailer',
        html: '<p>Hello ' + FORM_DATA.fname + ',</p><p>Thank you for subscribing! We hope you have the best of times with Sunset Hammock.</p>'     
    }

    transporter.sendMail(mailOptions, (error, info) => {
        if(error){
            console.log("ERROR: " + error);
        }else{
            console.log("SUCCESS: " + info.response);
        }
    });
    //EMAIL STUFF//

    //Create new user
    const usr = new  Usr({
        fname: req.body.fname,
        lname: req.body.lname,
        email: req.body.email,
        psw:   req.body.psw
    });
    usr.save((err, newUser) =>{
        if(err){
            res.render('/signup-error', {
                errorMessage: 'Error creating user'
            });
        } else {
            res.render('dashboard', {data: FORM_DATA, layout: false}); 
        }
    });

 
    //res.render('dashboard', {data: FORM_DATA, layout: false});
});


//create user route
/*
app.post('/register-user', (req, res) => {
    res.send('User Created!');
});*/

module.exports = app;