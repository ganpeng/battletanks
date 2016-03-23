/*
* Module : UTIL
*
* Hosts most of the common utility functions used by Battletanks
*/
var UTIL = (function () {
    var my = {};
    
    my.toTitleCase = function (str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };
    
    /*
    * Private Method: _idInArray
    *
    * Checks if id is found in array
    *
    * Parameters:
    *   array - the array to be checked
    *   id    - value to compare to
    *
    * Returns:
    *   a boolean true if id is found in array, else a boolean false
    */
    var _idInArray = function (array, id) {
        // Check if id exists in array.
        for (var i = 0; i < array.length; i++) {
            if (array[i].id == id) {
                return true;
            }
        }
        
        return false;
    };
    
    /*
    * Public Method: getMousePos
    *
    * Retreives the current mouse coordinates within an element
    *
    * Parameters:
    *   element - the element
    *   evt     - the event
    *
    * Returns:
    *   an object with the following properties: mX, mY (which are the mouse coordinates)
    */
    my.getMousePos = function (element, evt) {
        var rect = element.getBoundingClientRect();
        return {
            mX: evt.clientX - rect.left,
            mY: (evt.clientY - rect.bottom) * (-1) // multiply by -1 since the plane is inversed vertically
        };
    };
    
    /*
    * Public Method: genArrayId
    *
    * Generates a unique id for an array element
    *
    * Parameters:
    *   array - the array
    *
    * Returns:
    *   a unique alphanumeric string
    */
    my.genArrayId = function (array) {
        var id = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        
        do {
            for( var i=0; i < 5; i++ )
                id += possible.charAt(Math.floor(Math.random() * possible.length));
        } while (_idInArray(array, id));
        
        return id;
    };
    
    /*
    * Public Method: writeToLog
    *
    * Appends a string/message to the combat log, increments logNum (used for auto-scrolling)
    *
    * Parameters:
    *   message - the string to append
    */
    my.writeToLog = function (message) {
        if (!LOG_ENABLED) { return; }
        cLog.innerHTML = cLog.innerHTML + message + '<br>';
        cLog.scrollTop = document.getElementById('log-' + logNum).offsetTop;
        logNum++;
    };

    my.stopMusic = function (music) {
        music.pause();
        music.currentTime = 0;
    };
    
    my.changeMusic = function (music, url) {
        music.pause();
        music.currentTime = 0;
        music.src = url;
        my.playMusic(music);
    };
    
    my.pauseMusic = function (music) {
        music.pause();
    };
    
    my.playMusic = function (music) {
        if (music.readyState === 4) {
            music.play();
        }
    };
    
    my.getBotReference = function (id) {
        /* Return the reference to the bot matching the id from bots */
        for (var i = 0; i < bots.length; i++) {
            if (bots[i][0].config.id === id) {
                return bots[i];
            }
        }
    };
    
    my.levelCleared = function () {
        /* Check if all enemy tanks have been destroyed. */
        if (!GLOBALS.flags.initSpawn) {
            // if initial spawn hasn't started...
            return false;
        }
        
        for (var i = 0; i < bots.length; i++) {
            if (bots[i][0].config.active) {
                return false;
            }
        }
        
        return true;
    };
    
    my.skipWaveCountDown = function () {
        cd_skip = true;
    };
    
    my.getHighScores = function () {
        $.ajax({  
            type: "POST",  
            url: "/models/get_high_scores.php",  
            data: {ajax: true},  
            success: function(response) {  
                var pr = JSON.parse(response);
                var count = 1;
                var spinner = document.getElementById('hof-spinner');
                var table = document.getElementById('hof-table').getElementsByTagName('tbody')[0];
                
                spinner.style.display = 'inline';
                table.innerHTML = '';
                for (var i = 0; i < pr.length; i++) {
                    var row = document.createElement('tr');
                    row.class = 'hof-row';
                    row.style.display = 'none';
                    row.innerHTML = '<td>'+count+'</td><td>'+pr[i].player+'</td><td>'+pr[i].map+'</td><td>'+pr[i].wave+'</td><td>'+pr[i].score+'</td>';
                    table.appendChild(row);
                    $(row).hide().delay(400).fadeIn();
                    count++;
                }
                spinner.style.display = 'none';
            }
        }); 
    };
    
    my.post = function (url, data, callbackSuccess, callbackFailed) {
        callbackSuccess = function () {} || callbackSuccess;
        callbackFailed = function () {} || callbackFailed;
    
        /* POST request as JSON */
        var req = new XMLHttpRequest();
        
        req.onreadystatechange = function () {
            if (req.readyState === 4) {
                if (req.status == 200 && req.status < 300) {
                    // process server response here
                    if (req.responseText !== 'ok') {
                        console.log(req.responseText);
                        callbackFailed();
                    }
                    else {
                        callbackSuccess();
                    }
                }
            }
        };
        
        req.open('POST', url);
        
        req.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
        
        req.send(data);
    };
    
    my.get = function (url, callbackSuccess, callbackFailed) {
        /* GET request */
            var req = new XMLHttpRequest();
            req.open('GET', url);
            
            req.onload = function () {
                if (req.status == 200) {
                    callbackSuccess(req.response);
                    //return req.response;
                }
                else {
                    callbackFailed();
                }
            };
            
            req.onerror = function () {
                callbackFailed();
            };
            
            req.send();
    };
    
    my.getPromise = function (url) {
        /* GET request using Promise. */
        return new Promise(function (resolve, reject) {
            var req = new XMLHttpRequest();
            req.open('GET', url);
            
            req.onload = function () {
                if (req.status == 200) {
                    resolve(req.response);
                }
                else {
                    reject(Error(req.statusText));
                }
            };
            
            req.onerror = function () {
                reject(Error('Network Error'));
            };
            
            req.send();
        });
    };
    
    my.fancyProgress = function (pseudoInc, callback) {
        /* Show a fake progress bar to annoy (or entertain?) the player. */
        STAT.reset();
        
        var fancyTalk = [
            'Playing Flappy Birds...',
            'Loading Workers...',
            'Loading Assets...',
            'Walking the dog...',
            'Walking the dog some more...',
            'Walking the human...',
            '<span style="color: orange;">Dendimon</span> has randomed Goblin Techies',
            'Nyx Nyx Nyx Nyx Nyx',
            'Let it go...',
            'Preparing the battlefield...',
            '<span style="font-family: \'Comic Sans\', \'Comic Sans MS\'; color: yellow">So doge</span>',
            '<span style="font-family: \'Comic Sans\', \'Comic Sans MS\'; color: pink">WOW</span>',
            '<span style="font-family: \'Comic Sans\', \'Comic Sans MS\'; color: purple">so progress</span>',
            '<span style="font-family: \'Comic Sans\', \'Comic Sans MS\'; color: green">such random</span>',
            'The <span style="color: orange">Cake</span> was a lie!'
        ];
        
        // Delay start to allow objects and workers to be initialized completely.
        progressBar.value = 0;
        progressText.innerHTML = 'Loading Game Objects... Please Wait...';
        var fti = 0, ftLen = fancyTalk.length, millisecSince = 0, msMin = 1100, msMax = 5000, gsc = 4;
        
        $('#progress').show();
        var preGameDelay = setInterval(function () {
            progressBar.value += pseudoInc + (Math.random() * 5);
            
            if (millisecSince > Math.floor(Math.random() * msMax) + msMin) {
                fti = Math.floor(Math.random() * ftLen);
                progressText.innerHTML = fancyTalk[fti];
                millisecSince = 0;
            }
            millisecSince += 50;
            
            if (progressBar.value === 100) {
                clearInterval(preGameDelay);
                callback();
            }
        }, 50);
    };
    
    my.toggleMiniMap = function () {
        /* Toggles minimap visibility. */
        var minimap = document.getElementById('minimap');
        var minimap_bg = document.getElementById('minimap-bg');
        
        if (minimap.style.visibility === 'hidden') {
            minimap.style.visibility = 'visible';
            minimap_bg.style.visibility = 'visible';
        }
        else {
            minimap.style.visibility = 'hidden';
            minimap_bg.style.visibility = 'hidden';
        }
    };
    
    my.packDestructibles = function () {
        /* Save the active destructibles into a simple [x, y, size] array for the pathfinders. */
        var packedDestructibles = [];
        for (var i = 0; i < destructibles.length; i++) {
            if (destructibles[i].config.active) {
                packedDestructibles.push([
                    destructibles[i].config.name,
                    destructibles[i].config.oX,
                    destructibles[i].config.oY,
                    destructibles[i].config.size,
                    destructibles[i].config.mod
                ]);
            }
        }
        
        return packedDestructibles;
    };
    
    my.getNearestTank = function (x, y, exceptions, factionExceptions) {
        /* Get the nearest enemy tank to point. [exceptions] is an array of tank IDs. */
        
        var dist = 0;
        var _dist = 0;
        var nearest_tank = -1;
        
        for (var i = 0; i < tanks.length; i++) {
            if (!tanks[i].config.active) { continue; } // skip dead tanks
            
            // check if item is found in exceptions
            if (typeof exceptions !== 'undefined') {
                if (exceptions.indexOf(tanks[i].config.id) > -1) {
                    continue;
                }
            }
            
            // check if item is found in factionExceptions
            if (typeof factionExceptions !== 'undefined') {
                if (factionExceptions.indexOf(tanks[i].config.faction) > -1) {
                    continue;
                }
            }
            
            _dist = UTIL.geometry.getDistanceBetweenPoints({x: x, y: y}, {x: tanks[i].config.oX, y: tanks[i].config.oY});
            
            if (_dist < dist) {
                // if this is nearer than the last, save it
                dist = _dist;
                nearest_tank = tanks[i];
            }
            else if (dist === 0) {
                dist = _dist;
                nearest_tank = tanks[i];
            }
        }
        
        return nearest_tank;
    };
    
    my.followNextTank = function () {
        /* Follow (camera) a random active tank. */
        var target = player;
        
        for (var i = 0; i < 1000; i++) {
            var r = Math.floor(Math.random() * ((tanks.length-1) - 0 + 1)) + 0;
            if (tanks[r].config.active && tanks[r].config.id !== camera.followed.config.id) {
                target = tanks[r];
                tank_to_chase = target;
                break;
            }
        }

        return target.config.id;;
    };
    
    my.doScreenShake = function (amount, duration) {      
        if ( shake_timer ) {
            if ( shake_amount > amount && shake_timer.config.active ) {
                // screenshakes of greater intensity are not overidden
                return;
            }
            shake_timer.clear();
        }
        shake_amount = amount;
        shake_timer = new Timer(function() {}, duration);
    };
    
    my.submitScore = function () {
        // check input field for name
        var playername = $('#playername').val().trim();
        playername = playername === '' ? 'Guest' : playername;
        
        // save name to localStorage
        sessionStorage.setItem('playername', playername);
        
        $('#submit-score').hide();
        $('#ss-notif').css('color', 'yellow');
        $('#ss-notif').show();
        $('#ss-notif').html('Submitting your score...');
        
        if (playername) {
            // save score to database only if playername is not empty/null
            var data = {
                ajax   : true,
                map    : maps[GLOBALS.map.index].name,
                player : playername,
                wave   : GLOBALS.map.wave.current_,
                score  : GLOBALS.statistics.lastScore
            };
            //UTIL.post('/models/submit_score.php', data);
            $.ajax({  
                type: "POST",  
                url: "/models/submit_score.php",  
                data: data,  
                success: function(status) {
                    if (status === 'ok') {
                        $('#ss-notif').css('color', 'green');
                        $('#ss-notif').html('Score submitted successfully!');
                    }
                    else {
                        $('#ss-notif').css('color', 'red');
                        $('#ss-notif').html('Score submission failed! <span class="uoh" onclick="UTIL.submitScore()">Retry Submission</span>');
                    }
                },
                error: function () {
                    $('#ss-notif').css('color', 'red');
                    $('#ss-notif').html('Score submission failed! <span class="uoh" onclick="UTIL.submitScore()">Retry Submission</span>');
                }
            });
        }
    };
    
    my.dealAreaDamage = function (epicenter, damage, radius, chainRadius, scale) {
        chainRadius = chainRadius || 90; // minimum distance for chain explosion
        scale = typeof scale === 'undefined' ? true : scale;
    
        // damage all tanks within radius units
        for (var n = 0; n < tanks.length; n++) {
            if (!tanks[n].config.active) { continue; }
            var d = UTIL.geometry.getDistanceBetweenPoints(epicenter, {x: tanks[n].config.oX, y: tanks[n].config.oY}) - tanks[n].config.cRadius;
            d = d < 0 ? 0 : d;
            if (d > radius || isNaN(d)) { continue; }
            
            var dRatio = (radius - d) / radius; // damage ratio (less distance)
        
            // calculate damage
            var dmg = tanks[n].config.invulnerable > 0 ? 0 : (damage * dRatio);
            dmg = scale ? dmg * (GLOBALS.map.wave.current + 1) : dmg;
            var crit = 10 > Math.random() * 100;
            dmg = crit ? dmg * ((Math.random() * 3) + 1) : dmg;
            dmg = isNaN(dmg) ? 0 : dmg;
            
            // deal damage to tank shield
            tanks[n].config.shield -= dmg;
            if (tanks[n].config.shield < 0) {
                dmg = (-1)*tanks[n].config.shield;
                tanks[n].config.shield = 0;
            }
            else {
                dmg = 0;
            }

            // apply damage reduction from armor
            dmg = dmg * UTIL.getDamageMultiplier(tanks[n].config.armor);

            // deal damage to tank health
            tanks[n].config.health -= dmg;
            tanks[n].config.health = tanks[n].config.health < 0 ? 0 : tanks[n].config.health;
            
            // animate player health if hit
            if (tanks[n].config.control === 'player') {
                renderExtern();
            }
            
            // if tank has 0 health, destroy the tank
            if (tanks[n].config.health === 0) {
                tanks[n].death();
            }
        }
        
        // damage all destructibles within radius units
        for (var n = 0; n < destructibles.length; n++) {
            if (!destructibles[n].config.active) { continue; }
            var d = UTIL.geometry.getDistanceBetweenPoints(epicenter, {x: destructibles[n].config.oX, y: destructibles[n].config.oY}) - destructibles[n].config.cRadius;
            d = d < 0 ? 0 : d;
            if (d > radius || isNaN(d)) { continue; }
            
            var dRatio = (radius - d) / radius; // damage ratio (less distance)
            
            // calculate damage
            var dmg = destructibles[n].config.mod === 'immortal' ? 0 : (damage * dRatio);
            dmg = scale ? dmg * (GLOBALS.map.wave.current + 1) : dmg;
            var crit = 10 > Math.random() * 100;
            dmg = crit ? dmg * ((Math.random() * 3) + 1) : dmg;
            dmg = isNaN(dmg) ? 0 : dmg;
            
            // apply damage reduction from armor
            dmg = dmg * UTIL.getDamageMultiplier(destructibles[n].config.armor);
            
            // deal damage to destructible health
            destructibles[n].config.health -= dmg;
            destructibles[n].config.health = destructibles[n].config.health < 0 ? 0 : destructibles[n].config.health;
            
            // if destructible has 0 health, destroy the tank
            if (destructibles[n].config.health === 0) {
                destructibles[n].death();
            }
        }
        
        // start a chain explosion with nearby mines
        for (var r = 0; r < dummies.length; r++) {
            if (dummies[r].config.active) {
                if (dummies[r].config.explosive) {
                    // check distance
                    var d = UTIL.geometry.getDistanceBetweenPoints({x: dummies[r].config.oX, y: dummies[r].config.oY}, epicenter);
                    if (d < chainRadius) {
                        dummies[r].chainExplode = true;
                    }
                }
            }
        }
    };
    
    my.getDamageMultiplier = function (armor) {
        return 1 - 0.06 * armor / (1 + 0.06 * Math.abs(armor));
    };
    
    my.setSfxVol = function (percentage) {
        // set the volume of sound effects to a percentage of their default volumes
        fireSound.setVolume(percentage);
        explodeSound.setVolume(percentage);
        d_explodeSound.setVolume(percentage);
        d_destroyedSound.setVolume(percentage);
        t_destroyedSound.setVolume(percentage);
        t_destroyedSound2.setVolume(percentage);
        t_destroyedSound3.setVolume(percentage);
        pick_powerupSound.setVolume(percentage);
        tick_sound.setVolume(percentage);
        wave_cleared_sound.setVolume(percentage);
        wave_start_sound.setVolume(percentage);
        gameover_sound.setVolume(percentage);
        gold_pick_sound.setVolume(percentage);
        button_hover_sound.setVolume(percentage);
        button_click_sound.setVolume(percentage);
        pup_tds_sound.setVolume(percentage);
        nuke_siren_sound.setVolume(percentage);
        nuke_explosion_sound.setVolume(percentage);
        laser_impact_sound.setVolume(percentage);
        c130_sound.setVolume(percentage);
    };
    
    my.setMscVol = function (percentage) {
        // TODO: create music object similar soundpool
        backgroundMusic.volume = 0.15 * (percentage / 100); // 0.15 is a hardcoded base volume
    };
        
    return my;
}());

