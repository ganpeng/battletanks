/* pre-game asset loading */

var LOAD = (function () {
    var my = {};
    
    my.gameSettings = function (player_name) {
        /* Load game settings before game starts. */
        powerups.clear();
        tanks.clear();
        bots.clear();
        projectiles.clear();
        destructibles.clear();
        startingpoints.clear();
        
        player_name = player_name === '' ? 'player' : player_name;
        
        // get the max players for current map : can be taken from the startingpoint length
        var max_players = GLOBALS.map.current.startingPoints.length;
        
        // build playerlist (first is the player, populate the rest with bots)
        var playerlist = [];
        var player_tank = GLOBALS.tankSelection.blueprints[GLOBALS.tankSelection.selectedIndex].name;
        
        // push the player first
        playerlist.push([player_name, player_tank, 'player']);
        
        for (var i = 1; i < max_players; i++) {
            // start on 1 so that the total bot number is 1 less than the max_players
            playerlist.push(['bot'+i, 'heavy', 'computer']);
        }
        
        var setup_error = MAP.setup(GLOBALS.map.current, playerlist);

        if (setup_error === 0) {
            // setup camera
            camera = new Viewport.Camera(0, 0, canvas.width, canvas.height, WORLD_WIDTH, WORLD_HEIGHT);
        
            // bind player controls
            player = tanks[0];
            camera.follow(player, canvas.width/2, canvas.height/2);
            
            // bind ai controls
            for (i = 1; i < max_players; i++) {
                bots.push([tanks[i], [], 'waiting', 'chase']);
            
                // spawn pathfinders
                LOAD.worker.pathFinder(GLOBALS.map.current, tanks[i].config.id, tanks[i].config.width);
            }
        }
        
        return max_players - 1;
        
    };
    
    return my;
}());

/* Sub-module: worker
 * In-charge of spawning workers
 */
LOAD.worker = (function () {
    var my = {},
        workerPool = []; // format of each item [worker, id]
    
    my.bot = function (id) {
        /* Spawn a new bot worker. */
        
        var ai = _spawnWorker('scripts/bot.js', id);
        
        ai.addEventListener('message', function (event) {
            //UTIL.writeToLog('worker says: ' + event.data);
            // terminate worker
            my.terminateAll();
        }, false);
        
        // start worker
        ai.postMessage(JSON.stringify(tanks[1].config));
    };
    
    my.pathFinder = function (map, id, tankSize) {
        /* Spawn a new pathFinder worker. */
        
        var pf = _spawnWorker('scripts/pathfinder.js', id);
        
        pf.addEventListener('message', function (event) {
            // Receive data from pathfinder
            var messageReceived  = JSON.parse(event.data),
                sender           = messageReceived.sender,
                cmd              = messageReceived.cmd;
                
            var bot_index = null;
            
            for (var i = 0; i < bots.length; i++) {
                // find bot matching sender
                if (bots[i][0].config.id === sender) {
                    bot_index = i; // save index
                }
            }
                
                switch (cmd) {
                    case 'update_ok':
                        bots[bot_index][2] = 'ready';
                        break;
                    case 'waypoint_ok':
                        bots[bot_index][1] = messageReceived.waypoint;
                        bots[bot_index][2] = 'ready';
                        break;
                    default:
                        break;
                }
            
            // Save the movement commands to the moveCmds action array
            
            
        }, false);
        
        // start worker
        var msg = {};
        msg.cmd = 'update_obstacles';
        msg.sender = id;
        msg.data = map.destructibles;
        msg.worldWidth = WORLD_WIDTH;
        msg.worldHeight = WORLD_HEIGHT;
        msg.tankSize = tankSize;
        
        pf.postMessage(JSON.stringify(msg));
    };
    
    my.sendMessage = function (id, msg) {
        /* Send message to worker corresponding to id. msg is an object containing the properties: cmd and data. */
        for (var i = 0; i < workerPool.length; i++) {
            if (id === workerPool[i][1]) {
                workerPool[i][0].postMessage(JSON.stringify(msg));
                break;
            }
        }
        
        // if no matching id is found, fail silently.
    };
    
    my.terminateAll = function () {
        /* Terminate all workers in pool. */
        while (workerPool.length > 0) {
            workerPool[0][0].terminate();
            workerPool.splice(0, 1);
        }
    };
    
    var _spawnWorker = function (src, id) {
        /* Spawn a new worker. */
        
        var worker = new Worker(src);
        
        workerPool.push([worker, id]);
        
        return worker;
    };
    
    return my;
}());