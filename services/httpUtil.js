var request = require('request'),
  cheerio = require('cheerio');

var promises = {};

function loadSummary(link) {
  var url = link.link;
  link.summary = {};

  if(url.match(/[.gif,.jpg,.png]$/)) {
    link.summary.img = url;
    return link;
  }

  if(!promises[url]) {
    promises[url] = new Promise(function (resolve, reject) {
      var options = {
        url: url,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/46.0.2490.71 Safari/537.36'
        }
      };
      request(options, function (error, response, body) {
        if(error) {
          link.summary.title = error;
        } else if(response.statusCode > 299) {
          link.summary.title = 'Error: ' + response.statusCode;
        } else {
          var $ = cheerio.load(body);
          link.summary.title = $('title').text();
          if(url.indexOf('facebook') > -1 && url.indexOf('photo') > -1) {
            link.summary.img = $('img#fbPhotoImage').attr('src');
            link.summary.description = $('.hasCaption').text();
          } else if($('[property="og:image"]')) {
            link.summary.img = $('[property="og:image"]').attr('content');
            link.summary.description = $('[property="og:description"]').attr('content');
          } else {
            link.summary.description = $('[name="description"]').attr('content');
          }
        }
        delete promises[url];
        resolve(link);
      });
    });
  }

  return promises[url];
}

module.exports = {
  loadSummary: loadSummary
};