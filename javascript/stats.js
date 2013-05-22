var counters = {
   'coin': 0,
   'enemy': 0,
   'pirate': 0,
   'wave': 0,
   friendly: 0,
}
var startMs = Date.now();
var $end = document.getElementById('km-end');

exports.count = function(type) {
   counters[type]++;
}

var isShown = false;
var show = function() {
   if (isShown) return;
   isShow = true;
   var duration = Date.now() - startMs
   var min = ((duration) / 1000 / 60) | 0;
   var secs = Math.round((duration) / 1000 % 60);
   min = (min+'').length < 2 ? '0' + min : min;
   secs = (secs+'').length < 2 ? '0' + secs : secs;
   counters['time'] = min + ':' + secs;
   console.log('counters is ', counters);
   for (var key in counters) {
      document.getElementById('km-end-' + key).textContent = counters[key];
   }
   $end.style.display = 'block';
}

window.victory = exports.victory = function() {
   document.getElementById('km-end-victory').style.display = 'block';
   show();
}

exports.defeat = function() {
   document.getElementById('km-end-defeat').style.display = 'block';
   show();
}