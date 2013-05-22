var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');
var SimplexNoise = require('./perlin').SimplexNoise;
var SpriteSheet = require('./spritesheet').SpriteSheet;
var astar = require('gamejs/pathfinding/astar');
var prng = require('./prng');

var BANDS = [
   {
      factor: 1/30, // the lower the number, the bigger the structures
      weight: 0.7
   },
   {
      factor: 1/30, // big number = high noise
      weight: 0.3
   },
   {
      factor: 1/15, // big number = high noise
      weight: 0
   }
];

   // position in spritesheet
   var NEIGHBOURS_TO_POSITION = {
      0: 4,

      // one neighbour
      2: 1,
      4: 3,
      8: 5,
      16: 7,

      // two neighbours in middle
      18: 4,
      12: 4,

      // 2 or 3 neighbours
      6: 0,
      14: 1,
      10: 2,
      22: 3,
      30: 4,
      26: 5,
      20: 6,
      28: 7,
      24: 8,
   }

   // position in spritesheet
   var WALL_NEIGHBOURS_TO_POSITION = {
      0: 4,

      // one neighbour
      2: 3,
      4: 0,
      8: 0,
      16: 3,

      // two neighbours in middle
      18: 3,
      12: 0,

      // two neighbors corner
      6: 5,
      14: 4,
      10: 4,
      // 3
      22: 4,
      26: 4,
      20: 0,
      28: 0,
      24: 0,
      // 4
      30: 4,
   };

var TILE_SIZE = 16;
var CHUNK_DIMENSIONS = [140, 140];
var TERRAIN_MAPPING = [
   {max:40, name: 'water', posMapping: NEIGHBOURS_TO_POSITION, color: '#0000ff'},
   {max:50, name: 'sand', posMapping: NEIGHBOURS_TO_POSITION, color: '#ffff00'},
   {max:51, name: 'sandwoods', posMapping: NEIGHBOURS_TO_POSITION, color: '#ffcc00'},
   {max:60, name: 'sand', posMapping: NEIGHBOURS_TO_POSITION, color: '#ffff00'},
   {max:80, name: 'dirt', posMapping: NEIGHBOURS_TO_POSITION, color: '#bab5ab'},
   {min: 80, max:160, name: 'gras', posMapping: NEIGHBOURS_TO_POSITION, color: '#267726'},
   {max:190, name: 'woods', posMapping: NEIGHBOURS_TO_POSITION, color: '#884631'},
   {max:230, name: 'hills', posMapping: NEIGHBOURS_TO_POSITION, color: '#565248'},
   {max:255, name: 'mountains', posMapping: NEIGHBOURS_TO_POSITION, color: '#000000'},

   {max:257, name: 'bricks', posMapping: WALL_NEIGHBOURS_TO_POSITION, color: '#df421e'},
   {min: 258, max:266, name: 'extras', color: '#ff3399'},
   {max:268, name:'crater', posMapping: NEIGHBOURS_TO_POSITION, color: '#330066'}
];



/**
 * Map
 */
var Map = exports.Map = function() {

   this.getChunk = function(topleft) {
      return (new Chunk(topleft, CHUNK_DIMENSIONS));
   };

   return this;
};

Map.getRangeForN = function(n) {
   var range = null;
   TERRAIN_MAPPING.some(function(r) {
      range = r;
      if (n <= r.max) {
         return true;
      }
      return false;
   });
   return range;
}

/**
 * ChunkRender
 */
