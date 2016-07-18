exports.modfn = function(fileSource, callback) {
  var modRegExp = /\{\{\#mod[\s]+([a-zA-Z]{1}[a-z0-9]*?)[\s]*\([\s]*(\{[\s\S]*?\})?[\s]*\)[\s]*\}\}/gi,
    modRegExp2 = /\{\{\#mod[\s]+([a-zA-Z]{1}[a-z0-9]*?)[\s]*\([\s]*(\{[\s\S]*?\})?[\s]*\)[\s]*\}\}/i,
    modMatch = fileSource.match(modRegExp);
  if (modMatch) {
    function modEach(){
      if (modMatch.length) {
        var newModMatch = modMatch.shift(),
          modExec = modRegExp2.exec(newModMatch),
          modName = modExec[1],
          modData = modExec[2];
        try {
          var modNode = require(templatePath + '/ui/'+modName+'/'+modName+'.mod');
        } catch(e) {
          var modNode = null;
        }
        if (modNode) {
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
        callback(fileSource);
      }
    }
    modEach();
  } else {
    callback(fileSource);
  }
};
