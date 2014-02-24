var VFX = (function () {
    var my = {};
    
    return my;
}());

function VisualEffect(specs) {
    this.config = {
        active            : true,
        name              : specs.name,
        oX                : specs.oX,
        oY                : specs.oY,
        width             : specs.width,
        height            : specs.height,
        angle             : typeof specs.angle === 'undefined' ? 0 : specs.angle,
        scaleW            : specs.scaleW,
        _scaleW           : specs.scaleW/2,
        scaleH            : specs.scaleH,
        _scaleH           : specs.scaleH/2,
        maxColIndex       : specs.maxCols - 1,
        maxRowIndex       : specs.maxRows - 1,
        framesTillUpdate  : specs.framesTillUpdate,
        loop              : specs.loop,
        resettable        : typeof specs.resettable === 'undefined' ? false : specs.resettable,
        paused            : typeof specs.paused === 'undefined' ? false : specs.paused,
        spriteSheet       : SpriteSheetImages.get(specs.spriteSheet)
    };
    
    var vx = this.config;
    
    this.animation = {
        csr    : 0, // current sprite row
        csc    : 0, // current sprite col
        frames : 0 // the number of frames that has passed since last sprite update
    };
    
    var animation = this.animation;
    
    this.nextSprite = function () {
        if (animation.csc === vx.maxColIndex) {
            animation.csc = 0;
            if (animation.csr === vx.maxRowIndex) {
                animation.csr = 0;
            }
            else {
                animation.csr++;
            }
        }
        else {
            animation.csc++;
        }
    };
    
    this.end = function () {
        /* End effect animation by setting active to false. */
        vx.active = false;
    };
    
    this.updatePos = function (x, y) {
        vx.oX = x;
        vx.oY = y;
    };
    
    this.updateAngle = function (angle) {
        vx.angle = angle;
    };
    
    this.unPause = function () {
        vx.paused = false;
    };
    
    this.update = function () {
        if (!vx.active || vx.paused) { return; }
        
        if (animation.frames !== vx.framesTillUpdate) {
            animation.frames++;
        }
        else {
            animation.frames = 0;
            
            if (animation.csr === vx.maxRowIndex && animation.csc === vx.maxColIndex) {
                if (!vx.loop) {
                    if (vx.resettable) {
                        animation.csr = 0;
                        animation.csc = 0;
                        animation.frames = 0;
                        vx.paused = true;
                    }
                    else {
                        vx.active = false;
                        GLOBALS.flags.clean.visualeffects++;
                    }
                }
                else {
                    this.nextSprite();
                }
            }
            else {
                this.nextSprite();
            }
            
        }
    };
    
    this.draw = function (ctx, xView, yView) {
        if (!vx.active) { return; }
    
        var angleInRadians = vx.angle * Math.PI/180;
    
        ctx.translate(vx.oX - xView, vx.oY - yView);
        ctx.rotate(angleInRadians);
        ctx.drawImage(
            vx.spriteSheet,
            animation.csc * vx.width,
            animation.csr * vx.height,
            vx.width, vx.height,
            -vx._scaleW,
            -vx._scaleH,
            vx.scaleW,
            vx.scaleH
        );
        ctx.rotate(-angleInRadians);
        ctx.translate(-(vx.oX - xView), -(vx.oY - yView));
    };
}