/*
* Module : UTIL
* Sub-module: Geometry
*
* A UTIL sub-module that handles geometry calculations
*/
UTIL.geometry = (function() {
    var my = {};
    
    /*  
    * Private Object: Point
    *
    * A UTIL.geometry point constructor
    *
    * Parameters:
    *   X - the x coordinate of the point
    *   Y - the Y coordinate of the point
    *
    * Note:
    *   All parameters default to null
    */
    var Point = function (x, y) {
        return {
            x: typeof x === "undefined" ? null : x,
            y: typeof y === "undefined" ? null : y
        };
    };

    /*  
    * Private Object: Line
    *
    * A UTIL.geometry point constructor
    *
    * Parameters:
    *   A - a Point object
    *   B - a Point object
    *
    * Note:
    *   all parameters default to null
    */
    var Line = function (A, B) {
        return {
            A: {
                x: typeof A.x === "undefined" ? null : A.x,
                y: typeof A.y === "undefined" ? null : A.y
            },
            B: {
                x: typeof B.x === "undefined" ? null : B.x,
                y: typeof B.y === "undefined" ? null : B.y
            }
        };
    };

    /*
    * Public Method: pointLiesInsidePointSquare
    *
    * Checks if a point is inside a square defined by the length of its side and a single central point
    *
    * Parameters:
    *   P  - coordinates of the point of the form: [x, y]
    *   Ps - coordinates of the central point of the square of the form: [x, y]
    *   w  - the width or length of one side of the square
    *
    * Returns:
    *   a boolean true if point lies inside, else a boolean false
    */
    my.pointLiesInsidePointSquare = function (P, Ps, w) {
        var _w = w;

        if (P[0] < Ps[0] + _w &&
            P[0] > Ps[0] - _w &&
            P[1] < Ps[1] + _w &&
            P[1] > Ps[1] - _w) {
            return true;
        }
        
        return false;
    };

    /*
    * Public Method: pointInsideRectangle
    * 
    * Checks if a point is inside a rotated or unrotated rectangle
    *
    * Parameters:
    *   rect - the rectangle object which has the following properties: w (width), h (height), a (angle), x and y
    *   P    - the point object which has the following properties: x and y
    *
    * Returns:
    *   a boolean true if point lies inside, else a boolean false
    */
    my.pointInsideRectangle = function (rect, P) {
        var c         = Math.cos(-rect.a*Math.PI/180);
        var s         = Math.sin(-rect.a*Math.PI/180);
        
        // UNrotate the point depending on the rotation of the rectangle.
        var rotatedX  = rect.x + c * (P.x - rect.x) - s * (P.y - rect.y);
        var rotatedY  = rect.y + s * (P.x - rect.x) + c * (P.y - rect.y);
        
        // Perform a normal check if the new point is inside the bounds of the UNrotated rectangle.
        var leftX     = rect.x - rect.w / 2;
        var rightX    = rect.x + rect.w / 2;
        var topY      = rect.y - rect.h / 2;
        var bottomY   = rect.y + rect.h / 2;
        
        return leftX <= rotatedX && rotatedX <= rightX && topY <= rotatedY && rotatedY <= bottomY;
    };
    
    /*
    * Public Method: lineAxPaRectIntersect
    *
    * Checks if line intersects a rectangle
    * 
    * Parameters:
    *   rect - an object which contains the properties: s, x, and y;
    *               where:
    *                   hl - the horizontal length
    *                   vl - the vertical length
    *                   x - is the x coordinate of the line's center
    *                   y - is the y cooridnate of the line's center
    *   line   - an object which contains the properties: Ax, Ay, Bx, and By
    *               where:
    *                   Ax - is the x coordinate of the line's point A
    *                   Ay - is the y coordinate of the line's point A
    *                   Bx - is the x coordinate of the line's point B
    *                   By - is the y coordinate of the line's point B
    *
    * Returns:
    *   an object which contains the properties:
    *       yes       - a boolean true if an intersection is found, else a boolean false
    *       sideIndex - an integer representing the side of impact
    *       poi       - an object representing the point of impact                
    */
    my.lineAxPaRectIntersect = function (rect, line, angle) {    
        // First retrieve the four line segments that compose the square.
        angle = angle || 0;
        var lines = _getLineSegmentsFromRect(rect.hl, rect.vl, rect.x, rect.y, angle),
            lastPoint = new Point(line.Bx, line.By),
            currPoint = new Point(line.Ax, line.Ay),
            incidentLine = new Line(lastPoint, currPoint),
            nearest_line, // line first intersected (if projectile path intersected more than 1 line)
            nearest_dist, // distance from PoI to last point (line.Bx, line.By)
            nearest_poi;
            
        /* Validate possible sides of impact. The following are rules of validity:
           top    : lastPoint.y > lines[0].A.y,
           bottom : lastPoint.y < lines[2].A.y,
           left   : lastPoint.x < lines[3].A.x,
           right  : lastPoint.x > lines[1].A.x
        */
        
        var poi, dist, side, valid;
        
        // Check each line segment if it intersects with the other line segment.
        for (var i = 0; i < lines.length; i++) {
            
            if (_linesIntersect(new Point(line.Ax, line.Ay), new Point(line.Bx, line.By), new Point(lines[i].A.x, lines[i].A.y), new Point(lines[i].B.x, lines[i].B.y))) {
                // If it intersects, get PoI, compare it with the nearest_line (if !null) otherwise save it.
                poi = _getPofIntLines(lines[i], incidentLine);
                dist = _getDistanceBetweenPoints(lastPoint, poi);

                if (nearest_line) {
                    // Compare distance.
                    if (dist < nearest_dist) {
                        // Apply rules of validity.
                        
                        switch (i) {
                            case 0:
                                valid = lastPoint.y > lines[0].A.y;
                                break;
                            case 2:
                                valid = lastPoint.y < lines[2].A.y;
                                break;
                            case 3:
                                valid = lastPoint.x < lines[3].A.x;
                                break;
                            case 1:
                                valid = lastPoint.x > lines[1].A.x;
                                break;
                        }
                        
                        if (valid) {
                            nearest_dist = dist;
                            nearest_line = lines[i];
                            nearest_poi = poi;
                            side = i;
                        }
                    }
                }
                else {
                    nearest_line = lines[i];
                    nearest_dist = dist;
                    nearest_poi = poi;
                    side = i;
                }
            }
        }
        // Loop done, return object.
        
        if (nearest_line) {
            return { yes: true, sideIndex: side, PoI: poi };
        }
        else {
            return { yes: false, sideIndex: null, PoI: null };
        }
    };
    
    /*
    * Public Method: getPofIntLines
    *
    * Finds the point of intersection of two lines
    *
    * Parameters:
    *   A, B - points representing the first line
    *   C, D - points representing the second line
    *
    * Returns:
    *   the result of a call to the private method: _getPofIntLines
    */
    my.getPofIntLines = function(A, B, C, D) {
        return _getPofIntLines(new Line(A, B), new Line(C, D));
    };
    
    /*
    * Public Method: getDistanceBetweenPoints
    *
    * Finds the distance between two points
    *
    * Parameters:
    *   A, B - the two points
    *
    * Returns:
    *   the result of a call to a private method: _getDistanceBetweenPoints
    */
    my.getDistanceBetweenPoints = function(A, B) {
        return _getDistanceBetweenPoints(A, B);
    };
    
    my.getPointAtAngleFrom = function (x, y, angle, dist) {
        /* Returns the point at dist distance from the point (x, y) at angle angle. */
        var _y = y + (dist * Math.sin(angle*Math.PI/180));
        var _x = x + (dist * Math.cos(angle*Math.PI/180));
        
        return [_x, _y];
    };

    my.getAngleBetweenLineAndHAxis = function (S, E) {
        /* Returns the angle (in degrees) between a line defined by two points and the horizontal axis. Where S is the line start point and E the end point */

        // First find the differece between start/end
        var _x = E.x - S.x;
        var _y = E.y - S.y;

        // Calculate angle
        return ((Math.atan2(_y, _x) * 180/Math.PI) + 360) % 360;
    };
    
    /*
    * Public Method: getSlopeOfTangentLineToCircle
    *
    * Finds the slope of the line tangent to a circle
    *
    * Parameters:
    *   O - the circle's center point
    *   P - the point of tangency
    *
    * Returns:
    *   the slope of the tangent line in the form {x: x, y: y}
    */
    my.getSlopeOfTangentLineToCircle = function (O, P) {
        return {y: -(P.x - O.x), x: -(P.y - O.y)};
    };
    
    /*
    * Public Method: getBounceAngle
    * 
    * Finds the bounce angle of an incident vector (in degrees)
    *
    * Parameters:
    *   s - surface angle
    *   i - incoming angle
    *
    * Returns:
    *   the outgoing angle
    */
    my.getBounceAngle = function (s, i) {
        return (2 * (s + 90)) - 180 - i;
    };
    
    /*
    * Public Method: getLineCircleIntersectionPoints
    *
    * Finds the intersections points of a line and circle
    *
    * Parameters:
    *   A - first point of the line
    *   B - second point of the line
    *   C - the center of the circle
    *   r - the radius of the circle
    *
    * Returns:
    *   the point(s) of collision in an array, or empty array if no collision exists
    */
    my.getLineCircleIntersectionPoints = function (A, B, C, r) {
        var locA = {
            x: A.x - C.x,
            y: A.y - C.y
        }
        
        var locB = {
            x: B.x - C.x,
            y: B.y - C.y
        }
        
        var BmA = {
            x: B.x - A.x,
            y: B.y - A.y
        }
        
        var a = (BmA.x * BmA.x) + (BmA.y * BmA.y);
        var b = 2 * ((BmA.x * locA.x) + (BmA.y * locA.y));
        var c = (locA.x * locA.x) + (locA.y * locA.y) - (r * r);
        var delta = b * b - (4 * a * c);
        
        if (delta < 0) {
            // no intersection
            return [];
        }
        else if (delta === 0) {
            // one intersection
            var u = -b / (2 * a);
            return [{x: A.x + (BmA.x * u), y: A.y + (BmA.y * u)}];
        }
        else if (delta > 0) {
            // two intersections
            var sqrtD = Math.sqrt(delta);
            
            var u1 = (((-1)*b) + sqrtD) / (2 * a);
            var u2 = (((-1)*b) - sqrtD) / (2 * a);
            
            return [
                {x: A.x + (u1 * BmA.x), y: A.y + (u1 * BmA.y)},
                {x: A.x + (u2 * BmA.x), y: A.y + (u2 * BmA.y)}
            ];
        }
        
        return [];
    };
    
    /*
    * Public Method: getProjectedPointInTime
    *
    * Finds the projected point (time-based) from an origin point
    *
    * Parameters:
    *   O - the origin point
    *   d - the direction of the terminal point
    *   s - the speed in units/second (at which the point is moving)
    *   t - the time used to calculate the future terminal point
    *
    * Returns:
    *   a point object (terminal point)
    */
    my.getProjectedPointInTime = function (O, d, s, t) {
        // get the distance travelled
        var dist = s * t;
        
        // get projected point
        var P = my.getPointAtAngleFrom(O.x, O.y, d, dist);
        
        return {x: P[0], y: P[1]};
    };
    
    /*
    * Private Method: _getDistanceBetweenPoints
    *
    * Finds the distance between two points
    *
    * Parameters:
    *   A, B - the two points
    *
    * Returns:
    *   a floating point value, the distance
    */
    var _getDistanceBetweenPoints = function(A, B) {   
        return Math.sqrt(Math.pow(A.x - B.x, 2) + Math.pow(A.y - B.y, 2));
    };
    
    /*
    * Private Method: _getPofIntLines
    *
    * Finds the point of intersection of two lines
    *
    * Parameters:
    *   lineA, lineB - Line objects
    *
    * Returns:
    *   an object which contains the properties:
    *       x, y - the x and y coordinates of the point of intersection
    */
    var _getPofIntLines = function (lineA, lineB) {
        /* Returns the point of intersection of two lines in the form: {x: _, y: _} parameters are Line objects. */
        
        var mA, mB, X, Y,
            xA = lineA.A.x,
            yA = lineA.A.y,
            xB = lineB.A.x,
            yB = lineB.A.y;
        
        // Check if any of the lines are vertical. Since the slope of a vertical line is undefined (special case fix)
        if (lineA.A.x === lineA.B.x) {
        
            // X is the same for both lines.
            X = lineA.A.x;
            
            // Get slope of lineB.
            mB = _getSlopeOfLine(lineB);
            
            // Solve for Y.
            Y = mB * (X - xB) + yB;
        }
        else if (lineB.A.x === lineB.B.x) {
        
            // X is the same for both lines.
            X = lineB.A.x;
            
            // Get slope of lineB.
            mA = _getSlopeOfLine(lineA);
            
            // Solve for Y.
            Y = mA * (X - xA) + yA;
        }
        else {
        
            // Get slope of lineA.
            mA = _getSlopeOfLine(lineA);
            
            // Get slope of lineB.
            mB = _getSlopeOfLine(lineB);
            
            // Solve for X via the point-slope formula.
            X = ((mA * xA) - yA - (mB * xB) + yB) / (mA - mB);
            
            // Solve for Y via the point-slope formula of one of the lines.
            Y = mA * (X - xA) + yA;
        }
        
        return {x: X, y: Y};
    };
    
    /*
    * Private Method: _linesIntersect
    *
    * Checks if two lines each defined by two points intersect
    *
    * Parameters:
    *   A, B - points belonging to the first line
    *   C, D - points belonging to the second line
    *
    * Returns:
    *   a boolean true if they intersect, else a boolean false
    */
    var _linesIntersect = function (A, B, C, D) {
        var CmP = new Point(C.x - A.x, C.y - A.y);
        var r   = new Point(B.x - A.x, B.y - A.y);
        var s   = new Point(D.x - C.x, D.y - C.y);
        
        var CmPxr = (CmP.x * r.y - CmP.y * r.x) * 1.0;
        var CmPxs = (CmP.x * s.y - CmP.y * s.x) * 1.0;
        var rxs   = (r.x * s.y - r.y * s.x) * 1.0;
        
        if (CmPxr === 0) {
            // Lines are collinear, and so intersect if they have any overlap.
            
            return ((C.x - A.x < 0) != (C.x - B.x < 0)) || ((C.y - A.y < 0) != (C.y - B.y < 0));
        }
        
        if (rxs === 0) {
            return false; // Lines are parallel.
        }
        
        var rxsr = 1.0 / rxs;
        var t = CmPxs * rxsr;
        var u = CmPxr * rxsr;
        
        return (t >= 0) && (t <= 1) && (u >= 0) && (u <= 1);
    };
    
    /*
    * Private Method: _getLineSegmentsFromSquare
    *
    * Retrieves the outer line segments defining a square
    *
    * Parameters:
    *   side - length of the square's side
    *   x, y - coordinates of the square's center point
    *   angle - square rotation angle
    *
    * Returns:
    *   an array of lines following the format: [Top, Right, Bottom, Left]
    */
    var _getLineSegmentsFromSquare = function (side, x, y, angle) {
        angle = angle || 0;
        var halfDiagonal = Math.sqrt(Math.pow(side, 2) * 2) / 2;
        
        var pTL = my.getPointAtAngleFrom(x, y, angle + 135, halfDiagonal); // Top left.
        var pTR = my.getPointAtAngleFrom(x, y, angle + 45, halfDiagonal); // Top right.
        var pBR = my.getPointAtAngleFrom(x, y, angle + 225, halfDiagonal); // Bottom right.
        var pBL = my.getPointAtAngleFrom(x, y, angle + 315, halfDiagonal); // Bottom left.
            
        return [
            new Line({x: pTL[0], y: pTL[1]}, {x: pTR[0], y: pTR[1]}),
            new Line({x: pTR[0], y: pTR[1]}, {x: pBR[0], y: pBR[1]}),
            new Line({x: pBL[0], y: pBL[1]}, {x: pBR[0], y: pBR[1]}),
            new Line({x: pTL[0], y: pTL[1]}, {x: pBL[0], y: pBL[1]})
        ];
    };
    
    /*
    * Private Method: _getLineSegmentsFromRect
    *
    * Retrieves the outer line segments defining a rectangle
    *
    * Parameters:
    *   hl - the horizontal length
    *   vl - the vertical length
    *   x, y - coordinates of the rectangle's center point
    *   angle - square rotation angle
    *
    * Returns:
    *   an array of lines following the format: [Top, Right, Bottom, Left]
    */
    var _getLineSegmentsFromRect = function (hl, vl, x, y, angle) {
        angle = angle || 0;
        var halfDiagonal = Math.sqrt(Math.pow(hl, 2) + Math.pow(vl, 2)) / 2;
        
        var pTL = my.getPointAtAngleFrom(x, y, angle + 135, halfDiagonal); // Top left.
        var pTR = my.getPointAtAngleFrom(x, y, angle + 45, halfDiagonal); // Top right.
        var pBR = my.getPointAtAngleFrom(x, y, angle + 225, halfDiagonal); // Bottom right.
        var pBL = my.getPointAtAngleFrom(x, y, angle + 315, halfDiagonal); // Bottom left.
            
        return [
            new Line({x: pTL[0], y: pTL[1]}, {x: pTR[0], y: pTR[1]}),
            new Line({x: pTR[0], y: pTR[1]}, {x: pBR[0], y: pBR[1]}),
            new Line({x: pBL[0], y: pBL[1]}, {x: pBR[0], y: pBR[1]}),
            new Line({x: pTL[0], y: pTL[1]}, {x: pBL[0], y: pBL[1]})
        ];
    };
    
    var _getSlopeOfLine = function(line) {
        /* Returns the slope of the line. Takes a line parameter. */
        
        return (line.A.y - line.B.y) / (line.A.x - line.B.x);
    };
    
    return my;
}());

