var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');

var ViewPort = exports.ViewPort = function(config) {

   var animation = {
      direction: null,
      countdown: 0,
      active: false
   }
   var fogBlitCountdown = ViewPort.FOG_COUNTDOWN;
   this.update = function(msDuration, playerPos) {

      fogBlitCountdown -= msDuration;
      if (fogBlitCountdown < 0) {
         this.fogOfWar.blit(
            lightCone,
            $v.subtract(playerPos, $v.divide(lightCone.getSize(),2)),
            [0,0],
            'destination-out'
         );
         fogBlitCountdown = ViewPort.FOG_COUNTDOWN;
      }

      if (animation.active == false &&
         $v.distance(playerPos, this.rect.center) > 100
      ) {
         animation.direction = $v.unit($v.subtract(playerPos, this.rect.center));
         animation.countdown = 1200;
         animation.active = true;
         return;
      } else if (animation.active === true) {
         animation.countdown -= msDuration;
         var delta = $v.multiply(animation.direction, (msDuration/1000) * 130);
         this.rect.center = $v.add(this.rect.center, delta)
         if (animation.countdown <= 0) {
            animation.active = false;
         }
         if (this.rect.left < 0) this.rect.left = 0;
         if (this.rect.top < 0) this.rect.top = 0;
         if (this.rect.right > config.mapSize[0]) this.rect.right = config.mapSize[0];
         if (this.rect.bottom > config.mapSize[1]) this.rect.bottom = config.mapSize[1];
      }
   }

   this.draw = function(display) {
      display.blit(this.fogOfWar, $v.multiply(this.rect.topleft, -1));
   }

   this.rect = new gamejs.Rect([DISPLAY_DIMS[0]/2,DISPLAY_DIMS[1]/2], DISPLAY_DIMS);
   this.fogOfWar = new gamejs.Surface(config.mapSize);
   this.fogOfWar.fill('black');
   var lightCone = gamejs.image.load('./images/lightcone.png');
   return this;
}

ViewPort.FOG_COUNTDOWN = 200;
