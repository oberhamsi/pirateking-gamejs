var gamejs = require('gamejs');

exports.play = function(type) {
   sounds[type].play();
}

var types = ['gauntling',
   'splash0', 'splash1', 'splash2', 'splash3', 'splash4',
   'money', 'eruption', 'bomb', 'clock'];
var sounds = [];
exports.getPreloadAssets = function() {
   return types.map(function(t) {
      return './sounds/' + t + '.wav';
   });
}

exports.init = function() {
   types.forEach(function(t) {
      sounds[t] = new gamejs.mixer.Sound('./sounds/' + t + '.wav');
   });
   return;
}