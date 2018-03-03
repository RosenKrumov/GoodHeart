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

	app.get('/charities/add', function(req, res) {
		res.render('../web-app/views/addCharity', {title: 'GoodHeart', message: 'GoodHeart Charity Organization'});
	});

	app.get('/addCharity', function(req, res) {
		console.log("Adding charity folder...");
		addCharity(charities_folder, req.query.description, req.query.charityId);
	});

	app.listen(http_port, () => console.log('Listening http on port ' + http_port));
}

function addCharity(dir, charityDescription, charityId) {
	var directoryToCreate = `${dir}/${charityId}`;
	var fileToCreate = `${charityId}_description.txt`;

	console.log("Directory to create: " + directoryToCreate);

	console.log("Directory exists: " + fs.existsSync(directoryToCreate));

	if (!fs.existsSync(directoryToCreate)){
	    fs.mkdirSync(directoryToCreate);

    	fs.writeFile(directoryToCreate + "/" + fileToCreate, charityDescription, function(err) {
			if(err) {
		        return console.log(err);
		    }

		    console.log("The file was saved!");
		});
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

initHttpServer();