var SpriteSheet = require('./spritesheet').SpriteSheet;

var Animation = exports.Animation = function(config) {
	// FIXME cache read-only spritesheets per game
	this.sheet =  new SpriteSheet(config.spriteSheet);
   this.directions = config.spriteSheet && config.spriteSheet.directions;
   this.frameMs = config.frameMs || Animation.FRAME_MS;
   this.steps = config && config.spriteSheet && config.spriteSheet.cols - 1 || 2;
   this.animation = 0;
   this.step = 0;
   this.countDown = this.frameMs;
   this.image = this.sheet.get(this.step, this.direction);
   this.direction = null;
   return this;
}
Animation.FRAME_MS = 250;

Animation.prototype.setDirection = function(newDirection) {
   if (!this.direction || this.direction !== newDirection) {
   	this.animation = this.directions[newDirection].animation;	
      this.countDown = 0;
      this.update(0);
      this.direction = newDirection;
   }
}

Animation.prototype.update = function(msDuration) {
   // update animation
   this.countDown -= msDuration;
   if (this.countDown <= 0) {
      this.countDown = this.frameMs;
      this.step++;
      if (this.step > this.steps) {
         this.step = 0;
      }
      this.image = this.sheet.get(this.step, this.animation);
   }
}
