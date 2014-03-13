/*-------- Powerups --------*/
var PUP = (function() {
    var my = {};
    
    var pSlugs = [
        'random',
        'haste',
        'ammo',
        'projectile-barrier',
        'aphotic-shield',
        'increased-armor',
        'reactive-armor',
        'regeneration',
        'rapid-fire',
        'faster-projectile',
        'increased-damage',
        'return',
        'multi-shot',
        'homing-missile'
    ];
    
    my.create = function (name, x, y) {
        switch (name) {
            case 'random':
                return new Random(x, y);
            case 'haste':
                return new Haste(x, y);
            case 'ammo':
                return new Ammo(x, y);
            case 'projectile-barrier':
                return new ProjectileBarrier(x, y);
            case 'aphotic-shield':
                return new AphoticShield(x, y);
            case 'increased-armor':
                return new IncreasedArmor(x, y);
            case 'reactive-armor':
                return new ReactiveArmor(x, y);
            case 'regeneration':
                return new Regeneration(x, y);
            case 'rapid-fire':
                return new RapidFire(x, y);
            case 'faster-projectile':
                return new FasterProjectile(x, y);
            case 'increased-damage':
                return new IncreasedDamage(x, y);
            case 'return':
                return new Return(x, y);
            case 'multi-shot':
                return new MultiShot(x, y);
            case 'homing-missile':
                return new HomingMissile(x, y);
            default:
                break;
        }
    };
    
    my.createRandom = function (x, y) {
        var index = Math.floor(Math.random() * pSlugs.length);
        
        return PUP.create(pSlugs[index], x, y);
    };
    
    // POWERUP OBJECTS
    
    function Random(x, y) {
        /* get random effects */
        this.config = {
            name    : 'Random',
            slug    : 'random',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('random')
        };
        
        this.tmp = PUP.createRandom(x, y);
        
        this.use = function (tank) {
            this.tmp.use(tank);
            var pn = this.tmp.config.name;
            this.config.name += ' | ' + pn;
        };
    }
    
    function HomingMissile(x, y) {
        /* Projectiles home into nearest target. */
        this.config = {
            name    : 'Homing Missile',
            slug    : 'homing-missile',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('homing-missile')
        };
        
        this.use = function (tank) {
            var active = typeof tank.hm_active !== 'undefined';
            
            if (!active) {
                tank.hm_active = true;
                
                var homingMissile = function (projectile) {
                    var p = projectile.config;
                    
                    // Get nearest enemy tank.
                    var nearest_tank = UTIL.getNearestEnemyTank(p.oX, p.oY);
                    
                    if (nearest_tank === -1) { return; }
                    
                    // Determine which way to adjust projectile angle.
                    var dX = nearest_tank.config.oX - p.oX;
                    var dY = nearest_tank.config.oY - p.oY;
                    var angle_adj = 5;
                    
                    var tanA = Math.atan2(dY, dX) * 180/Math.PI;
                    tanA = tanA < 0 ? tanA + 360 : tanA;
                    tanA = tanA > p.angle ? tanA - p.angle : tanA + 360 - p.angle;
                    
                    var d_add = tanA;
                    var d_sub = Math.abs(360 - tanA);
                    
                    if (tanA === 360 || tanA === 0) {
                        // nothing
                    }
                    else if (d_add < d_sub) {
                        // turn left
                        p.angle = tanA < angle_adj ? tanA + p.angle : p.angle + angle_adj;
                    }
                    else if (d_add > d_sub) {
                        // turn right
                        p.angle = 360-tanA < angle_adj ? tanA + p.angle : p.angle - angle_adj;
                    }
                    
                    p.angle = p.angle % 360;
                    if (p.angle < 0) {
                        p.angle += 360;
                    }  
                };
                homingMissile.id = 'homingMissile';
                
                tank.projectile_mods.push(homingMissile);
                
                tank.hm_timeout = new Timer(function () {
                    delete tank.hm_active;
                    delete tank.hm_timeout;
                    tank.projectile_mods = tank.projectile_mods.filter(function (item) { return item.id != 'homingMissile'; });
                }, 12000);
            }
            else {
                tank.hm_timeout.extend(6000);
            }
        };
    }

    function MultiShot(x, y) {
        /* Fires 2 extra projectiles at a slight angle. Adds another 2 extra projectiles for each stack. */
        this.config = {
            name    : 'Multi Shot',
            slug    : 'multi-shot',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('multi-shot')
        };
        
        this.use = function (tank) {
            var active = typeof tank.ts_active !== 'undefined';
            
            if (!active) {
                tank.ts_active = true;
                tank.ts_stack = 1;
            
                var multiShot = function (_oX, _oY) {
                    for (var i = 1; i < tank.ts_stack + 1; i++) {
                        projectiles.push(new Projectile({mods: tank.projectile_mods, speed: tank.config.pSpeed, damage: tank.config.pDamage, critChance: tank.config.critChance, angle:  tank.config.tAngle - (2 * i), oX: _oX, oY: _oY, srcId: tank.config.id, srcType: tank.config.name}));
                        projectiles.push(new Projectile({mods: tank.projectile_mods, speed: tank.config.pSpeed, damage: tank.config.pDamage, critChance: tank.config.critChance, angle:  tank.config.tAngle + (2 * i), oX: _oX, oY: _oY, srcId: tank.config.id, srcType: tank.config.name}));
                    }
                };
                multiShot.id = 'multiShot';
                
                tank.fire_callbacks.push(multiShot);
                
                tank.ts_timeout = new Timer(function () {
                    delete tank.ts_active;
                    delete tank.ts_timeout;
                    delete tank.ts_stack;
                    tank.fire_callbacks = tank.fire_callbacks.filter(function (item) { return item.id != 'multiShot'; });
                }, 30000);
            }
            else {
                tank.ts_stack = tank.ts_stack > 16 ? tank.ts_stack : tank.ts_stack + 1; // cap at 16 stacks
                tank.ts_timeout.extend(12000);
            }
        };
    }

    function Return(x, y) {
        /* returns any (except ricochet type) projectiles to their source */
        this.config = {
            name    : 'Return',
            slug    : 'return',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('return')
        };
        
        this.use = function (tank) {
            var active = typeof tank.r_active !== 'undefined';
            
            if (!active) {
                tank.r_active = true;
                
                var returnHit = function(projectile) {
                    var p = projectile.config;
                
                    if (p.srcType === 'ricochet') {
                        return; // bounce once only please
                    }

                    var retProj = new Projectile({speed: p.speed, damage: p.damage, critChance: p.critChance, angle: (p.angle + 180) % 360, oX: p.oX, oY: p.oY, srcId: p.srcId, srcType: 'ricochet'});
                    projectiles.push(retProj);
                };
                returnHit.id = 'returnHit';
                
                tank.hit_callbacks.push(returnHit);
                
                tank.r_timeout = new Timer(function () {
                    delete tank.r_active;
                    delete tank.r_timeout;
                    tank.hit_callbacks = tank.hit_callbacks.filter(function (item) { return item.id != 'returnHit'; });
                }, 20000);
            }
            else {
                tank.r_timeout.extend(12000);
            }
        };
    }

    function ProjectileBarrier(x, y) {
        /* causes projectiles that hit the tank to circle around forming a lethal barrier */
        this.config = {
            name    : 'Projectile Barrier',
            slug    : 'projectile-barrier',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('projectile-barrier')
        };
        
        this.use = function (tank) {
            var active = typeof tank.pb_active !== 'undefined';
        
            if (!active) {
                // array that holds the projectile barriers
                tank.pBarrier = [];
                tank.pb_radius = tank.config.width;
                tank.pb_active = true;
                tank.config.invulnerable++;
            
                var incBarrier = function () {
                    // Increases the barrier projectile count
                    var tmp = new Projectile({speed: 0, damage: tank.config.pDamage, critChance: tank.config.critChance, angle: 0, oX: tank.config.oX + tank.pb_radius, oY: tank.config.oY, srcId: tank.config.id, srcType: 'projectile-barrier'});
                    projectiles.push(tmp);
                    tank.pBarrier.push([tmp, 0]);
                };
                incBarrier.id = 'incBarrier';
                
                tank.hit_callbacks.push(incBarrier);
                
                var updateBarrierSpin = function () {
                    // Updates the position of each projectile tethered to the tank

                    for (var i = 0; i < tank.pBarrier.length; i++) {
                        var newAngle = tank.pBarrier[i][1] === 356 ? 0 : tank.pBarrier[i][1] + 4;
                        var newLoc = UTIL.geometry.getPointAtAngleFrom(tank.config.oX, tank.config.oY, newAngle, tank.pb_radius);
                        tank.pBarrier[i][0].config.oX = newLoc[0];
                        tank.pBarrier[i][0].config.oY = newLoc[1];
                        tank.pBarrier[i][1] = newAngle;
                    }
                };
                updateBarrierSpin.id = 'updateBarrierSpin';
                
                tank.frame_callbacks.push(updateBarrierSpin);
                
                tank.pb_timeout = new Timer(function () {    
                    // deactivate all projectiles in pBarrier
                    for (var i = 0; i < tank.pBarrier.length; i++) {
                        tank.pBarrier[i][0].config.active = false;
                    }
                    
                    tank.config.invulnerable--;
                    delete tank.pBarrier; // remove temp variable
                    delete tank.pb_radius;
                    delete tank.pb_timeout;
                    delete tank.pb_active;
                    tank.hit_callbacks = tank.hit_callbacks.filter(function (item) { return item.id != 'incBarrier'; });
                    tank.frame_callbacks = tank.move_callbacks.filter(function (item) { return item.id != 'updateBarrierSpin'; });
                }, 20000);
            }
            else {
                tank.pb_radius += 5; // increase projectile barrier radius
                tank.pb_timeout.extend(6000); // reset timer
            }
        };
    }

    function RapidFire(x, y) {
        /* increases the firing rate */
        this.config = {
            name    : 'Rapid Fire',
            slug    : 'rapid-fire',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('rapid-fire')
        };
        
        this.use = function (tank) {
            var active = typeof tank.rf_active !== 'undefined';
            
            if (!active) {
                tank.config.fRate += 5;
                
                tank.rf_active = true;
                tank.rf_stacks = 1;
                
                tank.rf_timeout = new Timer(function () {
                    tank.config.fRate -= 5 * tank.rf_stacks;
                    delete tank.rf_active;
                    delete tank.rf_stacks;
                    delete tank.rf_timeout;
                }, 12000);
            }
            else {
                tank.config.fRate += 5;
                tank.rf_stacks++;
                tank.rf_timeout.extend(12000);
            }
        };
    }

    function Haste(x, y) {
        /* increases the movement speed */
        this.config = {
            name    : 'Haste',
            slug    : 'haste',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('haste')
        };
        
        this.use = function (tank) {
            var active = typeof tank.h_active !== 'undefined';
        
            if (!active) {
                tank.config.fSpeed += 100;
                tank.config.rSpeed += 100;
                tank.config.tSpeed += 40;
                tank.config.sSpeed += 20;
                
                tank.h_active = true;
                tank.h_stacks = 1;
                
                tank.h_timeout = new Timer(function () {
                    tank.config.fSpeed -= 100 * tank.h_stacks;
                    tank.config.rSpeed -= 100 * tank.h_stacks;
                    tank.config.tSpeed -= 40 * tank.h_stacks;
                    tank.config.sSpeed -= 20 * tank.h_stacks;
                    
                    delete tank.h_active;
                    delete tank.h_stacks;
                    delete tank.h_timeout;
                }, 20000);
            }
            else {
                tank.config.fSpeed += 100;
                tank.config.rSpeed += 100;
                tank.config.tSpeed += 40;
                tank.config.sSpeed += 20;
                tank.h_stacks++;
                tank.h_timeout.extend(3000);
            }
        };
    }

    function FasterProjectile(x, y) {
        /* increases the velocity of projectiles */
        this.config = {
            name    : 'Faster Projectile',
            slug    : 'faster-projectile',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('faster-projectile')
        };
        
        this.use = function (tank) {
            var active = typeof tank.fp_active !== 'undefined';
            
            if (!active) {
                tank.config.pSpeed += 200;
                
                tank.fp_active = true;
                tank.fp_stacks = 1;
                
                tank.fp_timeout = new Timer(function () {
                    tank.config.pSpeed -= 200 * tank.fp_stacks;
                    
                    delete tank.fp_active;
                    delete tank.fp_stacks;
                    delete tank.fp_timeout;
                }, 30000);
            }
            else {
                tank.config.pSpeed += 200;
                tank.fp_stacks++;
                tank.fp_timeout.extend(6000);
            }
        };
    }

    function IncreasedArmor(x, y) {
        /* increases the armor */
        this.config = {
            name    : 'Increased Armor',
            slug    : 'increased-armor',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('increased-armor')
        };
        
        this.use = function (tank) {
            var active = typeof tank.ia_active !== 'undefined';
            
            if (!active) {
                tank.config.armor += 50;
                
                tank.ia_active = true;
                tank.ia_stacks = 1;
                
                tank.ia_timeout = new Timer(function () {
                    tank.config.armor -= 50 * tank.ia_stacks;
                    
                    delete tank.ia_active;
                    delete tank.ia_stacks;
                    delete tank.ia_timeout;
                }, 30000);
            }
            else {
                tank.config.armor += 50;
                tank.ia_stacks++;
                tank.ia_timeout.extend(12000);
            }
        };
    }

    function IncreasedDamage(x, y) {
        /* increases the armor */
        this.config = {
            name    : 'Increased Damage',
            slug    : 'increased-damage',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('increased-damage')
        };
        
        this.use = function (tank) {   
            var active = typeof tank.id_active !== 'undefined';
            
            if (!active) {
                tank.config.pDamage += 50;
                
                tank.id_active = true;
                tank.id_stacks = 1;
                
                tank.id_timeout = new Timer(function () { 
                    tank.config.pDamage -= 50 * tank.id_stacks;

                    delete tank.id_active;
                    delete tank.id_stacks;
                    delete tank.id_timeout;
                }, 30000);
            }
            else {
                tank.config.pDamage += 50;
                tank.id_stacks++;
                tank.id_timeout.extend(12000);
            }
        };
    }

    function AphoticShield(x, y) {
        /* increases the armor, absorbs projectiles */
        this.config = {
            name    : 'Aphotic Shield',
            slug    : 'aphotic-shield',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('aphotic-shield')
        };
        
        this.use = function (tank) {
            var active = typeof tank.as_active !== 'undefined';
        
            if (!active) {
                tank.as_active = true;
                tank.hitsTaken = tank.hitsTaken > 0 ? tank.hitsTaken : 0;
                
                tank.as_vfx = new VisualEffect({name: 'aphotic_shield', oX: tank.config.oX, oY: tank.config.oY, width: 32, height: 32, scaleW: 52, scaleH: 52, maxCols: 4, maxRows: 4, framesTillUpdate: 2, loop: true, spriteSheet: 'aphotic_shield'});
                visualeffects.push(tank.as_vfx);
                tank.config.invulnerable++;
                
                var absorbHit = function () {
                    // keep count of hits taken
                    tank.hitsTaken++;
                };
                absorbHit.id = 'absorbHit';
                
                var asAnim = function () {
                    // update animation position
                    tank.as_vfx.updatePos(tank.config.oX, tank.config.oY);
                };
                asAnim.id = 'asAnim';
                
                tank.frame_callbacks.push(asAnim);
                tank.hit_callbacks.push(absorbHit);
                
                tank.as_timeout = new Timer(function () {
                    // fire the number of absorbed projectiles in all directions
                    var aFactor = 360/tank.hitsTaken;
                    var cAngle = 0;
                    var x = 0;
                    var y = 0;
                    
                    for (var i = 0; i < tank.hitsTaken; i++) {
                        // determine starting coordinates of projectile based on vector info
                        x = tank.config.oX + Math.cos(cAngle * Math.PI/180) * (tank.config.cRadius+10);
                        y = tank.config.oY + Math.sin(cAngle * Math.PI/180) * (tank.config.cRadius+10);
                        
                        // create new projectile
                        var proj = new Projectile({ speed: tank.config.pSpeed * 1.25, damage: tank.config.pDamage, critChance: tank.config.critChance, angle:  cAngle, oX: x, oY: y, srcId: tank.config.id, srcType: 'blast'});
                        
                        // add projectile to array
                        projectiles.push(proj);
                        
                        // set cAngle
                        cAngle += aFactor;
                    }
                    
                    tank.config.invulnerable--;
                    tank.as_vfx.end();
                    
                    tank.hit_callbacks = tank.hit_callbacks.filter(function (item) { return item.id != 'absorbHit'; });
                    tank.frame_callbacks = tank.frame_callbacks.filter(function (item) { return item.id != 'asAnim'; });
                    d_explodeSound.get(); // play explode sound
                    
                    delete tank.hitsTaken; // remove temp variable
                    delete tank.as_active;
                    delete tank.as_vfx;
                    delete tank.as_timeout;
                }, 8000);
            }
            else {
                tank.as_timeout.extend(6000);
            } 
        };
    }

    function ReactiveArmor(x, y) {
        /* increases the armor each time tank is hit, "what doesn't kill you, makes you stronger" */
        this.config = {
            name    : 'Reactive Armor',
            slug    : 'reactive-armor',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('reactive-armor')
        };
        
        this.use = function (tank) {
            var active = typeof tank.ra_active !== 'undefined';
            
            if (!active) {
                tank.ra_active = true;
                tank.armorBuff = 0;
                
                var increaseArmorWhenHit = function () {
                    // increase armor each hit
                    tank.armorBuff += 20;
                    tank.config.armor += 20;
                };
                increaseArmorWhenHit.id = 'increaseArmorWhenHit';
                
                tank.hit_callbacks.push(increaseArmorWhenHit);
                
                tank.ra_timeout = new Timer(function () {
                    tank.config.armor -= tank.armorBuff;
                    delete tank.armorBuff; // remove temp variable
                    delete tank.ra_timeout; // remove temp variable
                    delete tank.ra_active;
                    tank.hit_callbacks = tank.hit_callbacks.filter(function (item) { return item.id != 'increaseArmorWhenHit'; });
                }, 20000);
            }
            else {
                tank.ra_timeout.extend(6000);
            }
        };
    }

    function Regeneration(x, y) {
        /* Regenerates the tanks health, dispells on hit */
        this.config = {
            name    : 'Regeneration',
            slug    : 'regeneration',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('regeneration')
        };
        
        this.use = function (tank) {
            // can only use one
            var active = typeof tank.regen_active !== 'undefined';
            
            if (!active) {
                tank.regen_active = true;
                tank.regen_rate = 0.01;
                
                tank.regenIntervalID = setInterval(function () {
                    tank.config.health = tank.config.maxHealth - tank.config.health < tank.regen_rate ? tank.config.maxHealth : tank.config.health + tank.regen_rate;
                    renderExtern();
                    if (tank.config.health === tank.config.maxHealth) {
                        clearInterval(tank.regenIntervalID);
                        delete tank.regenIntervalID;
                        delete tank.dispellRegen;
                        delete tank.regen_active;
                        delete tank.regen_rate;
                        tank.hit_callbacks = tank.hit_callbacks.filter(function (item) { return item.id != 'dispellRegen'; });
                    }
                }, 1);
            
                var dispellRegen = function () {
                    // dispell regen
                    clearInterval(tank.regenIntervalID);
                    delete tank.regenIntervalID;
                    delete tank.dispellRegen;
                    delete tank.regen_active;
                    delete tank.regen_rate;
                };
                dispellRegen.id = 'dispellRegen';
                
                tank.hit_callbacks.push(dispellRegen);
            }
            else {
                tank.regen_rate += 0.01;
            }
        };
    }

    function Ammo(x, y) {
        /* additional ammunition */
        this.config = {
            name    : 'Ammo',
            slug    : 'ammo',
            oX      : x,
            oY      : y,
            size    : 32,
            cRadius : 16,
            image   : PowerUpImages.get('ammo')
        };
        
        this.use = function (tank) {
            tank.config.ammo += 25;
        };
    }
    
    return my;
}());