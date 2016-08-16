var fs = require('fs'),
  compile = require('./compile');
global.fromPath = './template/';
global.toPath = './publish/';

// 判断发布文件夹是否存在
fs.exists(toPath, function (state) {
  if (!state) {
    fs.mkdirSync(toPath);
  }
  // 获取最近发布列表
  var publishList = [];
  fs.readFile(toPath+'publish.list', 'utf8', function (error, list) {
    if (!error && list) {
      publishList = list.split(',');
    }
    var question1 = '',
      question2 = '请输入要发布的文件或文件夹路径：'+fromPath;
    if (publishList.length) {
      for (var i=0; i<publishList.length; i++) {
        question1 += '['+i+'] '+fromPath + publishList[i]+'\n';
      }
      question1 += '请选择路径，或敲回车输入其它路径：';
      compile.question(question1, function(input){
        if (input) {
          var selectNumber = + input;
          if (isNaN(selectNumber) || selectNumber < 0 || selectNumber >= publishList.length) {
            question2Fn();
          } else {
            publishPath(publishList[selectNumber]);
          }
        } else {
          question2Fn();
        }
      });
    } else {
      question2Fn();
    }
    function question2Fn(){
      compile.question(question2, function(input){
        var path = input.replace(/(^\s*)|(\s*$)/g, '')
          .replace(/\\/g, '/');
        if (path) {
          publishPath(path);
        }
      });
    }

    // 发布路径
    function publishPath(path){
      global.commonPath = __dirname + '/template/onion_common';
      global.hostPath = __dirname + '/template/' + path.substr(0, (path+'/').indexOf('/'));
      // 获取到发布路径，开始分析路径
      compile.review(path, function(fileArray){
        if (fileArray) {
          // 存储输入的路径
          var newPublishList = [],
            maxI = 1;
          newPublishList.push(path);
          for (var i=0; i<publishList.length; i++) {
            if (maxI < 10 && publishList[i] != path) {
              maxI++;
              newPublishList.push(publishList[i]);
            }
          }
          fs.writeFile(toPath+'publish.list', newPublishList.join(','), 'utf8', function(){
            if (fileArray.length) {
              console.log('-- 文件获取成功，'+ fileArray.length +'个文件待发布 --')
              // 发布获取的文件列表
              compile.publish(fileArray);
            } else {
              console.log('/* 无文件需要发布 */');
            }
          });
        } else {
          console.log('/* 输入的文件或文件夹不存在 */');
          question2Fn();
        }
      });
    }
  });
});