UTIL.gui = (function () {
    var my = {};
    
    my.selectMap = function (dir) {
        /* Select next/prev maps. */
        var map = GLOBALS.map;
        var map_name = document.getElementById('ms-name');
        var map_desc = document.getElementById('ms-desc');
        
        switch (dir) {
            case 'next':
                map.index = map.index === maps.length - 1 ? 0 : map.index + 1;
                break;
            case 'prev':
                map.index = map.index === 0 ? maps.length - 1 : map.index - 1;
                break;
            default:
                break;
        }
        
        map.current = maps[map.index];
        
        map_name.innerHTML = map.current.name;
        map_desc.innerHTML = map.current.desc;
    };
    
    my.updateTankStats = function (dir) {
        /* Update the tank selection stats. */
        
        /*
        * Max values for stat comparison:
        *   firepower - 2000
        *   armor     - 500
        *   mobility  - 400
        *   size      - 100
        */
        
        var ts = GLOBALS.tankSelection;
        
        do {
            if (dir === 'next') {
                ts.selectedIndex = ts.selectedIndex !== ts.blueprints.length-1 ? ts.selectedIndex + 1 : 0;
                if (ts.blueprints[ts.selectedIndex].locked === 1) {
                    // move again
                    ts.selectedIndex = ts.selectedIndex !== ts.blueprints.length-1 ? ts.selectedIndex + 1 : 0;
                }
            }
            else if (dir === 'prev') {
                ts.selectedIndex = ts.selectedIndex !== 0 ? ts.selectedIndex - 1 : ts.blueprints.length-1;
                if (ts.blueprints[ts.selectedIndex].locked === 1) {
                    // move again
                    ts.selectedIndex = ts.selectedIndex !== 0 ? ts.selectedIndex - 1 : ts.blueprints.length-1;
                }
            }
        } while (ts.blueprints[ts.selectedIndex].locked === 1);
       
        var si = ts.selectedIndex;
        var bps = ts.blueprints;
        var bp = bps[si];
        var name = UTIL.toTitleCase((bp.name).split('_').join(' '));
        var type = UTIL.toTitleCase((bp.type).split('_').join(' '));
        var chassis_img_url = TankImages.get(bp.bImage).src;
        var turret_img_url = TankImages.get(bp.tImage).src;
            
        var tank_stats = [
            [bp.health, 5000],
            [bp.shield, 10000],
            [bp.shieldRegen, 5000],
            [bp.armor, 1000],
            [bp.sSpeed, 180],
            [bp.tSpeed, 280],
            [bp.fSpeed, 400],
            [bp.rSpeed, 400],
            [bp.accel, 400],
            [bp.pDamage, 1000],
            [bp.pSpeed, 1000],
            [bp.fRate, 36],
            [bp.critChance, 100],
            [bp.critMultiplier, 20]
        ];
       
        var bar_cap = 512; // the ui bar max width
        
        // update tank stats shown
        var _c = 10;
        var tdata = document.getElementsByClassName('ts-bar');
        for (var i = 0; i < tank_stats.length; i++) {
            _c += 10;
            tdata[i].style.backgroundColor = 'rgb(255,255,'+_c+')';
            tdata[i].style.width = Math.min((tank_stats[i][0] / tank_stats[i][1]), 1) * bar_cap + 'px'; // (value / optimum) * max_bar_width
        }
        
        $('#tank-name').html(name);
        $('#tank-type').html(type);
        
        $('#tank-chassis-img').css('backgroundImage', 'url(' + chassis_img_url + ')');
        $('#tank-turret-img').css('backgroundImage', 'url(' + turret_img_url + ')');
    };
    
    my.makeSelectOpts = function (arrayOfObjects, prop) {
        /* Convert array of objects' property to options (string) of a select element. */
        
        var opts = '<option value="default" selected>--Select One--</option>';
        
        for (var i = 0; i < arrayOfObjects.length; i++) {
            opts += '<option value="' + arrayOfObjects[i][prop] + '">' + UTIL.toTitleCase(arrayOfObjects[i][prop]) + '</option>';
        }
        
        return opts;
    };

    my.makeSelectOptsFromAoS = function (arrayOfStrings) {
        /* Convert an array of strings to options for a select element. */

        var opts = '<option value="default" selected>--Select One--</option>';
        
        for (var i = 0; i < arrayOfStrings.length; i++) {
            opts += '<option value="' + arrayOfStrings[i] + '">' + arrayOfStrings[i] + '</option>';
        }
        
        return opts;
    };
    
    my.makeChildrenHTMLIntoArrayElements = function (elem) {
        /* Converts the html values of an element's children into array elements. */
        
        var array = [];
        
        $(elem).children().each(function (i, obj) {
            array.push($(obj).html());
        });
        
        return array;
    };
    
    my.makeChildrenATTRIntoArrayElements = function (elem, attr) {
        /* Converts the attribute values of an element's children into array elements. */
        
        var array = [];
        
        $(elem).children().each(function (i, obj) {
            array.push($(obj).attr(attr));
        });
        
        return array;
    };
    
    my.loadPediaContents = function () {
        /* Load gamepedia contents into pedia divs. */
        
        if (GLOBALS.flags.gamepediaLoaded) { return; }

        UTIL.get('json/gamepedia.json', function (response) {
            var pc = $('#pedia-content');
            var pt = $('#pedia-tabs');
            var gp = JSON.parse(response);
            var ins = '';
            var tab = null;

            for (var key in gp) {
                pt.append('<div class="pc-tabs" style="display: inline-block; width: 52px; height: 52px; background: url(images/ui/' + key + '-tab.png) center center no-repeat; cursor: pointer; margin-left: 10px;" onclick="$(\'.pc-cat\').hide(); $(\'#pc-tc-' + key + '\').fadeIn(200); $(\'.pc-tabs\').css(\'background-color\', \'transparent\'); $(this).css(\'background-color\',\'#0058b3\'); $(\'#cd-item-video\').get(0).pause();"></div>');
                ins = '<div id="pc-tc-' + key + '" class="pc-cat">';
                for (var i = 0; i < gp[key].length; i++) {
                    tab = gp[key];
                    ins += '<div class="pc-item" data-name="' + tab[i].name + '" data-description="' + tab[i].description + '" data-image-url="' + tab[i].image + '" data-video-url="' + tab[i].video + '">' + tab[i].name + '</div>';
                }
                ins += '</div>';
                pc.append(ins);
            }
            
            $('.pc-item').click(function () {
                $('.pc-item').removeClass('pc-item-active');
                $(this).addClass('pc-item-active');
                
                $('#cd-item-image').attr('src', $(this).data('image-url'));
                $('#cd-item-name').html($(this).data('name'));
                $('#cd-item-description').html($(this).data('description'));
                if ($(this).data('video-url') !== '') {
                    $('#cd-item-video').show();
                    $('#cd-item-video').attr('src', $(this).data('video-url'));
                    $('#cd-item-video').attr('controls', 'controls');
                    $('#cd-item-video').get(0).play();
                }
                else {
                    $('#cd-item-video').hide();
                }
            });
            
            GLOBALS.flags.gamepediaLoaded = true;
        }, function () {
            
        });
    };
    
    return my;
}());

