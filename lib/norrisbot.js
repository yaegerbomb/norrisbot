var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();
var Bot = require('slackbots');

var NorrisBot = function Constructor(settings) {
    this.settings = settings;
    this.settings.name = this.settings.name || 'norrisbot';
    this.dbPath = settings.dbPath || path.resolve(process.cwd(), 'data', 'norrisbot.db');
	console.log(this.dbPath);
    this.user = null;
    this.db = null;
};

// inherits methods and properties from the Bot constructor
util.inherits(NorrisBot, Bot);

module.exports = NorrisBot;

NorrisBot.prototype.run = function () {
    NorrisBot.super_.call(this, this.settings);

    this.on('start', this._onStart);
    this.on('message', this._onMessage);
};

NorrisBot.prototype._onStart = function () {
	console.log("on start happened");
    this._loadBotUser();
    this._connectDb();
	console.log("db connected");
    this._firstRunCheck();
};

NorrisBot.prototype._loadBotUser = function () {
    var self = this;
    this.user = this.users.filter(function (user) {
        return user.name === self.name;
    })[0];
};

NorrisBot.prototype._connectDb = function () {
    if (!fs.existsSync(this.dbPath)) {
        console.error('Database path ' + '"' + this.dbPath + '" does not exists or it\'s not readable.');
        process.exit(1);
    }

    this.db = new SQLite.Database(this.dbPath);
};


NorrisBot.prototype._firstRunCheck = function () {
    var self = this;
    self.db.get('SELECT val FROM info WHERE name = "lastrun" LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var currentTime = (new Date()).toJSON();

        // this is a first run
        if (!record) {
            self._welcomeMessage();
            return self.db.run('INSERT INTO info(name, val) VALUES("lastrun", ?)', currentTime);
        }

        // updates with new last running time
        self.db.run('UPDATE info SET val = ? WHERE name = "lastrun"', currentTime);
    });
};

NorrisBot.prototype._welcomeMessage = function () {
    this.postMessageToChannel(this.channels[0].name, 'Hi guys, roundhouse-kick anyone?' +
        '\n I can tell jokes, but very honest ones. Just say `Chuck Norris` or `' + this.name + '` to invoke me!',
        {as_user: true});
};

NorrisBot.prototype._onMessage = function (message) {
	console.log("message: " + message)
    if (this._isChatMessage(message) &&
        this._isChannelConversation(message) &&
        !this._isFromNorrisBot(message) &&
        this._isMentioningChuckNorris(message)
    ) {
		console.log("joke time");
        this._replyWithKeywordJoke(message);
    }
};

NorrisBot.prototype._isChatMessage = function (message) {
	console.log("Is chat message: " + message.type === 'message' && Boolean(message.text));
    return message.type === 'message' && Boolean(message.text);
};

NorrisBot.prototype._isChannelConversation = function (message) {
	console.log("Is channel Conversation" + typeof message.channel === 'string' && message.channel[0] === 'C');
    return typeof message.channel === 'string' &&
        message.channel[0] === 'C';
};

NorrisBot.prototype._isFromNorrisBot = function (message) {
	console.log("Is from norris bot " + message.user === this.user.id);
    return message.user === this.user.id;
};

NorrisBot.prototype._isMentioningChuckNorris = function (message) {
	console.log("message:" + message);
    return message.text.toLowerCase().indexOf('chuck norris') > -1 ||
        message.text.toLowerCase().indexOf(this.name) > -1;
};

NorrisBot.prototype._replyWithRandomJoke = function (originalMessage) {
    var self = this;
    self.db.get('SELECT id, joke FROM jokes ORDER BY used ASC, RANDOM() LIMIT 1', function (err, record) {
        if (err) {
            return console.error('DATABASE ERROR:', err);
        }

        var channel = self._getChannelById(originalMessage.channel);
        self.postMessageToChannel(channel.name, record.joke, {as_user: true});
        self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
    });
};

NorrisBot.prototype._replyWithKeywordJoke = function(originalMessage){
	var self = this;
	console.log(originalMessage.text);
	var messageText = originalMessage.text.toLowerCase();
	var indexOfChuckNorris = messageText.indexOf('chuck norris');
	var keyword = "";
	if(indexOfChuckNorris == -1){		
		keyword = messageText.split(this.name)[1];
	}else{
		keyword = messageText.split('chuck norris')[1];
	}
	var textToSearch = keyword.split(' ');
	if(keyword.split(' ')[0] == ""){
		textToSearch == keyword;
	}else{
		textToSearch = keyword.split(' ')[0];
	}
	
	if(keyword == undefined || keyword == "" || keyword == null || keyword == "chuck" || keyword == "norris" || keyword == "chuck norris"){
		self._replyWithRandomJoke(originalMessage);
	}
	console.log("keyword: " + keyword);
	console.log("texttosearch: " + textToSearch);
	self.db.get("SELECT id, joke FROM jokes WHERE joke LIKE '%" + keyword + "%' LIMIT 1", function (err, record) {
        if (err) {
            console.log("screwed up code");
			self._replyWithRandomJoke(originalMessage);
        }else{

			console.log(record);
			if(record){
				console.log("I found something to reply with");
			var channel = self._getChannelById(originalMessage.channel);
			self.postMessageToChannel(channel.name, record.joke, {as_user: true});
			self.db.run('UPDATE jokes SET used = used + 1 WHERE id = ?', record.id);
			}else{
				console.log("I did not find anything");
				self._replyWithRandomJoke(originalMessage);
			}
		}
    });
}

NorrisBot.prototype._getChannelById = function (channelId) {
    return this.channels.filter(function (item) {
        return item.id === channelId;
    })[0];
};
