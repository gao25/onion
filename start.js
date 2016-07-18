var fs = require('fs'),
  nodeModules = ['sqlite3', 'juicer', 'stylus', 'gulp', 'gulp-minify-css', 'gulp-uglify', 'gulp-imagemin', 'imagemin-pngquant'],
  nodeModulesState = true;

fs.exists('./node_modules', function (state) {
  if (state) {
    hasModules();
  } else {
    nodeModulesState = false;
    console.log('请先安装依赖模块：');
    for (var i=0; i<nodeModules.length; i++) {
      console.log('npm install '+nodeModules[i]);
    }
  }
});

function hasModules(){
  if (nodeModules.length) {
    var thisModule = nodeModules.shift();
    fs.exists('./node_modules/'+thisModule, function (state) {
      if (!state) {
        if (nodeModulesState) {
          console.log('请先安装依赖模块：');
          nodeModulesState = false;
        }
        console.log('npm install '+thisModule);
      }
      hasModules();
    });
  } else {
    if (nodeModulesState) eachNode();
  }
}

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
  ['xinhuamm.js', '6801'],
  ['xinhuaapp.js', '6802']
];

function eachNode(){
  if (nodeList.length) {
    var nodeThis = nodeList.pop();
    nodeStart(nodeThis, eachNode);
  }
}