/* UTIL.asset submodule. */
UTIL.asset = (function() {
    var my = {},
        loadQueue = [],
        loaded = 0,
        failed = 0,
        queued = 0;
        
    my.queue = function (type, args) {
        /* Equeue asset. args: [id, url, libObj] */
        loadQueue.push([type, args]);
        queued++;
    };
    
    my.bulkQueueImgs = function (assets, obj) {
        /* ([[id, url]...], obj) */
        for (var i = 0; i < assets.length; i++) {
            my.queue('image', [assets[i][0], assets[i][1], obj]); 
        }
    };
    
    my.getTotalQueued = function () {
        return queued;
    };
    
    my.getTotalLoaded = function () {
        return loaded;
    };
    
    my.getTotalFailed = function () {
        return failed;
    };
    
    my.clear = function () {
        /* Clears the loaded, failed, and queued vars for the next loading of assets. */
        loaded = 0;
        failed = 0;
        queued = 0;
    };
    
    my.load = function (onSuccess, onError) {
        /* Load one asset from front of queue. Call onSuccess if successful, else onError. */
        var item = loadQueue.shift();
        var type = item[0];
        var args = item[1];
        
        switch (type) {
            case 'image': // [id, url, library]
                args[2].add(args[0], args[1], function (id) {
                    loaded++;
                    onSuccess(id);
                }, function (error) {
                    failed++;
                    onError(error);
                });
                break;
            case 'soundpool': // [url, volume, poolmax, poolVar]
                args[1].init(function (soundLoc) {
                    loaded++;
                    onSuccess(soundLoc);
                });
                break;
            case 'audio': // [url, loop, volume, musicVar]
                var cpt = args[3].addEventListener('canplaythrough', function () {
                    loaded++;
                    onSuccess(args[0]);
                }, false);
                args[3].src = args[0];
                args[3].loop = args[1];
                args[3].volume = args[2];
                args[3].load();
                break;
            case 'blueprint': // url
                BLUEPRINT.addMulti(args[0], args[1], function(url) {
                    loaded++;
                    onSuccess(url);
                }, function (error) {
                    failed++;
                    onError(error);
                });
                break;
            default:
                break;
        }
    };
    
    my.loadAll = function (onSuccess, onError, onAllLoaded) {
        /*
        *  Load all assets in queue. Callbacks are called for each successfully loaded or failed asset.
        *  onAllLoaded is called after everything on queue has been loaded.
        */
        while (loadQueue.length > 0) {
            my.load(function (response) {
                onSuccess(response);
                // check if everything's been loaded
                if (loaded === queued) {
                    my.clear();
                    
                    onAllLoaded();
                }
                else {
                    
                }
            }, onError);
        }
    };
    
    return my;
}());

