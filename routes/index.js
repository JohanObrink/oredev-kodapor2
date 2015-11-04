var express = require('express'),
  router = express.Router(),
  r = require('rethinkdb'),
  queries = require('../services/queries'),
  https = require('https');

var pages = [
  {name: 'Members', href: '/members'},
  {name: 'First members', href: '/first'},
  {name: 'Collage', href: '/collage'},
  {name: 'Most active members', href: '/active'},
  {name: 'Most liked members', href: '/liked'},
  {name: 'Companies', href: '/companies'},
  {name: 'Most posted links', href: '/links'},
  {name: 'Most Engaging posts', href: '/engagement'}
];

/* GET home page. */
router.get('/', function(req, res, next) {
  Promise.all([
    queries.first(1000),

    queries.topActive(),
    queries.topActive('posts'),
    queries.topActive('comments'),
    queries.topActive('likes'),
    queries.inactive(),

    queries.topLiked(),
    queries.topLiked(true, true),
    queries.topLiked(true),

    queries.topLinks(),
    queries.topLinks(true),
    queries.topLinks(false, true),
    queries.topLinks(true, true),

    queries.companies(),
    queries.companies(true),

    queries.engagement('posts', 'comment_count', 10),
    queries.engagement('posts', 'like_count', 5),
    queries.engagement('comments', 'like_count', 5)
  ])
  .then(function (results) {
    res.render('index', {
      title: 'Kodapor',

      first: results.shift(),

      activeScore: results.shift(),
      activePosts: results.shift(),
      activeComments: results.shift(),
      activeLikes: results.shift(),
      activeInactive: results.shift(),

      likedNominal: results.shift(),
      likedPercentActive: results.shift(),
      likedPercent: results.shift(),

      linksPosted: results.shift(),
      linksPostedDomains: results.shift(),
      linksLiked: results.shift(),
      linksLikedDomains: results.shift(),

      companies: results.shift(),
      companiesActive: results.shift(),

      engagementPostsByComments: results.shift(),
      engagementPostsByLikes: results.shift(),
      engagementCommentsByLikes: results.shift(),
    });
  })
  .catch(next);
});

router.get('/memberchart', function(req, res, next) {
  queries.growth('members')
    .then(function (data) {
      res.render('chart', {
        title: 'Members',
        data: data
      });
    })
    .catch(next);  
});

router.get('/postchart', function(req, res, next) {
  queries.growth('posts')
    .then(function (data) {
      res.render('chart', {
        title: 'Posts',
        data: data
      });
    })
    .catch(next);  
});

router.get('/commentchart', function(req, res, next) {
  queries.growth('comments')
    .then(function (data) {
      res.render('chart', {
        title: 'Comments',
        data: data
      });
    })
    .catch(next);  
});

router.get('/posts', function(req, res, next) {
  queries.posts(30)
    .then(function (posts) {
      var payload = {language: "sv", texts: []};
      
      posts.map(function (p) {
        if ('message' in p) {
          var body = p.message;
          if(p.description) {
            body += '\n' + p.description;
          }

          p.comments.forEach(function (c) {
              body += '\n' + '\n' + c.message;  
          });
          
          if (typeof body !== undefined) {
            payload.texts.push({id: p.id, body: JSON.stringify(body).replace('"', '')}); 
          } 
        }
      });
      
      res.send(payload);
    })
    .catch(next);  
});

router.get('/heatmap', function(req, res, next) {
  res.render('heatmap');
});

router.get('/wordcloud', function(req, res, next) {
  res.render('wordcloud');
});

router.use('/v3/tonality', function(req, res, next) {
    var options = {
        hostname: 'api.gavagai.se',
        port: 443,
        path: '/v3/tonality' + req.url,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    },
    body = '';

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

    console.log(new Date(), ' -- Rquest Received:', req.body, req.url);

    var requ = https.request(options, function(https_res) {
        console.log(new Date(), 'statusCode: ', https_res.statusCode);
        console.log(new Date(), 'headers: ', https_res.headers);

        https_res.on('data', function(d) {
            body += d;
        });

        https_res.on('end', function() {
            res.send(body);
            console.log(new Date(), 'Sent request: ', req.body);
            next();
        });

    });

    requ.write(JSON.stringify(req.body));
    requ.end();
});

module.exports = router;
