var Alea = require('./prng/alea').Alea;

var alea = null;

var random = exports.random = function() {
   return alea();
}

exports.rand = function(min, max) {
   return min + (random() * (max-min));
}

var init = exports.init = function(seed) {
   alea = new Alea(seed || Date.now());
}

init();