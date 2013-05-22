var gamejs = require('gamejs');
var sprite = require('gamejs/sprite');
var objects = require('gamejs/utils/objects');
var $v = require('gamejs/utils/vectors');
var Animation = require('./animation').Animation;
var Muzzle = require('./muzzle').Muzzle;
var sounds = require('./sounds');
var prng = require('./prng');

var Unit = exports.Unit = function(pos, config) {
   Unit.superConstructor.apply(this, []);

   this.moveVector = [0, 0];

   this.animation = new Animation(config || {
      spriteSheet: {
         image: null,
         cols: null,
         rows: null,
         directions: null
      }
   });
   this.rect = new gamejs.Rect(pos, Unit.SIZE);

   this.muzzle = new Muzzle(this.rect);
   this.direction = null;
   this.setDirection('e');
   this.health = config.health || 1;
   this.radius = config.radius || 15;
   this.speed = config.speed || 60;
   // FIXME
   Unit.shield = gamejs.image.load('./images/shield.png');

   // optimization
   this.updateCountDown = 0;
   return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);


Unit.SIZE = [16, 18];
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
};

Unit.getDirectionForVector = function(vel) {
   var closestDirectionKey = null;
   var closestDistance = Infinity;
   vel = $v.multiply(vel, -1);
   for (var dirKey in Unit.DIRECTIONS) {
      var dir = Unit.DIRECTIONS[dirKey];
      var ang = $v.angle(dir.cartasian, vel);
      if (ang < closestDistance) {
         closestDistance = ang;
         closestDirectionKey = dirKey;
      }
   }
   return closestDirectionKey
}
Unit.prototype.getViewTiles = function() {
   var dir = this.direction;
   if (dir.length > 1) {
      dir = dir.substring(0, 1);
   }
   var mid = this.getTilePos();
   var poses = [];
   var delta = Unit.DIRECTIONS[dir].cartasian;
   var scanDelta = [0,0];
   if (['n','s'].indexOf(dir) > -1) {
      scanDelta = [1, 0]
   } else {
      scanDelta = [0, 1];
   }
   var range = 6;
   while (range --> 0) {
      mid = $v.add(mid, delta);
      for (var i=-range; i < range+1; i++) {
         poses.push(
            $v.add(
               $v.multiply(scanDelta, i),
               mid
            )
         );
      }
   }
   return poses;
}

Unit.prototype.setDirection = function(direction, force) {
   if (direction === this.direction && !force) {
      return;
   }
   if (direction === null) {
      this.moveVector = [0,0];
   } else {
      this.direction = direction;
      this.muzzle.setDirection(direction);
      this.animation.setDirection(direction);

      var dir = Unit.DIRECTIONS[direction];
      this.moveVector = dir.cartasian;
   }
};

Unit.prototype.update = function(msDuration) {
   this.muzzle.update(msDuration);

   if (this.isPlayer === true) {
      this.updateControlled(msDuration);
      if (this.inFlock) {
         this.boid.pos = this.rect.center;
      }
   } else {
      this.updateBoid(msDuration);
   }
   return;
};

Unit.prototype.updateBoid = function(msDuration) {
   this.rect.center = this.boid.pos;
   if (this.updateCountDown <= 0) {
      this.direction = Unit.getDirectionForVector(this.boid.vel);
      this.muzzle.setDirection(this.direction);
      this.animation.setDirection(this.direction);
      updateCountDown = 800;
   } else {
      updateCountDown -= msDuration;
   }
   this.animation.update(msDuration);
   if (this.boid.flock.blackboard.state === 'errorpath') {
      gamejs.log('Errorpath suicide', this)
      this.kill();
   }
}

Unit.prototype.updateControlled = function(msDuration) {
   if ($v.len(this.moveVector) <= 0.01) {
      return;
   }
   this.animation.update(msDuration);
   // update position
   var deltaX = this.moveVector[0] * (msDuration/1000) * this.speed;
   var deltaY = this.moveVector[1] * (msDuration/1000) * this.speed;
   if (this.boid.flock.chunk.isMoveable($v.add(this.rect.center, [deltaX, deltaY]))) {
      this.rect.moveIp(deltaX, deltaY);
   }
}

Unit.prototype.drawPlayer = function(display, topleft) {
   if (this.isPlayer) {
      // FIXME 2 is hardcoded b/c pirate h as 0.5 health
      var color = [255, (this.health * 255) | 0, (this.health * 255) | 0];
      gamejs.draw.circle(
         display,
         'rgb('+color[0] + ',' + color[1] + ', ' + color[2] + ')',
         $v.add(topleft, [this.rect.width/2, this.rect.height/2]),
         16,
         2
      );
   } else {
      // FIXME 2 is hardcoded b/c pirate h as 0.5 health
      var color = [255, (2 * this.health * 255) | 0, (2 * this.health * 255) | 0];
      gamejs.draw.circle(
         display,
         'rgba('+color[0] + ',' + color[1] + ', ' + color[2] + ',0.3)',
         $v.add(topleft, [this.rect.width/2, this.rect.height/2]),
         15,
         0
      );
      if (this.boid.flock.blackboard.state === 'guard') {
         display.blit(Unit.shield, $v.add(topleft, [16,5]));
      }
   }
}

Unit.prototype.draw = function(display, viewRect) {
   if (!viewRect.collideRect(this.rect)) {
      return false;
   }
   var topleft = $v.subtract(this.rect.topleft, viewRect.topleft);
   if (this.boid.flock.isPlayer) {
      this.drawPlayer(display, topleft)
   }
   display.blit(this.animation.image, topleft);
   this.muzzle.draw(display, viewRect);
}

Unit.prototype.getTilePos = function() {
   // FIXME tilesize hardcoded
   var t = $v.divide(this.rect.center, 16);
   return [t[0] | 0, t[1] | 0];
}

Unit.prototype.kill = function() {
   Unit.superClass.kill.apply(this, arguments);
   this.boid.isDead = true;
   sounds.play('splash' + parseInt(4 * prng.random(), 10));
   if (!this.boid.flock.isPlayer) {
      require('./stats').count('enemy');
   } else {
      if (this.isPlayer) {
         require('./stats').defeat();
      }
      require('./stats').count('friendly');
   }
}
