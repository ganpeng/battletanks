    
    /* ------------------------ MAIN ------------------- */
    $('.overlay').hide();
    
    var menu = function() {
        ui_location = 'menu';
        
        $('#external-hud').hide();
    
        // show menu overlay
        $('#main-menu').show();
    };
    
    var pause = function() {
        // stop the main interval
        if (ui_location == 'game') cancelAnimationFrame(mainAnimation);
        if (ui_location == 'editor') cancelAnimationFrame(editorAnimation);
    
        // show pause menu
        if (ui_location == 'game') $('#pause-menu').show();
        else if (ui_location == 'editor') $('#editor-menu').show();
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
        
        /* turn turret (based on current facing angle) */
        player.turnTurret(modifier, mousePos.mX, mousePos.mY);
       
        // enemy AI here, but random movements for now
        // calculate distance between player and enemy
        var d = Math.sqrt(Math.pow(player.config.oX-enemy.config.oX, 2) + Math.pow(player.config.oY-enemy.config.oY, 2));
        if (d < 200) {
            enemy.move(modifier, 'forward');
        }
        else if (d > 400) {
            enemy.move(modifier, 'reverse');
        }
        enemy.turnTurret(modifier, player.config.oX, player.config.oY);
        enemy2.turnTurret(modifier, player.config.oX, player.config.oY);
        var rng = Math.floor(Math.random() * 250) + 1;
        if (rng == 1 || rng == 4 || rng == 7) {
            enemy.fire();
        }
        if (rng == 50 || rng == 18 || rng == 101) {
            enemy2.fire();
        }
        // point enemy turret to player and fire
        
        // Update all projectiles.
        for (var i = 0; i < projectiles.length; i++) {
            if (projectiles[i].config.active) {
                projectiles[i].update(modifier);
            }
        }
    };
    
    // Editor UPDATE
    var editorUpdate = function() {

        if (mouseDownLeft && cs_placement_ok) {
            // place game object
            
            var asset_type = cs_assets[current_asset][0];

            switch (asset_type) {
                case 'destructible':
                    destructibles.push(new Destructible(BLUEPRINT.get(cs_assets[current_asset][1]), mousePos.mX, mousePos.mY));
                    break;
                case 'starting-point':
                    startingpoints.push(new StartingPoint(mousePos.mX, mousePos.mY));
                    break;
                default:
                    break;
            }
            
            cs_placement_ok = false;
            
            clearTimeout(cspo_timeout);
            
            cspo_timeout = setTimeout(function() { cs_placement_ok = true; }, 120);
        }
        
        if (mouseDownRight) {
            
            deleteAssetOnCursor();
            
        }
        
        
        if (cs_asset_select_ok) {
            if (37 in keysDown) { // left arrow pressed
                // move down on cs_assets
                current_asset = current_asset != csa_max ? current_asset+1 : 0;
            }
            
            if (39 in keysDown) { // right arrow pressed
                // move up on cs_assets
                current_asset = current_asset != 0 ? current_asset-1 : csa_max;
            }
            
            cs_asset_select_ok = false;
            
            clearTimeout(csas_timeout);
            
            csas_timeout = setTimeout(function() { cs_asset_select_ok = true }, 100);
        }

    }

    // DRAW SCENE
    var renderCanvas = function() {

        CANVAS.clear(ctx);

        CANVAS.drawDestructibles(ctx);
        CANVAS.drawPowerUps(ctx);
        CANVAS.drawTanks(ctx);
        CANVAS.drawProjectiles(ctx);

    };
    
    var renderExtern = function() {
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
    var main = function() {
        var now = performance.now();
        var delta = now - then;

        
        update(delta / 1000);
        renderCanvas(); // render canvas objects
        renderExtern(); // render external objects

        
        then = now;
        mainAnimation = requestAnimationFrame(main);
    };
    
    // Faux Main (Map Editor)
    var editor = function() {
        editorUpdate();
        renderCanvas();
        
        drawStartingPoints(); 
        drawAssetOnCursor();
        
        editorAnimation = requestAnimationFrame(editor);
    }
    
    // START
    var start = function(player_name) {
        ui_location = 'game';
        
        $('#external-hud').show();
        
        initGameSettings(player_name);
        attachGameEventListeners();
        checkAudio = window.setInterval(function() { checkReadyState() }, 1000);
        then = performance.now();

        main();
    };
    
    // Editor START
    var startMapEditor = function() {
        
        ui_location = 'editor';
    
        // clear the arrays
        powerups.clear();
        tanks.clear();
        projectiles.clear();
        destructibles.clear();
        startingpoints.clear();
    
        attachGameEventListeners();
        attachEditorEventListeners();
        
        editor();
    }
    
    menu();
    attachMenuEventListeners();
    //start();