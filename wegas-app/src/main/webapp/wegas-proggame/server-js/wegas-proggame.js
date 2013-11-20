var ret = [], cObject, level, Wegas;

Wegas = {//                                                                     // Utilities
    bind: function(fn, scope) {
        var scope = scope, fn = fn;
        return function() {
            fn.call(scope);
        };
    },
    mix: function(receiver, supplier) {
        var i;
        for (i in supplier) {
            if (supplier.hasOwnProperty(i) && !receiver[i]) {
                receiver[i] = supplier[i];
            }
        }
        return receiver;
    },
    Object: {
        values: function(object) {
            var ret = [], i;
            for (i in object) {
                ret.push(object[i]);
            }
            return ret;
        },
        clone: function(o) {
            var newObj = (o instanceof Array) ? [] : {};
            for (var i in o) {
                if (i === 'clone')
                    continue;
                if (o[i] && typeof o[i] === "object") {
                    newObj[i] = Wegas.Object.clone([i]);
                } else
                    newObj[i] = o[i];
            }
            return newObj;
        }
    }
};
function wdebug(msg) {
    //println(msg);
}
function ProgGameSimulation() {
    this.breakpoints = [];
    this.debug = false;
    this.watches = [];
    this.startLine = -1;
}
Wegas.mix(ProgGameSimulation.prototype, {
    run: function(playerFn, level) {
        wdebug("Simulation run");
        this.args = {};
        this.ret = [];
        this.cObject = null;
        this.said = "";
        this.doRecordCommands = true;
        this.currentLine = -1;
        this.level = level;
        this.objects = level.objects;                                           // Shortcut to level objects
        this.gameOverSent = false;

        //"sendCommand({type:'resetLevel', objects: " + JSON.stringify(this.get("objects")) + "});"
        var o, i, j;
        for (i = 0; i < this.objects.length; i += 1) {
            this.objects[i].defaultActions = this.objects[i].actions;
        }

        if (level.onStart) {
            eval(level.onStart);
        }
        this.log('Running Main...');
        for (i = 0; i < level.maxTurns; i += 1) {
            //this.log('Turn ' + (i + 1));

            for (j = 0; j < this.objects.length; j += 1) {
                if (this.checkGameOver())                                       // If the game is already stopped,
                    continue;                                                   // no need to continue

                this.cObject = o = this.objects[j];                             // Set up a global reference

                if (o.id === "Player") {                                        // If current object is the player,
                    //this.log('Your turn');
                    this.doPlayerEval(playerFn);                                // run his code
                }
                if (o.ai) {                                                     // If object has an AI,
                    //this.log(o.id + ' turn');
                    this.doEval(o.ai);                                          // run its code
                }
            }

            //this.resetActions();                                              // Reset available action at the beginning of each turn
        }
        if (!this.checkGameOver()) {                                            // If the game is still not won,
            this.log('You lost.');                                              // then it's definitely lost
        }
    },
    resetActions: function() {
        for (var i = 0; i < this.objects.length; i++) {
            this.objects[i].actions = this.objects[i].defaultActions;
            this.sendCommand({
                type: "updated",
                object: Wegas.Object.clone(this.objects[i])
            });
        }
    },
    commands: {
        move: function() {
        }
    },
    sendCommand: function(cfg) {
        wdebug("Sendcommand " + cfg.type + " current line: " + this.currentLine + ", start line:" + this.startLine + "*" + this.doRecordCommands);
        if (this.currentLine < this.startLine) {                                // Debug
            wdebug("early command dropped");
            return;
        }
        if (!this.doRecordCommands) {
            return false;
        }
        this.ret.push(cfg);
    },
    getCommands: function() {
        return this.ret;
    },
    beforeAction: function(object) {
        if (this.checkGameOver())
            return false;

        if (!this.consumeActions(object, 1)) {
            this.log("Not enough actions to rotate.");
            return false;
        }

        return true;
    },
    afterAction: function(object) {
        this.doEval(this.level.onAction);
    },
    log: function(text) {
        this.sendCommand({
            type: 'log',
            text: text
        });
    },
    pushArg: function(name, val) {
        this.args[name] = val;
    },
    getArgs: function() {
        return this.args;
    },
    consumeActions: function(object, actions) {

//        if (object.actions - actions < 0) {
//            //this.log("Not enough actions");
//            return false;
//        }
//        object.actions -= actions;

        return true;
    },
    say: function(msg) {
        if (!this.beforeAction())
            return;

        this.doSay({
            text: "" + msg
        });
        this.said = msg;

        this.afterAction();
    },
    doSay: function(cfg) {
        this.log(this.cObject.id + " says \"" + cfg.text + "\"");
        this.sendCommand(Wegas.mix(cfg, {
            type: "say",
            id: this.cObject.id,
            duration: 1500
        }));
    },
    doOpen: function(object) {
        object.open = true;
        this.sendCommand({
            id: object.id,
            type: "doorState",
            state: true
        });
    },
    read: function() {
        if (this.checkGameOver())
            return;

        var panel = this.findAt(this.cObject.x, this.cObject.y),
                value;

        if (panel && panel.value) {
            value = this.doEval(panel.value);
            this.doSay({text: "It's written \"" + value + "\""});
            return value;
        } else {
            this.doSay({text: "There's nothing to read here."});
        }
    },
    move: function() {
        var object = this.cObject,
                moveV = this.dirToVector(object.direction);


        if (!this.beforeAction(object))
            return;

        if (!this.consumeActions(object, 1)) {
            this.log("Not enough actions to move");
            return;
        }

        if (this.checkCollision(object, object.x + moveV.x, object.y + moveV.y)) {
            this.doSay({text: "Something is blocking the way", duration: 800});
            //this.log("Something is blocking the way");
        } else {
            object.x += moveV.x;
            object.y += moveV.y;
            this.doMove(object);
        }
    },
    doMove: function(object) {
        this.sendCommand({
            type: 'move',
            dir: object.direction,
            id: object.id,
            x: object.x,
            y: object.y
        });
    },
    rotate: function(dir) {
        var object = this.cObject;

        if (!this.beforeAction(object))
            return;

        if (!this.consumeActions(object, 1)) {
            this.log("Not enough actions to rotate.");
            return;
        }
        object.direction += dir;
        if (object.direction > 4)
            object.direction = 1;
        if (object.direction < 1)
            object.direction = 4;

        this.doMove(object);                                                    // Send move command

        this.afterAction();
    },
    right: function() {
        this.rotate(-1);
    },
    left: function() {
        this.rotate(1);
    },
    fire: function() {
        var i, source = this.cObject;
        wdebug("fire" + source.actions);

        if (this.checkGameOver())
            return;

        if (!this.consumeActions(source, 1)) {
            this.log("Not enough actions to fire.");
            return;
        }

        this.sendCommand({
            type: 'fire',
            object: Wegas.Object.clone(source)
        });

        var colidee, dirV = this.dirToVector(source.direction);

        for (i = 0; i <= source.range; i++) {
            colidee = this.checkCollision(this.cObject, source.x + (i * dirV.x), source.y + (i * dirV.y));
            if (colidee) {
                colidee.life = 0;
                this.sendCommand({
                    type: 'die',
                    object: Wegas.Object.clone(colidee)
                });
            }
        }
    },
    checkCollision: function(source, x, y) {
        var o, k, collides,
                collided = false;
        for (k = 0; k < this.objects.length; k++) {
            o = this.objects[k];
            collides = (o.x === x && o.y === y && o.id !== source.id);
            collided = collided || collides;
            if (collides && (o.collides === undefined || o.collides)) {
                //this.log("Player collision");
                if (!o.open) {                                                  // useful for doors
                    return o;
                }
            }
        }
        //this.log("pos" + y);
        //this.log();
        //if (this.level.map[this.level.map.length - 1 - y][x].y === 0 ? !collided : false) {// It's a XOR
        if (this.level.map[y][x].y === 0 ? !collided : false) {                 // It's a XOR
            return true;
        }
        return null;
    },
    checkGameOver: function() {
        if (this.gameOverSent) {
            return true;
        } else if (this.doEval(this.level.winningCondition)) {
            this.gameOverSent = true;
            this.log("You won!");
            this.sendCommand({
                type: "gameWon"
            });
            return true;
        }
        return false;
    },
    doEval: function(code) {
        try {
            with (this) {
                return eval(code);
            }
        } catch (e) {
            return null;
        }
    },
    doPlayerEval: function(playerFn) {
//        var scope = {};
//        for (i in this.commands) {
//            scope[i] = Wegas.bind(this.commands[i], this);
//        }
        with (this) {
            //(function(that) {
            playerFn.apply(this/*, Wegas.Object.values(this.getArgs())*/);                       // run fn
            //})(this);
        }
    },
    find: function(id) {
        for (var i = 0; i < this.objects.length; i = i + 1) {
            if (this.objects[i].id === id) {
                return this.objects[i];
            }
        }
        return null;
    },
    findAt: function(x, y) {
        for (var i = 0; i < this.objects.length; i = i + 1) {
            if (this.objects[i].x === x && this.objects[i].y === y
                    && this.objects[i].id !== "Player") {
                return this.objects[i];
            }
        }
        return null;
    },
    findObject: function(id) {
        return find(id);
    },
    comparePos: function(a, b) {
        return a.x === b.x && a.y === b.y;
    },
    _____debug: function(line, scope, vars) {
//            this.log("mmmm"+ y+"*"+);

        this.currentLine += 1;
        wdebug("debug line:" + line + ", currentline " + this.currentLine + ", startline: " + this.startLine);
        if (this.currentLine > this.startLine) {
            //&& line > this.currentLine && // first time considering this line
            wdebug("halted" + this.breakpoints.indexOf(line) + "*" + line);
            if (this.breakpoints.indexOf("" + line) > -1) {
                this.sendCommand({
                    type: "breakpoint",
                    line: line,
                    step: this.currentLine,
                    scope: vars
                            //scope: this.genScope(scope)
                });
                this.doRecordCommands = false;
            }
        }
        //this.currentLine = line;
    },
    _____watch: function() {
        for (var i = 0; i < arguments.length; i += 1) {
            if (!this.watches.indexOf(arguments[i]) > -1) {
                this.watches.push(arguments[i]);
            }
        }
    },
    genScope: function() {
        var i, ret = {};
        for (i = 0; i < this.watches.length; i += 1) {
            try {

                ret[this.watches[i]] = eval(this.watches[i]);
//                ret[this.watches[i]] = this.doEval(this.watches[i]);
            } catch (e) {
                // GOTCHA
            }
//            ret[this.watches[i]] = true;
        }
        return ret;
    },
// *** Utilities *** //
    dirToVector: function(dir) {
        var dirX = 0, dirY = 0;
        switch (dir) {
            case 1:
                dirY = 1;
                break;
            case 2:
                dirX = 1;
                break;
            case 3:
                dirY = -1;
                break;
            case 4:
                dirX = -1;
                break;
        }
        return {
            x: dirX,
            y: dirY
        };
    }
});



function run(playerFn, level) {
    var simulation = new ProgGameSimulation();
    simulation.run(playerFn, level);
    return JSON.stringify(simulation.getCommands());
}
function debug(playerFn, level, breakPoints, watches, startLine) {
    var simulation = new ProgGameSimulation();
    simulation.debug = true;
    simulation.watches = watches;
    simulation.startLine = startLine;
    simulation.breakpoints = breakPoints;
    simulation.run(playerFn, level);
    return JSON.stringify(simulation.getCommands());
}