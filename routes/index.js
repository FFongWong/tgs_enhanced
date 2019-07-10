var express = require('express');
var fs = require('fs');
var FfmpegCommand = require('fluent-ffmpeg');

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  fs.readdir('./public/Videos', function(err, files) {
    if(err) {
      console.error(err);
    }
    else {
      res.render('index', { title: 'The Good Stuff', videos: shuffle(files) });
    }
  });
  //res.render('index', { title: 'Express' });
});

router.get('/video/:name', function(req, res, next) {
  res.render('video', {src: req.params.name});
});


router.get('/rvideo/:lock?', function(req, res, next) {

  fs.readdir('./public/Videos', function(err, files) {
    if(err) {
      console.error(err);
    }
    else {
      const randIndex = Math.floor(Math.random() * files.length);
      
      res.render('rvideo', {src: files[randIndex], lock: req.params.lock});
    }
  });

  
});

router.get('/thumbnailer', function(req, res, next) {
  fs.readdir('./public/Videos', function(err, files) {
    if(err) {
      console.error(err);
    }
    else {
      function convertNow(files, counter) {
        try {
          if (!fs.existsSync('./public/Thumbnails/' + files[counter] + '.jpg')) {
            let command = new FfmpegCommand();
            console.log('CONVERTING: ' + files[counter]);
            command.input('./public/Videos/' + files[counter])
            .screenshots({
              timestamps: ['50%'],
              filename: files[counter] + '.jpg',
              folder: './public/Thumbnails/',
            })
            .on('end', function() {
              counter++;
              if(counter < files.length) {
                convertNow(files, counter);
              }
            });
          }
          else {
            counter++;
            if(counter < files.length) {
              convertNow(files, counter);
            }
          }
        } catch(err) {
          console.error(err)
        }
      }

      convertNow(files, 0);
    }
  });
  res.redirect('/');
});

module.exports = router;
