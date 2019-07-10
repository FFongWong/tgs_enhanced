var express = require('express');
var fs = require('fs');
var FfmpegCommand = require('fluent-ffmpeg');

var router = express.Router();



function getFilenames(fileDirents, shuffle) {
    
    console.log(fileDirents);
    
    const shuffledFileNames = fileDirents.map(name => name);
    
// const shuffledFileNames = fileDirents
// .filter(dirent => !dirent.isDirectory())
// .map(dirent => dirent.name);
    
    for (let i = shuffledFileNames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledFileNames[i], shuffledFileNames[j]] = [shuffledFileNames[j], shuffledFileNames[i]];
    }
    return shuffledFileNames;
}

function getChannelNames(fileDirents) {
    
    console.log(fileDirents);
    
    const channelNames = fileDirents.map(name => name);;
    
// const channelNames = fileDirents
// .filter(dirent => dirent.isDirectory())
// .map(dirent => dirent.name);
    
    return channelNames;
}


/* GET home page. */
router.get('/:channel?', function(req, res, next) {
  
    const channelPath     = req.params.channel == undefined ? 'root' : req.params.channel;
    const channelName = req.params.channel == undefined ? false : req.params.channel;
    const browserTitle = channelName ? 'Channel Browser: ' + channelName : 'Channel Browser';
    const channelFilePath = channelName ? './public/Videos/' + channelName : './public/Videos/';
      
        
    fs.readdir(channelFilePath, {withFileTypes: true}, function(err, fileDirents) {
        if(err) {
            console.error(err);
        }
        else {
            res.render('index', { title:       browserTitle, 
                                  channels:    getChannelNames(fileDirents),
                                  videos:      getFilenames(fileDirents, true), 
                                  channelPath: channelPath, 
                                  channelName: channelName 
                              });
        }
    });
  // res.render('index', { title: 'Express' });
});



router.get('/video/:channel/:name', function(req, res, next) {    
    
    const channelPath = req.params.channel;
    const channelName = req.params.channel == 'root' ? false : req.params.channel;
    const channelFilePath = channelName ? './public/Videos/' + channelName : './public/Videos/';
    const backPath        = req.params.channel == 'root' ? '/' : '/'+ req.params.channel;
    
    const filePath     = req.params.channel == 'root' ? req.params.name : req.params.channel + '/'+ req.params.name;
    
    res.render('video', { src: filePath, 
                          backPath: backPath, 
                          channelPath: channelPath, 
                          channelName: channelName 
                        });
});



router.get('/rvideo/:channel/:lock?', function(req, res, next) {

    const channelPath     = req.params.channel;
    const channelName     = req.params.channel == 'root' ? false : req.params.channel;
    const channelFilePath = channelName ? './public/Videos/' + channelName : './public/Videos/';
    const backPath        = req.params.channel == 'root' ? '/' : '/'+ req.params.channel;
    
    fs.readdir(channelFilePath, function(err, fileDirents) {
        if(err) {
          console.error(err);
        }
        else {
            
          const randomFile = getFilenames(fileDirents, true)[0];
          const filePath     = req.params.channel == 'root' ? randomFile : req.params.channel + '/'+ randomFile;
          
          res.render('rvideo', { src: filePath, 
                                 lock: req.params.lock,
                                 backPath: backPath, 
                                 channelPath: channelPath, 
                                 channelName: channelName 
                    });
          
        }
    });

  
});



router.get('/thumbnailer/:channel', function(req, res, next) {
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
