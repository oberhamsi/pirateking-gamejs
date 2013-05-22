var gamejs = require('gamejs');
var Animation = require('./animation').Animation;
var $v = require('gamejs/utils/vectors');

var Coin = exports.Coin = function(pos) {
   Coin.superConstructor.apply(this, arguments);

   this.radius = 32;
   this.explosion = null;
      this.animation = new Animation({
         frameMs: 100,
         spriteSheet: {
            image: './images/coins.png',
            rows: 1,
            cols: 6,
            directions: {
               n: {
                  animation: 0,
               }
            }
         }
      });
   this.animation.setDirection('n');
   this.rect = new gamejs.Rect(pos, this.animation.image.getSize())
   return this;
}
gamejs.utils.objects.extend(Coin, gamejs.sprite.Sprite);

Coin.prototype.draw = function(display, viewRect) {
   display.blit(
      this.animation.image,
      $v.subtract(
         $v.subtract(this.rect.topleft, $v.multiply(this.animation.image.getSize(),0.6)),
         viewRect.topleft
      )
   );
   return;
}

Coin.prototype.update = function(msDuration) {
   this.animation.update(msDuration)
}


