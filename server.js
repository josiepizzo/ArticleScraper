/* Showing Mongoose's "Populated" Method (18.3.8)
 * INSTRUCTOR ONLY
 * =============================================== */

// dependencies
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var logger = require('morgan');
var mongoose = require('mongoose');
// Notice: Our scraping tools are prepared, too
var request = require('request');
var cheerio = require('cheerio');

// use morgan and bodyparser with our app
app.use(logger('dev'));
app.use(bodyParser.urlencoded({
    extended: false
}));

// make public a static dir
app.use(express.static('public'));


// Database configuration with mongoose
mongoose.connect('mongodb://localhost/articledb');
var db = mongoose.connection;

// show any mongoose errors
db.on('error', function(err) {
    console.log('Mongoose Error: ', err);
});

// once logged in to the db through mongoose, log a success message
db.once('open', function() {
    console.log('Mongoose connection successful.');
});

console.log('test');

// And we bring in our Note and Article models
var Note = require('./models/Note.js');
var Article = require('./models/Article.js');


// Routes
// ======

// Simple index route

app.get('/', function(req, res) {
    res.render(index.html);
});

// A GET request to scrape the echojs website.
app.get('/scrape', function(req, res) {
    console.log('scraping');
    // first, we grab the body of the html with request
    request('http://www.bbc.com/', function(error, response, html) {
        console.log("html", html)
        // then, we load that into cheerio and save it t;o $ for a shorthand selector
        var $ = cheerio.load(html);
        // now, we grab every h3 within an article tag, and do the following:
        // $('a.faux-block-link__overlay-link').each(function(i, element) {
        $('a.faux-block-link__overlay-link').each(function(i, element) {
            

            // save an empty result object
            var result = {};

            result.title = $(this).text();
            //console.log($(this).text())
            var fullUrl =  'http://www.bbc.com' + $(this).attr('href');
            console.log('fullUrl', fullUrl);
            result.link =fullUrl;
            console.log('result',result);
            //console.log($(this).attr('href'));

            var entry = new Article(result);
            entry.save(function(err, doc) {
                if (err) {
                    console.log(err);
                }
            })
        })

        Article.find({}, function(err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.json(doc);
            }
        })
    })
});
//this gets the article and note and returns as a JSON to be used when
//displaying the text box for the note.  (headline goes above text box)
app.get('/articles/:id', function(req, res) {
    Article.findOne({ '_id': req.params.id })
        .populate('note')
        .exec(function(err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.json(doc);
            }
        });
});

//adds the note id to the article document as a reference back to the note
app.post('/savenote/:id', function(req, res) {
    var newNote = new Note(req.body);

    newNote.save(function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            Article.findOneAndUpdate({ '_id': req.params.id }, { 'note': doc._id })
                .exec(function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send(doc);
                    }
                });

        }
    });
});

//delete the note from both collections (article and notes)
app.post('/deletenote/:id', function(req, res) {
    Article.find({ '_id': req.params.id }, 'note', function(err, doc) {
        // .exec(function(err, doc){
        if (err) {
            console.log(err);
        }
        //deletes the note from the Notes Collection
        Note.find({ '_id': doc[0].note }).remove().exec(function(err, doc) {
            if (err) {
                console.log(err);
            }

        });

    });
    //deletes the note reference in the article document
    Article.findOneAndUpdate({ '_id': req.params.id }, { $unset: { 'note': 1 } })
        .exec(function(err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send(doc);
            }
        });
});

app.post('/dropdb', function(req, res) {
    //this function will delete all articles except those that have user notes.
    //once it goes back to the client, the page will be refreshed which forces
    //a new GET for the latest articles on the BBC Top Stores area of their home page.
    Article.find({})
        .populate('note')
        .exec(function(err, doc) {
            if (err) {
                console.log(err);
            } else {
                var removedArticles = 0;
                for (i = 0; i < doc.length; i++) {
                    // console.log(doc[i]._id);
                    // console.log(doc[i].note);
                    //if there is no note, we can remove the article from the db
                    //but if there is a note, move on to the next article.

                    if (doc[i].note == undefined) {
                        Article.find({ '_id': doc[i]._id }).remove()
                            .exec(function(err, doc) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    ++removedArticles;
                                    console.log(removedArticles + " Total Articles removed");
                                } //close else
                            }) //close .exec
                    } //close if
                } //close for
            } //close else 
        }) //close .exec
    res.end();
}); //close drop route



// listen on port 3000
app.listen(3000, function() {
    console.log('App running on port 3000!');
});
