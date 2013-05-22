var gamejs = require('gamejs')
var $v = require('gamejs/utils/vectors');
var particles = require('./particles');
var sounds = require('./sounds');

var AiDirector = exports.AiDirector = function(player, flockManager, chunk) {

   var explosions = [];
   var waveCountdown = DEBUG ? 1 * 1000 : 40 * 1000;
   var waveIdx = 0;
   var WAVE_DURATION = 20 * 1000;
   var WAVES = [
      ['skull'],
      ['skull', 'skull'],
      ['skull', 'skull', 'skull'],
      ['skull', 'skull', 'wind'],
      ['skull', 'wind', 'wind'],
      ['skull', 'wind', 'blob'],
      ['skull', 'blob', 'blob', 'blob'],
      ['blob', 'wind', 'wind', 'fire'],
      ['skull', 'blob', 'blob', 'wind', 'fire'],
   ]
   var clockTicking = false;

   var addExplosion = function(pos) {
      var emitter = new particles.Emitter({
        delay: 300,
        numParticles: 20,
        //modifierFunc: particles.Modifiers.tail(2, 0.4, 'rgb(255, 0, 0)', $v.multiply(dir, -1))
        modifierFunc: particles.Modifiers.ring(30, 3, 'rgba(240,233,50,0.1)')
      });
      emitter.pos = pos;
      emitter.start();
      explosions.push({
         emitter: emitter,
         age: 0
      });
   }

   this.update = function(msDuration) {

      if (flockManager.getFlockLength() === 0) {
         waveCountdown -= msDuration;
         if (waveIdx === WAVES.length) {
            require('./stats').victory();
            return;
         }
      }
      if (waveCountdown < 7 * 1000 && !clockTicking) {
         clockTicking = true;
         sounds.play('clock');
      }

      var nextWaveTriggered = false;
      if (waveCountdown <= 0) {
         waveCountdown = WAVE_DURATION;
         if (waveIdx >= WAVES.length) {
            waveIdx = 0;
            return;
         }
         require('./stats').count('wave');
         nextWaveTriggered = true;
         clockTicking = false;
         sounds.play('eruption');
         flockManager.emptyCoins();
         WAVES[waveIdx].forEach(function(flockType) {
            gamejs.utils.arrays.shuffle(bases);
            var pos = bases[0].pos;
            for (var i = 0;i<1;i++) {
               flockManager.addCoin(chunk.getPosition(pos, 150, true));
            }
            flockManager.createEnemyFlock({
               type: flockType,
               pos: chunk.getPosition(pos, 150, true),
               target: player.rect.center
            });
            addExplosion(pos);
         });
         waveIdx++;
      }

      // blood emitter update & remove
      explosions = explosions.filter(function(e) {
         e.age += msDuration;
         if (e.age > 3000) {
            e.emitter.stop();
            e.emitter = null;
            return false;
         }
         e.emitter.update(msDuration);
         return true;
      });
      if (nextWaveTriggered) {
         return 'next-wave';
      }
   }

   this.draw = function(display, viewRect) {
      explosions.forEach(function(e) {
         e.emitter.draw(display, viewRect);
      });
   }

   this.drawGui = function(display) {
      if (flockManager.getFlockLength() === 0) {
         var wc = (waveCountdown / 1000) | 0;
         display.blit(
            font.render('Eruption ' + (waveIdx+1) + ' of ' + WAVES.length + ' in ' + wc + ' seconds.', 'white'),
            [10, 10]
         );
      }
   }

   var font = new gamejs.font.Font("25px 'Aladin', cursive");
   var bases = chunk.bases;
   return this;
}
