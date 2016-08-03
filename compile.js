exports.question = function(output, input) {
  var readline = require('readline'),
    rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  rl.question(output, function (str) {
    rl.close();
    input(str);
  });
};

exports.review = function(path, callback) {
  var fs = require('fs'),
    dateformat = require('./routes/dateformat'),
    folderArray = [],
    fileArray = [],
    mkFolderArray = [];
  fs.exists(fromPath + path, function (state) {
    if (!state) {
      callback();
    } else {
      var stat = fs.statSync(fromPath + path);
      if (stat.isFile()) { // 如果是文件
        var filetime = dateformat.format('YY-MM-DD hh:mm:ss', stat.mtime),
          filesize = stat.size,
          filename = path.substr(path.lastIndexOf('/') + 1);
        fileArray.push({
          "filepath": path,
          "filename": filename,
          "filetime": filetime,
          "filesize": filesize
        });
        path = path.substr(0, path.lastIndexOf('/'));
        mkFolderArray = path.split('/');
        mkFolder();
      } else { // 如果是文件夹
        if (path.substr(-1) == '/') {
          path = path.substr(0,path.length-1);
        } 
        folderArray.push(path);
        mkFolderArray = path.split('/');
        mkFolder();
      }
    }
  });

  // 创建目录文件夹环境
  var mkFolderCurrent = toPath;
  function mkFolder(){
    if (mkFolderArray.length) {
      var folderName = mkFolderArray.shift();
      if (folderName) {
        mkFolderCurrent += folderName + '/';
        fs.exists(mkFolderCurrent, function(state){
          if (!state) {
            fs.mkdirSync(mkFolderCurrent);
          }
          mkFolder();
        });
      } else {
        mkFolder();
      }
    } else {
      getFileList();
    }
  }

  // 获取文件列表
  function getFileList(){
    if (folderArray.length) {
      var folderName = folderArray.pop(),
        fromFolderPath = fromPath + folderName,
        toFolderPath = toPath + folderName;
      fs.exists(toFolderPath, function(state){
        if (!state) {
          fs.mkdirSync(toFolderPath);
        }
        fs.readdir(fromFolderPath, function (error, files){
          if (error) {
            getFileList();
          } else {
            for (var i=0; i<files.length; i++) {
              var stat = fs.statSync(fromFolderPath + '/' + files[i]);
              if (stat.isFile()) {
                if (files[i] != ".DS_Store" && files[i] != ".gitignore" && files[i].substr(-5) != '.data') {
                  var filetime = dateformat.format('YY-MM-DD hh:mm:ss', stat.mtime),
                    filesize = stat.size,
                    filename = files[i];
                  fileArray.push({
                    "filepath": folderName + '/' + files[i],
                    "filename": filename,
                    "filetime": filetime,
                    "filesize": filesize
                  });
                }
              } else if (stat.isDirectory()) {
                if (files[i] != ".git") {
                  folderArray.push(folderName + '/' + files[i]);
                }
              }
            }
            getFileList();
          }
        });
      });
    } else {
      callback(fileArray);
    }
  }
};

