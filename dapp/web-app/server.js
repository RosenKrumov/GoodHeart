'use strict';
var express = require("express");
var bodyParser = require('body-parser');
var http = require('http');
var fs = require('fs');
var html_sanitizer = require('html-css-sanitizer').sanitize;

const { join } = require('path')

var charities_folder = "./web-app/resources/charities";
var charities_images_paths = "/web-app/images";

var node_hostname = "localhost";
var http_port = "8001";

var initHttpServer = () => {
	var app = express();
	app.set('view engine', 'pug');

	//app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));
	app.use('/web-app/images', express.static('./web-app/resources/charities'));
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
	});

	app.get('/getCharityContributions', function(req, res) {
		var charityId = req.query.charityId.trim();
		var contributions = getCharityContributions(charities_folder, charityId);
		res.send(contributions);
	});

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

	app.get('/addCharityContribution', function(req, res) {
		var request = req.query;
		var description = request.description.trim();
		var imageUrl = request.imageUrl.trim();
		var charityId = request.charityId.trim();
		var contributionId = request.contributionId;


		if (description == '' || charityId == '' || contributionId == '' || imageUrl == '') {
			res.send('{"error" : "Invalid data provided", "status": 400}');
		} else {
			var addedSuccessfully = addCharityContribution(charityId, contributionId, description, imageUrl);
			if (addedSuccessfully) {
				res.send('{"success": "Contribution added successfully for approval", "status": 200}');
			} else {
				res.send('{"error": "Contribution could not be added", "status": 400}');
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

function addCharity(dir, charityDescription, charityId) {
	var directoryToCreate = `${dir}/${charityId}`;
	var fileToCreate = `${charityId}_description.txt`;

	console.log("Directory to create: " + directoryToCreate);

	console.log("Directory exists: " + fs.existsSync(directoryToCreate));

	if (!fs.existsSync(directoryToCreate)){
	    try {
		    fs.mkdirSync(directoryToCreate);
		    fs.mkdirSync(directoryToCreate + "/approvedContributions");
		    fs.mkdirSync(directoryToCreate + "/contributions");
	    	fs.writeFileSync(directoryToCreate + "/" + fileToCreate, charityDescription);
	    } catch(err) {
	    	return false;
	    }

	    return true;
	} else {
	    try {
	    	fs.writeFileSync(directoryToCreate + "/" + fileToCreate, charityDescription);
	    } catch(err) {
	    	return false;
	    }

	    return true;
	}
}

function addCharityContribution(charityId, contributionId, contributionDescription, contributionImageUrl) {
	var charityFolder = `${charities_folder}/${charityId}`;
	var contributionFolder = `${charityFolder}/contributions/${contributionId}`;

	if (fs.existsSync(charityFolder)){
		console.log("Charity folder exists!");
		if (!fs.existsSync(contributionFolder)) {
			console.log("Contributions id folder does not exist!");
			try {
			    fs.mkdirSync(contributionFolder);
				fs.writeFileSync(contributionFolder + `/${contributionId}_image.txt`, contributionImageUrl);
				fs.writeFileSync(contributionFolder + `/${contributionId}_description.txt`, contributionDescription);
		    } catch(err) {
		    	console.log(err);
		    	return false;
		    }

	    	return true;
		
		} else {
			console.log("Contributions id folder exists!");
			try {
				fs.writeFileSync(contributionFolder + `/${contributionId}_image.txt`, contributionImageUrl);
				fs.writeFileSync(contributionFolder + `/${contributionId}_description.txt`, contributionDescription);
			} catch(err) {
				console.log(err);
				return false;
			}

			return true;
		}

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

	try {
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
	} catch (err) {
		return {
			'description': "",
			'picture': ""
		}
	}

	return charityJson;
}

function getCharityContributions(dir, charityId) {
	var allContributions = {};
	var contributionsFolder = `${dir}/${charityId}/contributions`;

	var contributionsFolders = fs.readdirSync(contributionsFolder);

	contributionsFolders.map(contribution => {
		allContributions[contribution] = {};
		var contributionFiles = fs.readdirSync(contributionsFolder + "/" + contribution);
		contributionFiles.map(file => {
			var content = fs.readFileSync(contributionsFolder + "/" + contribution + "/" + file);
			content = html_sanitizer(content);

			if (file.endsWith("_image.txt")) {
				allContributions[contribution]['image'] = content; 
			} else if (file.endsWith("_description.txt")) {
				allContributions[contribution]['description'] = content;
			}
		});
	});

	return allContributions;
}

initHttpServer();