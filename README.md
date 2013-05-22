Pirate King
==============

Survive on a mysterious pacific island populated by evil souls.

About the code
=====================

The working title for this was "perlintest". At it's core, it generates a smooth, 2D tiled island based on noise data.

boids/boid.js & flock.js
------------------

The boid code is a pretty literal translation of [Reynolds](http://www.red3d.com/cwr/boids/) pseudocode. Except that I added a "map force" in addition to the traditional forces. The "map force" pushes the individual boids away from unwalkable areas. This means that boids can and do walk over unwalkable tiles, they just *avoid* doing that. The whole swarm containing a boid will follow the proper, walkable A* path but individual boids will stray of a bit. I sometimes have 30 or more fast moving enemies on screen and can't possibly run expensive path finding for every single one of them. That sounds like a bug but keep in mind that most units are floating souls...

world.js
-----------------------

Generate noise data and render it as a 2D tiled map. Three classes are doing the heavy lifting: `Chunk`, `AChunk` and `ChunkRenderer`.

`Chunk`

generates the 2d array of noise data. It those so by layering multiple bands of noise on top of each other because otherewise we'd get a pretty uniform, boring map.

`AChunk`

"AChunk" as in "A* pathfinding chunk". This class implements the `gamejs.pathfinding.astar.Map` interface. It holds a lower resolution data of the `Chunk` of our current island to be queried by the pathfinding.

`ChunkRenderer`

Each of the eleven tiles (e.g., gras, water, sand, etc.) comes in nine versions (i.e. four corners, one center piece and four edge pieces). All nine versions are in one image. If you split this image in 3x3 pieces, you will get the nine versions:

![Water tile](/images/terrain/water.png)

The eight corners and edges (so everything except the center piece) are necessary for transition from one tile type to another tile type. Depending on the neighbours of a tile, we need to figure out which of those nine versions to display. For example, if all neighbours are of the same type as the tile itself, we can use the center tile. If it has one side with a different neighbour, we use an edge pieces, etc. Nine pieces is not enough for all combinations of neighbours possible but I made sure that the cases for which I didn't have images will not appear in the map by tuning the noise.

Initially, I wanted to have multiple islands per world. And that's why there is a `Map` which can hold several `Chunk`s (each of which is a complete island). Ignore all that: I never load more than one Chunk in a game.


The long story of how I got A* to perform in a browser environment
=====================================

I knew A* is expensive so I planned to do the path-finding on a lower resolution version of the 2d data. The full resolution 2d array I use to render the map is 140x140. For that size it too long to find a path on a typical map; the game would often skip a dozen frames or more and what was even worse: it would ignore any input during that time. Stutter galore! I *tried* to solve this by zooming the perlin noise out, which give me the same landscape in a lower resolution. I could than do the pathfinding queries on a - say - 70x70 grid and get roughly the same result unless there are too may small map features, which disappear in the zoomed out version. I got this to work with a 5x zoom. 

The lower resolution pathfinding did help a lot with performance but it still took too long to get a path. As I later found out, in one situation it was particularly noticable: when the player fights enemy swarms. Basically, when enemies and the player are on the same screen (combat is near!) I have to run A* much more frequently for the enemies to create attack behaviours different from a bull just trying to ram a target. This nearly killed the project: the game performed worst in the most interesting situation.

Half a year later it became feasible to use WebWorkers in most browsers. Once I had access to WebWorkers in GameJs (thanks to the [gamejs/worker](http://docs.gamejs.org/gamejs/worker/) module) I had a whole CPU just for crunching on my A* queries. This made all my A* performance problems go away and I ended up using the same grid size for A* as for rendering the map (by setting zoom to "1x"...).

One caveat: this kind of asynchronous A* is not going to work for any game. There is a considerable delay between requesting a path and actually getting the path information. But what WebWorkers helped me with is that the game doesn't block (it keeps rendering and I can recieve and react to player input). And for Pirate King, the pathfinding delay is problem because the individual boids will continue buzzing around even if no new waypoint is set.

Credits
==========

The simplex noise generator was written by Sean McCullough. The particles (blood!) engine is a modified version of the particle code from Michael Campagnaro.

Graphics and sound:

 * <http://opengameart.org/content/16x16-fantasy-pixel-art-vehicles>
 * <http://opengameart.org/content/16x16-overworld-tiles>
 * <http://opengameart.org/content/twelve-more-16x18-rpg-character-sprites>
 * <http://opengameart.org/content/twelve-16x18-rpg-character-sprites-including-npcs-and-elementals>
 * <http://opengameart.org/content/chaingun-pistol-rifle-shotgun-shots>
 * <http://opengameart.org/content/16x18-zombie-characters-templates-extra-template>
 * <http://opengameart.org/content/16x16-indoor-rpg-tileset-the-baseline>
 * <http://opengameart.org/content/twelve-16x18-rpg-sprites-plus-base>
 * <http://opengameart.org/content/town-tiles>
 * <http://opengameart.org/content/golgotha-effects-textures-weaponflashjpg>
 * <http://opengameart.org/content/16x16-16x24-32x32-rpg-enemies-updated>
 * <http://opengameart.org/content/halloween-gift-for-oga>
 * <http://opengameart.org/content/objects-for-16x16-tilesets>
 * <http://opengameart.org/content/fireball-spell>
 * <http://opengameart.org/content/oldschool-bomb>
 * <http://opengameart.org/content/16x16-pixel-art-dungeon-wall-and-cobblestone-floor-tiles>
 * <http://opengameart.org/content/lightning-shock-spell>
 * <http://opengameart.org/content/keyboard-keys>
 * <http://opengameart.org/content/flying-coins-loot>
 * <http://opengameart.org/content/48x48-faces-3rd-sheet>
 * <http://www.freesound.org/people/kantouth/sounds/104397/>
 * <http://opengameart.org/content/2-wooden-squish-splatter-sequences>
 * <http://opengameart.org/content/inventory-sound-effects>
 * <http://opengameart.org/content/short-medieval-loop>
 * <http://opengameart.org/content/discordance>
 * <http://opengameart.org/content/nail-bytint>
 * <http://opengameart.org/content/2-explosions>
 * <http://opengameart.org/content/ticking-clock>
 * <http://opengameart.org/content/rpg-icons>

![CC0](http://i.creativecommons.org/p/zero/1.0/88x31.png)

To the extent possible under law, the developers of the Pirate King source code have waived all copyright and related or neighboring rights to Pirate King. This work is published from: Austria. 
