var gamejs = require('gamejs');
var CombatResolver = require('./combatresolver').CombatResolver;
var $v = require('gamejs/utils/vectors');
var ViewPort = require('./viewport').ViewPort;
var AiDirector = require('./aidirector').AiDirector;
var FlockManager = require('./flockmanager').FlockManager;
var mob = require('./mob');
var Shop = require('./shop').Shop;
var InputHandler = require('./inputhandler').InputHandler;

/**
 * GameScene
 */
exports.Game = function(chunk) {

   this.handleEvent = function(event) {
      inputHandler.handleEvent(event);
   }

   /**
    *
    */
   this.draw = function(display) {
      //display.clear();
      display.blit(chunk.renderer.getSurface(), display.getRect(), viewPort.rect);
      shop.draw(display, viewPort.rect);
      friendlies.draw(display, viewPort.rect);
      enemies.draw(display, viewPort.rect);
      combatResolver.draw(display, viewPort.rect);
      aiDirector.draw(display, viewPort.rect);
      flockManager.draw(display, viewPort.rect);
      !DEBUG && viewPort.draw(display);
      inputHandler.draw(display, viewPort.rect);
      aiDirector.drawGui(display);
      shop.drawGui(display, viewPort.rect, player.rect);
      // player gui
      var start = [10, 35];
      for (var i = 0;i<player.bombs;i++) {
         display.blit(images.bomb, start);
         start = $v.add(start, [17, 0]);
      }
      var start = [10, 55];
      for (var i = 0;i<player.coins;i++) {
         display.blit(images.coin, start);
         start = $v.add(start, [17, 0]);
      }
      DEBUG && display.blit(miniMap);
   };

   this.update = function(msDuration) {
      viewPort.update(msDuration, player.rect.center);
      combatResolver.update(msDuration);
      flockManager.update(msDuration);
      friendlies.update(msDuration);
      enemies.update(msDuration);
      var nextWave = aiDirector.update(msDuration);
      if (nextWave) {
         shop.nextShop();
      }
      // player on shop?
      var mapPos = chunk.viewToMap(player.rect.topleft);
      mapPos.reverse();
      if (shop.contains(mapPos)) {
         shop.show();
      } else {
         shop.hide();
      }
   };

   // unit groups
   var friendlies = new gamejs.sprite.Group();
   var enemies = new gamejs.sprite.Group();

   var flockManager = window.flockManager = new FlockManager(friendlies, enemies, chunk);

   // create players
   var basePos = chunk.getPosition();
   var flock = flockManager.createFriendlyFlock();
   flock.center = basePos;
   // player
   flock.type = 'captain';
   flock.weapon = 'gauntling';
   var sprite = flockManager.addBoid(flock);
   friendlies.add(sprite);
   var player = window.player = friendlies.sprites()[0];
   player.isPlayer = true;
   player.inFlock = true;
   player.coins = 1;
   player.bombs = 0;
   player.setDirection(null);
   flock.isPlayer = true;

   flock.type = 'pirate';
   for (var i=0;i<2;i++) {
      friendlies.add(flockManager.addBoid(flock));
   }

   flockManager.setPlayer(player);
   var combatResolver = new CombatResolver(friendlies, enemies, chunk);

   var viewPort = new ViewPort({
      mapSize: chunk.renderer.getSurface().getSize()
   });

   var startMs = Date.now();
   var aiDirector = new AiDirector(player, flockManager, chunk);
   gamejs.log('AiDirector spawn time ', (Date.now() - startMs));

   startMs = Date.now();
   var shop = new Shop(player, flockManager, friendlies, chunk);
   gamejs.log('Shop spawn time ', (Date.now() - startMs));

   var inputHandler = new InputHandler(player, combatResolver);

   var images = {
      coin: gamejs.image.load('./images/coin.png'),
      bomb: gamejs.image.load('./images/bomb_big.png')
   }
   var miniMap = chunk.renderer.getPreviewSurface();

   return this;
};
