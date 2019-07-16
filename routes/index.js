var express = require('express');
var cookieParser = require('cookie-parser')
var fs = require('fs');
var ws = require('windows-shortcuts');
var FfmpegCommand = require('fluent-ffmpeg');

var router = express.Router();

//need cookieParser middleware before we can do anything with cookies
express().use(cookieParser());

// set a cookie
express().use(function (req, res, next) {
  // check if client sent cookie
  var cookie = req.cookies.prevFilename;
  if (cookie === undefined)
  {
    // no: set a new cookie
    res.cookie('prevFilename',false, { maxAge: 900000, httpOnly: true });
//    console.log('cookie created successfully');
  } 
  else
  {
    // yes, cookie was already present 
//    console.log('cookie exists', cookie);
  } 
  next(); 
});




async function getFileInfo(fileDirents, channelName, shuffle, fileInfo) {
    
//    console.log("FILES", fileDirents);
    var filePaths = [] ;
    var fileNames = fileDirents[0].isDirectory == undefined ?  fileDirents.map(name => name).filter(name => !['.DS_Store'].includes(name)):
                                                          fileDirents
                                                         .filter(dirent => !dirent.isDirectory())
                                                         .map(dirent => dirent.name)
                                                         .filter(name => !['.DS_Store'].includes(name));
    
    if(shuffle) {
        for (let i = fileNames.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [fileNames[i], fileNames[j]] = [fileNames[j], fileNames[i]];
        }
    }   
    
//    fileNames.forEach(function(nameItem, nameIndex) {
    async function resolveLinks(nameItem) {
    	const nameIndex = fileNames.indexOf(nameItem);
        filePaths[nameIndex] = channelName == 'root' ? nameItem : channelName + '/'+ nameItem;
        
//        console.log('before analysis', filePaths[nameIndex]);
        
        // special handing of windows shortcuts -- see https://www.npmjs.com/package/windows-shortcuts
        if(nameItem.includes('.lnk')) {
//            console.log('IS LINK', filePaths[nameIndex]);
            
            async function operation() {
                return new Promise(function(resolve, reject) {
                	ws.query('./public/Videos/' +filePaths[nameIndex], function(err, shortCutInfo){
                		fileNames[nameIndex] = fileNames[nameIndex].replace(' - Shortcut.lnk', '').replace('.lnk', '');
                    	filePaths[nameIndex] = shortCutInfo['target'];
                        
//                        console.log('before slice', filePaths[nameIndex]);
                        filePaths[nameIndex] = filePaths[nameIndex].slice(filePaths[nameIndex].indexOf("public\\Videos\\") + 14).replace("\\", '/');
//                        console.log('after slice', filePaths[nameIndex]);
                        
                        resolve(true) // successfully fill promise
                	});
                    
                })
            }
            
            return operation();
            
        }
        else {
//        	console.log('IS NOT LINK', filePaths[nameIndex]);
        }
        
    };
    
    const promises = fileNames.map(nameItem => resolveLinks(nameItem));
    await Promise.all(promises).then(function(){
//        console.log('after analysis', fileNames, filePaths);
        
        fileInfo['fileNames'] = fileNames;
        fileInfo['filePaths'] = filePaths;

    });

}

function getChannelNames(fileDirents) {
    
//    console.log("CHANNELS", fileDirents);
    
    const channelNames =  fileDirents[0].isDirectory == undefined ? fileDirents.map(name => name).filter(name => !['.DS_Store'].includes(name)):
                                      fileDirents
                                     .filter(dirent => dirent.isDirectory())
                                     .filter(dirent => !['.DS_Store'].includes(dirent.name))
                                     .map(dirent => dirent.name);
    
    return channelNames;
}


function removeDuplicates(names) {
    let unique = {};
    names.forEach(function(i) {
        if(!unique[i]) {
            unique[i] = true;
        }
    });
    return Object.keys(unique);
}