var ChunkRenderer = exports.ChunkRenderer = function(chunk) {

   // FIXME init once per game
   TERRAIN_MAPPING = TERRAIN_MAPPING.map(function(range) {
      range.sheet = new SpriteSheet({
         image: './images/terrain/' + range.name + '.png',
         cols: 3,
         rows:3
      });
      return range;
   });

   var DIRECTIONS = {
      2: [0,1],
      4: [1,0],
      8: [-1,0],
      16: [0,-1]
   };

   var imageForNeighbours = function(myRange, pos) {
      var sum = 0;
      for (var key in DIRECTIONS) {
         var dir = DIRECTIONS[key];
         key = key | 0;
         var x = pos[0] + dir[0];
         var y = pos[1] + dir[1];
         if (x < 0 || y < 0 || x > chunk.data.length-1 || y > chunk.data[0].length-1) {
            sum += key;
            continue;
         }
         var n = chunk.data[x][y];
         var range = Map.getRangeForN(n);
         if (range.name === myRange.name ||
            myRange.name === 'sand' && (range.name === 'water' || range.name === 'sandwoods') ||
            range.name === 'extras' || range.name === 'crater'
         ) {
            sum += key;
         }
      };
      return myRange.sheet.get(myRange.posMapping[sum]);

   }

   var renderToSurface = function(surface, i, j) {
      var n = chunk.data[i][j];
      var range = Map.getRangeForN(n);
      var screenPos = [i * TILE_SIZE , j * TILE_SIZE ];
      if (range.name === 'extras') {
         surface.blit(range.sheet.get(n - range.min), screenPos)
      } else {
         var image = imageForNeighbours(range, [i,j]);
         surface.blit(image, screenPos)
         if (range.name === 'gras') {
            var darkness = (n - range.min) / (range.max - range.min);
            var srf = new gamejs.Surface([TILE_SIZE, TILE_SIZE]);
            srf.fill('rgba(0, 255, 0, ' + (1-darkness) * 0.4 + ')');
            surface.blit(srf, screenPos)
         }
      }
   }

   this.getSurface = function() {
      if (this.surface) return this.surface;

      this.surface = new gamejs.Surface($v.multiply(chunk.dimensions, TILE_SIZE));
      for (var i = 0; i < chunk.dimensions[0]; i++) {
         for (var j = 0; j < chunk.dimensions[1]; j++) {
            renderToSurface(this.surface, i, j);

         }
      }
      return this.surface;
   };

   this.getPreviewSurface = function() {
      var PREVIEW_TILE_SIZE = 3;
      var surface = new gamejs.Surface($v.multiply(chunk.dimensions, PREVIEW_TILE_SIZE));
      var rect = new gamejs.Rect([0,0], [PREVIEW_TILE_SIZE, PREVIEW_TILE_SIZE]);
      for (var i = 0; i< chunk.dimensions[0]; i++) {
         for (var j = 0; j< chunk.dimensions[1]; j++) {
            var n = chunk.data[i][j];
            var range = Map.getRangeForN(n);
            rect.topleft = [i * PREVIEW_TILE_SIZE, j * PREVIEW_TILE_SIZE];
            gamejs.draw.rect(surface, range.color, rect, 0);
         }
      }
      return surface;
   }

   this.redraw = function(rect) {
      if (rect.left < 0) rect.left = 0;
      if (rect.top < 0) rect.top = 0;
      if (rect.right > chunk.dimensions[0]) rect.right = chunk.dimensions[0];
      if (rect.bottom > chunk.dimensions[1]) rect.bottom = chunk.dimensions[1];

      for (var i = rect.left; i < rect.right; i++) {
         for (var j = rect.top; j < rect.bottom; j++) {
            renderToSurface(this.getSurface(), i, j);
         }
      }
   }

   this.addBlood = function(pos) {
      var srf = this.getSurface();
      var idx = (prng.random() * 9) | 0;
      srf.blit(blood.get(idx), pos);
   }

   var blood = new SpriteSheet({
      image: './images/blood.png',
      cols: 2,
      rows: 5
   });

   return this;
};


/**
 * Chunk
 */
var Chunk = exports.Chunk = function(topleft, dimensions, data, bases) {
   this.topleft = topleft;
   this.dimensions = dimensions;

   this.viewZoom = 1;
   this.aiZoom = 1;

   // FIXME
   this.data = data || this.generate(this.viewZoom);
   this.bases = bases || this.spawnBases();

   this.astarMap = new AChunk(this.data);
   if (!gamejs.worker.inWorker) {
      this.renderer = new ChunkRenderer(this);
   }

   return this;
};

Chunk.load = function(chunk) {
   return (new Chunk(chunk.topleft, chunk.dimensions, chunk.data, chunk.bases));
}

Chunk.prototype.save = function() {
   return {
      topleft: this.topleft,
      dimensions: this.dimensions,
      data: this.data,
      bases: this.bases
   }
}

