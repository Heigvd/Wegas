var ret = [], cObject, level;

var Wegas = {//                                                                 // Utilities
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
    }
};

function ProgGameSimulation() {
}
Wegas.mix(ProgGameSimulation.prototype, {
    run: function(playerFn, level) {
        this.args = {};
        this.ret = [];
        this.cObject = null;
        this.said = "";
        this.level = level;

        this.objects = level.objects;                                           // Shortcut to level objects
        this.gameOverSent = false;
        //"sendCommand({type:'resetLevel', objects: " + Y.JSON.stringify(this.get("objects")) + "});"
        var o, i, j;
        for (i = 0; i < this.objects.length; i += 1) {
            this.objects[i].defaultActions = this.objects[i].actions;
        }

        if (level.onStart) {
            eval(level.onStart);
        }

        for (i = 0; i < level.maxTurns; i += 1) {
            this.log('Turn ' + (i + 1));

            for (j = 0; j < this.objects.length; j += 1) {
                this.log(playerFn);
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
            this.log('It\'s lost.');                                            // then it's definitely lost
        }
    },
    resetActions: function() {
        for (var i = 0; i < this.objects.length; i++) {
            this.objects[i].actions = this.objects[i].defaultActions;
            this.sendCommand({
                type: "updated",
                object: this.objects[i].clone()
            });
        }
    },
    commands: {
        move: function() {
        }
    },
    sendCommand: function(cfg) {
        this.ret.push(cfg);
    },
    getCommands: function() {
        return this.ret;
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
        if (object.actions - actions < 0) {
            //this.log("Not enough actions");
            return false;
        }
        object.actions -= actions;
        return true;
    },
    say: function(msg) {
        if (this.checkGameOver())
            return;

        /*if (!consumeActions(object, 1)) {
         this.log("Not enough actions to say something");
         return;
         }*/
        this.sendCommand({
            type: "say",
            id: this.cObject.id,
            text: msg
        });
        this.log(this.cObject.id + " says \"" + msg + "\"");
        this.said = msg;
    },
    move: function() {
        var object = this.cObject,
                moveV = dirToVector(object.direction);

        if (this.checkGameOver())
            return;

        if (!this.consumeActions(object, 1)) {
            this.log("Not enough actions to move");
            return;
        }

        if (this.checkCollision(object, object.x + moveV.x, object.y + moveV.y)) {
            this.log("Something is blocking the way");
        } else {
            object.x += moveV.x;
            object.y += moveV.y;
            this.sendCommand({
                type: 'move',
                object: object.clone()
            });
        }
    },
    rotate: function(dir) {
        var object = this.cObject;

        if (this.checkGameOver())
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
        this.sendCommand({
            type: 'move',
            object: object.clone()
        });
    },
    right: function() {
        this.rotate(1);
    },
    left: function() {
        this.rotate(-1);
    },
    fire: function() {
        var i, source = this.cObject;
        println("fire" + source.actions);

        if (this.checkGameOver())
            return;

        if (!this.consumeActions(source, 1)) {
            this.log("Not enough actions to fire.");
            return;
        }

        this.sendCommand({
            type: 'fire',
            object: source.clone()
        });

        var colidee, dirV = dirToVector(source.direction);

        for (i = 0; i <= source.range; i++) {
            colidee = this.checkCollision(this.cObject, source.x + (i * dirV.x), source.y + (i * dirV.y));
            if (colidee) {
                colidee.life = 0;
                this.sendCommand({
                    type: 'die',
                    object: colidee.clone()
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
                this.log("Player collision");
                return o;
            }
        }
        if (this.level.map[y][x].y === 0 ? !collided : false) {                 // It's a XOR
            this.log("Map collision" + this.level.map[x][y].y + "*" + this.level.map[x][y].y + "*" + x + "*" + y);
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
        with (this) {
            return eval(code);
        }
    },
    doPlayerEval: function(playerFn) {
//        var scope = {};
//        for (i in this.commands) {
//            scope[i] = Wegas.bind(this.commands[i], this);
//        }
        with (this) {
            //(function(that) {
            playerFn.apply(this, values(this.getArgs()));                       // run fn
            //})(this);
        }
    },
    findObject: function(id) {
        for (var i = 0; i < this.objects.length; i = i + 1) {
            if (this.objects[i].id === id) {
                return this.objects[i];
            }
        }
        return null;
    }
});


// *** Utilities *** //
Object.prototype.clone = function() {
    var newObj = (this instanceof Array) ? [] : {};
    for (var i in this) {
        if (i == 'clone')
            continue;
        if (this[i] && typeof this[i] == "object") {
            newObj[i] = this[i].clone();
        } else
            newObj[i] = this[i];
    }
    return newObj;
};
function dirToVector(dir) {
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
function values(object) {
    var ret = [], i;
    for (i in object) {
        ret.push(object[i]);
    }
    return ret;
}

function print_r(object) {
    var i;
    for (i in object) {
        if (object.hasOwnProperty(i)) {
            print(i + ": ");
            if (object[i] instanceof Object) {
                println(" ");
                print_r(object[i]);
            } else {
                println(object[i]);
            }
        }
    }
}

function run(playerFn, level) {
    var simulation = new ProgGameSimulation();
    try {
        simulation.run(playerFn, level);
    } catch (e) {
        simulation.log(e);
    }
    return simulation.getCommands();
}