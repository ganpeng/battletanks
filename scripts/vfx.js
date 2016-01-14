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
        endCallBack       : specs.endCallBack || function () {},
        vom               : typeof specs.vom === 'undefined' ? false : specs.vom, // visible on minimap
        fps               : specs.fps || 30,
        spriteSheet       : SpriteSheetImages.get(specs.spriteSheet)
    };
    
    this.animation = {
        csr    : 0, // current sprite row
        csc    : 0, // current sprite col
        frames : 0 // the number of frames that has passed since last sprite update
    };
}

VisualEffect.prototype.nextSprite = function () {
    var vx = this.config;
    var animation = this.animation;

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
    
    if (!vx.loop && animation.csr === vx.maxRowIndex && animation.csc === vx.maxColIndex) {
        if (vx.resettable) {
            animation.csr = 0;
            animation.csc = 0;
            animation.frames = 0;
            vx.paused = true;
        }
        else {
            this.end();
        }
    }
};

VisualEffect.prototype.end = function () {
    /* End effect animation by setting active to false. */
    this.config.endCallBack();
    this.config.active = false;
    GLOBALS.flags.clean.visualeffects++;
};

VisualEffect.prototype.updatePos = function (x, y) {
    var vx = this.config;
    vx.oX = x;
    vx.oY = y;
};

VisualEffect.prototype.updateAngle = function (angle) {
    this.config.angle = angle;
};

VisualEffect.prototype.unPause = function () {
    this.config.paused = false;
};

VisualEffect.prototype.update = function (dt) {
    var vx = this.config;
    var animation = this.animation;

    if (!vx.active || vx.paused) { return; }
    /*
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
                    this.end();
                }
            }
            else {
                this.nextSprite();
            }
        }
        else {
            this.nextSprite();
        }
        
    }*/
    // delta-based animation

    var frames = Math.ceil( dt * vx.fps );
    for (var i = 0; i < frames; i++) {
        this.nextSprite();
    }
};

VisualEffect.prototype.draw = function (ctx, xView, yView) {
    var vx = this.config;
    var animation = this.animation;

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

VisualEffect.prototype.drawScaled = function (ctx, xView, yView, scale) {
    var vx = this.config;
    var animation = this.animation;

    if (!vx.active) { return; }

    var angleInRadians = vx.angle * Math.PI/180;
    var x = vx.oX * scale;
    var y = vx.oY * scale;

    ctx.translate(x, y);
    ctx.rotate(angleInRadians);
    ctx.drawImage(
        vx.spriteSheet,
        animation.csc * vx.width,
        animation.csr * vx.height,
        vx.width, vx.height,
        -(vx._scaleW * scale),
        -(vx._scaleH * scale),
        vx.scaleW * scale,
        vx.scaleH * scale
    );
    ctx.rotate(-angleInRadians);
    ctx.translate(-x, -y);
};