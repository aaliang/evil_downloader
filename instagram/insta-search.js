var api = require('instagram-node').instagram(),
    fs = require('fs'),
    request = require('request'),
    async = require('async'),
    config = require('../config.json');

api.use({
  client_id: config.instagram_client_id,
  client_secret: config.instagram_client_secret
});

var dl = function (tag, output_dir, pages) {

  var pages = pages || 100;
  var result_set = [];
  var manifest = [];
  var dls_finished = false;

  var q = async.queue(function (task, callback) {
    var fname = output_dir + '/' + task.id + '.jpg';

    download(task.images.standard_resolution.url, fname, callback);
  }, 6);

  q.drain = function() {
    console.log('idling');
    if (dls_finished) {
      process.exit();
    }
  }

  var cb = function (r) {
    fs.writeFile(output_dir + '/_manifest.json', JSON.stringify(r), function (err) {
      if (err) {
        console.log(err);
      }
    });
    dls_finished = true;
  };

  var download = function(uri, filename, callback){
    request.head(uri, function(err, res, body){
      request(uri).pipe(fs.createWriteStream(filename)).on('close', function () {
        console.log(filename);
        callback();
      });
    });
  };

  var run_sum = 0;

  var handler = function(err, medias, pagination) {
    if (!err) {
      console.log(run_sum+=medias.length);
      result_set = result_set.concat(medias);
//      q.push(medias);
      if (pages--) {
        if (pagination.next) {
          pagination.next(handler);
        } else {
          cb(result_set);
        }
      } else {
        cb(result_set);
      }
    } else {
      cb(result_set);
    }
  };

  api.tag_media_recent(tag, {count: 33}, handler);

}

var search_tag = process.argv[2];
var output_dir = './output/' + search_tag;

fs.stat(output_dir, function (d, r) {
  if (d && d.code == 'ENOENT'){
    console.log(output_dir);
    fs.mkdirSync(output_dir);
  }
  dl(search_tag, output_dir, 100);
});

