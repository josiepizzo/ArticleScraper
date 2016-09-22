// grab the scrape as a json
$.getJSON('/scrape', function(data) {
  // for each one
  for (var i = 0; i<data.length; i++){
    //if there is a note on this article, attach *note* to the title to signify its existence to the user.
      if(data[i].note){
        noteExists = '<span style="color: red"><sup> *note attached*</sup></span>'
        }else{
          noteExists = "";
      }
$('#articles').append('<h2><p data-id="' + data[i]._id + '">' + data[i].title + noteExists+'</p></h2>'+'<a href='+data[i].link +' target = "_blank">'+data[i].link+"<br />");
      $('#articles').append("____________________________________________________________________________________________________________________");
    }
      $('#articles').append("____________________________________________________________________________________________________________________");
  });


// whenever someone clicks a p tag
$(document).on('click', 'p', function(){
  // empty the notes from the note section
  $('#notes').empty();
  // save the id from the p tag
  var thisId = $(this).attr('data-id');

  // now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/scrape/" + thisId,
  })
    // with that done, add the note information to the page
    .done(function( data ) {
      console.log(data);
      // the title of the article
      $('#notes').append('<h2>' + data.title + '</h2>'); 
      // an input to enter a new title
      $('#notes').append('<input id="titleinput" name="title" >'); 
      // a textarea to add a new note body
      $('#notes').append('<textarea id="bodyinput" name="body"></textarea>'); 


      // if there's a note in the article
      if(data.note){
        // place the title of the note in the title input
        $('#titleinput').val(data.note.title);
        // place the body of the note in the body textarea
        $('#bodyinput').val(data.note.body);
        $('#notes').append('<button data-id="' + data._id + '" id="deletenote">Delete Note</button>');
        $('#bodyinput,#titleinput').css('background-color', '#ffe5cc');
      }else{
        $('#notes').append('<button data-id="' + data._id + '" id="savenote">Save Note</button>');
        $('#bodyinput,#titleinput').css('background-color', '#ffe5cc');
      }
    });
});

// when you click the savenote button
$(document).on('click', '#savenote', function(){
  // grab the id associated with the article from the submit button
  var thisId = $(this).attr('data-id');

  // run a POST request to change the note, using what's entered in the inputs
  $.ajax({
    method: "POST",
    url: "/scrape/" + thisId,
    data: {
      title: $('#titleinput').val(), // value taken from title input
      body: $('#bodyinput').val() // value taken from note textarea
    }
  })
    // with that done
    .done(function( data ) {
      // log the response
      console.log(data);
      // empty the notes section
      $('#notes').empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $('#titleinput').val("");
  $('#bodyinput').val("");
});
//When the delete note button is clicked Post to deletenote on server
$(document).on('click', '#deletenote', function(){
  var thisId = $(this).attr('data-id');

  $.ajax({
    method: "POST",
    url: "/deletenote/" + thisId,
  })
    .done(function( data ) {
      
      console.log(data);
      $('#notes').empty();
    });

  location.reload();
  $('#titleinput').val("");
  $('#bodyinput').val("");
  
});

$(document).on('click', '#bbclogo', function(){
$('#head').css("color", "white");
  $.ajax({
    method: "POST",
    url: "/dropdb/"
  })
    .done(function( data ) {
      console.log("back from drop");
      $('#head').css("color", "black");
      //this will force a page refresh which will force a GET to '/' and that will force
      //the /scrape because it is the first thing that the JS does upon starting up.  ;-)
      location.reload();
    });

});