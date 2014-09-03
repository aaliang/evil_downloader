var twitterAPI = require('node-twitter-api'),
  fs = require('fs'),
  querystring = require('querystring'),
  config = require('../config.json');

var twitter = new twitterAPI({
  consumerKey: config.twitter_consumer_key,
  consumerSecret: config.twitter_consumer_secret
});

var accessToken = config.twitter_access_token,
    accessTokenSecret = config.twitter_access_token_secret;


function getTweetsv2 (queryString, count, callback) {
  var PAGE_SIZE = 100;

  var params = {
    count: PAGE_SIZE,
    result_type:'recent',
    lang: 'en',
    q: queryString
  };

  var resultsSet = [];
  var cachedResult = undefined;

  var searchCallback = function (err, data, resp) {
    if (err) {
      callback(resultsSet);
    }
    if (data.search_metadata && data.statuses.length > 0) {
      data.statuses.sort(function (a,b) {
        return a.id - b.id;
      });
      data.statuses = data.statuses.map(function (d) {
        return {
          id: d.id,
          text: d.text,
          entities: d.entities,
          created_at: d.created_at,
          user: d.user
        }
      });
      if (cachedResult && cachedResult.id == data.statuses[0].id) {
        callback(resultsSet, data.statuses[0]);
      } else {
        cachedResult = data.statuses[0];
        resultsSet = resultsSet.concat(data.statuses);
        params.max_id = data.statuses[0].id;

        var items_left = count - resultsSet.length;

        if (items_left <= 0) {
          callback(resultsSet, data.statuses[0]);
        }
        else {
          if (items_left < params.count) {
            params.count = items_left;
          }
          console.log(items_left);
          twitter.search(params, accessToken, accessTokenSecret, searchCallback);
        }
      }
    } else {
      callback(resultsSet);
    }
  };

  twitter.search(params, accessToken, accessTokenSecret, searchCallback);
};

var search_query = process.argv[2],
    output_file_name = search_query.split(" ").join("_") + '.json',
    num_to_fetch = process.argv[3];

getTweetsv2(search_query, num_to_fetch, function (results) {
  var r = {
    search_metadata: {},
    statuses: results
  };
  fs.writeFile('./output/' + output_file_name, JSON.stringify(r) , function (err) {
    if (err) {
      console.log(err);
    }
  });
});