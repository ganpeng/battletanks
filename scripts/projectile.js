/*
* Public Object: Projectile
*
* A Projectile object constructor
*
* Parameters:
*   specs - contains the following properties: speed, damage, angle, oX, oY, srcId, srcType
*/
function Projectile(specs) {
    this.mods = typeof specs.mods === 'undefined' ? [] : specs.mods;
    this.events = new EventEmitter();

    this.config = {
        active     : true,
        speed      : specs.speed,
        damage     : specs.damage,
        critChance : specs.critChance,
        critMultiplier : specs.critMultiplier || 2,
        angle      : specs.angle,
        oX         : specs.oX,
        oY         : specs.oY,
        srcId      : specs.srcId,
        srcType    : specs.srcType,
        origin     : {x: specs.oX, y: specs.oY},
        lastPos    : {x: specs.oX, y: specs.oY},
        objectHit  : {type: 'none', obj: null},
        PoI        : {x: 0, y: 0}, // Point of impact of the last collision
        sideHit    : 0 // Side hit (if square)
    };
}

Projectile.prototype.update = function (modifier) {
    var p = this.config;
    var angleInRadians = p.angle * Math.PI / 180;
    
    // Save last position.
    p.lastPos = {x: p.oX, y: p.oY};
    
    // Update projectile position.
    p.oX = p.oX + (p.speed * modifier * Math.cos(angleInRadians));
    p.oY = p.oY + (p.speed * modifier * Math.sin(angleInRadians));
    
    // Check for collisions. First check if it has reached the canvas outer boundary.
    if (this._hasHitBoundary(p.oX, p.oY) === true) {
        if (p.srcType === 'projectile-barrier') return; // projectile barriers are unaffected by boundaries
        this.death();
        
        p.objectHit = {type: 'boundary', obj: null};
        GLOBALS.flags.clean.projectiles++;
    }
    else {
        // Check if it hit a tank.
        var result = this._hasHitTank(tanks, p.oX, p.oY, p.lastPos.x, p.lastPos.y);
        if (result.hit === true) {
            this.death();
            var t = result.tank;
            
            // Call tank hit method. Pass the projectile that hit it.
            t.hit(this);
            
            p.objectHit = {type: 'tank', obj: t};
            GLOBALS.flags.clean.projectiles++;
        }
        else {
            // Check if it hit a destructible.
            var resultD = this._hasHitDestructible(destructibles, p.oX, p.oY, p.lastPos.x, p.lastPos.y);
            if (resultD.hit === true) {
                if (resultD.destructible.config.mod !== 'rubber') {
                    this.death();
                }
                var d = resultD.destructible;
                
                p.PoI = resultD.poi;
                p.sideHit = resultD.sideH;

                // Call destructible hit method.
                d.hit(this);
                
                p.objectHit = {type: 'destructible', obj: d};
                GLOBALS.flags.clean.projectiles++;
            }
        }
    }
    
    // Apply all mods
    for (var i = 0; i < this.mods.length; i++) {
        this.mods[i](this);
    }
};

Projectile.prototype.draw = function (ctx, xView, yView) {
    var p = this.config;    
    ctx.beginPath();
    ctx.arc(p.oX - xView, p.oY - yView, 1.5, 0, fullArc, false);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
};

Projectile.prototype._hasHitBoundary = function (x, y) {      
    return (x < 0 || x > WORLD_WIDTH || y < 0 || y > WORLD_HEIGHT);
};

Projectile.prototype._hasHitDestructible = function (destructibles, x, y, lx, ly) {
    var p = this.config;
    for (var i = 0; i < destructibles.length; i++) {
        var d = destructibles[i].config;
        
        if (d.active === false || d.mod === 'low-lying') continue; // Skip inactive destructibles
        
        // let's check if they're even remotely colliding
        if (!UTIL.geometry.pointLiesInsidePointSquare([x, y], [d.oX, d.oY], d.size + d.size/2)) {
            // nope they're too far to even collide, check the next one
            continue;
        }
        else if (d.mod !== 'rubber' || p.speed === 0) {
            // if the current destructible we're checking is not rubbery, then we can skip the expensive intersection cd algorithm
            // this time check if point is inside using the actual destructible size
            if (UTIL.geometry.pointLiesInsidePointSquare([x, y], [d.oX, d.oY], d.size/2)) {
                return { hit: true, poi: { x: x, y: y }, sideH: 0, destructible: destructibles[i] };
            }
        }
        
        var lineX = UTIL.geometry.lineAxPaRectIntersect({ hl: d.size, vl: d.size, x: d.oX, y: d.oY }, { Ax: x, Ay: y, Bx: lx, By: ly });
        if (lineX.yes) {
            return { hit: true, poi: lineX.PoI, sideH: lineX.sideIndex, destructible: destructibles[i] };
        }
    }
    return { hit: false, poi: null, sideH: null, destructible: destructibles[i] };
};

Projectile.prototype._hasHitTank = function (tanks, x, y, lx, ly) {
    for (var i = 0; i < tanks.length; i++) {
        var t = tanks[i].config;
        if (t.active === false) continue; // Skip inactive tanks
    
        // let's check if they're even remotely colliding
        if (!UTIL.geometry.pointLiesInsidePointSquare([x, y], [t.oX, t.oY], t.width + t.width/2)) {
            // nope they're too far to even collide, check the next one
            continue;
        }
    
        // check using simple point inside rect method
        if (UTIL.geometry.pointInsideRectangle({w: t.width, h: t.height, a: t.hAngle, x: t.oX, y: t.oY}, {x: x, y: y})) {
            return { hit: true, tank: tanks[i] };
        }
        
        // line-rect intersection check
        var lineX = UTIL.geometry.lineAxPaRectIntersect({ hl: t.width, vl: t.height, x: t.oX, y: t.oY }, { Ax: x, Ay: y, Bx: lx, By: ly }, t.hAngle);
        if (lineX.yes) {
            return { hit: true, tank: tanks[i] };
        }
    }
    return { hit: false, tank: null };
};

Projectile.prototype.death = function () {
    if (!this.config.active) { return; } // prevent multiple deaths
    this.events.emit('death');
    this.config.active = false;
};