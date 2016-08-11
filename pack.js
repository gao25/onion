var fs = require('fs'),
  compile = require('./compile');
global.fromPath = './template/';
global.toPath = './pack/';

// 判断发布文件夹是否存在
fs.exists(toPath, function (state) {
  if (!state) {
    fs.mkdirSync(toPath);
  }
  // 获取项目列表
  fs.readdir(fromPath, function (error, files) {
    if (error) {
      console.log('/* 项目列表获取失败 */');
      return false;
    }
    var publishList = [];
    for (var i=0; i<files.length; i++) {
      var stat = fs.statSync(fromPath + files[i]);
      if (stat.isDirectory() && files[i] != ".git") {
        publishList.push(files[i]);
      }
    }
    var question = '';
    if (publishList.length) {
      for (var i=0; i<publishList.length; i++) {
        question += '['+i+'] '+fromPath + publishList[i]+'\n';
      }
      question += '请选择要打包的项目：';
      compile.question(question, function(input){
        if (input) {
          var selectNumber = + input;
          if (isNaN(selectNumber) || selectNumber < 0 || selectNumber >= publishList.length) {
            console.log('/* 选择的项目不存在 */');
          } else {
            publishPath(publishList[selectNumber]);
          }
        }
      });
    } else {
      console.log('/* 无项目可打包 */');
      return false;
    }

    // 发布路径
    function publishPath(path){
      global.commonPath = __dirname + '/template/onion_common';
      global.hostPath = __dirname + '/template/' + path;
      // 获取到发布路径，开始分析路径
      compile.review(path, function(fileArray){
        if (fileArray) {
          if (fileArray.length) {
            fileDbFn(fileArray, function(pubfileArray){
              if (pubfileArray.length) {
                console.log('-- 有 '+pubfileArray.length+' 个文件需要重新打包 --');
                compile.publish(pubfileArray, 'pack');
              } else {
                console.log('-- 无文件需要重新打包 --');
              }
            });
          } else {
            console.log('/* 此项目无文件需要打包 */');
          }
        } else {
          console.log('/* 输入的文件或文件夹不存在 */');
        }
      });
    }
  });
});

var sqlite3 = require('sqlite3'),
  dateformat = require('./routes/dateformat'),
  timestamp = dateformat.format('YYMMDDhhmmss');
function fileDbFn(fileArray, callback){
  fs.exists(toPath + 'files.db', function (state) {
    var filesDb = new sqlite3.Database(toPath + 'files.db');
    if (!state) {
      // 创建 files 数据表
      var filesSql = 'CREATE TABLE files (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,'+
        'filepath, filename, fileurl, filetime, filesize, timestamp, state)';
      filesDb.run(filesSql, function (error){
        // 创建 links 数据表
        var linksSql = 'CREATE TABLE links (id integer PRIMARY KEY AUTOINCREMENT NOT NULL,'+
          'fileid, linktype, linkfileid, state)';
        filesDb.run(linksSql, function (error){
          fileDbFn(fileArray, callback);
        });
      });
      return false;
    }
    function saveData(){
      if (fileArray.length) {
        var file = fileArray.shift(),
          sql = 'select * from files where filepath="'+file['filepath']+'"';
        filesDb.get(sql, function (error, response) {
          if (response) {
            if (response['filetime'] != file['filetime'] || response['filesize'] != file['filesize']) {
              if (response['state'] == 'new' || response['state'] == 'update') {
                var saveSql = 'update files set filetime="'+file['filetime']+'", filesize="'+file['filesize']+'", timestamp="'+timestamp+'" where id='+response['id'];
              } else {
                var saveSql = 'update files set filetime="'+file['filetime']+'", filesize="'+file['filesize']+'", timestamp="'+timestamp+'", state="update" where id='+response['id'];
              }
            } else {
              saveData();
              return false;
            }
          } else {
            var fileurl = file['filepath'].replace('.juic', '.html')
              .replace('.styl', '.css'),
              saveSql = 'insert into files(filepath, filename, fileurl, filetime, filesize, timestamp, state) values(' +
                '"' + file['filepath'] + '",' +
                '"' + file['filename'] + '",' +
                '"' + fileurl + '",' +
                '"' + file['filetime'] + '",' +
                '"' + file['filesize'] + '",' +
                '"' + timestamp + '",' +
                '"new"' +
              ')';
          }
          console.log(saveSql);
          filesDb.run(saveSql, function (error) {
            if (error) {
              console.log('[error] '+file['filepath']+' 数据保存出错');
            }
            var sql = 'select id from files where filepath="'+file['filepath']+'"';
            filesDb.get(sql, function (error, response) {
              if (response) {
                savelinkData(response['id'], function(){
                  saveData();
                });
              } else {
                saveData();
              }
            });
          });
        });
      } else {
        // 获取有更新主文件
        var selectfileSql = 'select * from files where state="new" or state="update"';
        filesDb.all(selectfileSql, function (error, response) {
          if (error) {
            console.log('[error] 数据获取出错');
          } else {
            callback(response);
          }
        });
      }
    }
    saveData();

    // 顺带更新掉关联的文件
    function savelinkData(ids, saveback){
      var sql = 'select fileid from links where linkfileid in('+ids+') and state="on"';
      filesDb.all(sql, function (error, response) {
        if (!error && response.length) {
          var fileids = [];
          for (var i=0; i<response.length; i++) {
            fileids.push(response[i]['fileid']);
          }
          var selectSql = 'select id from files where id in('+fileids+') and state="publish"';
          filesDb.all(sql, function (error, response) {
            if (!error && response.length) {
              var updateFileids = [];
              for (var i=0; i<response.length; i++) {
                updateFileids.push(response[i]['fileid']);
              }
              var updateSql = 'update files set state="update", timestamp="'+timestamp+'" where id in('+updateFileids+')';
              filesDb.run(updateSql, function (error) {
                savelinkData(updateFileids, saveback);
              });
            } else {
              saveback();
            }
          });
        } else {
          saveback();
        }
      });
    }
  });
}

