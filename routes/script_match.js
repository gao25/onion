exports.includefn = function(fileSource, callback) {
  var includeRegExp = /\{\{\#include[\s]*\((.*?)\)[\s]*\}\}/gi,
    includeRegExp2 = /\{\{\#include[\s]*\((.*?)\)[\s]*\}\}/i,
    includeMatch = fileSource.match(includeRegExp);
  if (includeMatch) {
    var fs = require('fs');
    function includeEach(){
      if (includeMatch.length) {
        var newIncludeMatch = includeMatch.shift(),
          includeExec = includeRegExp2.exec(newIncludeMatch),
          includeList = includeExec[1],
          includeSource = '';
        if (includeList) {
          var includeListArray = includeList.split(',');
          for (var i=0; i<includeListArray.length; i++) {
            var includeFile = includeListArray[i].replace(/(^\s*)|(\s*$)/g, '');
            try{
              var includeFileSource = fs.readFileSync(commonPath + '/script/' + includeFile, 'utf-8');
            } catch (e) {
              var includeFileSource = '// '+e;
            }
            includeSource += includeFileSource + '\n';
          }
        }
        fileSource = fileSource.replace(newIncludeMatch, includeSource);
        includeEach();       
      } else {
        callback(fileSource);
      }
    }
    includeEach();
  } else {
    callback(fileSource);
  }
};