Chunk.prototype.generate = function(zoom, dimensionFactor) {
   // init
   dimensionFactor = dimensionFactor || 1;
   var SIMPLEX = new SimplexNoise(prng);
   var startMs = Date.now();
   var data = [];
   for (var i = this.topleft[0]; i < this.dimensions[0] * dimensionFactor; i++) {
      var row = [];
      for (var j = this.topleft[1]; j < this.dimensions[1] * dimensionFactor; j++) {
         var n = 0;
         BANDS.forEach(function(band) {
            noise = SIMPLEX.noise(i * band.factor * zoom, j * band.factor * zoom) * band.weight;
            n += noise;
         }, this);
         n = parseInt(127.5 + (n * 127.5), 10);
         row.push(n);
      }
      data.push(row);
   }
   // add hills and water
   // FIXME hills are not SIMPLE reproducible
   var dimHalf = $v.divide(this.dimensions, 2);
   var radius = Math.max(this.dimensions[0], this.dimensions[1]) * 0.4;
   var maxY = Math.pow(radius,2);
   var center = dimHalf;
   var waterBorderSize = 3;
   for (var i = this.topleft[0]; i < this.dimensions[0] * dimensionFactor; i++) {
      for (var j = this.topleft[1]; j < this.dimensions[1] * dimensionFactor; j++) {

         // fix water at borders
         if (i < this.topleft[0] + waterBorderSize ||
            j < this.topleft[1] + waterBorderSize ||
            i > this.dimensions[0] * dimensionFactor - waterBorderSize ||
            j > this.dimensions[1] * dimensionFactor - waterBorderSize)
         {
            data[i][j] = 0;
         } else {
            var z = Math.pow(radius,2) -
                        (Math.pow(i - center[0],2) + Math.pow(j - center[1],2));
            z /= maxY; // z is now in range -1 to 1
            //z *= 0.15;
            if (z > 0) {
               z = 0;
            }
            //z = (0.5 + z/2); // z is now in range 0 to 1
            //if (z < -1) z = -1;
            //z /= 100;
            data[i][j] += (z * 128);
         }
      }
   }
   gamejs.info('Chunk', this.topleft, this.dimensions, 'generated in', Date.now() - startMs, ' ms');
   return data;
}

   var basePattern = [
[0,0,259,259,259,0,0],
[0,0,259,259,259,0,0],
[259,0,0,259,0,0,259],
[0,259,0,0,0,259,0],
[0,0,259,0,259,0,0],
[0,0,0,259,0,0,0],
[0,0,259,0,259,0,0],
[0,0,259,0,259,0,0],
[0,0,259,0,259,0,0],
[0,259,259,0,259,259,0],
   ]
Chunk.prototype.spawnBases = function() {
   var bases = [];
   var posGenFn = this.getSpiralPosGenerator();
   for (var i = 0; i < 3; i++) {
      var pos = posGenFn();
      basePattern.forEach(function(row, r) {
         row.forEach(function(val, c) {
            if (val === 0) return;

            var blockPos = this.viewToMap($v.add(pos, [r * 16,c * 16]));
            this.modify(blockPos, val, true);
         }, this);
      }, this);
      bases.push({
         pos: pos,
         isDead: false
      })
      //gamejs.log('created enemy base at ' + pos)
   }
   return bases;
}


Chunk.prototype.findRoute = function(origin, destination, timeout) {
   origin = this.viewToAiMap(origin);
   destination = this.viewToAiMap(destination);
   var startMs = Date.now();
   var route = astar.findRoute(this.astarMap, origin, destination, timeout || 50);
   var r = [];
   while (route) {
      r.push(route.point);
      route = route.from;
   }
   r.reverse();
   gamejs.info('Findroute from', origin,'to', destination, 'with length', r.length, 'generated in', Date.now() - startMs, ' ms');
   return r.filter(function(p, idx) {
      return idx % 4 === 0 || idx === r.length -1 || idx < 3;
   }, this).map(function(p) {
      return $v.multiply(p, 16 * (this.aiZoom/this.viewZoom));
   }, this);
}

Chunk.prototype.isMoveable = function(pos) {
   pos = [
      (pos[0] / TILE_SIZE) | 0,
      (pos[1] / TILE_SIZE) | 0
   ]
   if (pos[0] < 0 || pos[0] > this.data.length - 1 ||
      pos[1] < 0 || pos[1] > this.data[0].length - 1) {
         return false;
   }
   var n = this.data[pos[0]][pos[1]];
   var range = Map.getRangeForN(n);
   return ['sand', 'gras', 'dirt', 'crater'].indexOf(range.name) > -1;
}

Chunk.prototype.viewToAiMap = function(pos) {
   return [
      (pos[0] / (TILE_SIZE * (this.aiZoom/this.viewZoom))) | 0,
      (pos[1] / (TILE_SIZE * (this.aiZoom/this.viewZoom))) | 0
   ]
}

