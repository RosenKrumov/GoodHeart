'use strict';
var express = require("express");
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var html_sanitizer = require('html-css-sanitizer').sanitize;

const { join } = require('path')

var charities_folder = "./web-app/resources/charities";
var charities_images_paths = "/web-app/views";

var node_hostname = "localhost";
var http_port = "8001";

var initHttpServer = () => {
	var app = express();
	app.set('view engine', 'pug');

	//app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use('/web-app/views', express.static('./web-app/resources/charities'));
	app.use('/web-app', express.static('./web-app'));

	app.get('/', function(req, res) {
		res.render('../web-app/views/index', {title: 'GoodHeart', message: 'GoodHeart Charity Organization'});
	});

	app.get('/charities', function(req, res) {
		res.render('../web-app/views/charities', {title: 'GoodHeart', message: 'GoodHeart Charity Organization'});
	});

	app.get('/getAllCharities', function(req, res) {
		var allCharities = getAllCharities(charities_folder);
		res.send(allCharities);
	});

	app.get('/getCharity', function(req, res) {
		var charityId = req.query.charityId.trim();
		var charity = getCharity(charities_folder, charityId);
		res.send(charity);
	})

	app.get('/charities/add', function(req, res) {
		res.render('../web-app/views/addCharity', {title: 'GoodHeart', message: 'GoodHeart Charity Organization'});
	});

	app.get('/addCharity', function(req, res) {
		console.log("Adding charity folder...");

		var description = req.query.description.trim();
		var charityId = req.query.charityId.trim(); 

		console.log(description);

		if (req.query.description == '') {
			res.send('{"error" : "Charity description is empty", "status" : 400}');
		} else {
			var addedSuccessfully = addCharity(charities_folder, req.query.description, req.query.charityId);
			console.log("FUNC RETURN VAL IS: " + addedSuccessfully);
			if (addedSuccessfully) {
				res.send('{"success" : "Charity added successfully", "status" : 200}');	
			} else {
				res.send('{"error" : "Charity could not be added", "status" : 400}');
			}
		}
	});

	app.get('/charities/:id', function(req, res) {
		var id = req.params.id;
		if (id == parseInt(id, 10)) {
		    res.render('../web-app/views/charity', {title: 'GoodHeart', message: 'GoodHeart Charity Organization', charityId: id, status: 'OK'});
		} else {
		    res.render('../web-app/views/charity', {title: 'GoodHeart', message: 'GoodHeart Charity Organization', charityId: id, status: 'Invalid'});
		}

	});

	app.listen(http_port, () => console.log('Listening http on port ' + http_port));
}

function checkIfCharityExistsInBlockchain() {
	// TODO
}

function addCharity(dir, charityDescription, charityId) {
	var directoryToCreate = `${dir}/${charityId}`;
	var fileToCreate = `${charityId}_description.txt`;

	console.log("Directory to create: " + directoryToCreate);

	console.log("Directory exists: " + fs.existsSync(directoryToCreate));

	if (!fs.existsSync(directoryToCreate)){
	    try {
		    fs.mkdirSync(directoryToCreate);
	    	fs.writeFileSync(directoryToCreate + "/" + fileToCreate, charityDescription);
	    } catch(err) {
	    	return false;
	    }

	    return true;
	} else {
		return false;
	}
}

function getAllCharities(dir) {
    var allCharities = [];

    // get all 'files' in this directory
    var charityFolders = fs.readdirSync(dir);

    // process each checking directories and saving files
    charityFolders.map(charityFolder => {
        var charityJson = {};

        charityJson['id'] = charityFolder;

        var charityFiles = fs.readdirSync(charities_folder + "/" + charityFolder);

        charityFiles.map(charityFile => {
            if (charityFile.endsWith(".txt")) {
                var charityFilePath = charities_folder + "/" + charityFolder + "/" + charityFile;
                var content = fs.readFileSync(charityFilePath, 'utf-8');
                content = html_sanitizer(content);
                charityJson['description'] = content;
            } else if (charityFile.indexOf("picture") > -1) {
                var charityPicturePath = charities_images_paths + "/" + charityFolder + "/" + charityFile
                charityJson['picture'] = charityPicturePath;
            }
        })

        allCharities.push(charityJson);
    });

    return allCharities;
}

function getCharity(dir, charityId) {
	var charityDir = `${dir}/${charityId}`;
	var charityFiles = fs.readdirSync(charityDir);
	var charityJson = {};

	charityFiles.map(charityFile => {
        if (charityFile.endsWith(".txt")) {
            var charityFilePath = charityDir+ "/" + charityFile;
            var content = fs.readFileSync(charityFilePath, 'utf-8');
            content = html_sanitizer(content);
            charityJson['description'] = content;
        } else if (charityFile.indexOf("picture") > -1) {
            var charityPicturePath = charities_images_paths + "/" + charityId + "/" + charityFile
            charityJson['picture'] = charityPicturePath;
        }
	});

	return charityJson;
}

initHttpServer();