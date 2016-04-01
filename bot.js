'use strict';

var NorrisBot = require('./lib/norrisbot');

var token = process.env.BOT_API_KEY;
var dbPath = process.env.BOT_DB_PATH;
var name = process.env.BOT_NAME;

var norrisbot = new NorrisBot({
    token: 'xoxb-31293820775-PAXjjhoBIcjxjcQnmZ1KubMy',
    dbPath: dbPath,
    name: 'norrisbot'
});

norrisbot.run();