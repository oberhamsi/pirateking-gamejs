var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');
var $r = require('gamejs/utils/prng');
var $a = require('gamejs/utils/arrays');
var $m = require('gamejs/utils/math');
var sounds = require('./sounds');

exports.Shop = function(player, flockManager, friendlies, chunk) {

   this.drawGui = function(display, viewRect, playerRect) {
      // in center top draw the arrow
      var shopPos = chunk.mapToView(shops[activeShopIdx]);
      var toShopAngle = $v.angle([1,0], $v.subtract(shopPos, playerRect.center));
      var srf = gamejs.transform.rotate(arrowSrf, $m.degrees(toShopAngle));
      var center = [DISPLAY_DIMS[0]/2 - srf.getSize()[0]/2, 5];
      display.blit(srf, center);
   }

   this.draw = function(display, viewRect) {
      // draw blue flame in active shop
      var shopPos = chunk.mapToView(shops[activeShopIdx]);
      var topleft = $v.subtract(shopPos, viewRect.topleft);
      display.blit(blueGlowSrf, topleft);
   }

   this.nextShop = function() {
      activeShopIdx++;
      if (activeShopIdx >= shopActivationOrder.length) {
         activeShopIdx = 0;
      }
      gamejs.log('Active shop is now at ', shops[activeShopIdx]);
   }

   this.show = function() {
      coins.textContent = player.coins;
      bombs.textContent = player.bombs;
      shop.style.display = 'block';
   }
   this.hide = function() {
      shop.style.display = 'none';
   }

   this.contains = function(pos) {
      var s = shops[activeShopIdx];
      return $v.distance(s, pos) < 2
   }

   var pattern = [
[70,70,70,70,70,70,70,70,70,70,70,70,70,70],
[70,70,70,70,70,70,70,70,70,70,70,70,70,70],
[70,70,150,150,150,150,150,150,150,150,150,150,70,70],
[70,70,150,256,256,256,256,256,256,256,256,150,70,70],
[70,70,150,256,150,150,150,150,150,150,256,150,70,70],
[70,70,150,256,150,150,264,150,150,150,256,150,70,70],
[70,70,150,256,150,150,150,150,150,150,256,150,70,70],
[70,70,150,256,256,150,150,150,150,256,256,150,70,70],
[70,70,150,150,150,150,150,150,150,150,150,150,70,70],
[70,70,150,150,150,150,150,150,150,150,150,150,70,70],
[70,70,150,256,256,256,256,256,256,256,256,150,70,70],
[70,70,150,150,150,150,150,150,150,150,150,150,70,70],
[70,70,70,70,70,70,70,70,70,70,70,70,70,70],
[70,70,70,70,70,70,70,70,70,70,70,70,70,70],
   ]

   // constructor
   var shops = [];
   var posFn = chunk.getSpiralPosGenerator();
   for (var i = 0;i<3;i++) {
      var pos = posFn();
      pattern.forEach(function(row, r) {
         row.forEach(function(val, c) {
            var blockPos = chunk.viewToMap($v.add(pos, [r * 16,c * 16]));
            chunk.modify(blockPos, val, true);
            if (val === 258 || val === 264 ) {
               shops.push(blockPos);
            }
         });
      });
      // FIXME need better way to blip data like above
      chunk.renderer.redraw(new gamejs.Rect(chunk.viewToMap(pos), [pattern[0].length, pattern.length]));
      gamejs.log('Created shop at ' + pos);
   }
   // prepare order on which we will shuffle through the shops
   var shopActivationOrder = Object.keys(shops).map(function(i) {
      return parseInt(i,10);
   });
   $a.shuffle(shopActivationOrder);
   var activeShopIdx = 0;
   var blueGlowSrf = gamejs.image.load('./images/blueglow.png');
   var arrowSrf = gamejs.image.load('./images/arrow.png');

   var shop = document.getElementById('km-shop');
   var coins = document.getElementById('km-shop-coins');
   var bombs = document.getElementById('km-shop-bombs');
   document.getElementById("km-shop-buypirate").addEventListener('mouseup', function() {
      if (player.coins < 2) return;
      friendlies.add(flockManager.addBoid(player.boid.flock));
      player.coins -= 2;
      sounds.play('money');
      require('./stats').count('pirate');
      coins.textContent = player.coins;
   }, false);
   document.getElementById("km-shop-buyheal").addEventListener('mouseup', function() {
      if (player.coins <= 0) return;
      player.health = 1;
      player.coins--;
      sounds.play('money');
      coins.textContent = player.coins;
   }, false)
   document.getElementById("km-shop-buybomb").addEventListener('mouseup', function() {
      if (player.coins <= 0) return;
      player.coins--;
      sounds.play('money');
      player.bombs += 3;
      coins.textContent = player.coins;
      bombs.textContent = player.bombs;
   }, false);
   var self = this;
   document.body.addEventListener('keydown', function(event) {
      if (event.keyCode === 27) {
         self.hide();
         gamejs.log('hiding')
      }
   }, false)
   return;
}