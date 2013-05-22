var gamejs = require('gamejs');

/**
 * Director
 */
exports.Director = function (dimensions) {
   var onAir = false;
   var activeScene = null;

   this.draw = function(display) {
      if (!onAir || !activeScene) return;

      activeScene.draw(display);
   }

   this.update = function(msDuration) {
      if (!onAir || !activeScene) return;

      if (typeof activeScene.update === 'function') {
         activeScene.update(msDuration);
      }
   }

   this.handle = function(event) {
      if (!onAir || !activeScene) return;

      if (typeof activeScene.handleEvent === 'function') {
         activeScene.handleEvent(event);
      }
   }

   this.start = function(scene) {
      this.replaceScene(scene);
   };

   this.replaceScene = function(scene) {
      activeScene = scene;
   };

   this.getScene = function() {
      return activeScene;
   };

   this.setOffAir = function() {
      onAir = false;
   }
   this.setOnAir = function() {
      onAir = true;
   }

   this.isOnAir = function() {
      return onAir;
   }

   return this;
};
