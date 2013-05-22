var gamejs = require('gamejs')
var $v = require('gamejs/utils/vectors');
var Flock = require('./boids/flock').Flock;
var mob = require('./mob');
var Coin = require('./coin').Coin;
var sounds = require('./sounds');
var prng = require('./prng');

var TYPES = {
   wind: {
      frameMs: 250,
      speed: 100,
      weapon: 'melee',
      health: 0.15,
      groupMinMax: [20,28],
      spriteSheet: {
         image: './images/units/wind.png',
         cols: 3,
         rows: 4,
         directions: {
            n: {animation: 0}, s: {animation: 2}, w: {animation: 3},
            e: {animation: 1}, nw: {animation: 0}, ne: {animation: 0},
            sw: {animation: 2}, se: {animation: 2}
         }
      },
   },
   skull: {
      frameMs: 150,
      speed: 80,
      weapon: 'melee',
      health: 0.3,
      groupMinMax: [6,8],
      spriteSheet: {
         image: './images/units/skull.png',
         cols: 3,
         rows:4,
         directions: {
            'n': {animation: 1}, 's': {animation: 0},
            'w': {animation: 3}, 'e': {animation: 2},
            'ne': {animation: 1}, 'nw': {animation: 1},
            'se': {animation: 0}, 'sw': {animation: 0}
         }
      },
   },
   fire: {
      frameMs: 250,
      speed: 20,
      weapon: 'projectile',
      groupMinMax: [2,3],
      health: 0.5,
      spriteSheet: {
         image: './images/units/fire.png',
         cols: 3,
         rows: 4,
         directions: {
            n: {animation: 0}, s: {animation: 2}, w: {animation: 3},
            e: {animation: 1}, nw: {animation: 0}, ne: {animation: 0},
            sw: {animation: 2}, se: {animation: 2}
         }
      },
   },
   blob: {
      frameMs: 400,
      speed: 30,
      groupMinMax: [6,8],
      health: 0.3,
      weapon: 'gauntling',
      spriteSheet: {
         image: './images/units/blobs.png',
         cols: 3,
         rows:4,
         directions: {
            'n': {animation: 1}, 's': {animation: 1},
            'w': {animation: 1}, 'e': {animation: 1},
            'ne': {animation: 1}, 'nw': {animation: 1},
            'se': {animation: 1}, 'sw': {animation: 1}
         }
      },
   },
   cultist: {
      frameMs: 200,
      speed: 30,
      weapon: 'melee',
      health: 0.3,
      groupMinMax: [15,20],
      spriteSheet: {
         image: './images/units/cultist.png',
         cols: 3,
         rows: 4,
         directions: {
            n: {animation: 0}, s: {animation: 2}, w: {animation: 3},
            e: {animation: 1}, nw: {animation: 0}, ne: {animation: 0},
            sw: {animation: 2}, se: {animation: 2}
         }
      },
   },
   captain: {
      frameMs: 250,
      speed: 80,
      weapon: 'gauntling',
      spriteSheet: {
         image: './images/units/captain.png',
         cols: 3,
         rows: 4,
         directions: {
            n: {animation: 0,}, s: {animation: 2,},w: {animation: 3,},
            e: {animation: 1,}, nw: {animation: 3,},ne: {animation: 1,},
            sw: {animation: 3,}, se: {animation: 1}
         }
      }
   },
   pirate: {
      health: 0.5,
      frameMs: 150,
      speed: 45,
      weapon: 'gauntling',
      spriteSheet: {
         image: './images/units/pirate.png',
         cols: 3,
         rows: 4,
         directions: {
            n: {animation: 0,}, s: {animation: 2,},w: {animation: 3,},
            e: {animation: 1,}, nw: {animation: 3,},ne: {animation: 1,},
            sw: {animation: 3,}, se: {animation: 1}
         }
      }
   }
};
/*
{
   frameMs: 5000,
   speed: 15,
   health: 0.2,
   weapon: 'melee',
   groupMinMax: [10,15],
   spriteSheet: {
      image: './images/units/skeleton.png',
      cols: 3,
      rows:4,
      directions: {
         'n': {animation: 0}, 's': {animation: 1},
         'w': {animation: 3}, 'e': {animation: 2},
         'ne': {animation: 0}, 'nw': {animation: 0},
         'se': {animation: 1}, 'sw': {animation: 1}
      }
   },
},
*/

