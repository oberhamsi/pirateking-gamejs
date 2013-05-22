var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');
var particles = require('./particles');
var Animation = require('./animation').Animation;

var Bomb = exports.Bomb = function(config) {
	Bomb.superConstructor.apply(this, []);

	Bomb.IMAGE = gamejs.image.load('./images/bomb.png')
	this.image = Bomb.IMAGE.clone();
	this.rect = new gamejs.Rect(config.pos, this.image.getSize())
	this.xDir = config.xDir || 1;
	this.time = 0;
	this.launchVelocity = config.launchVelocity * 150 || 150;
	this.origCenter = this.rect.center.slice(0);
	this.height = null;
	this.mass = 10;
	this.explosion = null;
   	this.animation = new Animation({
   		spriteSheet: {
   			image: './images/explosion.png',
   			rows: 1,
   			cols: 2,
   			directions: {
            n: {
               animation: 0,
            },
            s: {
               animation: 2,
            },
            w: {
               animation: 3,
            },
            e: {
               animation: 1,
            },
            nw: {
               animation: 3,
            },
            ne: {
               animation: 1,
            },
            sw: {
               animation: 3,
            },
            se: {
               animation: 1,
            }
         }
		}
   	});
   	this.radius = 40;
   	this.animation.setDirection('n');
   	this.dying = false;
   	this.age = 400;
	return this;
}

gamejs.utils.objects.extend(Bomb, gamejs.sprite.Sprite);

var G = -20.8;


Bomb.prototype.draw = function(display, viewRect) {
	if (!viewRect.collideRect(this.rect)) {
		return false;
	}
	if (this.dying === true) {
		display.blit(
			this.animation.image,
			$v.subtract(
				$v.subtract(this.rect.topleft, $v.multiply(this.animation.image.getSize(),0.6)),
				viewRect.topleft
			)
		);
	} else {
		display.blit(this.image, $v.subtract(this.rect.topleft, viewRect.topleft));
	}
}

Bomb.prototype.update = function(msDuration) {
	if (this.dying) {
		this.age -= msDuration;
		this.animation.update(msDuration);
		if (this.age <= 0) {
			this.kill();
		}
		return false;
	}
	// done?
	this.height = this.origCenter[1] - this.rect.center[1];
	if (this.time > 500 && this.height <= 0) {
		this.dying = true;
		return true;
	}
	this.time += msDuration;
	var ttime = (this.time/1000);
	var delta = [
		this.xDir * ttime * this.launchVelocity,
		- ((ttime * this.launchVelocity) +
			(0.5 * G * this.mass * Math.pow(ttime,2)))
	]
	this.rect.center = $v.add(this.origCenter, delta);
	return false;
}