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
            screenMatch.apifn(source, 'local', function(source){
              // 设置时间戳
              var dateformat = require('./dateformat'),
                timestamp = dateformat.format('YYMMDDhhmmss');
              source = source.replace(/\{\{\#timestamp\}\}/gi, timestamp);
              // 获取模拟数据
              var fileDataPath = hostPath + pathname.replace('.html', '.data');
              fs.stat(fileDataPath, function (error, stats){
                var juicer = require('juicer');
                juicer.set({
                  'tag::operationOpen': '{{@',
                  'tag::operationClose': '}}',
                  'tag::interpolateOpen': '${{',
                  'tag::interpolateClose': '}}',
                  'tag::noneencodeOpen': '$${{',
                  'tag::noneencodeClose': '}}',
                  'tag::commentOpen': '{{#',
                  'tag::commentClose': '}}',
                  'strip': false
                });
                var sourceData = {};
                if (error) {
                  // 输出
                  res.writeHead(200, {'Content-Type': 'text/html'});
                  source = juicer(source, sourceData);
                  res.end(source);
                } else {
                  fs.readFile(fileDataPath, 'utf8', function (error, dataSource){
                    if (error) {
                      // nonthing
                    } else {
                      // 数据写入页面
                      sourceData = JSON.parse(dataSource);
                    }
                    source = juicer(source, sourceData);
                    // 输出
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.end(source);
                  });
                }
              });
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