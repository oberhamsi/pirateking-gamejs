var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');
// custom
var particles = require('./particles');
var Explosion = require('./explosion').Explosion;
var Bomb = require('bomb').Bomb;
var Projectile = require('./projectile').Projectile;
var sounds = require('./sounds');
var prng = require('./prng');

var CombatResolver = exports.CombatResolver = function(friendlies, enemies, chunk) {
   
   this.enemies = enemies;
   this.friendlies = friendlies;

   this.countdowns = {};
   for (var key in CombatResolver.COUNTDOWNS) {
      this.countdowns[key] = CombatResolver.COUNTDOWNS[key];
   }

   var bloodEmitters = [];
   var explosions = new gamejs.sprite.Group();
   var bombs = new gamejs.sprite.Group();
   var projectiles = new gamejs.sprite.Group();

   var unitsOnTiles = function(units, tiles) {
      var enemies = [];
      tiles.forEach(function(tile) {
         var enemy = null;
         units.forEach(function(e) {
            var epos = e.getTilePos();
            if (epos[0] === tile[0] && epos[1] === tile[1]) {
               enemies.push(e);
            }
         });        
      }, this);
      return enemies;
   }

   this.draw = function(display, viewRect) {
      bombs.draw(display, viewRect);
      bloodEmitters.forEach(function(e) {
         e.emitter.draw(display, viewRect);
      });
      projectiles.draw(display, viewRect);
      explosions.draw(display, viewRect);
   }
   var addBloodEmitter = function(enemy) {
      var emitter = new particles.Emitter({
        delay: 90, 
        numParticles: 5,
        //modifierFunc: particles.Modifiers.tail(2, 0.4, 'rgb(255, 0, 0)', $v.multiply(dir, -1))
        modifierFunc: particles.Modifiers.explosion(4, 1.2)
      });      
      emitter.pos = enemy.rect.center;
      emitter.start();
      bloodEmitters.push({
         emitter: emitter,
         age: 0
      });
   }

   var addProjectile = function(config) {
      projectiles.add(new Projectile(config));
   }

   this.addBomb = function(config) {
      bombs.add(
         new Bomb(config)
      );
   }

   var kickbackAndHealth = function(enemy, health, force) {
      // kickback & health
      if (enemy.boid) {
         var newPos = $v.subtract(enemy.boid.pos, force);
         if (chunk.isMoveable(newPos)) {
            enemy.boid.pos = newPos;
            enemy.rect.center = $v.subtract(enemy.rect.center, force);
         }
      }
      enemy.health -= health;

      if (enemy.health > 0) {
         addBloodEmitter(enemy);
      }  else {
         var image = enemy.animation.image;
         image = gamejs.transform.scale(image, $v.multiply(image.getSize(), 1.8));
         explosions.add(new Explosion(image, enemy.rect.topleft, $v.multiply($v.unit(force), -1)));
         enemy.kill();
         if (prng.random() < 0.3) {
            // FIXME not pretty direct access to renderer
            chunk.renderer.addBlood(enemy.rect.center);
         }
      }
   }

   var weaponUpdate = {
      melee: function(attackers, defenders) {
          // enemies melee attacking player?
         var cols = gamejs.sprite.groupCollide(
            attackers,
            defenders,
            false,
            false,
            gamejs.sprite.collideCircle
         );
         cols.forEach(function(col) {
            var friendly = col.b;
            if (col.a.boid.flock.weapon !== 'melee') return false;

            var dir = $v.unit($v.subtract(col.a.rect.center, friendly.rect.center));
            var force = $v.multiply(dir, 7);
            kickbackAndHealth(friendly, 0.01, force)
            gamejs.info('friendly melee hit', friendly.health)
         });
      },

      gauntling: function(attackers, defenders) {
         // update gauntling combat
         attackers.forEach(function(friend) {
            if (friend.boid && friend.boid.flock.weapon !== 'gauntling') return false;

            var tiles = friend.getViewTiles();
            var enemies = unitsOnTiles(defenders, tiles);
            if (enemies.length > 0) {
               gamejs.utils.arrays.shuffle(enemies);
               if (!friend.muzzle.active) {
                  sounds.play('gauntling');
               }
               friend.muzzle.active = true;
               enemies.slice(0, 3).forEach(function(enemy) {
                  var dir = $v.unit($v.subtract(friend.rect.center, enemy.rect.center));
                  var force = $v.multiply(dir, 10);
                  kickbackAndHealth(enemy, 0.02, force)
               });
            } else {
               friend.muzzle.active = false;
            }
         });
      },

      projectile: function(attackers, defenders) {
         attackers.forEach(function(friend) {
            if (!friend.boid || friend.boid.flock.weapon !== 'projectile') return false;

            var enemies = gamejs.sprite.spriteCollide(
               {rect: friend.rect, radius: 250},
               defenders,
               false,
               gamejs.sprite.collideCircle
            );
            if (enemies.length) {
               gamejs.utils.arrays.shuffle(enemies);
               enemies.some(function(enemy) {
                  if (!$v.distance(enemy.rect.center, friend.rect.center) > 200) {
                     return false;
                  }
                  addProjectile({
                     origin: friend.rect.center,
                     destination: enemy.rect.center
                  });
                  return true;
               });
            } else {
               if (friend.flock && friend.flock.blackboard) {
                  // FIXME wvery weird
                  friend.flock.blackboard.state = 'stopped';
               }
            }
         });
      }
   };

   this.update = function(msDuration) {

      // bombs - and explosions of them
      bombs.forEach(function(bomb) {
         var exploding = bomb.update(msDuration);
         if (exploding) {
            sounds.play('bomb');
            var collisions = gamejs.sprite.spriteCollide(bomb, this.enemies, false, gamejs.sprite.collideCircle);
            var collisions = collisions.concat(gamejs.sprite.spriteCollide(bomb, this.friendlies, false, gamejs.sprite.collideCircle));
            collisions.forEach(function(enemy) {
               var dir = $v.unit($v.subtract(bomb.rect.center, enemy.rect.center));
               var force = $v.multiply(dir, 15);
               kickbackAndHealth(enemy, 0.2, force)
            }, this)
            var pos = chunk.viewToMap(bomb.rect.center);
            pos.reverse();
            for (var i = -3; i < 3; i++) {
               for (var j = -3; j < 3; j++) {
                  var testPos = $v.add(pos, [i,j]);
                  chunk.modify(testPos, 267, true);
               }
            }
            chunk.modify(pos, 267);
         }
      }, this);

      // projectiles and their explosion
      projectiles.forEach(function(projectile) {
         if (!projectile.isArmed()) {
            return;
         }
         var collisions = gamejs.sprite.spriteCollide(projectile, this.enemies, false, gamejs.sprite.collideCircle);
         collisions = collisions.concat(gamejs.sprite.spriteCollide(projectile, this.friendlies, false, gamejs.sprite.collideCircle));
         collisions.some(function(enemy) {
            var b = new Bomb({pos: projectile.rect.center, launchVelocity: 1});
            b.time = Infinity; // immediatly explode
            bombs.add(b);
            projectile.kill();
            return true;
         });
      }, this);

      // blood emitter update & remove
      bloodEmitters = bloodEmitters.filter(function(e) {
         e.age += msDuration;
         if (e.age > 400) {
            e.emitter.stop();
            e.emitter = null;
            return false;
         }
         e.emitter.update(msDuration);
         return true;
      });

      // updates
      explosions.update(msDuration);
      projectiles.update(msDuration);

      // do we update the fighting status for a certain weapon type?
      for (var key in CombatResolver.COUNTDOWNS) {
         this.countdowns[key] -= msDuration;
         if (this.countdowns[key] <= 0) {
            if (key !== 'melee') {
               weaponUpdate[key](this.friendlies, this.enemies);
            }
            weaponUpdate[key](this.enemies, this.friendlies);
            this.countdowns[key] = CombatResolver.COUNTDOWNS[key];
         }
         continue;
      }

   }
   return this;
}

CombatResolver.COUNTDOWNS = {
   gauntling: 200,
   projectile: 2000,
   melee: 300
};
