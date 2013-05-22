var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');

// FIXME copy&pasta shit
var Unit = {};
Unit.DIRECTIONS = {
   n: {
      cartasian: [0, -1],
      angle: 270,
   },
   s: {
      cartasian: [0, 1],
      angle: 90,
   },
   w: {
      cartasian: [-1, 0],
      angle: 180,
   },
   e: {
      cartasian: [1, 0],
      angle: 0,
   },
   nw: {
      cartasian: $v.unit([-1, -1]),
      angle: 225,
   },
   ne: {
      cartasian: $v.unit([1, -1]),
      angle: 315,
   },
   sw: {
      cartasian: $v.unit([-1, 1]),
      angle: 135,
   },
   se: {
      cartasian: $v.unit([1, 1]),
      angle: 45,
   }
};/**
 *
 */
var Muzzle = exports.Muzzle = function(rect) {
   this.active = false;
   this.countdown = Muzzle.COUNTDOWN;
   this.visible = false;
   this.rect = rect;
   this.offset = [0,0];
   Muzzle.IMAGE = gamejs.image.load('./images/muzzle.png');
   this.setDirection('e');
   return this;
}
Muzzle.DIRECTIONS = {
   n: {
      offset: [-2,-20],
   },
   s: {
      offset: [-2,5],
   },
   w: {
      offset: [-17,0],
   },
   e: {
      offset: [2,0],
   },
   nw: {
      offset: [-15,-15],
   },
   ne: {
      offset: [2,-10],
   },
   sw: {
      offset: [-13,0],
   },
   se: {
      offset: [0,0],
   }
};
Muzzle.COUNTDOWN = 30;

Muzzle.prototype.draw = function(display, viewRect) {
   if (this.active && this.visible) {
      display.blit(
         this.image,
         $v.subtract(
            $v.add(this.rect.center, Muzzle.DIRECTIONS[this.direction].offset),
            viewRect.topleft
         )
      );
   }
}

Muzzle.prototype.update = function(msDuration) {
   if (this.active) {
      this.countdown -= msDuration;
      if (this.countdown <= 0) {
         this.countdown = Muzzle.COUNTDOWN;
         this.visible = !this.visible;
      }
   }
}
Muzzle.prototype.setDirection = function(dir) {
   this.direction = dir;
   this.image = gamejs.transform.rotate(Muzzle.IMAGE, Unit.DIRECTIONS[this.direction].angle)

}