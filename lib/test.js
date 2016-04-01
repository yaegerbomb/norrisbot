var util = require('util');
var path = require('path');
var fs = require('fs');
var SQLite = require('sqlite3').verbose();

if (!fs.existsSync('./data/norrisbot.db')) {
	console.error('Database path ' + '"' + '../data/norrisbot.db' + '" does not exists or it\'s not readable.');
	process.exit(1);
}

this.db = new SQLite.Database('./data/norrisbot.db');

this.db.get("SELECT id, joke FROM jokes WHERE joke LIKE '%" + "Rome" + "%' LIMIT 1", function (err, record) {
        if (err) {
            console.log(err);
			
        }else{

			console.log(record);
		
		}
    });
	
	