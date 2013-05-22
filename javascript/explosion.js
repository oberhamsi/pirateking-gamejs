var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');
var particles = require('./particles');
var prng = require('./prng');

var Explosion = exports.Explosion = function(image, pos, direction) {
   Explosion.superConstructor.apply(this, []);

   this.age = 0;

   // split big image into parts
   this.parts = [];
   var size = image.getSize();
   for (var i=0; i<size[0]; ) {
      w = prng.rand(Explosion.MIN_SIZE, Explosion.MAX_SIZE);
      for (var j=0; j<size[1]; ) {
         h = prng.rand(Explosion.MIN_SIZE, Explosion.MAX_SIZE);
         var s = new gamejs.Surface(w, h);
         s.blit(image, new gamejs.Rect(0,0, w, h), new gamejs.Rect(i, j, w, h));
         this.parts.push({
            rect: new gamejs.Rect($v.add(pos, [i, j]), [w, h]),
            image: s,
            v: $v.unit($v.add(direction, [prng.rand(-0.5,0.5), prng.rand(-0.5,0.5)]))
         });
         j += h;
      }
      i += w;
   }
  this.explosion = new particles.Emitter({
    delay: 50, 
    numParticles: 40,
    //modifierFunc: particles.Modifiers.tail(2, 0.4, 'rgb(255, 0, 0)', $v.multiply(dir, -1))
    modifierFunc: particles.Modifiers.explosion(10, 0.5, "rgba(255,0,0,0.6)")
  }); 
  this.explosion.pos = pos;
  this.explosion.start();
  return this;
}
gamejs.utils.objects.extend(Explosion, gamejs.sprite.Sprite);

Explosion.prototype.update = function(msDuration) {
   this.explosion.update(msDuration);
   this.parts.forEach(function(p, idx) {
      p.rect.center = $v.add(p.rect.center, $v.multiply(p.v, (msDuration/1000) * Explosion.SPEED));
      p.rect.width *= (1 - (msDuration/1000) * Explosion.SIZE_DECREASE);
      p.rect.height *= (1 - (msDuration/1000) * Explosion.SIZE_DECREASE);
   });
   this.age += msDuration;
   if (this.age > Explosion.LIFETIME) {
      this.explosion.stop();
      this.explosion = null;
      this.kill();
   } else if (this.age > Explosion.EMITTER_LIFETIME) {
      this.explosion.stop();
   }
}

Explosion.SPEED = 150;
Explosion.MIN_SIZE = 2;
Explosion.MAX_SIZE = 10;
Explosion.LIFETIME = 500; //ms
Explosion.EMITTER_LIFETIME = 100;
Explosion.SIZE_DECREASE = 0.8; // per sec

Explosion.prototype.draw = function(display, viewRect) {
   this.explosion.draw(display, viewRect);
   this.parts.forEach(function(p) {
      var tl = viewRect.topleft;
      display.blit(p.image, p.rect.move(-tl[0], -tl[1]));
   });
}