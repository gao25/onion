exports.format = function(typeStr, date) {
  if (date) {
    var thisDate = new Date(date);
  } else {
    var thisDate = new Date();
  }
  var YY = thisDate.getFullYear();
  var Y = YY.toString().substr(2, 2);
  var M = 1 + thisDate.getMonth();
  var MM = M > 9 ? M : '0' + M;
  var D = thisDate.getDate();
  var DD = D > 9 ? D : '0' + D;
  var h = thisDate.getHours();
  var hh = h > 9 ? h : '0' + h;
  var m = thisDate.getMinutes();
  var mm = m > 9 ? m : '0' + m;
  var s = thisDate.getSeconds();
  var ss = s > 9 ? s : '0' + s;
  var formatStr = typeStr
    .replace(/YY/g, YY)
    .replace(/Y/g, Y)
    .replace(/MM/g, MM)
    .replace(/M/g, M)
    .replace(/DD/g, DD)
    .replace(/D/g, D)
    .replace(/hh/g, hh)
    .replace(/h/g, h)
    .replace(/mm/g, mm)
    .replace(/m/g, m)
    .replace(/ss/g, ss)
    .replace(/s/g, s);
  return formatStr;
};
exports.weekdays = function(week) {
  var valSplit = week.split('-W');
  var val_year = + valSplit[0];
  var val_Week = + valSplit[1];
  var firstday = new Date(val_year, 0, 1);
  var firstday_weekday = firstday.getDay();
  if (firstday_weekday < 5) {
    var firstweek_day = firstday.setDate(firstday.getDate() - firstday_weekday + 1);
  } else {
    var firstweek_day = firstday.setDate(firstday.getDate() + 8 - firstday_weekday);
  }
  var parse = firstweek_day + (val_Week - 1) * 7 * 24 * 3600 * 1000;
  var dataArray = [];
  for (var i=0; i<7; i++) {
    var dayParse = parse + i * 24 * 3600 * 1000;
    var dayText = this.format('YY-MM-DD', dayParse);
    dataArray.push(dayText);
  }
  return dataArray;
};
