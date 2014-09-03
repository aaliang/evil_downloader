var path = require('path'),
    request = require('request'),
    async = require('async'),
    fs = require('fs');

var clientId = require('../config.json').imgurClientId;

var dls_finished = false;
var download = function(uri, filename, callback) {
  request.head(uri, function (err, res, body) {
    request(uri).pipe(fs.createWriteStream(filename)).on('close', function () {
      console.log(filename);
      callback();
    });
  });
}

var q = async.queue(function (task, callback) {
  var fname = path.basename(task.link);

  download(task.link, fname, callback);
}, 6);


var imgur_search = function (params, callback) {
  request(params, callback);
}

var download_imgur = function (query, iterations, callback) {
  var i = 0;
  var options = {
    qs: {
      q: query,
      page: 0
    },
    url: 'https://api.imgur.com/3/gallery/search',
//    url: 'https://api.imgur.com/3/gallery/t/' + query,
    headers: {
      'Authorization': 'Client-ID ' + clientId
    }
  };

  var search_callback = function (e, r, d) {
    var data = JSON.parse(d);
    if (data.data.length > 0) {
      options.qs.page++;
      q.push(data.data);
      imgur_search(options, search_callback);
    }
  };

  imgur_search(options, search_callback);
};

download_imgur('sear', 10, function () {
  dls_finished = true;
});

