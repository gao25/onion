exports.fn = function(req, res, pathname) {
  var fs = require('fs'),
    filePath = hostPath + pathname;
  fs.stat(filePath, function (error, stats){
    if (error) {
      filePath = hostPath + pathname.replace('.css', '.styl');
      fs.stat(filePath, function (error, stats){
        if (error) {
          res.writeHead(200, {'Content-Type': 'text/css'});
          res.end('{ReadFile Error: '+filePath+'}');
        } else {
          var stylus = require('stylus'),
            stylusPaths = [
              hostPath,
              filePath.substr(0, filePath.lastIndexOf('/') + 1)
            ];
          fs.readFile(filePath, 'utf8', function (error, stylSource){
            if (error) {
              res.end('{ReadFile Error: '+filePath+'}');
            } else {
              stylus(stylSource)
                .set('paths', stylusPaths)
                .render(function(err, source) {
                  res.writeHead(200, {'Content-Type': 'text/css'});
                  if (err) {
                    res.end('Stylus Error:\n'+err);
                  } else {
                    res.end(source);
                  }
                });
            }
          });
        }
      });
    } else {
      fs.readFile(filePath, 'utf8', function (error, source){
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.end(source);
      });
    }
  });
};