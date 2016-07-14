exports.fn = function(req, res, pathname, ext) {
  // 解析分辨路径
  var fs = require('fs'),
    filePath = hostPath + pathname;

  fs.stat(filePath, function(err, stats){
    if (err) {
      var juicPath = hostPath + pathname.replace('.html', '.juic');
      fs.readFile(juicPath, 'utf-8', function(err, source){
        if (err) {
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.end('{ERROR:404:' + pathname + '}');
        } else {
          var screenMatch = require('./screen_match');
          // mod 模块
          screenMatch.modfn(source, function(source){
            var fileDataPath = hostPath + pathname.replace('.html', '.data');
            // 模拟数据
            fs.stat(fileDataPath, function (error, stats){
              if (error) {
                // 输出
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(source);
              } else {
                fs.readFile(fileDataPath, 'utf8', function (error, dataSource){
                  if (error) {
                    // nonthing
                  } else {
                    // 数据写入页面
                    var sourceData = JSON.parse(dataSource),
                      juicer = require('juicer');
                    juicer.set('strip', false);
                    source = juicer(source, sourceData);
                  }
                  // 输出
                  res.writeHead(200, {'Content-Type': 'text/html'});
                  res.end(source);
                });
              }
            });
          });
        }
      });
    } else {
      fs.readFile(filePath, 'utf-8', function(err, source){
        if (err) {
          res.writeHead(404, {'Content-Type': 'text/html'});
          res.end('{ERROR:404:' + pathname + '}');
        } else {
          res.writeHead(200, {'Content-Type': 'text/html'});
          res.end(source);
        }
      });
    }
  });
};