/* UTIL.timing submodule */
UTIL.timer = (function() {
    // all methods apply to both timers and intervals (extended versions)
    return {
        pauseAll : function () {
            /* Pause all timers. */
            for (var i = 0; i < timers.length; i++) {
                timers[i].pause();
            }
            for (i = 0; i < intervals.length; i++) {
                intervals[i].pause();
            }
        },
        resumeAll : function () {
            /* Resume all timers. */
            for (var i = 0; i < timers.length; i++) {
                timers[i].resume();
            }
            for (i = 0; i < intervals.length; i++) {
                intervals[i].resume();
            }
        },
        killAll : function () {
            /* Kill all running timers in the timers array. */
            for (var i = 0; i < timers.length; i++) {
                timers[i].clear();
            }
            for (i = 0; i < intervals.length; i++) {
                intervals[i].clear();
            }
            
            timers.length = 0;
            intervals.length = 0;
        },
        cleanAll : function () {
            /* Remove all inactive timers in timers array. */
            timers = timers.filter(function (item) {
                return !item.isExpired();
            });
            intervals = intervals.filter(function (item) {
                return !item.isExpired();
            });
        }
    };
}());

/*
* Public Object: ImageLibrary
*
*  An image library constructor
*/
function ImageLibrary() {
    this.shelf = {};
    
    /*
    * Public Method: add
    *
    * Pushes a new image object into the shelf array
    */
    
    this.add = function (id, url, onSuccess, onError) {
        var tmp = new Image();
        tmp.id = id;
        tmp.onload = function () {
            this.ready = true;
            onSuccess(url);
            tmp.onload = null;
        };
        tmp.onerror = function () {
            onError('Error loading ' + id);
        };
        tmp.src = url;
        this.shelf[id] = tmp;
    };
    
    /*
    * Public Method: get
    *
    * Returns the image object which contains id
    */
    this.get = function(id) {
        return this.shelf[id];
    };
}

