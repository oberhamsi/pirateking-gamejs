var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');
var Unit = require('./mob').Unit;
var Animation = require('./animation').Animation;

var Projectile = exports.Projectile = function(config) {
	Projectile.superConstructor.apply(this, arguments);
	this.vel = $v.unit($v.subtract(config.destination, config.origin));
	this.radius = 8;
	this.animation = new Animation({
		spriteSheet: {
			image: './images/fireball.png',
			cols: 8,
			rows: 8,
         directions: Projectile.DIRECTIONS
		},
	})
	var dir = Unit.getDirectionForVector(this.vel);
	this.animation.setDirection(dir);
	
	this.rect = new gamejs.Rect([0, 0], this.animation.image.getSize());
	this.rect.center = config.origin;
	this.countdown = 1500;
	return this;	
}
gamejs.utils.objects.extend(Projectile, gamejs.sprite.Sprite);

Projectile.prototype.isArmed = function() {
   return this.countdown < 800;
}

Projectile.prototype.draw = function(display, viewRect) {
	display.blit(this.animation.image, $v.subtract(this.rect.topleft, viewRect.topleft));
}

Projectile.prototype.update = function(msDuration) {
	this.countdown -= msDuration;
	if (this.countdown <= 0) {
		this.kill();
	}
	var delta = $v.multiply(this.vel, (msDuration/1000) * Projectile.SPEED);
	this.rect.moveIp(delta);
	this.animation.update(msDuration);
	return;
}

Projectile.SPEED = 200;

Projectile.DIRECTIONS = {
   w: {
      animation: 0,
   },
   nw: {
      animation: 1,
   },
   n: {
      animation: 2,
   },
   ne: {
      animation: 3,
   },
   e: {
      animation: 4,
   },
   se: {
      animation: 5,
   },
   s: {
      animation: 6,
   },
   sw: {
      animation: 7,
   }
};