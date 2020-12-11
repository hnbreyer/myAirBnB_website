/*#region CONSTS AND REQUIRES */

require("dotenv").config({silent: true});

const express = require("express");
var nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require('fs');
const path = require("path");
const app = express.Router();
const bcrypt = require("bcryptjs");
const Usr = require('../models/usersModel');
const Listing = require('../models/listingModel');
const clientSessions = require("client-sessions");
const PHOTODIR = "./public/photos/";
/*#endregion */

/*#region PHOTO SETTINGS*/
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
/*#endregion */

/*#region EMAIL SETUP */
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.MAIN_EMAIL,
        pass: process.env.MAIN_PSW
    }
});
/*#endregion */

/*#region SESSION*/
app.use(clientSessions({
    cookieName: "session",
    secret: process.env.SECRET,
    duration: 20*60*1000,
    activeDuration: 60*1000
}));

app.use((req, res, next)=>{
    res.locals.s = req.session.usrSesh; 
    next();
});
/*#endregion*/

/*#region CHECKS  */


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

const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const passwordRegexp = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
/*#endregion */

////////////////////*ROUTES START HERE */

/*#region HOME, LISTING PAGE AND DETAIL PAGE */
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
        res.render("room_listing", {locations: locations, hasLocation: !!locations.length, user:req.session.usrSesh, layout:false});
    });
});

app.get("/details_page", function(req, res){
    res.render('details_page', { user: req.session.usrSesh, layout: false});
});

app.get("/details_page/:listingid", function(req, res){
    const listingid = req.params.listingid;

    Listing.findOne({_id: listingid})
    .lean()
    .exec()
    .then((listings)=>{
        res.render("details_page", {listings: listings, user: req.session.usrSesh, layout:false});
    });
});
/*#endregion */

/*#region BOOKING/CHECKOUT */

app.post("/calculate_reserv/:listingid", upload.none(), function(req, res){
    const listingid = req.params.listingid;
    var check_in = new Date(req.body.checkin);
    var check_out = new Date(req.body.checkout);
    const price = req.body.price;
    const service_fee = req.body.servicefee;
    const guests = req.body.guests;
    
    var time_difference = check_out.getTime() - check_in.getTime();
    var days_difference = time_difference / (1000 * 60 * 60 * 24);

    var totalPrice = (days_difference * price) + service_fee/1;

    var check_in = req.body.checkin;
    var check_out = req.body.checkout;

    Listing.findOne({_id: listingid})
    .lean()
    .exec()
    .then((listings)=>{
        res.render("details_page", {listings: listings, user: req.session.usrSesh, hasCheckout: true, check_in: check_in, check_out: check_out, totalPrice: totalPrice, service_fee: service_fee, day: days_difference, price: price, guests: guests, layout:false});
    });
   
});

app.post("/checkout/:listingid", upload.none(), checkLogin, function(req, res){
    const listingid = req.params.listingid;
    const username = req.body.username;
    const email = req.body.email;
    const fname = req.body.fname;
    const lname = req.body.lname;
    const listing_name = req.body.listingName;
    const filename = req.body.filename;
    const location = req.body.location;
    var check_in = new Date(req.body.checkin);
    var check_out = new Date(req.body.checkout);
    const guests = req.body.guests;
    const totalPrice = req.body.totalprice;
    const user = req.session.usrSesh;

    var check_in = req.body.checkin;
    var check_out = req.body.checkout;

    /////connect this listing with user
    //update the user (get user _id) with a new key (bookings)
    //the value of this key is the listing id

    Usr.findOneAndUpdate(
        { username: username }, 
        {$push: { 
            bookings:{$each : [listingid]} 
        }} 
    ).exec()
    .then((err)=>{
         var mailOptions = {
             
            from: process.env.MAIN_EMAIL,
            to: user.email,
            subject: 'Details about your booking: ' + listing_name,
            html: `${fname} ${lname}, thank you for your booking! Here are the details: <br>` +
                   `<b>${listing_name}<b>, ${location} <br>` +
                   `Check-in: ${check_in} <br> ` +
                   `Check-out: ${check_out} <br>` +
                   `Total price: $${totalPrice} <br><br> `         
        }
    
            transporter.sendMail(mailOptions, (error, info) => {
                if(error){
                    console.log("ERROR: " + error);
                }else{
                    console.log("SUCCESS: " + info.response);
                }
            }); 

            req.session.usrSesh = {
                bookings: listingid,
                username: username,
                email: email,
                fname: fname,
                lname: lname    
            }; 

            console.log(`An error ocurred within: ${err}`);
            res.render('confirmation', {user: req.session.usrSesh, listing_name: listing_name, filename: filename, check_in: check_in, check_out: check_out, guests: guests, location: location, totalPrice: totalPrice, layout: false});

    })
    .catch((err)=> {console.log(`An error ocurred: ${err}`)});
});

