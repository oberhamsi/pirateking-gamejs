var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');
var Boid = require('./boid').Boid;

var Flock = exports.Flock = function(config) {
	this.boids = [];
	this.center = null;
	this.centerWeight = null;
	this.velocityWeight = null;
	this.target = config.target || [0,0];
	this.chunk = config.chunk;
	this.allBoids = Flock.boids;
	/**
	var pos = config.pos;
	var side = Math.sqrt(config.size || 16);
	for (var i = 0; i < side; i++) {
		for (var j = 0; j < side; j++) {
			this.boids.push(new Boid({
				flock: this,
				pos: [
					pos[0] + i * Boid.SIZE * 1.5,
					pos[1] + j * Boid.SIZE * 1.5
				]
			}));
		}
	}
	**/
	return this;
}
Flock.boids = [];

Flock.prototype.createBoid = function(config) {
	var b = new Boid(gamejs.utils.objects.merge(config, {
		flock: this,
		pos: [0,0]
	}));
	this.boids.push(b);
	Flock.boids.push(b);
	return b;
}

Flock.prototype.draw = function(display) {
	this.boids.forEach(function(b) {
		b.draw(display);
	})
}
Flock.prototype.update = function(msDuration) {
	this.boids = this.boids.filter(function(b) {
		if (b.isDead === true) {
			gamejs.utils.arrays.remove(b, Flock.boids);
			gamejs.utils.arrays.remove(b, this.allBoids);
			return false;
		}
		return true;
	}, this)
	if (this.boids.length <= 0) return;

	var center = [0,0];
	var velocityWeight = [0,0];
	var updateCenterForBoid = function(boid) {		
		center = $v.add(center, boid.pos);
		velocityWeight = $v.add(velocityWeight, boid.vel);
	}
	this.boids.forEach(updateCenterForBoid);
	// following variables used by boids during their update process
	this.centerWeight = center.slice(0);
	this.center = $v.divide(center, this.boids.length);
	this.velocityWeight = velocityWeight;
	this.targetVector = $v.subtract(this.target, this.center);

	this.boids.forEach(function(b) {
		b.update(msDuration);
	});

	return center;
}