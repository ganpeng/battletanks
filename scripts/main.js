    
    /* ------------------------ MAIN ------------------- */
    $('.overlay').hide();
    
    var menu = function() {
        ui_location = 'menu';
        
        $('#external-hud').hide();
        $('#editor-ui').hide();
    
        // show menu overlay
        $('#main-menu').show();
    };
    
    var pause = function () {
        // stop the main interval
        if (ui_location === 'game') {
            cancelAnimationFrame(mainAnimation);
        }
        else if (ui_location === 'editor') {
            cancelAnimationFrame(editorAnimation);
        }
        else if (ui_location === 'post_game') {
            return;
        }
    
        // show pause menu
        if (ui_location == 'game') $('#pause-menu').show();
        else if (ui_location == 'editor') $('#editor-menu').show();
        
        UTIL.pauseMusic(backgroundMusic);
    };
    
    // NEW GAME
    var reset = function() {
        alert('done');
    };
    
    
    // UPDATE SCENE
    var update = function(modifier) {
        
        /* turn tank body to direction */
        if (37 in keysDown) { // left arrow pressed
            player.turnBody(modifier, 'ccw');
        }
        
        if (39 in keysDown) { // right arrow pressed
            player.turnBody(modifier, 'cw');
        }
        
        if (!(37 in keysDown) && !(39 in keysDown)) { // no left/right arrows pressed
            player.turnBody(modifier, 'hold');
        }
        
        if (38 in keysDown) { // up arrow pressed
            player.move(modifier, 'forward');
        }
        else {
            player.move(modifier, 'forward-stop');
        }
        
        if (40 in keysDown) { // down arrow pressed
            player.move(modifier, 'reverse');
        }
        else {
            player.move(modifier, 'reverse-stop');
        }
        
        if (mouseDownLeft) {
            player.fire();
        }
        
        player.frame(); // run all frame callbacks
        
        /* turn turret (based on current facing angle) */
        player.turnTurret(modifier, mousePos.mX, mousePos.mY);
       
        // AI
        for (var i = 0; i < bots.length; i++) {
            // update tanks only if active | TEST for AI pathfinding
            if (bots[i][0].config.active) {
                bots[i][0].frame(); // run all frame callbacks
            
                // Update turret
                bots[i][0].turnTurret(modifier, player.config.oX, player.config.oY);
                
                // Fire
                if (1 > Math.random() * 100) {
                    bots[i][0].fire();
                }
                
                // Check if movequeue has commands
                var mq = bots[i][1];
                if (mq.length > 0 && bots[i][2] === 'ready') {
                    // if it has commands execute them starting from the last (since its reversed)
                    var move = mq[mq.length - 1];
                    var cmd = move[0];
                    
                    switch (cmd) {
                        case 'turn':
                            //bots[i][0].move(modifier, 'forward-stop');
                            if (bots[i][0].config.hAngle !== move[2]) {
                                bots[i][0].velocity.forward = 0.0;
                            }
                            bots[i][0].turnBody(modifier, move[1], move[2]);
                            // check if turn angle reached
                            if (bots[i][0].config.hAngle === move[2]) {
                                // if yes, pop the move
                                bots[i][1].pop();
                            }
                            break;
                        case 'move':
                            bots[i][0].turnBody(modifier, 'hold');
                            bots[i][0].move(modifier, 'forward', { x: move[1], y: move[2] });
                            // check if move point reach
                            if (bots[i][0].config.oX === move[1] && bots[i][0].config.oY === move[2]) {
                                // if yes, pop the move
                                bots[i][1].pop();
                            }
                            break;
                        default:
                            break;
                    }
                }
                else if (bots[i][2] !== 'waiting') {
                    // movequeue is empty and bot is not waiting for reply from worker, so ask for movelist from pathfinder
                    
                    var bot_id = bots[i][0].config.id;
                    
                    var msg = {};
                    
                    msg.sender = bot_id;
                    msg.start = [bots[i][0].config.oX, bots[i][0].config.oY];
                    msg.angle = bots[i][0].config.hAngle; // body angle
                    
                    switch (bots[i][3]) {
                        case 'patrol':
                            msg.cmd = 'get_waypoint_random';
                            break;
                        case 'chase':
                            msg.goal  = [player.config.oX, player.config.oY];
                            msg.cmd = 'get_waypoint';
                            break;
                        default:
                            msg.cmd = 'get_waypoint_random';
                            break;
                    }
                    
                    // send message to pathfinder worker asking for directions
                    LOAD.worker.sendMessage(bot_id, msg);
                    
                    // set status to:
                    bots[i][2] = 'waiting'
                }
            }
        }
        
        // Update all projectiles.
        for (i = 0; i < projectiles.length; i++) {
            if (projectiles[i].config.active) {
                projectiles[i].update(modifier);
            }
        }
        
        // Remove all inactive projectiles. This keeps the projectile array from accumulating inactive objects.
        projectiles = projectiles.filter(function (item) {
            return item.config.active;
        });
    };
    
    // Editor UPDATE
    var editorUpdate = function() {
         
        if (cs_asset_select_ok) {
            
            if (96 in keysDown) { // num 0
                MAP.nextPlaceable();
            }
            
            if (17 in keysDown) { // ctrl
                MAP.toggleMode();
            }
            
            cs_asset_select_ok = false;
            
            clearTimeout(csas_timeout);
            
            csas_timeout = setTimeout(function() { cs_asset_select_ok = true }, 75);
        }
        
        if (cs_movement_ok) {
        
            if (37 in keysDown) { // left arrow
                MAP.moveCursor('L');
            }
            
            if (39 in keysDown) { // right arrow
                MAP.moveCursor('R');
            }
            
            if (38 in keysDown) { // up arrow
                MAP.moveCursor('U');
            }
            
            if (40 in keysDown) { // down arrow
                MAP.moveCursor('D');
            }
            
            cs_movement_ok = false;
            
            clearTimeout(csmv_timeout);
            
            csmv_timeout = setTimeout(function() { cs_movement_ok = true }, 50);
        }
        
        if (cs_placement_ok) {
        
            if (13 in keysDown || mouseDownLeft) { // enter
                MAP.placeObject();
            }
            
            cs_placement_ok = false;
            
            clearTimeout(cspo_timeout);
            
            cspo_timeout = setTimeout(function() { cs_placement_ok = true; }, 100);
        }
        
        if (110 in keysDown || mouseDownRight ) {
            MAP.removeObject();
        }

    }

    // DRAW SCENE
    var renderCanvas = function () {

        CANVAS.clear(ctx);

        CANVAS.drawDestructibles(ctx);
        CANVAS.drawPowerUps(ctx);
        CANVAS.drawTanks(ctx);
        CANVAS.drawVisualEffects(ctx);
        CANVAS.drawProjectiles(ctx);

    };
    
    var renderExtern = function () {
        // draw player health
        var healthFraction = player.config.health / player.config.maxHealth;
        var cHealth = player.config.health <= 0 ? 0 : 1024 * healthFraction; // 420
        var remBar = hp.style.width;
        remBar = remBar.replace('px', '');
        
        // change health bar color as health drops 
        if      (healthFraction >= 0.75) hp.style.backgroundColor = '#66CD00'; // green        @ >= 75%
        else if (healthFraction >= 0.50) hp.style.backgroundColor = '#FFFF00'; // yellow       @ >= 50%
        else if (healthFraction >= 0.25) hp.style.backgroundColor = '#FE4902'; // vermillion   @ >= 25%
        else                             hp.style.backgroundColor = '#FF0000'; // red          @ < 25%
        
        hp.style.width = cHealth + 'px';
        
        var diff = remBar - cHealth;
        hNum.innerHTML = player.config.health.toFixed(2);
        
        if (diff > 0) {
            // if health is reduced, animate
            $('#current-health-anim').stop();
            $('#current-health-anim').animate({width: cHealth}, 500);
        }
        else if (diff < 0) {
            // if health is restored, don't animate
            $('#current-health-anim').stop();
            $('#current-health-anim').width(cHealth);
        }
    }    
    
    // MAIN
    var main = function () {
        var now = performance.now();
        var delta = now - then;

        
        update(delta / 1000);
        renderCanvas(); // render canvas objects
        renderExtern(); // render external objects

        
        then = now;
        mainAnimation = requestAnimationFrame(main);
        
        // check player state
        if (!player.config.active) {
            // if player is dead, show game over screen
            ui_location = 'post_game';
            showGameOver();
        }
        else if (UTIL.levelCleared()) {
            // level is cleared (i.e. all enemy tanks are destroyed)
            UTIL.writeStats();
            ui_location = 'post_game';
            showLevelCleared();
        }
    };
    
    // Faux Main (Map Editor)
    var editor = function () {
    
        editorUpdate();
        renderCanvas();
        
        CANVAS.drawStartingPoints(ctx); 
        MAP.drawPlaceableGhost(ctx);
        
        editorAnimation = requestAnimationFrame(editor);
    }
    
    // START
    var start = function (player_name) {
        ui_location = 'game';
        
        $('#external-hud').show();
        
        LOAD.gameSettings(player_name);
        attachGameEventListeners();
        then = performance.now();
        UTIL.playMusic(backgroundMusic);
        GameStatistics.reset();

        main();
    };
    
    // Editor START
    var startMapEditor = function () {
        
        ui_location = 'editor';
    
        // clear the arrays
        powerups.clear();
        tanks.clear();
        projectiles.clear();
        destructibles.clear();
        startingpoints.clear();
        visualeffects.clear();
    
        attachGameEventListeners();
        attachEditorEventListeners();
        
        MAP.loadPlaceablesToUI();
        
        editor();
    };
    
    var showGameOver = function () {
        // stop the main interval
        cancelAnimationFrame(mainAnimation);
    
        // show game over screen
        $('#game-over-screen').show();
        UTIL.pauseMusic(backgroundMusic);
    };
    
    var showLevelCleared = function () {
        // stop the main interval
        cancelAnimationFrame(mainAnimation);
    
        // show game over screen
        $('#level-cleared-screen').show();
        UTIL.pauseMusic(backgroundMusic);
    };
    
    menu();
    attachMenuEventListeners();
    //start();