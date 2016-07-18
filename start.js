var process = require('child_process');
function nodeStart(nodename, callback){
  process.exec('forever stop '+nodename[0], function (error, stdout, stderr) {
    process.exec('forever start '+nodename[0], function (error, stdout, stderr) {
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
  ['xinhuamm.js', '8601'],
  ['xinhuaapp.js', '8602']
];

function eachNode(){
  if (nodeList.length) {
    var nodeThis = nodeList.pop();
    nodeStart(nodeThis, eachNode);
  }
}
eachNode();
