// 定义 common 路径
global.commonPath = __dirname + '/template/onion_common';

// 定义对话交互
var readline = require('readline'),
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

var fs = require('fs'),
  dateformat = require('./routes/dateformat'),
  folderArray = [],
  fileArray = [],
  fromPath = './template/',
  toPath = './publish/',
  mkFolderArray = [],
  dirname = '';

var sqlite3 = require('sqlite3'),
  fileDb = new sqlite3.Database('./publish/files.db');

function question(){
  var sql = 'select * from pathlog order by logtime desc';
  fileDb.all(sql, function (error, response){
    if (error) {
      if (error.toString().indexOf('no such table: pathlog') > 0) {
        var pathlogSql = 'CREATE TABLE pathlog (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,'+
          'path, logtime)';
        fileDb.run(pathlogSql, function (error){
          //question();
        });
      }
    } else {
      var question = '[0] 手动输入要发布的文件或文件夹路径\n';
      if (response.length) {
        // 
      }
    }
  });
}
//question();


rl.question('请输入要发布的文件或文件夹路径：' + fromPath, function (path) {
  rl.close();
  if (path) {
    path = path.replace(/(^\s*)|(\s*$)/g, '')
      .replace(/\\/g, '/');
    if (path) {
      fs.exists(fromPath + path, function(state){
        if (!state) {
          console.log('输入的文件或文件夹不存在！');
        } else {


          // 创建 发布记录 表
          
            


          dirname = path.substr(0, (path+'/').indexOf('/'));
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
            folderArray.push(path);
            mkFolderArray = path.split('/');
            mkFolder();
          }
        }
      });
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
                  filesize = stat.size;
                fileArray.push({
                  "filepath": folderName + '/' + files[i],
                  "filename": files[i],
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
    console.log('文件列表获取成功...');
    saveFileDb();
  }
}

var publishList = [];
function saveFileDb(){
  if (fileArray.length) {
    var file = fileArray.pop(),
      sql = 'select * from files where filepath = "'+file['filepath']+'"';
    fileDb.get(sql, function (error, response){
      if (error) {
        if (error.toString().indexOf('no such table: files') > 0) {
          // 创建 files 表
          var filesSql = 'CREATE TABLE files (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,'+
            'filepath, filename, filetime, filesize, state)';
          fileDb.run(filesSql, function (error){
            //console.log('数据库创建成功！');
            fileArray.push(file);
            saveFileDb();
          });
        } else {
          saveFileDb();
        }
      } else {
        if (response) {
          if (response['filetime'] != file['filetime'] || response['filesize'] != file['filesize']) {
            var saveSql = 'update files set '+
              'filetime="'+file['filetime']+'"'+
              ',filesize="'+file['filesize']+'"'+
              ',state="update"'+
              ' where id='+response['id'];
            fileDb.run(saveSql, function(){
              saveFileDb();
            });
          } else {
            saveFileDb();
          }
        } else {
          var saveSql = 'insert into files(filepath,filename,filetime,filesize,state) values('+
            '"'+file['filepath']+'"'+
            ',"'+file['filename']+'"'+
            ',"'+file['filetime']+'"'+
            ',"'+file['filesize']+'"'+
            ',"new"'+
          ')';
          fileDb.run(saveSql, function(){
            saveFileDb();
          });
        }
      }
    });
  } else {
    console.log('文件列表存储成功...');
    var publishSql = 'select * from files where state <> "publish" order by filepath';
    fileDb.all(publishSql, function (error, response){
      if (error) {
        console.log(error);
      } else {
        if (response.length) {
          publishList = response;
          console.log('-- 开始发布文件(待发布:'+publishList.length+') --');
          publishFile();
        } else {
          console.log('无文件需要发布！');
        }
      }
    });
  }
}

function publishFile(){
  if (publishList.length) {
    var file = publishList.pop(),
      fromFilePath = fromPath + file['filepath'],
      toFilePath = toPath + file['filepath'],
      ext = file['filename'].substr(file['filename'].lastIndexOf('.')+1);
      
    var publishCallback = function(e){
      if (e) {
        console.log('[' + file['state'] + '] ... ' + file['filepath']);
        if (ext == 'juic' || ext == 'styl' || ext == 'js') {
          // 无法判断关联的模块或组件是否有更新
          var saveSql = 'update files set state="update" where id='+file['id'];
        } else {
          var saveSql = 'update files set state="publish" where id='+file['id'];
        }

        fileDb.run(saveSql, function(){
          publishFile();
        });
      } else {
        console.log('[error] ... ' + file['filepath']);
        publishFile();
      }
    }

    if (file['filename'].indexOf('-min.') > 0 || file['filename'].indexOf('.min.') > 0) {
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
          fs.writeFile(toFilePath, source, function (error) {
            if (error) {
              callback(false);
            } else {
              callback(true);
            }
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
          __dirname + '/template/'+dirname,
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