/*
* Public Object: TextureLibrary
*/
function TextureLibrary() {
    this.shelf = {};
    
    this.add = function (id, url, onSuccess, onError) {
    
    };
    
    this.get = function (id) {
    
    };
}

/*
* Public Object: SoundPool
*
* A sound pool constructor
*
* Parameters:
*   loc - location of the sound file
*   vol - sound volume
*   max - max number of sounds in pool
*/
function SoundPool(loc, vol, max) {
    var size = max,
        soundLoc = loc,
        soundVol = vol,
        soundIndex = 0;
    
    var pool = [];
    this.pool = pool;
    this.loaded = 0;
    
    /*
    * Public Method: init
    * 
    * Initializes the sound pool for later use
    */
    this.init = function (onSuccess) {
        var loaded = this.loaded;
        for (var i = 0; i < size; i++) {
            var sound = new Audio(soundLoc);
            var cpt = sound.addEventListener('canplaythrough', (function (scope) {
                scope.loaded++;
                if (scope.loaded === max) {
                    onSuccess(soundLoc);
                }
                removeEventListener('canplaythrough', cpt, false);
            }(this)), false);
            sound.volume = soundVol;
            sound.load();
            pool[i] = sound;
        }
    };
    
    /*
    * Public Method: get
    *
    * Plays a sound in the pool, shifts index
    */
    this.get = function () {
        if (pool[soundIndex].currentTime === 0 || pool[soundIndex].ended) {
            pool[soundIndex].play();
        }
        soundIndex = (soundIndex + 1) % size;
    };
    
    this.setVolume = function (percentage) {
        var _d = percentage / 100;
        for (var i = 0; i < size; i++) {
            pool[i].volume = soundVol * _d;
        }
    };
}

