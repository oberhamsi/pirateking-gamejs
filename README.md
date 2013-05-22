Pirate King
==============

Survive as long as you can on a mysterious island populated by evil souls.

About the code
=====================

The working title for this was "perlintest". At it's core, it generates a smooth, 2D tiled island based on noise data.

world.js
-----------------------

Generate 2d noise data and render the data as a 2D tiled map.

There's three Very Important Classes in here: `Chunk`, `AChunk` and `ChunkRenderer`.

`Chunk` generates the 2d array of noise data. After the map array is filled by simplex, I create a water border around the edges (because it's an island...).
   
`AChunk` as in "A* pathfinding chunk". This class implements the `gamejs.pathfinding.astar.Map` interface. It holds a lower resolution data of the current island and provides methods to query it (which tile types are walkable? what other tiles is a tile connected to?).

`ChunkRenderer` each of the eleven tiles (e.g., gras, water, sand, etc.) comes in nine versions (i.e. four corners, one center piece and four edge pieces). All nine versions are in one image (imagine a regular 3x3 grid on top of this image):

![Water tile](/images/terrain/water.png)

The corners and edges are necessary for transition from one tile type to another. Depending on neighbours on a tile, we need figure out, which of those nine versions to display. For example, if all neighbours are of the same type as the tile itself, we can use the center tile. If it has one side with a different neighbour, we use an edge pieces, etc. If you are paying attention, you should have noticed that nine pieces is not enough for all combinations of neighbours possible! But I made sure that the cases for which I didn't have images will not appear by tuning the noise.

Initially, I wanted to have multiple islands per world. And that's why there is a `Map` which can hold several `Chunk`s (each of which is a complete island). Ignore all that.

boids/boid.js & flock.js
------------------

The boid code is a pretty literal translation of [Reynolds](http://www.red3d.com/cwr/boids/) pseudocode. Except that I added a "map force" in addition to the traditional forces ("seperation", "alignment" and "cohesion"). The "map force" pushes the individual boids away from unwalkable areas. This means that boids *can* walk over unwalkable tiles, they just avoid it. Only the whole swarm will follow the proper A* path, but individual boids might stray of a bit. I sometimes have 30 or more fast moving units on screen and can't possibly run expensive path finding for every single one of them. That sounds like a bug but keep in mind that most units are floating souls (all the fast ones are, which are most prone to running away to far from the best path).

explosion.js
----------------

Interesting to the GameJs and PyGame crowd: it's a `gamejs.sprite.Sprite` implementation which explodes any `Surface` into a specific direction.


The long story of how I got A* to perform in a browser environment
=====================================

I knew A* is slow so I wanted to do the path-finding on a lower resolution version of the 2d data. The 2d array I use to render the map is 140x140. It took way to long to get a path - the game would often skip 10 frames or more and what was even worse: it would ignore any input during that time. Stutter galore! I *tried* to solve this by "zooming" the perlin noise out, which give me the same landscape in a lower resolution. This also meant smaller features were no longer present in the zommed out version but my maps didn't have those and without too much zooming out, it shouldn't make much of difference.

I got this to work with a 5x zoom. That did help a lot with performance but it still took too long to get a path. As I later found out, in one situation it was very noticable: when enemy swarms and the player character are fighting. Basically, when enemies and the player are on he same screen I have to run A* much more frequently to create attack behaviours different from a bull just trying to ram into the target. This nearly killed the project: the game performed worst in the most interesting situation.

Half a year later it became feasible to use WebWorkers. Once I had those in gamejs (thanks to the [gamejs/worker](http://docs.gamejs.org/gamejs/worker/) module) I basically had a whole CPU just for crunching on A*. This made all my A* performance problems go away and I ended up using the same grid size for A* as for rendering the map (by setting zoom to "1x"...).

One caveat: this kind of asynchronous A* is not going to work for any game. There's still a considerable delay for requiring a path, but at least with a Worker the game doesn't block (it keeps rendering and recieving input). And for Pirate King, that is alright because the individual boids will continue buzzing around even if no new waypoint is set. The fact that the boids are still hovering at the last waypoint, waiting for a new path, is hardly noticable to the player.

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


