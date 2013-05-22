var gamejs = require('gamejs');
var $v = require('gamejs/utils/vectors');
var prng = require('../prng');

var Boid = exports.Boid = function(config) {
	this.flock = config.flock;
	this.pos = config.pos;
	this.vel = [0,0];
	this.oldVelocity = null;
	this.perceivedCenter = null;
	this.perceivedVelocity = null;
	this.forceUpdateCountDown = Boid.getUpdateDelta();
	this.speed = config.speed || 25;
	return this;
}
Boid.SIZE = 18;
Boid.getUpdateDelta = function() {
	return 50 + (prng.random() * 50);
}

Boid.prototype.update = function(msDuration) {
	this.forceUpdateCountDown -= msDuration;
	if (this.forceUpdateCountDown <= 0) {
		this.forceUpdateCountDown = Boid.getUpdateDelta();

		this.oldVelocity = this.vel.slice(0);
		var force = this.getMapForce();
		force = $v.add(force, this.getSeperationForce());
		force = $v.add(force, this.getAlignmentForce());
		force = $v.add(force, this.getCohesionForce());
		force = $v.unit(force);
		this.vel = $v.add(
			$v.divide(force, 2),
			$v.divide(this.oldVelocity, 2)
		);

		this.vel = $v.unit(this.vel);
	}
	this.pos = $v.add(
		this.pos,
		$v.multiply(this.vel, (msDuration/1000) * this.speed)
	);
	return true;
}

Boid.prototype.getSeperationForce = function() {
	var force = [0,0];
	var factor = 5;
	var updateForceForBoid = function(boid) {
		if (boid == this) return;

		var delta = $v.subtract(boid.pos, this.pos);
		var distance = $v.len(delta);
		if (distance < Boid.SIZE * 1.5 && distance != 0) {
			force = $v.subtract(force, delta);
		}
	}

	this.flock.allBoids.forEach(updateForceForBoid, this);
	return $v.multiply(force, factor);
}

Boid.prototype.getAlignmentForce = function() {
	var factor = 1/200;
	var fromCenter = $v.subtract(this.pos, this.flock.center);
	var perceivedCenter = (this.flock.boids.length < 2) ? this.pos : $v.divide(
		$v.subtract(this.flock.centerWeight, this.pos),
		this.flock.boids.length - 1
	);
	return $v.multiply(
		$v.subtract(perceivedCenter, this.pos),
		factor
	);
};

Boid.prototype.getCohesionForce = function() {
	var factor = 8;
	var perceivedVelocity = (this.flock.boids.length < 2) ? this.vel : $v.divide(
		$v.subtract(this.flock.velocityWeight, this.vel),
		this.flock.boids.length -1
	);
	var force = $v.divide(
		$v.subtract(perceivedVelocity, this.vel),
		factor
	);
	force = $v.add(force, $v.unit(this.flock.targetVector))
	return force;
}

var DIRECTIONS = [
	[0,1],[1,0],[-1,0],[0,-1],
	[1,1],[1,-1],[-1,1], [-1,-1]
];
DIRECTIONS.forEach(function(dir) {
	DIRECTIONS.push($v.multiply(dir,2));
});
Boid.prototype.getMapForce = function() {
	var factor = 400;
	var force = [0,0];
	var pos = [
		this.pos[0] | 0,
		this.pos[1] | 0
	];
	DIRECTIONS.forEach(function(dir, idx) {
		if (!this.flock.chunk.isMoveable($v.add(pos, dir))) {
			force = $v.add(force, $v.multiply(dir, -1));
		}
	}, this);
	return $v.multiply(force, factor);
}

Boid.prototype.draw = function(display) {
	gamejs.draw.circle(display, '#ff0000', this.pos, 5)
}