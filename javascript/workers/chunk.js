var world = require('../world');

var gamejs = require('gamejs');

gamejs.ready(function() {
   gamejs.onEvent(function() {
      var map = new world.Map();
      var chunk = map.getChunk([0, 0]);

      gamejs.worker.post({
         chunk: chunk.save()
      });

   });
})