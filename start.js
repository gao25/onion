// 配置
var nodeList = [
  ['onion_action', '6801'],
  ['onion_system', '6802'],
  ['onion_project', '6803'],
  ['static', '6804'],
  ['demo', '6805'],
  ['test', '6870'],
  ['live-test', '6871']
];

var fs = require('fs'),
  process = require('child_process');
function nodeStart(nodename, callback){
  process.exec('forever stop start/'+nodename[0]+'.js', function (error, stdout, stderr) {
    process.exec('forever start start/'+nodename[0]+'.js', function (error, stdout, stderr) {
      if (error) {
        console.log('error：' + error);
      } else {
        console.log('node '+nodename[0]+' 启动成功，端口：'+nodename[1]);
      }
      if (callback) callback();
    });
  });
}

function eachNode(){
  if (nodeList.length) {
    var nodeThis = nodeList.pop();
    fs.exists('./start/'+nodeThis[0]+'.js', function (state) {
      if (!state) {
        var fileText = 'var onion = require("../onion");\nonion.fn("'+nodeThis[0]+'", "'+nodeThis[1]+'");';
        fs.writeFile('./start/'+nodeThis[0]+'.js', fileText, 'utf8', function(){
          nodeStart(nodeThis, eachNode);
        });
      } else {
        nodeStart(nodeThis, eachNode);
      }
    });
  }
}
// 创建 start template 文件夹
fs.exists('./start', function (state) {
  if (!state) {
    fs.mkdirSync('./start');
  }
  fs.exists('./template', function (state) {
    if (!state) {
      fs.mkdirSync('./template');
    }
    eachNode();
  });
});
