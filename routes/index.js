var express = require('express'),
  router = express.Router(),
  r = require('rethinkdb'),
  queries = require('../services/queries');

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
  res.render('index', { title: 'Express' });
});

router.get('/members', function(req, res, next) {
  queries.members()
    .then(function (members) {
      res.render('members', {
        title: 'Members',
        members: members,
        pages: pages
      });
    })
    .catch(next);  
});

router.get('/first', function(req, res, next) {
  queries.first(50)
    .then(function (members) {
      res.render('first', {
        title: 'First members',
        members: members,
        pages: pages
      });
    })
    .catch(next);  
});

router.get('/collage', function(req, res, next) {
  queries.first(1000)
    .then(function (members) {
      res.render('collage', {
        title: 'Collage',
        members: members,
        pages: pages
      });
    })
    .catch(next);  
});

router.get('/active', function(req, res, next) {
  Promise.all([
      queries.topActive(),
      queries.topActive('posts'),
      queries.topActive('comments'),
      queries.topActive('likes'),
      queries.inactive()
    ])
    .then(function (values) {
      res.render('active', {
        title: 'Most active members',
        score: values[0],
        posts: values[1],
        comments: values[2],
        likes: values[3],
        inactive: values[4],
        pages: pages
      });
    })
    .catch(next);  
});

router.get('/liked', function(req, res, next) {
  Promise.all([
      queries.topLiked(),
      queries.topLiked(true, true),
      queries.topLiked(true)
    ])
    .then(function (values) {
      res.render('liked', {
        title: 'Most liked members',
        likedNominal: values[0],
        likedActive: values[1],
        liked: values[2],
        pages: pages
      });
    })
    .catch(next);  
});

router.get('/links', function(req, res, next) {
  Promise.all([
      queries.topLinks(),
      queries.topLinks(true),
      queries.topLinks(false, true),
      queries.topLinks(true, true)
    ])
    .then(function (values) {
      res.render('links', {
        title: 'Most posted links',
        links: values[0],
        domains: values[1],
        likedLinks: values[2],
        likedDomains: values[3],
        pages: pages
      });
    })
    .catch(next);  
});

router.get('/companies', function(req, res, next) {
  Promise.all([
      queries.companies(),
      queries.companies(true)
    ])
    .then(function (values) {
      res.render('companies', {
        title: 'Companies',
        companies: values[0],
        active: values[1],
        pages: pages
      });
    })
    .catch(next);  
});

router.get('/engagement', function(req, res, next) {
  Promise.all([
      queries.engagement('posts', 'comment_count', 20),
      queries.engagement('posts', 'like_count', 20),
      queries.engagement('posts', 'totalLikes', 20),
      queries.engagement('comments', 'like_count', 20)
    ])
    .then(function (values) {
      res.render('engagement', {
        title: 'Most Engaging posts',
        postsByComments: values[0],
        postsByLikes: values[1],
        postsByTotalLikes: values[2],
        commentsByLikes: values[3],
        pages: pages
      });
    })
    .catch(next);  
});

router.get('/posts', function(req, res, next) {
  queries.posts(50)
    .then(function (posts) {
      res.send(posts.map(function (p) {
        var body = p.message;
        if(p.description) {
          body += '\n' + p.description;
        }
        p.comments.forEach(function (c) {
          body += '\n' + '\n' + c.message;
        });
        return {
          id: p.id,
          body: body
        };
      }));
    })
    .catch(next);  
});

module.exports = router;
