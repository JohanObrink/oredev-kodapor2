var Feed = require('./feed');

var groupId = '133054986743582';
var accessToken = 'CAACEdEose0cBANG2jZCGbVtEAGoc8A8AD8tfag4XNeDzu0jsh7Oo46AxucdrRX6BaQmJJIiT3VSAJxqRkwhr8Gr7oegBv0eujTo9f1rnyzaoThOCNeXW6T8Ggr6oJSQj2ekvZC6NHT5bVYwxERSTEbvByfjJxvq5labPOwsju8F268Sqtx3mc5p2e9mrqDUH9SCy87bxqV5SATQn4m';
var fromTime = '2015-10-02T00:00:00+0000';

var feed = new Feed(groupId, accessToken, fromTime);
feed.read();