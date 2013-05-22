var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');

exports.InputHandler = function(player, combatResolver) {
   
   var keyDown = {};
   
   var setDirectionForKeyDown = function(unit) {
      if (
            keyDown[gamejs.event.K_LEFT] && keyDown[gamejs.event.K_UP] ||
            keyDown[gamejs.event.K_a] && keyDown[gamejs.event.K_w]
         ) {
         unit.setDirection('nw', true);
      } else if (
         keyDown[gamejs.event.K_RIGHT] && keyDown[gamejs.event.K_UP] ||
         keyDown[gamejs.event.K_d] && keyDown[gamejs.event.K_w]
      ) {
         unit.setDirection('ne', true);
      } else if (
         keyDown[gamejs.event.K_LEFT] && keyDown[gamejs.event.K_DOWN] ||
         keyDown[gamejs.event.K_a] && keyDown[gamejs.event.K_s]
      ) {
         unit.setDirection('sw', true);
      } else if (
         keyDown[gamejs.event.K_RIGHT] && keyDown[gamejs.event.K_DOWN] ||
         keyDown[gamejs.event.K_d] && keyDown[gamejs.event.K_s]
      ) {
         unit.setDirection('se', true);
      } else if (
         keyDown[gamejs.event.K_LEFT] ||
         keyDown[gamejs.event.K_a]
      ) {
         unit.setDirection('w', true);
      } else if (
         keyDown[gamejs.event.K_RIGHT] ||
         keyDown[gamejs.event.K_d]
      ) {
         unit.setDirection('e', true);
      } else if (
         keyDown[gamejs.event.K_UP] ||
         keyDown[gamejs.event.K_w]
      ) {
         unit.setDirection('n', true);
      } else if (
         keyDown[gamejs.event.K_DOWN] ||
         keyDown[gamejs.event.K_s]         
      ) {
         unit.setDirection('s', true);
      } else {
         unit.setDirection(null);
      }
   };

   var getVelocityForSpaceDown = function() {
      var delta = Date.now() - spaceDownTime;
      var velocity = Math.min(1, ((delta/1000) * 0.6) + 0.4);
      return velocity;
   }

   var addBomb = function() {
      // trigger bomb player
      combatResolver.addBomb({
         pos: player.rect.center,
         xDir: ['w', 'sw','nw'].indexOf(player.direction) > -1 ? -1 : 1,
         launchVelocity: getVelocityForSpaceDown()
      });
      player.bombs--;
   }
   
   /**
    * handleEvent
    */
   var spaceDownTime = null;
   var lastSpaceUp = null;

   // behaviours
   var startFollowing = function(flock) {
      flock.blackboard.state = 'following';
   };
   var startGuard = function(flock) {
      flock.blackboard.state = 'guard';
      flock.blackboard.target = flock.center;
   };
   
   this.handleEvent = function(event) {
      if (event.type === gamejs.event.QUIT) {
         // do quit.
      }
      if (event.type === gamejs.event.KEY_DOWN) {
         keyDown[event.key] = true;
         setDirectionForKeyDown(player);
         // space
         if (!spaceDownTime && event.key === gamejs.event.K_SPACE) {
            spaceDownTime = Date.now();
         }
      } else if (event.type == gamejs.event.KEY_UP) {
         keyDown[event.key ] = false;
         setDirectionForKeyDown(player);
         // space
         if (event.key === gamejs.event.K_SPACE) {
            var now = Date.now();
            if (now - lastSpaceUp > 1000 && player.bombs > 0) {
               addBomb(now);
            };
            spaceDownTime = null;
            lastSpaceUp = null;
         }
         // shift
         if (event.key === gamejs.event.K_SHIFT) {
            player.inFlock = !player.inFlock;
            if (player.inFlock) {
               startFollowing(player.boid.flock);
            } else {
               startGuard(player.boid.flock);
            }
            player.boid.speed = player.boid.speed ? 0 : player.speed;
         }
      } else if (event.type === gamejs.event.MOUSE_DOWN) {
      } else if (event.type === gamejs.event.MOUSE_UP) {
         if (event.button === 1) {
            window.flockManager.createEnemyFlock({
               type: 'skull',
               pos: $v.add(event.pos, vr.topleft),
               target: player.rect.center
            });
         }
      }
   };

   var rHeight = 20;
   var vr = null;
   this.draw = function(display, viewRect) {
      vr = viewRect;
      if (spaceDownTime && player.bombs > 0) {
         var r = new gamejs.Rect($v.subtract(player.rect.topleft, viewRect.topleft), [5, rHeight]);
         r.moveIp(-6,0);
         r.height = rHeight * getVelocityForSpaceDown();
         r.topleft = [
            r.topleft[0],
            r.topleft[1] - (r.height - rHeight)
         ]
         gamejs.draw.rect(display, "rgba(50, 50, 50, 1)", r, 0);
      }
   }


   return this;
}