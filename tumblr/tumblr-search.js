
var tumblr = require('tumblr'),
    async = require('async'),
    request = require('request'),
    fs = require('fs'),
    path = require('path'),
    config = require('../config.json');

var oauth = {
  consumer_key: config.tumblr_consumer_key,
  consumer_secret: config.tumblr_consumer_secret
};

var t = new tumblr.Tagged(oauth);

var q = async.queue(function (task, callback) {
  download(task, callback);
}, 6);

var download = function(uri, callback){
  var filename = dir + '/'+ path.basename(uri);

  request.head(uri, function(err, res, body){
    request(uri).pipe(fs.createWriteStream(filename)).on('close', function () {
//      console.log(filename);
      callback();
    });
  });
};

var search = function (query, number, callback) {
  var results_set = [];
  var search_cb = function(e,r,d){
    if (!e) {
      results_set = results_set.concat(r);

      var img_uris = r.reduce(function (p, c) {
        if (c.photos && c.photos.length > 0) {
          c.photos.forEach(function (d) {
            console.log(d.original_size.url + ' -> ' + c.post_url);
            p.push(d.original_size.url)
          });
        }
        return p;
      }, []);
      q.push(img_uris);
      if (number--) {
        if (r[r.length-1])
          t.search(query, {before: r[r.length - 1].timestamp}, search_cb);
        else {
          var x = 3;
        }
      } else {
        callback(results_set);
      }
    } else {
      callback(results_set);
    }
  };

  t.search(query, search_cb);
};


var download_blog_photos = function (blogname, number, callback) {
  var blog = new tumblr.Blog(blogname, oauth);
  var params = {
    type: 'photo',
    limit: 20,
    offset: 0
  };

  var results_set = [];
  var total_fetched = 0;
  var posts_callback = function(e,r,d){
    if (!e) {
      results_set = results_set.concat(r.posts);
      total_fetched += r.posts.length;
      var img_uris = r.posts.reduce(function (p, c) {
        if (c.photos && c.photos.length > 0) {
          c.photos.forEach(function (d) {
            console.log(d.original_size.url + ' -> ' + c.post_url);
            p.push(d.original_size.url)
          });
        }
        return p;
      }, []);
      q.push(img_uris);
      if (number-- && total_fetched < r.total_posts) {
        params.offset += r.posts.length;
        blog.posts(params, posts_callback);
//        t.search(query, {before: r[r.length - 1].timestamp}, search_cb);
      } else {
        callback(results_set);
      }
    } else {
      callback(results_set);
    }
  };

  blog.posts(params, posts_callback);
};
//
var blogname = process.argv[2];
if (blogname.indexOf('http://wwww.') == 0) {
  blogname = blogname.slice('http://wwww.'.length, blogname.length);
} else if (blogname.indexOf('http://') == 0) {
  blogname = blogname.slice('http://'.length, blogname.length);
}
var dir = process.argv[3];
download_blog_photos(blogname, 400, function (r) {

});

//var dir = 'yd';
//  search('young-dommes', 100, function (d) {
//});