async function processChannelFiles(channelPath, currentName, shuffle, req, res, callback, skipCookie = false) {
    
    const rootFilePath = './public/Videos/' ;
    
    var callbackObject = {
        fileNames:     [],
        filePaths:     [],
        channelNames: [],
        currentName:  currentName,
        currentPath:  false,
        prevFile:     false,
        nextFile:     false,
    };
    
    var error = false;
    
    var channelList = [ channelPath ];
    
   
    
    var channelDirents = fs.readdirSync(rootFilePath, {withFileTypes: true}) ;
    callbackObject['channelNames'] = getChannelNames(channelDirents);
    
    if(channelPath == 'All') {
        channelList = ['root'].concat(callbackObject['channelNames']);
    }
        
    async function determinePaths(channelItem) {
        
            const channelName  = channelItem == 'root' ? false : channelItem;
            const channelFilePath = channelName ? rootFilePath + channelName : rootFilePath;
            
            var fileInfo = {'fileNames': [], 'filePaths': []};
            await getFileInfo( fs.readdirSync(channelFilePath, {withFileTypes: true}), channelItem, shuffle, fileInfo) ;
            
//            console.log(fileInfo);
            
            var fileNames = fileInfo['fileNames'] ;
            var filePaths = fileInfo['filePaths'] ;
            
            
            if(fileNames.includes(currentName)) {
//                const currentPath = channelItem == 'root' ? currentName : channelItem + '/'+ currentName;
//                callbackObject['currentPath'] = currentPath;
                
                callbackObject['currentPath'] = filePaths[fileNames.indexOf(currentName)];
                
            }
            
            callbackObject['fileNames'] = callbackObject['fileNames'].concat(fileNames);
            callbackObject['filePaths'] = callbackObject['filePaths'].concat(filePaths);
            
    };
        
    async function doCallback() {
    	
    	try {
    		
    		callbackObject['fileNames'] = removeDuplicates(callbackObject['fileNames']);
    		callbackObject['filePaths'] = removeDuplicates(callbackObject['filePaths']);
    		
	        if(shuffle) {
	            for (let i = callbackObject['fileNames'].length - 1; i > 0; i--) {
	                const j = Math.floor(Math.random() * (i + 1));
	                [callbackObject['fileNames'][i], callbackObject['fileNames'][j]] = [callbackObject['fileNames'][j], callbackObject['fileNames'][i]];
	                [callbackObject['filePaths'][i], callbackObject['filePaths'][j]] = [callbackObject['filePaths'][j], callbackObject['filePaths'][i]];
	            }
	        }   
	        
	        if(!currentName) {
	            callbackObject['currentName'] = callbackObject['fileNames'][0];
	            callbackObject['currentPath'] = callbackObject['filePaths'][0];
	            
	            if(req.cookies.prevFilename && req.cookies.prevFilename == callbackObject['currentName'] && callbackObject['fileNames'][1] != undefined) {
	                callbackObject['currentName'] = callbackObject['fileNames'][1];
	                callbackObject['currentPath'] = callbackObject['filePaths'][1];
	            }
	        }
	        
	        if(!skipCookie) {
	        	res.cookie('prevFilename',callbackObject['currentName'], { maxAge: 900000, httpOnly: true });
	        }
	        
	        console.log('CURRENT FILE IS', callbackObject['currentName']);
	        console.log('CURRENT PATH IS', callbackObject['currentPath']);
	        
	        
	        if(currentName) {
	            const currentIndex = callbackObject['fileNames'].indexOf(currentName);
	            callbackObject['prevFile'] = callbackObject['fileNames'][currentIndex - 1] != undefined ? callbackObject['fileNames'][currentIndex - 1] : callbackObject['fileNames'][callbackObject['fileNames'].length - 1];
	            callbackObject['nextFile'] = callbackObject['fileNames'][currentIndex + 1] != undefined ? callbackObject['fileNames'][currentIndex + 1] : callbackObject['fileNames'][0];
	        }
	        
	        
	//        callbackObject['channelNames'] = ['All'].concat(callbackObject['channelNames']);
	        
	        
	//        console.log("CALLBACK OBJECT: ", callbackObject);
    	} catch (thrownError) {
    		error = thrownError;
    	}

    
        callback(error, callbackObject);
    };
    
    
    const promises = channelList.map(channelItem => determinePaths (channelItem));
    await Promise.all(promises).then(doCallback);
}


