/*-------- Globals & Setup --------*/

var GLOBALS = (function () {
    var m = {
        flags : {
            clean : {
                threshold     : 32, // the max number of inactive objects (e.g. destructibles) before filter-based cleaning is done
                destructibles : 0,  // the current inactive object count (in this case, the current inactive destructibles) 
                visualeffects : 0,
                projectiles   : 0,
                tanks         : 0,
                dummies       : 0,
                timers        : 0,
                intervals     : 0
            },
            initSpawn : false,
            gamepediaLoaded : false
        },
        settings : {
            set : function () {
                // set screenshake
                m.settings.screenShake = parseInt($('#set-screen-shake').val());
                
                // set always show hp/shield
                m.settings.ashp = parseInt($('#set-ashp').val());
                
                // set music volume
                var _mscv = parseInt($('#set-music-volume').val());
                _mscv = Math.max(0, Math.min(_mscv, 200)); // clamp between 0 and 200
                m.settings.mscVol = _mscv;
                UTIL.setMscVol(m.settings.mscVol);
                
                // set sfx volume
                var _sfxv = parseInt($('#set-sfx-volume').val());
                _sfxv = Math.max(0, Math.min(_sfxv, 200)); // clamp between 0 and 200
                m.settings.sfxVol = _sfxv;
                UTIL.setSfxVol(m.settings.sfxVol);
            },
            screenShake : 0, // 0 = false, 1 = on critical hit only, 2 = on normal hit only, 3 = on both
            ashp : 1, // always show hitpoints and shield
            mscVol : 100,
            sfxVol : 100
        },
        ui : {
            active : {
                upgrades : false // true if upgrades screen is shown
            }
        },
        tankSelection : {
            blueprints : [],
            selectedIndex: 0
        },
        player : {
            name : 'player1',
            bestScores : {} // map_name : best_score
        },
        map : {
            index   : 0,
            current : null,
            wave    : {
                current : 0,
                current_ : 0,
                enemyCount : 0,
                spawning : false
            },
            postgame : false
        },
        statistics : {
            tank_type_kills : [],
            tankAppend : 0,
            tankKillTicks : 0,
            lastScore: 0
        },
        botCount : 0, // the number of bots currently active
        abotCount: 0, // allied bots spawned (doesn't get reset)
        rdd : 0, // number of recently destroyed destructibles (that the pathfinders are not aware of)
        packedDestructibles : []
    };
    
    return m;
}());

Array.prototype.clear = function () {
  while (this.length > 0) {
    this.pop();
  }
};

var LOG_ENABLED = false;
var MAX_BOTS = 50;

var terrain = null;
var dummies = [];
var triggers = [];
var powerups = [];
var tanks = [];
var projectiles = [];
var destructibles = [];
var startingpoints = [];
var visualeffects = [];
var lights = [];
var timers = [];
var intervals = [];
var maps = [];
var bots = []; // [tank, movequeue, movelist_status, state] where movelist_status pertains to readiness to execute the movelist, state refers to bot state 'patrolling', 'chasing', 'running'

var mainAnimation = null;
var editorAnimation = null;

var camera = null;
var chase_target = {};
var chase_target_seek = false;

var ui_location = null; // menu, game, editor

var mousePos = {};
var mouseDownLeft = false; // left mouse
var mouseDownRight = false; // right mouse
var cycles = 0;
var logNum = 0;
var keysDown = {};
var then = performance.now();

/* map editor */
var cs_placement_ok = true;
var cspo_timeout = null; // timeout for cs_placement_ok

var cs_asset_select_ok = true;
var csas_timeout = null;

var cs_movement_ok = true;
var csmv_timeout = null;

var hud_kill_count = document.getElementById('kill-count');
var cLog = document.getElementById('combat-log');
var hNum = document.getElementById('hNum');
var hp = document.getElementById('current-health');

var waveCountDown = null;
var spawn_timer = null;
var cd_skip = false;