app.get("/confirmation", function(req, res){
    res.render('confirmation', {user: req.session.usrSesh, layout: false});
});

/*#endregion */

/*#region LOGIN/LOGOUT*/
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

    const errors = [];

    if(usr_email === "" || usr_psw === ""){
       errors.push("Both fields are required!");
    }

    if(errors.length > 0){
        res.render("login", {errorMsg: errors, layout: false});
    } else {

    Usr.findOne({email : usr_email})
    .exec()
    .then((usr)=>{
        if(!usr){
            console.log("User couldn't be found.");  
            errors.push("Sorry, you entered the wrong email and/or password");
            res.render("login", {errorMsg: errors, layout : false });
        } 
         else {

            bcrypt.compare(usr_psw, usr.psw)
            .then(isMatched=>{

                //psw correct
                if(isMatched == true){
                    req.session.usrSesh = usr;
                    console.log(usr);
                    console.log("User logged-in successfully! " + usr_email);

                    //check if admin
                    if(usr.isAdmin === false){
                        //RENDER INSTEAD OF REDIRECT?
                         return res.redirect("/dashboard");
                     } else {
                        return res.redirect("/admindashboard");
                     }
                } else {
                    console.log("Wrong password");
                    errors.push("Sorry, you entered the wrong email and/or password");
                    res.render('login', {errorMsg: errors, layout : false});
                }


            }).catch(err => console.log(`Error: ${err}`));
         }
    })
    .catch((error) => { console.log(`An error ocurred: ${error}`)});
    }
    });

/*#endregion */

/*#region SIGNUP */
app.get("/signup", function(req, res){
        res.render('signup', {layout: false});
    });

app.post("/signup", upload.none(), (req, res) => {

    var newUsr = {
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


        bcrypt.hash(req.body.psw, 8)
        .then(hash =>{

            var newUsr = {
                username: req.body.uname,
                email: req.body.email,
                psw: hash,
                fname: req.body.fname,
                lname: req.body.lname
            };
        
            //Create new user
        var usr = new Usr(newUsr);
        usr.save((err, newUser) =>{
        if(err){
            console.log("Error creating user.");  
        } else {

            res.render("login", {welcomeMsg: "Thanks for registering! Log in now", layout: false });

                    //EMAIL STUFF//
        var mailOptions = {
            from: process.env.MAIN_EMAIL,
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
        });

}
    
});
/*#endregion */

/*#region PROFILE */
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
/*#endregion */

/*#region USER DASHBOARD*/

app.get("/dashboard", checkLogin, function(req, res){

    const user = req.session.usrSesh;

     Listing.find({_id: {$in: [user.bookings]}})
     .lean()
     .exec()
     .then((listings)=>{
        // console.log(usr);
         console.log(listings);
         res.render("dashboard", {listings: listings, hasBookings: !!listings.length, user: req.session.usrSesh, layout:false});
     });
});
/*#endregion*/

/*#region ADMIN VIEWS  */

app.get("/admindashboard", checkLogin, checkAdmin, function(req, res){
    res.render('admindashboard', {
       user: req.session.usrSesh,
        layout: false
    });
});

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
});


app.get("/admin_listings/Delete/:listingid", checkLogin, checkAdmin, function(req, res){
    const listingid = req.params.listingid;

    Listing.deleteOne({_id: listingid})
        .then(()=>{
            res.redirect("/admin_listings");
        });
});
/*#endregion*/



module.exports = app;