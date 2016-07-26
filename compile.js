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

exports.publish = function(fileArray) {
  var fs = require('fs'),
    publishIndex = 0,
    fileCount = fileArray.length;
  function publishFile(){
    if (fileArray.length) {
      publishIndex ++;
      var filepath = fileArray.pop()['filepath'],
        fromFilePath = fromPath + filepath,
        toFilePath = toPath + filepath,
        ext = filepath.substr(filepath.lastIndexOf('.')+1);
        
      var publishCallback = function(e){
        if (e) {
          console.log(publishIndex + '/' + fileCount + ' ...' + ' [publish] ... ' + filepath);
          publishFile();
        } else {
          console.log(publishIndex + '/' + fileCount + ' ...' + ' [error] ... ' + filepath);
          publishFile();
        }
      }

      if (filepath.indexOf('-min.') > 0 || filepath.indexOf('.min.') > 0) {
        copyFile['static'](fromFilePath, toFilePath, publishCallback);
      } else if (ext == 'juic' || ext == 'styl' || ext == 'css' || ext == 'js') {
        copyFile[ext](fromFilePath, toFilePath, publishCallback);
      } else if (ext == 'png' || ext == 'jpg' || ext == 'gif') {
        copyFile['img'](fromFilePath, toFilePath, publishCallback);
      } else {
        copyFile['static'](fromFilePath, toFilePath, publishCallback);
      }
    } else {
      console.log('-- 文件发布完成 --');
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
          toFilePath = toFilePath.replace('.juic', '.html');
          screenMatch.modfn(source, function(source){
            screenMatch.apifn(source, 'publish', function(source){
              fs.writeFile(toFilePath, source, function (error) {
                if (error) {
                  callback(false);
                } else {
                  callback(true);
                }
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
              fs.writeFile(toFilePath, source, function (error) {
                if (error) {
                  callback(false);
                } else {
                  var savePath = toFilePath.substr(0, toFilePath.lastIndexOf('/'));
                  gulp.src(toFilePath)
                    .pipe(minifyCss())
                    .pipe(gulp.dest(savePath))
                    .on('end', function(){
                      callback(true);
                    }).on('error', function(err) {
                      callback(false);
                    });
                }
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
          toFilePath = toFilePath.replace('.juic', '.html');
          scriptMatch.includefn(source, function(source){
            fs.writeFile(toFilePath, source, function (error) {
              if (error) {
                callback(false);
              } else {
                var savePath = toFilePath.substr(0, toFilePath.lastIndexOf('/'));
                gulp.src(toFilePath)
                  .pipe(uglifyJs())
                  .pipe(gulp.dest(savePath))
                  .on('end', function(){
                    callback(true);
                  }).on('error', function(err) {
                    callback(false);
                  });
              }
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

  publishFile();
};