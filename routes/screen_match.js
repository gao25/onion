exports.modfn = function(fileSource, callback) {
  var modRegExp = /\{\{\#mod[\s]+([a-zA-Z]{1}[a-z0-9]*?)[\s]*\([\s]*(\{[\s\S]*?\})?[\s]*\)[\s]*\}\}/gi,
    modRegExp2 = /\{\{\#mod[\s]+([a-zA-Z]{1}[a-z0-9]*?)[\s]*\([\s]*(\{[\s\S]*?\})?[\s]*\)[\s]*\}\}/i,
    modMatch = fileSource.match(modRegExp);
  if (modMatch) {
    var modArray = [];
    function modEach(){
      if (modMatch.length) {
        var newModMatch = modMatch.shift(),
          modExec = modRegExp2.exec(newModMatch),
          modName = modExec[1],
          modData = modExec[2],
          modPath = '/ui/'+modName+'/'+modName+'.mod';
        try {
          var modNode = require(templatePath + modPath);
        } catch(e) {
          var modNode = null;
        }
        if (modNode) {
          modArray.push(modPath);
          if (modData) {
            modData = JSON.parse(modData);
          } else {
            modData = {};
          }
          modNode.fn(modData, function(modSource){
            fileSource = fileSource.replace(newModMatch, modSource);
            modEach();
          });
        } else {
          modEach();
        }
      } else {
        callback(fileSource, modArray);
      }
    }
    modEach();
  } else {
    callback(fileSource);
  }
};

exports.apifn = function(fileSource, serverType, callback) {
  var fs = require('fs'),
    apiPath = hostPath + '/api/api.conf';
  fs.stat(apiPath, function (error, stats){
    if (error) {
      callback(fileSource);
    } else {
      fs.readFile(apiPath, 'utf8', function (error, dataSource){
        if (error) {
          callback(fileSource);
        } else {
          var sourceData = JSON.parse(dataSource);
          for (var key in sourceData) {
            var re = new RegExp('\\$\\{\\{'+key+'\\}\\}', 'g');
            fileSource = fileSource.replace(re, sourceData[key][serverType]);
          }
          callback(fileSource);
        }
      });
    }
  });
};
