const express = require("express");
var nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require('fs');
const path = require("path");
const app = express.Router();
//const multerFunction = multer();
const Usr = require('../models/usersModel');
const Listing = require('../models/listingModel');
const clientSessions = require("client-sessions");
const { pathToFileURL } = require("url");
const PHOTODIR = "./public/photos/";

//const { try } = require("bluebird");
//const server = require('../server');

//PHOTO SETTINGS
if(!fs.existsSync(PHOTODIR)){
    fs.mkdirSync(PHOTODIR);
}

const storage = multer.diskStorage({
    destination: PHOTODIR,
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

app.use(clientSessions({
    cookieName: "session",
    secret: "t5rGXr2dZQYg6mj",
    duration: 20*60*1000,
    activeDuration: 60*1000
}));

app.use((req, res, next)=>{
    res.locals.s = req.session.usrSesh; 
    next();
});

function checkLogin(req, res, next){
    if(!req.session.usrSesh){
        res.redirect("/login");
    } else{
        next();
    }
};

function checkAdmin(req, res, next){
    if(req.session.usrSesh.isAdmin === false){
        res.redirect("/");
    } else {
        next();
    }
};

// REGULAR EXPRESSION
// Email
const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegexp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;

app.get("/", function(req, res){
    res.render('home', {user: req.session.usrSesh, layout: false});
});

app.get("/room_listing", function(req, res){
    Listing.find()
    .lean()
    .exec()
    .then((listings) => {
        res.render("room_listing", {listings: listings, hasListings: !!listings.length, user:req.session.usrSesh, layout:false});
    });
});

app.post("/room_listing/Search", upload.none(), function(req, res){
    Listing.find({
        location: req.body.destination
    })
    .lean()
    .exec()
    .then((locations)=>{
        res.render("room_listing", {locations: locations, hasLocation: !!locations.length, layout:false});
    });
});

app.get("/details_page", function(req, res){
    res.render('details_page', { user: req.session.usrSesh, layout: false});
});

app.get("/owner_upload", function(req, res){
   res.render('owner_upload', {user: req.session.usrSesh, layout: false});
});

app.get("/confirmation", function(req, res){
    res.render('confirmation', {user: req.session.usrSesh, layout: false});
});



//email setup
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hnb.web322@gmail.com',
        pass: 'web322iscool'
    }
});



app.get("/logout", (req, res)=>{
    req.session.reset();
    res.redirect("/");
});


app.get("/login", function(req, res){
    res.render('login', {user: req.session.usrSesh, layout: false});
});


app.post("/login", upload.none(), (req, res) => {
    const usr_email = req.body.email;
    const usr_psw = req.body.psw;

    if(usr_email === "" || usr_psw === ""){
        res.render("login", {errorMsg: "Both fields are required!", layout: false});
    }

    

    Usr.findOne({email : usr_email, psw : usr_psw})
    .exec()
    .then((usr)=>{
        if(!usr){
            console.log("User couldn't be found.");  
             res.render("login", {errorMsg: "The email or password does not match!", layout : false });
        } 
         else {
             console.log(usr);
             req.session.usrSesh = usr;
             console.log("User logged-in successfully! " + usr_email);

             if(usr.isAdmin === false){
                //RENDER INSTEAD OF REDIRECT?
                 return res.redirect("/dashboard");
             } else {
                return res.redirect("/admindashboard");
             }

             
             //server.disconnect();
         }
    })
    .catch((error) => { console.log(`An error ocurred: ${error}`)});

    });

    app.get("/signup", function(req, res){
        res.render('signup', {layout: false});
    });


//////////////////////

app.post("/signup", upload.none(), (req, res) => {

  
    //const FORM_DATA = req.body;
    const newUsr = {
        username: req.body.uname,
        email: req.body.email,
        psw: req.body.psw,
        fname: req.body.fname,
        lname: req.body.lname
    };

    const errors = [];
    

    Usr.findOne({email : newUsr.email})
    .exec()
    .then((usr) => {
        if(usr){
            console.log("Email already registered.");  
             errors.push("Email already registered");
             //res.render("signup", {errorMsg: errors, layout: false});
        }
    }).catch((error)=>{console.log("Error here: " + error)});


    //validation
    if(emailRegexp.test(newUsr.email) == false){
        errors.push("Please enter a valid email");
    }

    if(newUsr.username.trim() === ''){
        errors.push("Please enter a valid username");
    }

    if(newUsr.fname.trim() == ''){
        errors.push("Please enter a valid first name");
    }

    if(newUsr.lname.trim() == ''){
        errors.push("Please enter a valid last name");
    }

    if(passwordRegexp.test(newUsr.psw) == false){
        errors.push("Please enter a valid password");
    }

    if(errors.length > 0){
        res.render("signup", {errorMsg: errors, layout: false});
    } else {

  

       //Create new user
       const usr = new Usr(newUsr);
        usr.save((err, newUser) =>{
        if(err){
            console.log("Error creating user.");  
        } else {

            res.render("login", {welcomeMsg: "Thanks for registering! Log in now", layout: false });

                  //EMAIL STUFF//
        var mailOptions = {
            from: 'hnb.web322@gmail.com',
            to: newUsr.email,
            subject: 'Test email from NODE.js using nodemailer',
            html: '<p>Hello ' + newUsr.fname + ',</p><p>Thank you for subscribing! We hope you have the best of times with Sunset Hammock.</p>'     
        }

            transporter.sendMail(mailOptions, (error, info) => {
                if(error){
                    console.log("ERROR: " + error);
                }else{
                    console.log("SUCCESS: " + info.response);
                }
            });
            
        }
    
    });


  

   
    //EMAIL STUFF//

 
}
    //res.render('dashboard', {data: FORM_DATA, layout: false});
    
});