var FlockManager = exports.FlockManager = function(friendlies, enemies, chunk) {

   var player = null;
   this.setPlayer = function(p) {
      player = p;
   }

   var Behaviour = {
      "goto": function(flock) {
         var b = flock.blackboard;
         if (b.gotoPath && (!flock.target || flock.target && $v.distance(flock.target, flock.center) < 10)) {
            b.gotoIdx++;
            if (b.gotoIdx >= b.gotoPath.length) {
               gamejs.info('Flock reached final position', flock.center)
               b.gotoPath = null;
               b.state = 'stopped';
               return;
            }
            flock.target = b.gotoPath[b.gotoIdx];
         }
      },
      attackIfInSight: function(flock, attackTargets) {
         // FIXME radius 250 is the projectil radius!!
         var inSight = gamejs.sprite.spriteCollide(
            {radius: Math.min(flock.boids[0].speed * 8, 300), rect: new gamejs.Rect(flock.center)},
            attackTargets,
            false,
            gamejs.sprite.collideCircle
         ).sort(function(a,b) {
            var distA = $v.distance(flock.center, a.rect.center);
            var distB = $v.distance(flock.center, b.rect.center);
            if (distA > distB) return 1;
            if (distA < distB) return -1;
            return 0;
         });
         if (inSight.length) {
            gamejs.info('attackIfInSight: got enemy in sight');
            if (flock.weapon === 'melee'  || flock.weapon === 'gauntling') {
               this.asyncRoute(flock, flock.center, inSight[0].rect.center);
            } else if (flock.weapon === 'projectile') {
               Behaviour.fire(flock)
            }
         }
      },
      startGoto: function(flock, path) {
         if (!path || !path.length) {
            flock.blackboard.state = 'errorpath';
            gamejs.info('startGoto but no path given', flock, path);
            return;
         }
        if (path.length) {
           gamejs.info('startGoto success', path);
           flock.blackboard = flock.blackboard || {};
           if (flock.blackboard.state === 'goto') {
              flock.blackboard.oldGotoPath = flock.blackboard.gotoPath && flock.blackboard.gotoPath.slice(0);
           }
           flock.blackboard.state = 'goto';
           flock.blackboard.gotoIdx = 0;
           flock.blackboard.gotoPath = path.slice(0);
           flock.target = flock.blackboard.gotoPath[0];
        }
      },
      fire: function(flock) {
         gamejs.info('Fireing');
         flock.blackboard.state = 'fireing';
      }
   };

   /****************** */

   var behaviourCountdown = 500;

   var updateBlackboard = function(f, attackTargets) {
      if (f.boids.length <= 0) return;

      if (behaviourCountdown <= 0) {
         if (f.blackboard.state === 'guard') {
            return;
         }
         if (f.blackboard.state === 'goto') {
            Behaviour["goto"](f);
         }
         if (!f.isPlayer && (f.blackboard.state !== 'goto'  || !f.blackboard.oldGotoPath)) {
            Behaviour.attackIfInSight.apply(this, [f, attackTargets]);
         }
         if (f.blackboard.state === 'stopped' && f.blackboard.oldGotoPath) {
            this.asyncRoute(f, f.center, f.blackboard.oldGotoPath[f.blackboard.oldGotoPath.length-1]);
            f.blackboard.oldGotoPath = null;
         }
         if (f.blackboard.state === 'stopped') {
            //f.blackboard.state = 'following';
            this.asyncRoute(f, f.center, player.rect.center);
         }

      }
   }

   this.addCoin = function(pos) {
      coins.add(new Coin(pos))
   }

   this.emptyCoins = function() {
      coins.empty();
   }

   this.update = function(msDuration) {
      // coin collect?
      var colls = gamejs.sprite.spriteCollide(player, coins, true, gamejs.sprite.CollideCircle);
      if (colls.length) {
         player.coins += colls.length || 0;
         require('./stats').count('coin');
         sounds.play('money');
      }
      coins.update(msDuration);

      behaviourCountdown -= msDuration;
      friendlyFlocks.forEach(function(f) {
         if (f.boids.length <= 0) return;

         if (f.blackboard.state !== 'stopped') {
            f.update(msDuration);
         }
         if (f.blackboard.state === 'following') {
            f.target = friendlyFlocks[0].boids[0].pos;
         }
         if (behaviourCountdown < 0) {
            updateBlackboard.apply(this, [f, enemies]);
         }
      }, this);

      if (behaviourCountdown < 0) {
         // kill dead flocks
         friendlyFlocks = friendlyFlocks.filter(function(f) {
            return f.boids.length > 0;
         });
         // kill dead flocks
         flocks = window.flocks = flocks.filter(function(f) {
            var alive = f.boids.length > 0;
            if (!alive) {
               gamejs.info('Removing flock', f);
               if (prng.random() < 0.4) this.addCoin(f.center);
            }
            return alive;
         }, this);
      }
      flocks.forEach(function(f) {
         if (f.blackboard.state !== 'stopped') {
            f.update(msDuration);
         }
         if (behaviourCountdown < 0) {
            updateBlackboard.apply(this,[f, friendlies]);
         }
      }, this);
      if (behaviourCountdown < 0) {
         behaviourCountdown = 1000;
      }
   };


   this.draw = function(display, viewRect) {
      coins.draw(display, viewRect);
      if (DEBUG) {
         flocks.concat(friendlyFlocks).forEach(function(f) {
            if (f.blackboard.state === 'goto' && f.blackboard.gotoPath) {
               var p = f.blackboard.gotoPath.map(function(p) {
                  return $v.subtract(p, viewRect.topleft);
               });
               var color = 'rgba(0,0,255,0.8)';
               if (f.blackboard.oldGotoPath) {
                  color = 'rgba(177,0,0,0.8)';
               }
               gamejs.draw.lines(display, color, false, p , 1);
               if (p.length && f.blackboard.gotoIdx < p.length) {
                  gamejs.draw.circle(display, color, p[f.blackboard.gotoIdx], 5, 0);
                  gamejs.draw.circle(display, color, p[p.length-1], 10, 1);
               }
            }
         });
      }
   }

   this.createFriendlyFlock = function() {
      var f = new Flock({chunk: chunk});
      f.blackboard = {state: 'following'};
      friendlyFlocks.push(f);
      f.update(0);
      return f;
   }

   this.addBoid = function(flock) {
      var config = TYPES[flock.type];
      var pos = chunk.getPosition(flock.center, 100, true);
      // NOTE send in copy
      var configCopy = gamejs.utils.objects.merge(config, {});
      configCopy.pos = pos;
      var cultist = new mob.Unit([0,0], configCopy);
      cultist.boid = flock.createBoid(configCopy);
      cultist.boid.speed = config.speed;
      cultist.rect.center = cultist.boid.pos;
      return cultist;
   }

   this.asyncRoute = function(flock, origin, destination) {
      if (flock.waitingForRoute) {
         return;
      }
      gamejs.log('Starting async route', origin);
      origin = chunk.viewToMap(origin);
      destination = chunk.viewToMap(destination);
      origin.reverse();
      destination.reverse();

      var id = Date.now () + (prng.random() * Date.now());
      aStarWorker.post({
         type: 'findRoute',
         origin: origin,
         destination: destination,
         id: id
      });
      flock.waitingForRoute = true;
      workerCallbacks[id] = function(data) {
         gamejs.info('Worker path receieved, ms', data.duration)
         flock.waitingForRoute = false;
         if (data.route.length > 0) {
            Behaviour.startGoto(flock, data.route.slice(1));
         } else {
            flock.blackboard.state = 'errorpath';
         }
      }
   }

   this.createEnemyFlock = function(config) {
      if (flocks.length > 5) {
         return;
      }
      var type = config.type;
      var basePos = config.pos || chunk.getPosition();
      var target = config.target  || chunk.getPosition(basePos, 100, true);

      var dirs = ['n', 'e', 'w', 's', 'ne', 'nw', 'se', 'sw'];
      var flock = new Flock({
         chunk: chunk
      });
      flock.type = type;
      flock.center = basePos;
      var config = TYPES[type];
      var i = prng.rand(config.groupMinMax[0], config.groupMinMax[1]);
      while (i--> 0 ) {
         var cultist = this.addBoid(flock)
         enemies.add(cultist);
      }
      flock.blackboard = {};
      flock.weapon = config.weapon;
      this.asyncRoute(flock, basePos, target);
      flock.target = cultist.rect.center
      flocks.push(flock);
   }

   this.getFlockLength = function() {
      return flocks.length;
   }

   var flocks = window.flocks = [];
   var friendlyFlocks = [];
   var coins = new gamejs.sprite.Group();

   var workerCallbacks = {};
   var aStarWorker = new gamejs.worker.Worker('./workers/astar');
   aStarWorker.post({
      type: 'mapdata',
      map: chunk.data
   });

   aStarWorker.onEvent(function(event) {
      workerCallbacks[event.id](event);
   });


   return this;

}
