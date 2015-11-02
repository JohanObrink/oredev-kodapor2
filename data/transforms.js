var r = require('rethinkdb');

function connect() {
  return r.connect({db: 'kodapor'});
}

function getCompany(m) {
  var title = m.title;
  if(title.indexOf(' at ') === -1) {
    return null;
  }
  return title.substring(title.indexOf(' at ') + 4);
}

function setCompany() {
  return connect()
    .then(function (conn) {
      return r.table('members')
        .filter(function (m) {
          return m.hasFields('company').not();
        })
        .run(conn)
        .then(function (cursor) {
          return cursor.toArray();
        })
        .then(function (members) {
          return members.reduce(function (promise, m, ix) {
            return promise.then(function () {
              console.log(ix, 'of', members.length);
              var company = getCompany(m);
              console.log(m.name, company);
              return r.table('members')
                .get(m.id)
                .update({company: company})
                .run(conn);
            });
          }, Promise.resolve());
        });
    })
    .then(function () {
      console.log('DONE');
      process.exit(0);
    })
    .catch(function (err) {
      console.error(err);
      process.exit(1);
    });
}

module.exports = {
  getCompany: getCompany,
  setCompany: setCompany
}