app.get("/profile", checkLogin, (req, res)=>{
    res.render("profile", {user: req.session.usrSesh, layout: false});
});

app.get("/profile/Edit", checkLogin, (req, res)=>{
    res.render("profileEdit", {user: req.session.usrSesh, layout: false});
});

app.post("/profile/Edit", upload.none(), checkLogin, (req, res) =>{
    
    const updateUsr = {
        username: req.body.uname,
        email: req.body.email,
        fname: req.body.fname,
        lname: req.body.lname
    };
  

    Usr.updateOne(
        { username: updateUsr.username },
        {$set: {
            fname: updateUsr.fname,
            lname: updateUsr.lname,
            email: updateUsr.email,
        }}
    ).exec()
    .then((err)=>{
      
            req.session.usrSesh = {
                username: updateUsr.username,
                email: updateUsr.email,
                fname: updateUsr.fname,
                lname: updateUsr.lname
            };
        res.redirect("/profile");
        
    })
    .catch((err) => { console.log(`An error ocurred: ${err}`)});
});


app.get("/dashboard", checkLogin, function(req, res){
    res.render('dashboard', {
       user: req.session.usrSesh,
        layout: false
    });
});


app.get("/admindashboard", checkLogin, checkAdmin, function(req, res){
    res.render('admindashboard', {
       user: req.session.usrSesh,
        layout: false
    });
});



//////LISTINGS

app.get("/admin_listings", checkLogin, checkAdmin, function(req, res){
    Listing.find()
    .lean()
    .exec()
    .then((listings) => {
        res.render("admin_listings", {listings: listings, hasListings: !!listings.length, user:req.session.usrSesh, layout:false});
    });
});


app.get("/admin_listings/Edit",  checkLogin, checkAdmin, function(req, res){
    res.render("admin_listingsEdit", {user: req.session.usrSesh, layout:false});
});

app.get("/admin_listings/Edit/:listingid",  checkLogin, checkAdmin, function(req, res){
    const listingid = req.params.listingid;

    Listing.findOne({_id: listingid})
    .lean()
    .exec()
    .then((listings)=>{
        res.render("admin_listingsEdit", {listings: listings, user: req.session.usrSesh, layout:false});
    });
});


app.post("/admin_listings/Edit", upload.single("photo"), checkLogin, checkAdmin, function(req, res){
    const listing = new Listing({
        _id: req.body.id,
        listingName: req.body.listingname,
        location: req.body.location,
        price: req.body.price,
        details: req.body.details,
        filename: req.file.filename
    });

    if(req.body.edit === "1"){
        //editing
        Listing.updateOne({_id: listing._id},
            { $set: {
                listingName: listing.listingName,
                location: listing.location,
                price: listing.price,
                details: listing.details,
                filename: listing.filename
            }}
            ).exec()
            .then((err)=>{ console.log("There was an error editing listing: " + err)});

    } else {
        //adding
        listing.save()
        .then((err)=>{ console.log("There was an error saving listing: " + err)});
    };

    res.redirect("/admin_listings");
    //res.render("admin_listings", {user: req.session.usrSesh, layout: false});
});


app.get("/admin_listings/Delete/:listingid", checkLogin, checkAdmin, function(req, res){
    const listingid = req.params.listingid;
    Listing.deleteOne({_id: listingid})
        .then(()=>{
            res.redirect("/admin_listings");
        });
});

app.get("/firstadmin", (req, res) =>{
    var admin = new Usr({
        username: 'admin',
        fname: 'Spongebob',
        lname: 'Squarepants',
        email: 'hnb.web322@gmail.com',
        psw: 'KrabbyPatty1',
        isAdmin: true
    });
    admin.save((err)=>{
        console.log("Error happened: " + err);
        if(err){
            console.log("Error creating admin: " + err);
        } else{
            console.log("Admin was created! " + admin);
        }
    });
    res.redirect("/");
});


//create user route
/*
app.post('/register-user', (req, res) => {
    res.send('User Created!');
});*/

module.exports = app;