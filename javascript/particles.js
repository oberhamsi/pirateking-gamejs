var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

/* Author: Michael Campagnaro */
/* https://github.com/mikecampo/canvas-particles */

/* Somewhat adapted for GameJs by Simon Oberhammer */
var id = 0;
function nextId() {
    return id += 1;
}

var SIZE_SCALE = 0.5;
function Particle() {
    this.id = nextId();
    this.colour = '#ff0000';
    this.pos = [0,0];
    this.vX = 0;
    this.vY = 0;
    this.radius = 1;
    this.createdAt = (new Date()).getTime();
    this.life = Math.floor(Math.random()* 300 + 1);
    
    this.friction = 0.96;
    
    // for speed/sizing
    this.maxStopSize = 0.4;
    this.slowThreshold = 0.6;
    
    //
    this.lastScaledAvgVel = 0;
    
    this.isAlive = function(now) {
        return this.life && now - this.createdAt < this.life * 1000;
    };
    
    this.update = function(dt) {
        var x  = this.pos[0];
        var y  = this.pos[1];
        var vX = this.vX;
        var vY = this.vY;

        vX *= this.friction;
        vY *= this.friction;

        var absVX = Math.abs(vX);
        var absVY = Math.abs(vY);
        var avgVel = (absVX + absVY) * .5;

        // speed up particles that are slow
        if (absVX < this.slowThreshold) {
            vX *= Math.random() * 2 + 0.2;
        }
        if (absVY < this.slowThreshold) {
            vY *= Math.random() * 2 + 0.2;
        }

        this.lastScaledAvgVel = avgVel * SIZE_SCALE;


        this.vX = vX;
        this.vY = vY;
        this.pos = [
         x + vX,
         y + vY
        ];
    };
    
    this.draw = function(display, viewRect) {
      // FIXME
      var drawRadius = Math.max(Math.min(this.lastScaledAvgVel , 9.5), this.maxStopSize);
      // danger hack
     // this.ctx.globalCompositeOperation = "source-over";
     //  this.ctx.fillStyle = "rgba(8,8,12,.65)";
     //  this.ctx.fillRect(0, 0, this.canvas.width , this.canvas.height );
     //  this.ctx.globalCompositeOperation = "lighter";
      gamejs.draw.circle(display, this.colour, [
        this.pos[0] - viewRect.topleft[0],
        this.pos[1] - viewRect.topleft[1]
        ], drawRadius, 0);
    };
    
    return this;
}


// options { x, y, delay, numParticles, createFunc, modifierFunc }
var Emitter = exports.Emitter = function(options) {
    this.options = options || {};
    this.pos = [0,0];
    this.delay = options.delay;
    this.numParticles = options.numParticles;
    this.modifier = options.modifierFunc || function(){};
    this.initialize.call(this, options);
    this.particles = [];
    return this;
};

Emitter.prototype = {
    intervalId: null,
    name: 'bob',

    initialize: function(options) {},
    
    start: function() {
        var self = this;
        this.intervalId = setInterval(function() { 
            Emitter.createParticleSet.call(self, self.pos, self.numParticles, self.modifier);
        }, this.delay);
        return this;
    },
    
    stop: function() {
        clearInterval(this.intervalId);
        this.intervalId = null;
    },
    
    update: function(msDuration) {
       var dt = msDuration;
       // FIXME we need this for particle.isAlive() but particles too
       // should depend on msDuration as passed by gamejs
       var now = Date.now();
       var removeList = [];

       // update particles
       objects.keys(this.particles).forEach(function(key) {
           var particle = this.particles[key];
           if (!particle.isAlive(now)) {
               removeList.push(particle.id);
           } else {
               particle.update(dt);
           }
       }, this);
       this.removeDeadParticles(removeList);
    },
    
    draw: function(display, viewRect) {
      // FIXME special source/in out blending
      objects.keys(this.particles).forEach(function(key) {
         this.particles[key].draw(display, viewRect);
      }, this);
    },
    
    isRunning: function() {
      this.intervalId !== null;
    },
   createParticle : function(pos, modifierFunc) {
       
       var m = new Particle();
       m.pos  = pos.slice(0);
       
       var attrs = { 
           xVel: undefined, 
           yVel: undefined,
           life: m.life
       };
       
       if (modifierFunc) {
           attrs = modifierFunc(m);
       }
       
       if (typeof attrs.xVel == 'undefined') attrs.xVel = Math.random() * 4;
       if (typeof attrs.yVel == 'undefined') attrs.yVel = Math.random() * 4;
       
       m.vX = attrs.xVel;
       m.vY = attrs.yVel;
       m.life = attrs.life || m.life;
       m.colour = attrs.colour || m.colour;
       
       this.particles[m.id] = m;
       return m;
   },
   removeDeadParticles: function(dead) {
       // remove dead particles
       for (var i = 0; i < dead.length; i++) {
           delete this.particles[dead[i]];
       };
   }
};

/* optional: numParticles, modifierFun */
Emitter.createParticleSet = function(pos, numParticles, modifierFunc) {
    var modifier = modifierFunc;
    
    if (typeof numParticles === 'function') {
        modifier = numParticles;
        numParticles = null;
    }
    
    var particleSet = [];
    var num = numParticles;
    for (var i = 0; i < num; i++) {
        var p = this.createParticle(pos, modifier);
        particleSet.push(p);
    }
    return particleSet;
}

var Modifiers = exports.Modifiers = {
    ring: function(energy, life, colour) { 
        energy = energy || 15;
        return function(p) {
            return {
                xVel: Math.cos(p.id) * energy,
                yVel: Math.sin(p.id) * energy,
                life: life || 0.6,
                colour: colour
            }
        }
    }, 
    explosion: function(energy, life, colour) {
        return function(p) {
            energy = energy || 20;
            return {
                xVel: Math.cos(p.id) * Math.random() * energy,
                yVel: Math.sin(p.id) * Math.random() * energy,
                life: life || 1,
                colour: colour
            }
        }
    },
    tail: function(energy, life, colour, velocity) {
        energy = energy || 15;
        return function(p) { 
            return { 
                xVel: velocity[0] * energy + (Math.random() * energy/4), 
                yVel: velocity[1] * energy + (Math.random() * energy/4),
                life: life || 1.4,
                colour: colour
            };
        }
    }
};

