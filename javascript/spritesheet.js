var gamejs = require('gamejs');

/**
 * Access invidual images on a spritesheet image by index number
 * or row, col position.
 */
var SpriteSheet = exports.SpriteSheet = function(sheetSpec) {

   /**
    * single index or row, col
    *
    * get(5) or get(0, 5)
    *
    * @returns {Surface} the requested sub-surface
    */
   this.get = function() {
      var id = null;
      if (arguments.length === 2) {
         var x = arguments[0];
         var y = arguments[1];
         id = x + (y * cols);
      } else if (arguments.length === 1 && arguments[0] instanceof Array) {
         var x = arguments[0][0];
         var y = arguments[0][1];
         id = x + (y * cols);
      } else if (arguments.length === 1) {
         id = arguments[0];
      }
      if (id < surfaceCache.length) {
         return surfaceCache[id];
      }
      //throw new Error('SpriteSheet: bad arguments: ' + arguments[0] + ',' + arguments[1]);
   };

   /**
    * constructor
    */
   var imagePath = sheetSpec.image;
   var width = sheetSpec.width;
   var height = sheetSpec.height;

   var rows = sheetSpec.rows;
   var cols = sheetSpec.cols;

   // TODO
   // var spacing = sheetSpec.spacing || 0;
   var margin = sheetSpec.margin || 0;

   var image = gamejs.image.load(imagePath);

   if (!width) {
      width = parseInt((image.rect.width - (margin * cols)) / sheetSpec.cols, 10);
      height = parseInt((image.rect.height - (margin * rows)) / sheetSpec.rows, 10);
   }
   if (!cols) {
      rows = (image.rect.width - (margin * cols)) / width;
      cols = (image.rect.height - (margin * cols)) / height;
   }
   var surfaceCache = [];
   // height, y
   for (var j=margin;j<image.rect.height;j+=height+margin) {
      // width, x
      for (var i=margin; i<image.rect.width; i+=width+margin) {
         var srf = new gamejs.Surface([width, height]);
         var rect = new gamejs.Rect(i, j, width, height);
         srf.blit(image, new gamejs.Rect([0,0],[width,height]), rect);
         surfaceCache.push(srf);
      }
   }

   this.rect = new gamejs.Rect([0, 0], [width, height]);
   return this;
};

