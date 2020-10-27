var express = require("express");
var app = express();
//var path = require("path");
var multer = require("multer");
const hbs = require('express-handlebars');
var nodemailer = require("nodemailer");
//const { extname } = require("path");

var upload = multer();

//email setup
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'hnb.web322@gmail.com',
        pass: 'web322iscool'
    }
});

var HTTP_PORT = process.env.PORT || 8080;

app.use(express.static("views"));

app.engine('.hbs', hbs({extname: '.hbs'}));
app.set('view engine', '.hbs');

//ROUTES
app.get("/", function(req, res){
    //res.sendFile(path.join(__dirname, "/views/home.html"));
    res.render('home', {layout: false});
});

app.get("/room_listing", function(req, res){
    //res.sendFile(path.join(__dirname, "/views/room_listing.html"));
    res.render('room_listing', {layout: false});
});

app.get("/details_page", function(req, res){
    //res.sendFile(path.join(__dirname, "/views/details_page.html"));
    res.render('details_page', {layout: false});
});

app.get("/owner_upload", function(req, res){
   // res.sendFile(path.join(__dirname, "/views/owner_upload.html"));
   res.render('owner_upload', {layout: false});
});

app.get("/confirmation", function(req, res){
    //res.sendFile(path.join(__dirname, "/views/confirmation.html"));
    res.render('confirmation', {layout: false});
});

app.get("/dashboard", function(req, res){
    var someData = FORM_DATA;
    res.render('dashboard', {
        data: someData,
        //fname: req.body.fname,
        //lname: req.body.lname,
        layout: false
    });
});
//////////////////////
//register-user is the action of the form
app.post("/register-user", upload.none(), (req, res) => {
    const FORM_DATA = req.body;
   // const DATA_RECEIVED = "Welcome, " + FORM_DATA.fname + " " + FORM_DATA.lname + " " + "Your email is " + FORM_DATA.email;
    //const JSON_DATA = JSON.stringify(FORM_DATA);
    //console.log(JSON_DATA);

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

    //res.send(DATA_RECEIVED);
    //res.send(JSON_DATA);
    //res.sendFile(path.join(__dirname, "/views/register-confirmation.hbs"));
    //res.render('dashboard', FORM_DATA);
    //res.send(FORM_DATA);
    res.render('dashboard', {data: FORM_DATA, layout: false});
});

/////////////////////
app.listen(HTTP_PORT);