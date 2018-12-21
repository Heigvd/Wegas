// Types used accross this file
/* global gameModel, self, Variable, xapi, Log*/
/**
 * @typedef ObjectsItem
 * @property {string} id
 * @property {number} x
 * @property {number} y
 * @property {number=} direction
 * @property {boolean=} collides
 * @property {string} components
 *
 * @typedef Level ProgGame level
 * @property {string} `@pageId` Level id
 * @property {"ProgGameLevel"} type
 * @property {string} label
 * @property {string} intro
 * @property {{x:0, y:0|1}[][]} map Matrix of {x, y} where
 * - y = 1 means a path
 * - x is unused (history...)
 * @property {ObjectsItem[]} objects
 * @property {string[]} api
 * @property {string} winningCondition
 * @property {string} onStart
 * @property {string} onAction
 * @property {string | number} onWin
 * @property {string} defaultCode
 * @property {number} maxTurns
 *
 * @typedef {Object} Config
 * @property {boolean} debug
 * @property {unknown[]} breakpoint
 * @property {unknown[]} watches
 * @property {number} startStep
 * @property {number} targetStep
 * @property {boolean} recordCommands
 */

/* exported Action*/
var Action = {
    init: function() {
        Log.post([
            Log.statement('initialized', 'proggame'),
            Log.statement(
                'initialized',
                'level',
                Variable.find(gameModel, 'currentLevel').getValue(self)
            ),
        ]);
    },
    /**
     *
     * @param {number | string} level
     */
    changeLevel: function(level) {
        /**
         * @type {com.wegas.core.persistence.variable.primitive.NumberDescriptor}
         */
        var currentLevelDesc = Variable.find(gameModel, 'currentLevel');
        var curValue = currentLevelDesc.getValue(self);
        var maxValue = Math.min(
            Variable.find(gameModel, 'maxLevel').getValue(self),
            Variable.find(gameModel, 'levelLimit').getValue(self)
        );
        if (Number(level) <= maxValue) {
            currentLevelDesc.setValue(self, Number(level));
            if (curValue != currentLevelDesc.getValue(self)) {
                Log.post(Log.statement('initialized', 'level', level));
            }
        }
    },
};
/**
 * @namespace Wegas utilities
 */
var Wegas = {
    //                                                                     // Utilities
    Object: {
        /**
         * @param {{ [x: string]: any; }} object
         */
        values: function(object) {
            var r = [],
                i;
            for (i in object) {
                r.push(object[i]);
            }
            return r;
        },
        /**
         * Copy direct properties from objects to target
         * src: https://developer.mozilla.org/fr/docs/Web/JavaScript/Reference/Objets_globaux/Object/assign
         * @template T
         * @template O
         * @param {T} target
         * @param {...O} objects
         * @returns {T & O}
         */
        // eslint-disable-next-line no-unused-vars
        assign: function assign(target, objects) {
            // .length of function is 2
            'use strict';
            if (target == null) {
                // TypeError if undefined or null
                throw new TypeError(
                    'Cannot convert undefined or null to object'
                );
            }

            var to = Object(target);

            for (var index = 1; index < arguments.length; index++) {
                var nextSource = arguments[index];

                if (nextSource != null) {
                    // Skip over if undefined or null
                    for (var nextKey in nextSource) {
                        // Avoid bugs when hasOwnProperty is shadowed
                        if (
                            Object.prototype.hasOwnProperty.call(
                                nextSource,
                                nextKey
                            )
                        ) {
                            to[nextKey] = nextSource[nextKey];
                        }
                    }
                }
            }
            return to;
        },
        /**
         * Deep clone
         * @template {{[key: string]: any} | any[]} T
         * @param {T} o object to clone
         * @returns {T} clone
         */
        clone: function clone(o) {
            var i,
                newObj = o instanceof Array ? [] : {};
            for (i in o) {
                if (i === 'clone') continue;
                if (o[i] && typeof o[i] === 'object') {
                    newObj[i] = clone(o[i]);
                } else newObj[i] = o[i];
            }
            return newObj;
        },
    },
    /**
     * Get level from database
     * Works if pages are stored in JCR
     * @param {string|number} level
     * @returns {Level}
     */
    getLevelPage: function getLevelPage(level) {
        return JSON.parse(gameModel.getPages()[String(level)]);
    },
    /**
     * Create a double array with variables and corresponding values from given hashmap
     * @param {{[variables:string]: any}} varValues hashmap variable -> value
     */
    scopeValue: function(varValues) {
        /** @type {string[]} */
        var vars = [];
        var vals = [];
        if (typeof varValues === 'object') {
            vars = Object.keys(varValues);
            vals = vars.map(function(k) {
                return varValues[k];
            });
        }
        return {
            variables: vars,
            values: vals,
        };
    },
    /**
     * Make a function throw when called
     * @param {(...args:any[])=>any} fn function to mark as evil
     */
    evil: function(fn) {
        var newFn = function() {
            throw Error(fn.name + ' is Evil');
        };
        newFn.prototype = fn.prototype;
        return Wegas.Object.assign(newFn, fn);
    },
};
/**
 * print arguments
 * @callback varStr
 * @param {...string} str
 * @returns {void}
 */
