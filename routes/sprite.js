exports.fn = function (req, res, pathname, ext) {
  var fs = require('fs'),
    spritePath = pathname.substr(0, pathname.lastIndexOf('/')),
    spriteName = pathname.substr(pathname.lastIndexOf('/') + 1).replace('.sprite', '');
  fs.exists(hostPath + spritePath + '/' + spriteName, function (state) {
    if (!state) {
      res.writeHead(200, {'Content-Type': 'text/css'});
      res.end('<Wrong src>');
      return false;
    }
    var sprity = require('sprity');
    sprity.create({
      src: hostPath + spritePath + '/' + spriteName + '/*.{png,jpg}',
      out: hostPath + spritePath,
      name: spriteName,
      style: spriteName + '.styl',
      cssPath: spritePath,
      processor: 'css',
      prefix: 'sp-' + spriteName,
      margin: 0
    }, function (error) {
      if (error) {
        res.writeHead(200, {'Content-Type': 'text/css'});
        res.end('<Sprite Error>\n'+error);
        return false;
      }
      fs.readFile(hostPath + spritePath + '/' + spriteName + '.styl', 'utf8', function (error, source) {
        res.writeHead(200, {'Content-Type': 'text/css'});
        if (error) {
          res.end('{ReadFile Error: '+pathname+'}');
        } else {
          source = source.replace('/' + spriteName + '.png', '/' + spriteName + '.png?_t=' + new Date().getTime());
          fs.writeFile(hostPath + spritePath + '/' + spriteName + '.styl', source, 'utf8', function (error) {
            if (error) {
              res.end('{WriteFile Error: '+pathname+'}');
            } else {
              res.end(source);
            }
          }); 
        }
      });
    });
  });
};