Chunk.prototype.viewToMap = function(pos) {
   pos = [
      (pos[1] / TILE_SIZE) | 0,
      (pos[0] / TILE_SIZE) | 0
   ]
   return pos;
};

Chunk.prototype.mapToView = function(pos) {
   pos = [
      pos[0] * TILE_SIZE,
      pos[1] * TILE_SIZE
   ];
   return pos;
}

Chunk.prototype.modify = function(pos, newType, disableRedraw) {
      if (pos[0] < 0) return;
      if (pos[1] < 0) return;
      if (pos[0] >= this.dimensions[0]) return;
      if (pos[1] >= this.dimensions[1]) return;

   this.data[pos[0]][pos[1]] = newType;
   var redrawWidth = 10;
   var rect = new gamejs.Rect($v.subtract(pos, [redrawWidth/2,redrawWidth/2]), [redrawWidth,redrawWidth]);
   if (disableRedraw !== true) {
      this.renderer.redraw(rect);
   }
   return rect;
}

Chunk.prototype.getPosition = function(pos, variance, force) {
   var dims = $v.multiply(this.dimensions, TILE_SIZE);
   var origPos = pos && pos.slice(0) || [prng.rand(dims[0] * 0.2,dims[0] * 0.8), prng.rand(dims[1] * 0.2,dims[1] * 0.8)];
   variance = Math.min(variance || dims[0]/2, origPos[0], origPos[1], dims[0] - origPos[0], dims[1] - origPos[1]);
   var mapPos = origPos.slice(0);
   var tries = 0;
   var maxTries = 200;
   while (!this.isMoveable(mapPos) && tries < maxTries) {
      mapPos = $v.add(origPos, [prng.rand(-variance,variance), prng.rand(-variance,variance)]);
      tries++;
      if (tries >= maxTries && pos === undefined) {
         origPos = [prng.rand(dims[0] * 0.2,dims[0] * 0.8), prng.rand(dims[1] * 0.2,dims[1] * 0.8)];
         tries = 0;
      }
   }
   if (tries === maxTries && !force) {
      return null;
   }
   return mapPos;
}

Chunk.prototype.getSpiralPosGenerator = function() {
   var spiralPos = function(t) {
      var a = 1;
      var n = 1;
      return [
         a * Math.pow(t, 1/n) * Math.cos(t),
         a * Math.pow(t, 1/n) * Math.sin(t)
      ];
   }
   var self = this;
   var factor = prng.rand(100, 200);
   var center = $v.multiply(self.dimensions, TILE_SIZE/2);
   var next = function() {
      next.idx++;
      var spos = $v.add(
         center,
         spiralPos(next.idx * factor)
      );
      return self.getPosition(spos);
   }
   next.idx = 1;
   return next;
}

/**
 *
 */
var AChunk = exports.AChunk = function(data) {
   this.data = data;
   return this;
}
AChunk.prototype.adjacent = function(origin) {
   var ps = [];
   for (var i=-1;i<2;i++) {
      for (var j=-1;j<2;j++) {
         var p = $v.add(origin, [i,j])
         if (this.isMoveable(p)) {
            ps.push(p);
         }
      }
   }
   return ps;
}
AChunk.prototype.isMoveable = function(pos) {
   if (pos[0] < 0 || pos[0] > this.data.length - 1 ||
      pos[1] < 0 || pos[1] > this.data[0].length - 1) {
         return false;
   }
   var n = this.data[pos[0]][pos[1]];
   // FIXME can be hardcoded for faster lookup
   var range = Map.getRangeForN(n);
   return ['water', 'hills', 'mountains', 'woods', 'sandwoods'].indexOf(range.name) == -1;
}
AChunk.prototype.equals = function(a, b) {
   return a[0] === b[0] && a[1] === b[1];
}
AChunk.prototype.estimatedDistance = function(a, b) {
   return $v.distance(a,b);
}
AChunk.prototype.actualDistance = function(a, b) {
   var na = this.data[a[0]][a[1]];
   var nb = this.data[b[0]][b[1]];
   var dist = $v.distance(a,b);

   if (na > nb) return dist / 100;
   if (na < nb) return dist * 100;
   return dist;
}

AChunk.prototype.hash = function(a) {
   return a[0] +'/'+ a[1];
}