/**
 * @type {varStr}
 */
var wdebug = function() {
    // print.apply(null, arguments);
};
/**
 * @constructor
 * @param {Config} cfg
 */
function ProgGameSimulation(cfg) {
    this.debug = cfg.debug || false;
    this.breakpoints = cfg.breakpoints || [];
    this.watches = cfg.watches || [];
    this.startStep = cfg.startStep === undefined ? -1 : cfg.startStep;
    this.targetStep = cfg.targetStep === undefined ? 1e7 : cfg.targetStep;
    this.doRecordCommands =
        cfg.doRecordCommands === undefined ? true : cfg.recordCommands;
    this.ret = [];
    /** @type {ObjectsItem | null} */
    this.cObject = null;
    this.currentStep = -1;
    /** @type {Level} */
    this.level;
    /** @type {Level["api"]} */
    this.api; //= level.api;
    /** @type {Level["objects"]} */
    this.objects; // Shortcut to level objects
    this.gameOverSent = false;
}

ProgGameSimulation.prototype = {
    /**
     *
     * @param {(name: string) => void} playerFn fn containing player's code
     * @param {Level} level
     */
    run: function(playerFn, level) {
        wdebug('Simulation run');
        // convert old version
        // @TODO remove ...
        var onWin = level.onWin,
            r;
        if (
            typeof onWin === 'string' &&
            (r = onWin.match(
                /Variable.find\(gameModel, "currentLevel"\).setValue\(self, (\d+)\)/
            ))
        ) {
            level.onWin = Number(r[1]);
        }
        this.ret = [];
        this.cObject = null;
        this.currentStep = -1;
        this.level = level;
        this.api = level.api;
        this.objects = level.objects;
        this.gameOverSent = false;
        //"sendCommand({type:'resetLevel', objects: " + JSON.stringify(this.get("objects")) + "});"
        var o, i, j, a;
        for (i = 0; i < this.objects.length; i += 1) {
            this.objects[i].defaultActions = this.objects[i].actions;
        }
        if (level.onStart) {
            this.doEval(level.onStart);
        }
        this.log('Running...');
        for (i = 0; i < level.maxTurns; i += 1) {
            if (level.maxTurns > 1) {
                this.log('Turn ' + (i + 1));
            }
            for (j = 0; j < this.objects.length; j += 1) {
                if (this.checkGameOver())
                    // If the game is already stopped,
                    continue; // no need to continue
                this.cObject = o = this.objects[j]; // Set up a global reference

                if (o.id === 'Player') {
                    // If current object is the player,
                    // this.log('Your turn');
                    this.doPlayerEval(playerFn); // run his code
                }
                if (o.ai) {
                    // If object has an AI,
                    // this.log(o.id + ' turn');
                    var res = {};
                    for (a in this.api) {
                        if (this[this.api[a]]) {
                            res[this.api[a]] = this[this.api[a]].bind(this);
                        }
                    }
                    this.doEval(o.ai, res); // run its code
                }
            }

            //this.resetActions();                                              // Reset available action at the beginning of each turn
        }
        if (!this.checkGameOver()) {
            // If the game is still not won,
            this.log('You lost.'); // then it's definitely lost
            this.sendCommand({
                type: 'gameLost',
            });
        }
    },
    resetActions: function() {
        for (var i = 0; i < this.objects.length; i++) {
            this.objects[i].actions = this.objects[i].defaultActions;
            this.sendCommand({
                type: 'updated',
                object: Wegas.Object.clone(this.objects[i]),
            });
        }
    },
    commands: {
        move: function() {},
    },
    /**
     * Queue command
     * @param {{type: string}} cfg
     * @returns {boolean} command has been successfully queued
     */
    sendCommand: function(cfg) {
        wdebug(
            'Sendcommand ' +
                cfg.type +
                ' current line: ' +
                this.currentStep +
                ', start line:' +
                this.startStep +
                '*' +
                this.doRecordCommands +
                ', id:' +
                cfg.id
        );
        if (this.currentStep < this.startStep) {
            // Debug
            wdebug('early command dropped');
            return false;
        }
        if (this.currentStep > this.targetStep) {
            // Debug
            wdebug('late command dropped');
            return false;
        }
        if (!this.doRecordCommands) {
            return false;
        }
        this.ret.push(cfg);
        return true;
    },
    lastCommand: function() {
        return this.ret[this.ret.length - 1];
    },
    getCommands: function() {
        return this.ret;
    },
    beforeAction: function(object) {
        if (this.checkGameOver()) return false;

        //if (!this.consumeActions(object, 1)) {
        //    this.log("Not enough actions.");
        //    return false;
        //}

        return true;
    },
    /**
     *
     * @param {{[variable:string]: unknown}=} values to pass to the script
     */
    afterAction: function(values) {
        var injected = Wegas.Object.assign(
            {},
            { Source: this.cObject },
            values
        );
        this.doEval(this.level.onAction, injected);
    },
    log: function(text) {
        if (text instanceof Object) {
            text = JSON.stringify(text);
        }
        this.sendCommand({
            type: 'log',
            text: text,
        });
    },
    consumeActions: function(object, actions) {
        //if (object.actions - actions < 0) {
        //    //this.log("Not enough actions");
        //    return false;
        //}
        //object.actions -= actions;

        return true;
    },
    say: function(msg) {
        if (!this.beforeAction()) return;

        this.doSay({
            text: '' + msg,
        });

        this.afterAction({ type: 'say', said: msg });
    },
    doSay: function(cfg) {
        this.log(this.cObject.id + ' says "' + cfg.text + '"');
        this.sendCommand(
            Wegas.Object.assign(cfg, {
                type: 'say',
                id: this.cObject.id,
                delay: 1500,
            })
        );
    },
    doOpen: function(object) {
        object.open = true;
        this.sendCommand({
            id: object.id,
            type: 'doorState',
            state: true,
        });
    },
    read: function() {
        if (this.checkGameOver()) return;
        var panel = this.findAt(this.cObject.x, this.cObject.y, 'Panel'),
            value;
        if (panel && panel.components === 'Panel') {
            value = panel.value;
            this.doSay({
                text: 'It\'s written "' + value + '"',
                think: true,
            });
        } else {
            this.doSay({
                text: "There's nothing to read here.",
                think: true,
            });
        }
        this.afterAction({ type: 'read', panel: panel });
        return value;
    },
    include: function(fileName) {
        var msg,
            files = Variable.find(gameModel, 'files');
        if (files) {
            msg = files.getInstance(self).getMessageBySubject(fileName);
            if (msg) {
                this.log('Including: ' + fileName);
                this.doEval('' + msg.body);
                return;
            }
        }
        this.log('Unable to include file: ' + fileName);
    },
    move: function() {
        var i,
            o,
            object = this.cObject,
            moveV = this.dirToVector(object.direction);
        if (!this.beforeAction(object)) return;

        if (!this.consumeActions(object, 1)) {
            this.log('Not enough actions to move');
            return;
        }

        if (
            this.checkCollision(object, object.x + moveV.x, object.y + moveV.y)
        ) {
            this.doSay({
                text: 'Something is blocking the way',
                duration: 800,
            });
            //this.log("Something is blocking the way");
        } else {
            object.x += moveV.x;
            object.y += moveV.y;
            this.doMove(object);

            for (i = 0; i < this.currentCollides.length; i += 1) {
                o = this.currentCollides[i];
                switch (o.components) {
                    case 'Trap':
                        if (o.enabled) {
                            this.sendCommand({
                                type: 'trap',
                                id: o.id,
                            });
                            this.log('You lost.'); // then it's definitely lost
                            this.sendCommand({
                                type: 'gameLost',
                            });
                            this.doRecordCommands = false;
                        }
                        break;
                }
            }
        }
    },
    doMove: function(object) {
        this.sendCommand({
            type: 'move',
            dir: object.direction,
            id: object.id,
            x: object.x,
            y: object.y,
        });
    },
    rotate: function(dir) {
        var object = this.cObject;

        if (!this.beforeAction(object)) return;

        if (!this.consumeActions(object, 1)) {
            this.log('Not enough actions to rotate.');
            return;
        }
        object.direction += dir;
        if (object.direction > 4) object.direction = 1;
        if (object.direction < 1) object.direction = 4;

        this.doMove(object); // Send move command

        this.afterAction({ type: 'rotate', direction: dir });
    },
    right: function() {
        this.rotate(-1);
    },
    left: function() {
        this.rotate(1);
    },
    npc: function(fn) {
        var oldO = this.cObject;
        var npc;
        for (var i = 0; i < this.objects.length; i = i + 1) {
            if (this.objects[i].components === 'NPC') {
                npc = this.objects[i];
                break;
            }
        }
        if (npc === undefined) {
            return;
        }
        this.cObject = npc;
        var ret = fn();
        this.cObject = oldO;
        return ret;
    },
    getObjectsAt: function(x, y) {
        var k,
            objects = [];
        for (k = 0; k < this.objects.length; k++) {
            if (this.objects[k].x === x && this.objects[k].y === y) {
                objects.push(this.objects[k]);
            }
        }
        return objects;
    },
    checkCollision: function(source, x, y) {
        var o,
            k,
            collided = false,
            objects = this.getObjectsAt(x, y);

        this.currentCollides = [];

        for (k = 0; k < objects.length; k++) {
            o = objects[k];
            if (o.id !== source.id) {
                this.currentCollides.push(o);
                collided = true;
                switch (o.components) {
                    case 'Door': // Doors
                        if (!o.open) {
                            return o;
                        }
                        break;
                    case 'Trap': // Traps do not collide
                        break;
                    default:
                        // By default check collision
                        if (o.collides === undefined || o.collides) {
                            return o;
                        }
                }
            }
        }

        if (
            this.level.map[y] === undefined || // outside map
            this.level.map[y][x] === undefined || // outside map
            this.level.map[y][x].y === 0 // no path
                ? !collided
                : false
        ) {
            return true;
        }
        return false;
    },
    /**
     * Check if game has ended and execute success if player
     */
    checkGameOver: function() {
        if (this.gameOverSent) {
            return true;
        } else if (this.doEval('return ' + this.level.winningCondition)) {
            this.gameOverSent = true;
            this.log('You won!');
            this.sendCommand({
                type: 'gameWon',
            });
            var maxLevel = Variable.find(gameModel, 'maxLevel'),
                levelLimit = Variable.find(gameModel, 'levelLimit'),
                currentLevel = Variable.find(gameModel, 'currentLevel');
            if (maxLevel.getValue(self) <= currentLevel.getValue(self)) {
                Variable.find(gameModel, 'money').add(self, 100);
            }
            maxLevel.setValue(
                self,
                Math.max(maxLevel.getValue(self), Number(this.level.onWin))
            );

            return true;
        }
        return false;
    },
    /**
     *
     * @param {string} code code to execute
     * @param {{[variable:string]: unknown}=} values scope values hashmap
     */
    doEval: function(code, values) {
        wdebug('Eval', code);
        var ctx = this,
            argName,
            commands = ['comparePos', 'find', 'doOpen', 'lastCommand'],
            cb = commands.map(function(e) {
                return ctx[e].bind(ctx);
            });
        if (typeof values === 'object') {
            argName = Object.keys(values);
            commands = commands.concat(argName);
            cb = cb.concat(
                argName.map(function(k) {
                    return values[k];
                })
            );
        }
        try {
            return new Function(commands, code).apply(this, cb);
        } catch (e) {
            wdebug('[PROGGAME] ERRORED', e);
            this.log(e.message);
            return null;
        }
    },
    /**
     * @param {Function} playerFn
     */
    doPlayerEval: function(playerFn) {
        wdebug('Player eval');
        var scope = {
                // hide global variables to player
                self: undefined,
                gameModel: undefined,
                Variable: undefined,
                VariableDescriptorFacade: undefined,
                Instance: undefined,
                RequestManager: undefined,
                print: undefined,
                Wegas: undefined,
                Action: undefined,
                Log: undefined,
                xapi: undefined,
                ProgGameSimulation: undefined,
                run: undefined,
                load: undefined,
                // debugger tool
                _____debug: this._____debug.bind(this),
                watches: this.watches,
            },
            i;
        for (i in this.api) {
            if (this[this.api[i]]) {
                scope[this.api[i]] = this[this.api[i]].bind(this);
            }
        }
        var params = Wegas.scopeValue(scope);
        var f = new Function(
            params.variables.join(','),
            'return (' + playerFn.toString() + ').call({})'
        );
        return f.apply(null, params.values);
    },
    /**
     * Find object with correspondig id
     *
     * @param {string} id
     */
    find: function(id) {
        for (var i = 0; i < this.objects.length; i = i + 1) {
            if (this.objects[i].id === id) {
                return this.objects[i];
            }
        }
        return null;
    },
    /**
     * Find object at given position which is not the Player
     *
     * @param {number} x
     * @param {number} y
     * @param {string=} type
     */
    findAt: function(x, y, type) {
        for (var i = 0; i < this.objects.length; i = i + 1) {
            if (
                this.objects[i].x === x &&
                this.objects[i].y === y &&
                this.objects[i].components !== 'PC' &&
                (!type || this.objects[i].components === type)
            ) {
                return this.objects[i];
            }
        }
        return null;
    },
    /**
     * Check if 2 objects are at the same position
     *
     * @param {ObjectsItem} a object
     * @param {ObjectsItem} b object
     */
    comparePos: function(a, b) {
        return a.x === b.x && a.y === b.y;
    },
    _____debug: function(line, scope, vars) {
        this.currentStep += 1;
        wdebug(
            '____debug line:' +
                line +
                ', current step ' +
                this.currentStep +
                ', startStep: ' +
                this.startStep
        );
        if (this.currentStep > this.startStep) {
            // vars = (function(o) {
            //     var i,
            //         w = o.watches,
            //         ret = {};
            //     for (i = 0; i < w.length; i++) {
            //         try {
            //             print("EVAL", w[i]);
            //             ret[w[i]] = o.doEval("return " + w[i]);
            //         } catch (e) {}
            //     }
            //     return ret;
            // })(this);
            //&& line > this.currentStep && // first time considering this line
            wdebug('halted' + this.breakpoints.indexOf(line) + '*' + line);
            if (this.breakpoints.indexOf('' + line) > -1) {
                this.sendCommand({
                    type: 'breakpoint',
                    line: line,
                    step: this.currentStep,
                    scope: vars,
                    //scope: this.genScope(scope)
                });
                this.doRecordCommands = false;
            } else {
                this.sendCommand({
                    type: 'line',
                    line: line,
                });
            }
        }
        //this.currentStep = line;
    },
    _____watch: function() {
        for (var i = 0; i < arguments.length; i += 1) {
            if (!(this.watches.indexOf(arguments[i]) > -1)) {
                this.watches.push(arguments[i]);
            }
        }
    },
    genScope: function() {
        var i,
            ret = {};
        for (i = 0; i < this.watches.length; i += 1) {
            try {
                ret[this.watches[i]] = this.doEval('return ' + this.watches[i]);
            } catch (e) {
                // GOTCHA
            }
            //            ret[this.watches[i]] = true;
        }
        return ret;
    },
    // *** Utilities *** //
    /**
     * Get a normalized vector for a given direction
     * @param {0|1|2|3} dir direction
     */
    dirToVector: function(dir) {
        var dirX = 0,
            dirY = 0;
        switch (dir) {
            case 1: // down
                dirY = 1;
                break;
            case 2: // right
                dirX = 1;
                break;
            case 3: // top
                dirY = -1;
                break;
            case 4: // left
                dirX = -1;
                break;
        }
        return {
            x: dirX,
            y: dirY,
        };
    },
};
/* exported run */
/**
 * @param {(name: string) => void} playerFn fn containing player's code
 * @param {Level | string} level
 * @param {Config=} cfg
 */
function run(playerFn, level, cfg) {
    Object.freeze(this); // Freeze global object
    /** @type {Level} */
    var realLevel;
    cfg = cfg || /** @type {Config} */ ({});
    if (typeof level !== 'object') {
        realLevel = Wegas.getLevelPage(level);
    } else {
        realLevel = level;
    }
    var simulation = new ProgGameSimulation(cfg);

    simulation.run(playerFn, realLevel);

    return JSON.stringify(simulation.getCommands());
}
//node debug
/* eslint-disable  */
// var exports;

// if (module && module.exports) {
//     module.exports.run = run;
//     print = function() {
//         console.log(arguments);
//     }
// }
/* eslint-enable */