function Stat() {

    var fields = {}; // [fieldname, value]
    
    this.add = function (name) {
        /* Add new field. */
        // Check if field already exists
        
        if (!(name in fields)) {
            fields[name] = 0;
        }   
    };
    
    this.inc = function (name, value) {
        /* Increment value of matching field. */
        fields[name] += value;
    };
    
    this.dec = function (name, value) {
        /* Decrement value of matching field. */
        fields[name] -= value;
    };
    
    this.update = function (name, value) {
        /* Update value of matching field. */
        fields[name] = value;
    };
    
    this.reset = function () {
        /* Reset the values of all fields. */
        for (field in fields) {
            fields[field] = 0;
        }
    };
    
    this.get = function (name) {
        /* Retrieves the value of the matching field. */
        return fields[name];
    };
    
    this.getAll = function () {
        /* Retrieves all the fields. */
        return fields;
    };
};
/*
function Timer(callback, expire) {
    // Extended wrapper for the setTimeout function.
    this.cb = function () {
        callback();
        dead = true;
    };
    
    var dead = false;
    this.remaining = expire;
    this.expire_init = expire;

    this.pause = function () {
        window.clearTimeout(this.timerId);
        this.remaining -= new Date() - this.start;
    };

    this.resume = function () {
        this.start   = new Date();
        this.timerId = window.setTimeout(this.cb, this.remaining);
    };
    
    this.reset = function () {
        window.clearTimeout(this.timerId);
        this.start   = new Date();
        this.timerId = window.setTimeout(this.cb, this.expire_init);
    };
    
    this.extend = function (extension) {
        window.clearTimeout(this.timerId);
        this.remaining = this.getRemaining() + extension;
        this.start     = new Date();
        this.timerId   = window.setTimeout(this.cb, this.remaining);
    };
    
    this.clear = function () {
        window.clearTimeout(this.timerId);
        dead = true;
    };
    
    this.isExpired = function () {
        return dead;
    };
    
    this.getRemaining = function () {
        this.remaining -= new Date() - this.start;
        return this.remaining;
    };
    
    var thisTimer = this;
    timers.push(thisTimer);

    this.resume();
}*/

