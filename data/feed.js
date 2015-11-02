var EventEmitter = require('events').EventEmitter,
  request = require('request'),
  _ = require('lodash'),
  r = require('rethinkdb'),
  fs = require('fs');


function addProps(props) {
  return function (item) {
    return _.merge(item, props);
  };
}

function Feed(groupId, accessToken, fromTime) {
  this.fromTime = fromTime;
  this.groupId = groupId;
  this.accessToken = accessToken;

  this.posts = [];
  this.comments = [];
  this.likes = [];

  this.isLoading = false;
  this.pending = [];
  this.done = 0;

  this.onPosts = this.onPosts.bind(this);
  this.lastSave = 0;
  this.saveTimeout = null;
}

Feed.prototype = Object.create(EventEmitter.prototype);
Feed.prototype.constructor = Feed;

Feed.prototype.url = function () {
  var tokens = Array.prototype.slice.call(arguments);
  return 'https://graph.facebook.com/v2.0/' +
    tokens.join('/') +
    '?limit=200&access_token=' +
    this.accessToken;
};

Feed.prototype.read = function () {
  var url = this.url(this.groupId, 'feed');
  this.request(url, this.onPosts);
  return this;
};

Feed.prototype.request = function (url, callback) {
  if(url && callback) {
    this.pending.unshift({url: url, callback: callback});
  }
  if(this.isLoading) {
    return;
  }
  this.isLoading = true;
  var req = this.pending.shift();
  var url = req.url.replace('limit=25', 'limit=200');

  console.log('Posts', 'Comments', 'Likes');
  console.log(this.posts.length, this.comments.length, this.likes.length);
  logRequest(url);
  console.log('Pending requests', this.pending.length);
  console.log('Completed requests', this.done);
  console.log('');
  request(url, this.onResponse.bind(this, req));
};

function logRequest(url) {
  var pathQuery = url.split('?');
  var path = pathQuery[0].substring(26);
  var query = pathQuery[1]
    .split('&')
    .filter(function (param) {
      var nameValue = param.split('=');
      return nameValue[0] !== 'access_token';
    })
    .join('&');
  console.log('Loading', path + '?' + query);
}

Feed.prototype.onResponse = function (req, error, response, body) {
  this.isLoading = false;
  this.done++;
  if(error) {
    console.error(error);
    console.log('Retry');
    this.request(req.url, req.callback);
  } else if(response.statusCode === 200) {
    req.callback(JSON.parse(body));
    if(this.pending.length) {
      this.request();
    }
  } else {
    console.error(response.statusCode, body);
    console.log('Retry');
    this.request(req.url, req.callback);
  }
};

Feed.prototype.onPosts = function (body) {
  var self = this;
  var skipNext = false;

  this.posts = this.posts.concat(body.data);

  this.insertIntoDb('posts', body.data);

  //console.log(body);
  body.data.forEach(function (post) {
    if(self.fromTime && post.created_time < self.fromTime) {
      console.log('=== DONE LOADING POSTS ===');
      skipNext = true;
      return;
    } else {
      console.log(post.created_time, '>=', self.fromTime);
    }
    if(post.likes) {
      self.onLikes({post_id: post.id, comment_id: null}, post.likes);
    }
    if(post.comments) {
      self.onComments({post_id: post.id}, post.comments);
    }
  });
  this.emit('posts', body.data);
  if(body.paging && body.paging.next && !skipNext) {
    this.request(body.paging.next, this.onPosts);
    console.log('=== CONTINUE ===');
  } else {
    console.log('=== NEXT ===');
  }
  this.saveToFiles();
};

Feed.prototype.onComments = function (params, body) {
  var comments = body.data.map(addProps(params));
  this.comments = this.comments.concat(comments);

  this.insertIntoDb('comments', comments);

  var self = this;
  comments.forEach(function (comment) {
    if(comment.like_count > 0) {
      var url = self.url(comment.id, 'likes');
      params.comment_id = comment.id;
      self.request(url, self.onLikes.bind(self, params));
    }
  });
  if(body.paging && body.paging.next) {
    this.request(body.paging.next, this.onComments.bind(this, params));
  }
  this.saveToFiles();
};

Feed.prototype.onLikes = function (params, body) {
  var likes = body.data.map(function (like) {
    like = _.merge(like, params);
    like.user_id = like.id;
    like.id = [(like.comment_id || like.post_id), like.user_id].join('-');
    return like;
  });
  this.likes = this.likes.concat(likes);

  this.insertIntoDb('likes', likes);

  if(body.paging && body.paging.next) {
    this.request(body.paging.next, this.onLikes.bind(this, params));
  }
  this.saveToFiles();
};

Feed.prototype.getConnection = function () {
  if(!this.connection) {
    this.connection = r.connect({db: 'kodapor'});
  }
  return this.connection;
}

function sanitize(data) {
  return data.map(function (item) {
    return _.omit(item, [
      'actions',
      'comments',
      'likes',
      'privacy',
      'to',
      'paging'
    ]);
  });
}

Feed.prototype.saveToFiles = function () {
  var now = Date.now();
  if(now - this.lastSave > 60*1000) {
    clearTimeout(this.saveTimeout);
    this.lastSave = now;
    fs.writeFile(process.cwd() + '/likes.json',
      JSON.stringify(sanitize(this.likes)),
      {encoding: 'utf-8'},
      function (err, res) {
        if(err) { console.error('save error for likes', err); }
        else { console.log('saved likes'); }
      });
    fs.writeFile(process.cwd() + '/comments.json',
      JSON.stringify(sanitize(this.comments)),
      {encoding: 'utf-8'},
      function (err, res) {
        if(err) { console.error('save error for comments', err); }
        else { console.log('saved comments'); }
      });
    fs.writeFile(process.cwd() + '/posts.json',
      JSON.stringify(sanitize(this.posts)),
      {encoding: 'utf-8'},
      function (err, res) {
        if(err) { console.error('save error for posts', err); }
        else { console.log('saved posts'); }
      });
  } else {
    this.saveTimeout = setTimeout(this.saveToFiles.bind(this), 60*1000);
  }
};

Feed.prototype.insertIntoDb = function (tableName, data) {
  var getConnection = this.getConnection;
  function insert() {
    getConnection()
      .then(function (conn) {
        return r.table(tableName).insert(sanitize(data)).run(conn);
      })
      .catch(function (err) {
        console.error('db', err);
      });
  }
  if(!this.promise) {
    this.promise = insert();
  } else {
    this.promise = this.promise.then(insert());
  }
}

module.exports = Feed;