exports.publish = function(fileArray, pack) {
  // pack == "pack" 表示打包

  var fs = require('fs'),
    publishIndex = 0,
    fileCount = fileArray.length;

  if (pack == 'pack') {
    var sqlite3 = require('sqlite3'),
      filesDb = new sqlite3.Database(toPath + 'files.db');
  } else {
    var dateformat = require('./routes/dateformat'),
      timestamp = dateformat.format('YYMMDDhhmmss');
  }

  function publishFile(){
    if (fileArray.length) {
      publishIndex ++;
      var popFile = fileArray.pop();
        filepath = popFile['filepath'],
        fromFilePath = fromPath + filepath,
        toFilePath = toPath + filepath,
        ext = filepath.substr(filepath.lastIndexOf('.')+1);
        
      var publishCallback = function(e){
        if (e) {
          console.log(publishIndex + '/' + fileCount + ' ...' + ' [publish] ... ' + filepath);
          if (pack == 'pack') {
            var sql = 'update files set state="publish" where id='+popFile['id'];
            filesDb.run(sql, function (error) {
              publishFile();
            });
          } else {
            publishFile();
          }
        } else {
          console.log(publishIndex + '/' + fileCount + ' ...' + ' [error] ... ' + filepath);
          publishFile();
        }
      }

      var publishCall = function(){
        if (filepath.indexOf('-min.') > 0 || filepath.indexOf('.min.') > 0) {
          copyFile['static'](fromFilePath, toFilePath, publishCallback);
        } else if (ext == 'juic' || ext == 'styl' || ext == 'css' || ext == 'js') {
          copyFile[ext](fromFilePath, toFilePath, function (state, linkArray) {
            if (state && pack == 'pack') {
              // 保存文件关联
              if (linkArray && linkArray.length) {
                savelinkfn(popFile['id'], linkArray, function(){
                  publishCallback(state);
                })
              } else {
                publishCallback(state);
              }
            } else {
              publishCallback(state);
            }
          });
        } else if (ext == 'png' || ext == 'jpg' || ext == 'jpge' || ext == 'gif') {
          copyFile['img'](fromFilePath, toFilePath, publishCallback);
        } else {
          copyFile['static'](fromFilePath, toFilePath, publishCallback);
        }
      }

      if (pack == 'pack') {
        // 清除文件关联
        var sql = 'update links set state = "off" where fileid=' + popFile['id'];
        filesDb.run(sql, function (error) {
          publishCall();
        });
      } else {
        publishCall();
      }
    } else {
      if (pack == 'pack') {
        console.log('-- 文件打包完成 --');
      } else {
        console.log('-- 文件发布完成 --');
      }
    }
  }

  var screenMatch = require('./routes/screen_match'),
    scriptMatch = require('./routes/script_match'),
    stylus = require('stylus'),
    gulp = require('gulp'),  
    minifyCss = require('gulp-minify-css'),
    uglifyJs = require('gulp-uglify'),
    imagemin = require('gulp-imagemin'),
    pngquant = require('imagemin-pngquant');
  var copyFile = {
    "juic": function(fromFilePath, toFilePath, callback){
      fs.readFile(fromFilePath, 'utf-8', function (error, source){
        if (error) {
          callback(false);
        } else {
          var linkArray = [];
          toFilePath = toFilePath.replace('.juic', '.html');
          screenMatch.modfn(source, function (source, modArray) {
            if (modArray && modArray.length) {
              for (var i=0; i<modArray.length; i++) {
                linkArray.push({
                  'linkfilePath': modArray[i],
                  'linktype': 'mod'
                });
              }
            }
            screenMatch.apifn(source, 'publish', function (source) {
              timestampfn(fromFilePath, source, function (source, timestampArray) {
                for (var i=0; i<timestampArray.length; i++) {
                  linkArray.push({
                    'linkfilePath': timestampArray[i],
                    'linktype': 'timestamp'
                  });
                }
                fs.writeFile(toFilePath, source, function (error) {
                  if (error) {
                    callback(false);
                  } else {
                    callback(true, linkArray);
                  }
                });
              });
            });
          });
        }
      });
    },
    "styl": function(fromFilePath, toFilePath, callback){
      fs.readFile(fromFilePath, 'utf-8', function (error, source){
        if (error) {
          callback(false);
        } else {
          var linkArray = [];
          toFilePath = toFilePath.replace('.styl', '.css');
          var stylusPaths = [
            commonPath,
            hostPath,
            fromFilePath.substr(0, fromFilePath.lastIndexOf('/') + 1)
          ];
          stylus(source).set('paths', stylusPaths)
          .render(function (err, source) {
            if (err) {
              callback(false);
            } else {
              timestampfn(fromFilePath, source, function(source, timestampArray){
                for (var i=0; i<timestampArray.length; i++) {
                  linkArray.push({
                    'linkfilePath': timestampArray[i],
                    'linktype': 'timestamp'
                  });
                }
                fs.writeFile(toFilePath, source, function (error) {
                  if (error) {
                    callback(false);
                  } else {
                    var savePath = toFilePath.substr(0, toFilePath.lastIndexOf('/'));
                    gulp.src(toFilePath)
                      .pipe(minifyCss())
                      .pipe(gulp.dest(savePath))
                      .on('end', function(){
                        callback(true, linkArray);
                      }).on('error', function(err) {
                        callback(false);
                      });
                  }
                });
              });
            }
          });
        }
      });
    },
    "css": function(fromFilePath, toFilePath, callback){   
      var savePath = toFilePath.substr(0, toFilePath.lastIndexOf('/'));
      gulp.src(fromFilePath)
        .pipe(minifyCss())
        .pipe(gulp.dest(savePath))
        .on('end', function(){
          callback(true);
        }).on('error', function(err) {
          callback(false);
        });
    },
    "js": function(fromFilePath, toFilePath, callback){
      fs.readFile(fromFilePath, 'utf-8', function (error, source){
        if (error) {
          callback(false);
        } else {
          var linkArray = [];
          scriptMatch.includefn(source, function(source){
            timestampfn(fromFilePath, source, function(source, timestampArray){
              for (var i=0; i<timestampArray.length; i++) {
                linkArray.push({
                  'linkfilePath': timestampArray[i],
                  'linktype': 'timestamp'
                });
              }
              fs.writeFile(toFilePath, source, function (error) {
                if (error) {
                  callback(false);
                } else {
                  var savePath = toFilePath.substr(0, toFilePath.lastIndexOf('/'));
                  gulp.src(toFilePath)
                    .pipe(uglifyJs())
                    .pipe(gulp.dest(savePath))
                    .on('end', function(){
                      callback(true, linkArray);
                    }).on('error', function(err) {
                      callback(false);
                    });
                }
              });
            });
          });
        }
      });
    },
    "img": function(fromFilePath, toFilePath, callback){
      var savePath = toFilePath.substr(0, toFilePath.lastIndexOf('/'));
      gulp.src(fromFilePath)
        .pipe(imagemin({
          progressive: true,
          svgoPlugins: [{removeViewBox: false}],
          use: [pngquant()]
        }))
        .pipe(gulp.dest(savePath))
        .on('end', function(){
          callback(true);
        }).on('error', function(err) {
          callback(false);
        });
    },
    "static": function(fromFilePath, toFilePath, callback){
      // 通过文件流复制文件
      var readable = fs.createReadStream(fromFilePath),
        writable = fs.createWriteStream(toFilePath);
      readable.pipe(writable);
      callback(true);
    }
  };

  
  // 插入时间戳
  var url = require('url');
  function timestampfn(fromFilePath, fileSource, callback){
    var tsRegExp = /[\'|\"|\(]([^\'\"\(]*?)\{\{\#timestamp\}\}([^\'\"\(]*?)[\'|\"|\)]/gi,
      tsMatch = fileSource.match(tsRegExp),
      timestampArray = [];
    if (tsMatch) {
      function eachTs(){
        if (tsMatch.length) {
          var thisTsMath = tsMatch.shift();
          thisTsMath = thisTsMath.substr(1, thisTsMath.length-2);
          if (pack == 'pack') {
            var fileurl = thisTsMath.split('?')[0];
            if (fileurl.substr(0,1) == '/') {
              fileurl = fromFilePath.replace('./template/', '').split('/')[0] + fileurl;
            } else {
              fileurl = url.resolve(fromFilePath, fileurl).replace('template/', '');
            }
            var sql = 'select id,filepath,timestamp from files where fileurl="'+fileurl+'"';
            filesDb.get(sql, function (error, response) {
              if (response) {
                var newTsMath = thisTsMath.replace('{{#timestamp}}' ,response['timestamp']);
                timestampArray.push(response['filepath']);
              } else {
                var newTsMath = thisTsMath.replace('{{#timestamp}}' ,'undefined');
              }
              fileSource = fileSource.replace(thisTsMath, newTsMath);
              eachTs();
            });
          } else {
            var newTsMath = thisTsMath.replace('{{#timestamp}}' ,timestamp);
            fileSource = fileSource.replace(thisTsMath, newTsMath);
            eachTs();
          }
        } else {
          callback(fileSource, timestampArray);
        }
      }
      eachTs();
    } else {
      callback(fileSource, timestampArray);
    }
  }
  // 保存文件关联
  function savelinkfn(fileid, linkArray, callback){
    function eachSavelinkfn(){
      if (linkArray.length) {
        var linkfile = linkArray.pop(),
          linkfilePath = linkfile['linkfilePath'],
          linktype = linkfile['linktype'];
        var sql = 'select id from files where filepath="'+linkfilePath+'"';
        filesDb.get(sql, function (error, response) {
          if (response) {
            var linkfileid = response['id'],
              sql = 'select id from links where fileid='+fileid+' and linkfileid='+linkfileid;
            filesDb.get(sql, function (error, response) {
              if (response) {
                var sql = 'update links set state="on" where id='+response['id'];
              } else {
                var sql = 'insert into links(fileid, linktype, linkfileid, state) values('+fileid+',"'+linktype+'",'+linkfileid+',"on")';
              }
              filesDb.run(sql, function (error) {
                eachSavelinkfn();
              });
            });
          } else {
            eachSavelinkfn();
          }
        });
      } else {
        callback();
      }
    }
    eachSavelinkfn();
  }

  publishFile();
};