function Timer(callback, expire) {
    // settimeout replacement
    var m = {};
    
    m.config = {
        active : true,      // active
        status : 'running', // running|paused|dead
        ms     : 0,         // current count in milliseconds
        xp     : expire,    // expiration
        cb     : callback   // called on expire
    };
    
    m.pause = function () {
        m.config.status = 'paused';
    };
    
    m.resume = function () {
        m.config.status = 'running';
    };
    
    m.reset = function () {
        m.config.ms = 0;
    };
    
    m.extend = function (extension) {
        m.config.xp += extension;
    };
    
    m.clear = function () {
        m.config.active = false;
        m.config.status = 'dead';
        GLOBALS.flags.clean.timers++;
    };
    
    m.isExpired = function () {
        return !m.config.active && m.config.status === 'dead'; 
    };
    
    m.timeout = function () {
        if ( m.config.active ) {
            m.config.cb();
            m.clear();
        }
    };
    
    m.getRemaining = function () {
        return m.config.xp - m.config.ms;
    };
    
    m.update = function (delta) {
        m.config.ms += delta * 1000;
        if (m.config.ms >= m.config.xp) {
            m.timeout();
        }
    };
    
    timers.push(m);
    
    return m;
}

/*function Interval(callback, delay, ticks) {
    // Extended wrapper for the setInterval function.

    this._ticks = ticks || false; // stores the initial value of ticks
    this.ticks  = ticks || false;

    this.delay         = delay;
    this.intervalId    = null;

    var dead = false;
    var thisInterval = this;

    this.cb   = function () {
        callback();

        if (thisInterval.ticks !== false) {
            thisInterval.ticks -= 1;
            if (thisInterval.ticks === 0) {
                window.clearInterval(that.intervalId);
                dead = true;
            }
        }
    };

    this.pause = function () {
        window.clearInterval(this.intervalId);
    };

    this.resume = function () {
        this.intervalId = window.setInterval(this.cb, this.delay);
    };

    this.reset = function () {
        window.clearInterval(this.intervalId);
        this.ticks = this._ticks;
        this.intervalId = window.setInterval(this.cb, this.delay);
    };

    this.extend = function (extension) {
        window.clearInterval(this.intervalId);
        this.ticks += extension;
        this.intervalId = window.setInterval(this.cb, this.delay);
    };

    this.clear = function () {
        window.clearInterval(this.intervalId);
        dead = true;
    };

    this.isExpired = function () {
        return dead;
    };

    this.getRemaining = function () {
        return this.ticks;
    };

    intervals.push(thisInterval);

    this.resume();
}*/

function Interval(callback, delay, ticks) {
    // setinterval replacement
    
    var m = {};
    
    m.config = {
        active : true,
        status : 'running', // running|paused|dead
        ms     : 0,
        mx     : delay,
        tk     : {c: 0, m: ticks},
        cb     : callback, // called for each tick
        noend  : false // invalidates ticks, interval doesnt end
    };
    
    m.pause = function () {
        m.config.status = 'paused';
    };
    
    m.resume = function () {
        m.config.status = 'running';
    };
    
    m.reset = function () {
        m.config.ms = 0;
        m.config.tk.c = 0;
    };
    
    m.extend = function (extension) {
        m.config.tk.m += extension;
    };
    
    m.clear = function () {
        m.config.active = false;
        m.config.status = 'dead';
        GLOBALS.flags.clean.intervals++;
    };
    
    m.isExpired = function () {
        return !m.config.active && m.config.status === 'dead';
    };
    
    m.tick = function () {
        m.config.tk.c++;
        m.config.cb();
    };
    
    m.getRemaining = function () {
        return m.config.tk.m - m.config.tk.c;
    };
    
    m.update = function (delta) {
        m.config.ms += delta * 1000;
        if (m.config.ms >= m.config.mx) {
            m.tick();
            m.config.ms = m.config.ms - m.config.mx; // add overflow to next delay
            
            if (m.config.tk.c === m.config.tk.m && !m.config.noend) {
                m.clear();
            }
        }
    };
    
    intervals.push(m);
    
    return m;
}

// Dummy Object
function Dummy(specs) {
    this.mods = typeof specs.mods === 'undefined' ? [] : specs.mods;
    
    this.config = {
        active     : true,
        name       : specs.name,
        oX         : specs.oX,
        oY         : specs.oY,
        explosive  : typeof specs.explosive === 'undefined' ? false : specs.explosive
    };
}

Dummy.prototype.update = function (delta) {
    this.delta = delta;
    
    // Apply all mods
    for (var i = 0; i < this.mods.length; i++) {
        this.mods[i](this);
    }
};

jQuery.fn.flash = function( color, duration )
{
    var current = this.css( 'color' );
    this.animate( { color: 'rgb(' + color + ')' }, duration / 2 );
    this.animate( { color: current }, duration / 2 );
}