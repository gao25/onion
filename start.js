var process = require('child_process');
function nodeStart(nodename, callback){
  process.exec('forever stop start/'+nodename[0], function (error, stdout, stderr) {
    process.exec('forever start start/'+nodename[0], function (error, stdout, stderr) {
      if (error) {
        console.log('error：' + error);
      } else {
        console.log('node '+nodename[0]+' 启动成功，端口：'+nodename[1]);
      }
      if (callback) callback();
    });
  });
}

var nodeList = [
  ['action.js', '6801'],
  ['system.js', '6802'],
  ['project.js', '6803'],
  ['static.js', '6804'],
  ['orange.js', '6880']
];

function eachNode(){
  if (nodeList.length) {
    var nodeThis = nodeList.pop();
    nodeStart(nodeThis, eachNode);
  }
}
eachNode();
