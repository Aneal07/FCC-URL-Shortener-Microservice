require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
let mongoose = require('mongoose');
let bodyParser = require('body-parser');
const dns = require('dns');



mongoose.connect(process.env.MONGO_URL,{useNewUrlParser: true,
                                       useUnifiedTopology: true});

// Basic Configuration
const port = process.env.PORT || 3001;

const URLSchema = new mongoose.Schema({
  original_url: {type:String, required: true, unique:true},
  short_url: {type:String, required: true, unique: true}
})

let URLModel = mongoose.model("url", URLSchema);

//Middleware function to aprse post requests
app.use("/", bodyParser.urlencoded({extended: false }));

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.get('/api/shorturl/:short_url', function(req, res) {
    let short_url = req.params.short_url;

    URLModel.findOne({ short_url: short_url })
    .then(foundURL => {
        if (foundURL) {
            res.redirect(foundURL.original_url);
        } else {
            res.status(404).json({ error: "Short URL not found" });
        }
    })
    .catch(err => {
        res.status(500).json({ error: 'Database error' });
    });
});






// Your first API endpoint
app.post('/api/shorturl', function(req, res) {
    let url = req.body.url;
    try {
        let urlObj = new URL(url);
        dns.lookup(urlObj.hostname, (err, address) => {
            if (!address) {
                return res.json({ error: 'invalid url' });
            }
            URLModel.findOne({}).sort({ short_url: -1 }).limit(1).then(latestURL => {
                let short_url = (latestURL && latestURL.short_url) ? latestURL.short_url + 1 : 1;
                let newURL = new URLModel({
                    original_url: urlObj.href,
                    short_url: short_url
                });
                newURL.save().then(savedURL => {
                    res.json(savedURL);
                });
            });
        });
    } catch {
        res.json({ error: 'invalid url' });
    }
});

app.listen(port, function() {
    console.log(`Listening on port ${port}`);
});