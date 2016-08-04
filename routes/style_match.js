exports.fn = function (pathname, callback) {
  var fs = require('fs'),
    filePath = hostPath + pathname;
  fs.stat(filePath, function (error, stats) {
    if (error) {
      filePath = hostPath + pathname.replace('.css', '.styl');
      fs.stat(filePath, function (error, stats){
        if (error) {
          callback('{ReadFile Error: '+filePath+'}');
        } else {
          fs.readFile(filePath, 'utf8', function (error, stylSource){
            if (error) {
              callback('{ReadFile Error: '+filePath+'}');
            } else {
              // stylus
              var stylus = require('stylus'),
                stylusPaths = [
                  commonPath,
                  hostPath,
                  filePath.substr(0, filePath.lastIndexOf('/') + 1)
                ];
              stylus(stylSource)
                .set('paths', stylusPaths)
                .render(function(err, source) {
                  if (err) {
                    callback('Stylus Error:\n'+err);
                  } else {
                    // autoprefixer
                    var postcss = require('postcss'),
                      autoprefixer = require('autoprefixer');
                    postcss([autoprefixer]).process(source).then(function (result) {
                      var source = '';
                      result.warnings().forEach(function (warn) {
                        source += '/* ' + warn.toString() + ' */\n';
                      });
                      source += result.css;
                      callback(source);
                    });                    
                  }
                });
            }
          });
        }
      });
    } else {
      fs.readFile(filePath, 'utf8', function (error, source) {
        if (error) {
          callback('{ReadFile Error: '+filePath+'}');
        } else {
          callback(source);
        }
      });
    }
  });
};

