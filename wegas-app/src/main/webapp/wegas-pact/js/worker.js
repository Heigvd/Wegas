// / <reference no-default-lib="true"/>
/// <reference lib="webworker"/>
/* eslint-env worker */
importScripts('acorn-min.js', 'interpreter-min.js');

/* global Interpreter */
Interpreter.PARSE_OPTIONS = {
    ecmaVersion: 5,
    locations: true,
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
                newObj = Array.isArray(o) ? [] : {};
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
 * @param {Configuration} cfg
 */
function ProgGameSimulation(cfg) {
    this.debug = cfg.debug || false;
    this.callLine = cfg.callLine || false;
    /** @type {null | Interpreter} */
    this.runner = null;
    this.breakpoints = cfg.breakpoints || [];
    this.watches = cfg.watches || [];
    this.startStep = cfg.startStep === undefined ? -1 : cfg.startStep;
    this.targetStep = cfg.targetStep === undefined ? 1e7 : cfg.targetStep;
    this.ret = [];
    /** @type {MapItem | null} */
    this.cObject = null;
    this.currentStep = -1;
    /** @type {LevelPage} */
    this.level;
    /** @type {LevelPage["api"]} */
    this.api; //= level.api;
    /** @type {LevelPage["objects"]} */
    this.objects; // Shortcut to level objects
    this.gameOverSent = false;
    this.doRecordCommands = true;
}

ProgGameSimulation.prototype = {
    /**
     *
     * @param {(name: string) => void} playerFn fn containing player's code
     * @param {LevelPage} level
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
            this.gameOver();
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

    /**
     * Queue command
     * @param {{type: string, [key:string]:any}} cfg
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
        this.sendCallLine();
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
        this.sendCallLine();
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
    move: function() {
        var i,
            o,
            object = this.cObject,
            moveV;
        this.sendCallLine();
        if (object == null || object.direction == null) {
            return;
        }
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
                            this.gameOver(); // then it's definitely lost
                        }
                        break;
                }
            }
            if (!this.checkPath(object.x, object.y)) {
                this.sendCommand({
                    type: 'outside',
                    id: object.id,
                });
                this.gameOver();
            }
        }
    },
    gameOver: function() {
        this.log('You lost.');
        this.sendCommand({
            type: 'gameLost',
        });
        this.doRecordCommands = false;
        this.gameOverSent = true;
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
    /**
     * @param {number} dir
     */
    rotate: function(dir) {
        var object = this.cObject;
        if (object == null || object.direction == null) {
            return;
        }
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
        this.sendCallLine();
        this.rotate(-1);
    },
    left: function() {
        this.sendCallLine();
        this.rotate(1);
    },
    /**
     * @param {() => void} fn
     */
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
    /**
     * @param {MapItem} source
     * @param {number} x
     * @param {number} y
     */
    checkCollision: function(source, x, y) {
        var o,
            k,
            objects = this.getObjectsAt(x, y);

        this.currentCollides = [];

        for (k = 0; k < objects.length; k++) {
            o = objects[k];
            if (o.id !== source.id) {
                this.currentCollides.push(o);
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
        return false;
    },
    /**
     * @param {number} x
     * @param {number} y
     */
    checkPath: function(x, y) {
        if (
            this.level.map[y] === undefined || // outside map
            this.level.map[y][x] === undefined || // outside map
            this.level.map[y][x].y === 0 // no path
        ) {
            return false;
        }
        return true;
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
            // var maxLevel = Variable.find(gameModel, 'maxLevel'),
            //     currentLevel = Variable.find(gameModel, 'currentLevel');
            // if (maxLevel.getValue(self) <= currentLevel.getValue(self)) {
            //     Variable.find(gameModel, 'money').add(self, 100);
            // }
            // maxLevel.setValue(
            //     self,
            //     Math.max(maxLevel.getValue(self), Number(this.level.onWin))
            // );

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
        try {
            this.runner = new Interpreter(
                playerFn,
                function(interpreter, ctx) {
                    for (var i in this.api) {
                        if (this[this.api[i]]) {
                            interpreter.setProperty(
                                ctx,
                                this.api[i],
                                interpreter.createNativeFunction(
                                    this[this.api[i]].bind(this)
                                )
                            );
                        }
                    }
                }.bind(this)
            );
        } catch (e) {
            // Parse Error in the form of 'Message (col:line)'
            var res = /.*\((\d+):(\d+)\)$/.exec(e.message);
            postMessage([
                'parseError',
                e.message,
                res
                    ? {
                          start: {
                              line: Number(res[1]),
                              column: Number(res[2]),
                          },
                          end: {
                              line: Number(res[1]),
                              column: Number(res[2]) + 1,
                          },
                      }
                    : undefined,
            ]);
            throw e;
        }
        // Force strict mode
        this.runner.getScope().strict = true;
        try {
            while (this.runner.step()) {
                var node = this.runner.stateStack[
                    this.runner.stateStack.length - 1
                ].node;
            }
        } catch (e) {
            postMessage(['runtimeError', e.message, node.loc]);
            throw e;
        }
        this.runner.run();
        var result = this.runner.value;
        this.runner = null;
        return result;
    },
    sendCallLine: function() {
        if (this.runner != null && this.runner.stateStack.length) {
            var node = this.runner.stateStack[this.runner.stateStack.length - 1]
                .node;
            this.sendCommand({
                type: 'line',
                line: node.loc,
            });
        }
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
     * @param {MapItem} a object
     * @param {MapItem} b object
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
     * @param {1|2|3|4} dir direction
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

/**
 * @param {(name: string) => void} playerFn fn containing player's code
 * @param {LevelPage} level
 * @param {Configuration=} cfg
 */
function run(playerFn, level, cfg) {
    cfg = cfg || /** @type {Configuration} */ ({});
    var simulation = new ProgGameSimulation(cfg);

    simulation.run(playerFn, level);
    return simulation.getCommands();
}
self.onmessage = function(m) {
    var result = run.apply(self, m.data);
    // @ts-ignore
    postMessage(['success', result]);
};
