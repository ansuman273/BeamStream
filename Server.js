var express	=	require("express");
var multer	=	require('multer');
var http = require('http');
var fs = require('fs');
var util = require('util');
var app	=	express();

//Multer local storage implementation
var storage	=	multer.diskStorage({
  destination: function (req, file, callback) {

    callback(null, './uploads/videos');

  },
  filename: function (req, file, callback) {
    callback(null, file.fieldname + '-' + Date.now()+'.mp4');
  }
});

var upload = multer({ storage : storage}).single('uploadVid');

//home page of Beam Stream after bootstrapping
app.get('/',function(req,res){
      res.sendFile(__dirname + "/public/views/home.html");
});

app.get('/home',function(req,res){
    res.sendFile(__dirname + "/public/views/home.html");
});

app.get('/dashboard',function(req,res){
    res.sendFile(__dirname + "/public/views/dashboard.html");
});

app.get('/admin',function(req,res){
    res.sendFile(__dirname + "/public/views/admin.html");
});

app.get('/about',function(req,res){
    res.sendFile(__dirname + "/public/views/about.html");
});

//Upload a video to the local directory
app.post('/api/video',function(req,res){
	upload(req,res,function(err) {
		if(err) {
			return res.end("Error uploading video.");
		}
        else{
            res.status(200);
            res.end("Video is uploaded");
        }
	});
});

var async = require('async');

//Fetch all the uploaded videos
app.get('/api/videos',function(req,res){
    async.waterfall([

        function(callback){
            var walk    = require('walk');
            var files   = [];

            // Walker options
            var walker  = walk.walk('uploads/videos', { followLinks: false });

            walker.on('file', function(root, stat, next) {
                // Add this file to the list of files
                var fileNameWithExt = stat.name;
                files.push(fileNameWithExt);
                next();
            });

            walker.on('end', function() {
                callback(null, files);
            });
        },

        function(files,callback) {

            console.log("Files"+JSON.stringify(files));
            var allFiles=[];
            var filesJson;
            files.forEach(function(file,index) {
                filesJson={};
                filesJson.name=file;
                filesJson.serial=index+1;
                filesJson.link="api/video/"+file;
                allFiles.push(filesJson);
            })
            res.json(allFiles);
        }
    ]);

});

//Fetch a particular video by name
app.get('/api/video/:name',function(req,res){
    var path = 'uploads/videos/'+req.params.name;
    var stat = fs.statSync(path);
    var total = stat.size;
    if (req.headers['range']) {
        var range = req.headers.range;
        var parts = range.replace(/bytes=/, "").split("-");
        var partialstart = parts[0];
        var partialend = parts[1];

        var start = parseInt(partialstart, 10);
        var end = partialend ? parseInt(partialend, 10) : total-1;
        var chunksize = (end-start)+1;
        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

        var file = fs.createReadStream(path, {start: start, end: end});
        res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
        file.pipe(res);
    } else {
        console.log('ALL: ' + total);
        res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
        fs.createReadStream(path).pipe(res);
        //res.send(fs.createReadStream(path).pipe(res));
    }
});

// Serve static files like js and css
app.use(express.static(__dirname +'/public'));
app.use("/static", express.static(__dirname + '/public'));

// start the express App
app.listen(9000,function(){
    console.log("Working on port 9000");
});
