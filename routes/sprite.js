exports.fn = function (req, res, pathname, ext) {
  var sprity = require('sprity'),
    spritePath = pathname.substr(0, pathname.lastIndexOf('/')),
    spriteName = pathname.substr(pathname.lastIndexOf('/') + 1).replace('.sprite', '');
  sprity.create({
    src: hostPath + spritePath + '/' + spriteName + '/*.{png,jpg}',
    out: hostPath + spritePath,
    name: spriteName,
    style: spriteName + '.styl',
    cssPath: spritePath,
    processor: 'css',
    prefix: 'sp-' + spriteName,
    margin: 0
  }, function () {
    var fs = require('fs');
    fs.readFile(hostPath + spritePath + '/' + spriteName + '.styl', 'utf8', function (error, source) {
      res.writeHead(200, {'Content-Type': 'text/css'});
      if (error) {
        res.end('{ReadFile Error: '+pathname+'}');
      } else {
        source = source.replace('/' + spriteName + '.png', '/' + spriteName + '.png?t=' + new Date().getTime());
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
};
