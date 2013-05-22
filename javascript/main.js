var gamejs = require('gamejs');
var scenes = require('./scenes');
var Director = require('./director').Director;
var sounds = require('./sounds');
var world = require('./world');

var ASSETS = [
   './images/terrain/dirt.png',
   './images/terrain/gras.png',
   './images/terrain/hills.png',
   './images/terrain/mountains.png',
   './images/terrain/sand.png',
   './images/terrain/sandwoods.png',
   './images/terrain/woods.png',
   './images/terrain/water.png',
   './images/terrain/bricks.png',
   './images/terrain/extras.png',
   './images/terrain/crater.png',

   './images/muzzle.png',
   './images/bomb.png',
   './images/explosion.png',
   './images/fireball.png',
   './images/lightcone.png',

   './images/units/captain.png',
   './images/units/pirate.png',
   './images/units/cultist.png',
   './images/units/blobs.png',
   './images/units/fire.png',
   './images/units/wind.png',
   './images/units/skull.png',

   './images/coins.png',
   './images/shield.png',

   './images/coin.png',
   './images/bomb_big.png',

   './images/blood.png',
   './images/blueglow.png',
   './images/arrow.png'
].concat(sounds.getPreloadAssets());


window.DEBUG = false;

gamejs.preload(ASSETS);

gamejs.ready(function() {
   var dimensions = window.DISPLAY_DIMS = [Math.min(window.innerWidth-50, 1800), Math.min(window.innerHeight-50, 900)];
   var $loader = document.getElementById('gjs-loader');
   $loader.style.display = 'block';
   var $kmLoading = document.getElementById('km-loading');

   var display = gamejs.display.setMode(dimensions, gamejs.display.FULLSCREEN);
   gamejs.setLogLevel(0);
   gamejs.display.setCaption('Kingmaker [alpha]');
   sounds.init();

   var director = new Director();

   gamejs.onTick(function(msDuration) {
      director.update(msDuration);
      director.draw(display);
   });

   gamejs.onEvent(function(event) {
      if (event.type === gamejs.event.MOUSE_MOTION) {
         return;
      } else if (event.type === gamejs.event.DISPLAY_FULLSCREEN_ENABLED) {
         display = gamejs.display.setMode([window.innerWidth-20, window.innerHeight - 20], gamejs.display.FULLSCREEN);
      }
      director.handle(event);
   });

   var chunkWorker = new gamejs.worker.Worker('./workers/chunk');
   chunkWorker.onEvent(function(event) {
      var chunk = world.Chunk.load(event.chunk);
      var gameScene = new scenes.Game(chunk);
      director.start(gameScene);
      $kmLoading.style.display = 'none';
      $play.style.display = 'block';
      gamejs.log('starting director')
   });
   chunkWorker.post();

   var $gamejsCanvas = document.getElementById('gjs-canvas');
   $gamejsCanvas.style.display = 'none';
   var $play = document.getElementById('km-play');
   $play.style.display = 'none';
   $play.addEventListener('mouseup', function() {
      $gamejsCanvas.style.display = 'block';
      $loader.style.display = 'none';
      $('#coordx').text((Date.now() + '').substring(10,13));
      $('#coordy').text((Date.now() + '').substring(5,8));
      require('./stats');
      director.setOnAir()
   }, false);

   if (false && DEBUG) {
      // create the event
      var evt = document.createEvent('Event');
      evt.initEvent('mouseup', true, true);
      // elem is any element
      $play.dispatchEvent(evt);
   }

});

$(document).ready(function() {
   var currentTutorial = 1;
   var intervalId = null;
   var hideTimeoutId = null;

   var $box = $('#tutorialbox');
   var hideTutorial = function() {
      $box.popover('destroy');
      hideTimeoutId = null;
   }

   var nextTutorial = function() {
      var html = $('.km-helpquad:nth-child(' + currentTutorial +')').html();
      if (!html) {
         //clearInterval(intervalId);
         currentTutorial = 0;
      }
      $('#tutorialbox').popover({
         content: html,
         trigger: 'manual',
         placement: 'top',
         html: true,
         animation:true
      }).popover('show');

      var hideTimeoutId = setTimeout(hideTutorial, 25 * 1000);
      $box.off('click').on('click', hideTutorial);
      currentTutorial++;
   }

   $('#km-play').on('click', function() {
      var intervalId = setInterval(nextTutorial, 30 * 1000);
      nextTutorial();
   });

})