/* GET home page. */
router.get('/:channel?', function(req, res, next) {
  
    const channelPath  = req.params.channel == undefined ? 'root' : req.params.channel;
    const channelName  = channelPath == 'root' ? false : channelPath;
    const browserTitle = channelName ? 'Channel Browser: ' + channelName : 'Channel Browser: Home';
    
      
        
    processChannelFiles(channelPath, false, false, req, res, function(error, callbackObject) {
        if(error) {
            console.error(error);
        }
        else {
            res.render('index', { title:       browserTitle, 
                                  channels:    callbackObject['channelNames'],
                                  videos:      callbackObject['fileNames'],
                                  channelPath: channelPath, 
                                  channelName: channelName ? channelName : "Home"
                              });
        }
    });
  // res.render('index', { title: 'Express' });
});



router.get('/video/:channel/:mode/:name/:lock?', function(req, res, next) {    
    
    const channelPath = req.params.channel;
    const channelName = channelPath == 'root' ? false : channelPath;
    const backPath    = channelPath == 'root' ? '/' : '/'+ channelPath;
    
    const mode =  ['loop', 'auto'].includes(req.params.mode) ? req.params.mode : 'loop';
    
    processChannelFiles(channelPath, req.params.name, false, req, res, function(error, callbackObject) {
        if(error) {
            console.error(error);
        }
        else {
//            const filePath     = channelPath == 'root' ? req.params.name : channelPath + '/'+ req.params.name;
            
            res.render('video', { filePath: callbackObject['currentPath'], 
                                  currentName: callbackObject['currentName'],                  
                                  prevFile: callbackObject['prevFile'],                  
                                  nextFile: callbackObject['nextFile'],                  
                                  backPath: backPath, 
                                  lock: req.params.lock,
                                  mode: mode, 
                                  channelPath: channelPath, 
                                  channelName: channelName ? channelName : "Home" 
                                });
        }
    });
});



router.get('/rvideo/:channel/:lock?', function(req, res, next) {

    const channelPath     = req.params.channel;
    const channelName     = channelPath == 'root' ? false : channelPath;
    const channelFilePath = channelName ? './public/Videos/' + channelName : './public/Videos/';
    const backPath        = channelPath == 'root' ? '/' : '/'+ channelPath;
    
    processChannelFiles(channelPath, false, true, req, res, function(error, callbackObject) {
        if(error) {
          console.error(error);
        }
        else {
            
          res.render('rvideo', { filePath: callbackObject['currentPath'], 
                                 currentName: callbackObject['currentName'],                  
                                 prevFile: callbackObject['prevFile'],                  
                                 nextFile: callbackObject['nextFile'],   
                                 backPath: backPath, 
                                 lock: req.params.lock,
                                 channelPath: channelPath, 
                                 channelName: channelName ? channelName : "Home" 
                    });
          
        }
    });

  
});



router.get('/thumbnailer/:channel', function(req, res, next) {
    const channelPath  = req.params.channel == undefined ? 'root' : req.params.channel;
    
    processChannelFiles(channelPath, false, false, req, res, function(error, callbackObject) {
//  fs.readdir('./public/Videos', function(error, files) {
        if(error) {
          console.error(error);
        }
        else {
          const filePaths = callbackObject['filePaths'];
          const fileNames = callbackObject['fileNames'];
          
//          console.log('CALLBACK', callbackObject);
            
          function convertNow(filePaths, fileNames, counter) {
            try {
              if (!fs.existsSync('./public/Thumbnails/' + filePaths[counter] + '.jpg')) {
                let command = new FfmpegCommand();
                
                const fullFilePath = './public/Videos/' + filePaths[counter];
                console.log('CONVERTING: ' + fullFilePath);
                
                command.input(fullFilePath)
                .screenshots({
                  timestamps: ['50%'],
                  filename: fileNames[counter] + '.jpg',
                  folder: './public/Thumbnails/',
                })
                .on('end', function() {
                  counter++;
                  if(counter < filePaths.length) {
                      convertNow(filePaths, fileNames, counter);
                  }
                });
              }
              else {
                counter++;
                if(counter < filePaths.length) {
                    convertNow(filePaths, fileNames, counter);
                }
              }
            } catch(error) {
              console.error(error)
            }
          }
    
          convertNow(filePaths, fileNames, 0);
        }
    }, true);
    res.redirect('/' + channelPath);
});

module.exports = router;
