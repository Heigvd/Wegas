/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-proggame-level', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
    GRIDSIZE = 31,
    ProgGameLevel;

    /**
     *  The level display class, with script input, ia, debugger and
     *  terrain display.
     *
     */
    ProgGameLevel = Y.Base.create("wegas-proggame-level", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        // *** Fields *** //
        handlers: null,
        aceField: null,
        display: null,
        runButton: null,
        commandsStack: null,
        CONTENT_TEMPLATE: '<div class="yui3-g">'

        + '<div class="yui3-u left">'
        + '<div class="inventory"><h1>Inventory</h1><i><center style="padding-top:40px;">empty</center></i></div>'
        + '<div class="api"><h1>Api</h1></div>'
        + '</div>'

        + '<div class="yui3-u right">'
        + '<div class="yui3-g topright">'
        + '<div class="yui3-u topcenter"><h1></h1>'
        + '<div class="terrain-ui player-ui">Life<div class="life"><span /></div>Actions<div class="actions"></div></div>'
        + '<div class="terrain-ui enemy-ui">Life<div class="life"><span></span><div class="cl"></div></div>Actions<div class="actions"></div></div>'
        + '<div class="terrain"></div></div>'
        + '<div class="yui3-u toptopright">'
        + '<div class="buttons"></div>'
        + '<div class="ai"><h1>Enemy A.I.</h1></div>'
        + '<div class="debugger"><h1>Log</h1></div>'
        + '</div>'
        + '</div>'

        + '<div class="code"><h1>Your code</h1></div>'
        + '</div>'
        + '<div style="clear:both"></div>',

        // *** Lifecycle Methods *** //
        initializer: function () {
            this.handlers = {};
        },
        renderUI: function () {
            var i, cb = this.get(CONTENTBOX), api =[];

            this.aceField = new Y.inputEx.AceField({
                parentEl: cb.one(".code"),
                name: 'text',
                type: 'ace',
                height: "300px",
                language: "javascript",
                value: "move();fire();"
            });

            cb.one(".ai").append(Y.Wegas.App.nl2br(this.get("ai") || "<center><i>empty</i></center>"));
            cb.one(".topcenter h1").setHTML(this.get("label"));

            for (i = 0; i < this.get("api").length; i++) {
                api.push(this.get("api")[i].name);
            }
            cb.one(".api").append(api.join(', ') + "*");

            this.display = new ProgGameDisplay(this.toObject());
            this.display.render(cb.one(".terrain"));

            this.runButton = new Y.Wegas.Button({
                label: "RUN SCRIPT"
            });
            this.runButton.render(cb.one(".buttons"));

            this.resetUI();
        },
        bindUI: function () {
            this.handlers.response = Y.Wegas.app.VariableDescriptorFacade.after("response", // If data changes, refresh
                this.syncUI, this);
            this.handlers.playerChange = Y.Wegas.app.after('currentPlayerChange',
                this.syncUI, this);                                             // If current user changes, refresh (editor only)

            this.runButton.on("click", this.run, this);

            this.display.after('commandExecuted', this.consumeCommand, this);
            this.after('commandExecuted', this.consumeCommand, this);

        },
        run: function () {
            this.resetUI();

            this.runButton.set("label", "RUNNING...");
            this.runButton.set("disabled", true);

            Y.Wegas.app.VariableDescriptorFacade.rest.sendRequest({
                request: "/ProgGame/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: "JSON.stringify(run(function () {"+ this.aceField.getValue()+"}, "
                    + Y.JSON.stringify(this.toObject()) + "));"
                },
                on: {
                    success: Y.bind(this.onServerReply, this),
                    failure: Y.bind(function () {
                        this.runButton.set("label", "RUN SCRIPT");
                        this.runButton.set("disabled", false);
                        alert("Your script contains an error.");
                    }, this)
                }
            });
        },
        syncUI: function () {
            this.display.syncUI();
            this.syncFrontUI();
        },

        destructor: function () {
            var k;
            for (k in this.handlers) {
                this.handlers[k].detach();
            }
            console.log('!')
            this.aceField.destroy();
            this.display.destroy();
            this.runButton.destroy();
        },

        resetUI: function () {
            this.objects = Y.clone(this.get("objects"));

            this.display.set("objects", this.objects);                          // Reset the display to default
            this.display.syncUI();

            this.get(CONTENTBOX).one(".debugger").setHTML("<h1>Debugger</h1>");
            //this.get("contentBox").one(".debugger").empty();

            this.syncFrontUI();
        },

        onServerReply: function (e) {
            this.commandsStack = Y.JSON.parse(e.response.entity);
            for (var i = 0; i<this.commandsStack.length; i++ ) {
                console.log("command: ", this.commandsStack[i].type, this.commandsStack[i], this.commandsStack[i].text);
            }

            this.consumeCommand();
        },

        findObjectById: function (id) {
            return Y.Array.find(this.objects, function (o) {
                return o.id === id;
            });
        },

        consumeCommand: function () {
            if (this.commandsStack && this.commandsStack.length > 0) {
                var command = this.commandsStack.shift();
                console.log("consumeCommand", command.type, command);

                switch (command.type) {

                    case "move":
                    case "fire":
                        console.log("mixin", command.type, command.object);
                        Y.mix(this.findObjectById(command.object.id),           // Update target object cfg
                            command.object, true);
                        this.syncFrontUI();
                        break;

                    case "updated":
                        console.log("mixin", command.type, command.object);
                        Y.mix(this.findObjectById(command.object.id),           // Update target object cfg
                            command.object, true);
                        this.syncFrontUI();
                        this.consumeCommand();
                        break;

                    case "gameWon":
                        this.runButton.set("label", "NEXT LEVEL");
                        this.runButton.set("disabled", false);
                        this.runButton.detachAll("click");
                        this.runButton.on("click", this.doNextLevel, this);
                        break;
                    case "log":
                        this.get("contentBox").one(".debugger").append(command.text + "<br />");

                        Y.later(500, this, this.consumeCommand);
                        //this.fire("commandExecuted");
                    default:
                        break;
                }

                this.display.execute(command);                                  // Forware the command to the display

            } else {
                this.runButton.set("label", "RUN SCRIPT");
                this.runButton.set("disabled", false);
            }
        },


        doNextLevel: function () {
            Y.Wegas.app.VariableDescriptorFacade.rest.sendRequest({
                request: "/ProgGame/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: this.get("onWin")
                }
            });
        },

        syncFrontUI: function () {
            var cb = this.get(CONTENTBOX);

            function updateUI(object, el) {
                var i, acc= [];
                for (i = 0; i < object.actions; i += 1) {
                    acc.push("<span></span>");
                }

                el.one(".life span").setStyle("width", object.life + "%");
                el.one(".actions").setHTML(acc.join(""));
            }
            updateUI.call(this, this.objects[0], cb.one(".player-ui"));
            updateUI.call(this, this.objects[1], cb.one(".enemy-ui"));
        }

    }, {
        ATTRS: {
            label: {
                type: "string"
            },
            objects: {
                _inputex: {
                    _type: "object"
                }
            },
            api: {
                value: []
            },
            maxTurns: {
                type: "string",
                format: "Integer",
                validator: function (s) {
                    return (parseInt(s) ? parseInt(s) : 1);
                },
                _inputex: {
                    label: "Max turns"
                }
            },
            ai: {
                type: "string",
                format: "text"
            //                _inputex: {
            //                    _type: "ace"
            //                }
            },
            winningCondition: {
                type: "string",
                format: "text"
            //                _inputex: {
            //                    _type: "ace"
            //                }
            },
            onWin: {
                type: "string",
                _inputex: {
                    _type: "ace"
                }
            }
        }
    });

    Y.namespace('Wegas').ProgGameLevel = ProgGameLevel;


    /**
     * Level display, should handle canvas, for now renders the level as a
     * table element.
     *
     */
    var ProgGameDisplay = Y.Base.create("wegas-proggame-display", Y.Widget, [], {
        CONTENT_TEMPLATE: '<div><div class="object-layer"></div></div>',
        renderMethod: null,
        initializer: function () {
            this.publish("commandExecuted", {});
        },
        renderUI: function () {
            var i, j;

            var craftyNode = Y.Node.create("<div id='cr-stage'></div>");
            this.get(CONTENTBOX).append(craftyNode);

            Crafty.init(GRIDSIZE * this.get('gridW'), GRIDSIZE * this.get('gridH'));

            if (Crafty.support.canvas) {
                Crafty.canvas.init();
                this.renderMethod = 'Canvas';
            } else {
                this.renderMethod = 'DOM';
            }

            Crafty.refWidget = this;
            Crafty.background('rgb(110,110,110)');

            //sprites
            Crafty.sprite(24, 32, '/Wegas/wegas-proggame/images/sprites-1.png', {
                SCharacter: [0, 0]
            });
            Crafty.sprite(32, 32, '/Wegas/wegas-proggame/images/lightning.png', {
                SLightning: [0, 0]
            });

            //move function
            Crafty.c('MoveFunction', {//require Tween and spriteAnimation with "moveUp", "moveRight" "moveDown" and "moveLeft" animation
                tweenEnd: null,
                init: function () {
                    this.tweenEnd = []; //Tween x and y. Thus, the tween end when this variable contain x and y.
                    this.bind('TweenEnd', function (e) {
                        this.tweenEnd.push(e);
                        if (this.tweenEnd.length === 2) {
                            this.stop();
                            this.trigger('moveEnded');
                            Crafty.refWidget.fire("commandExecuted");
                        }
                    }, this);
                },
                execMove: function (direction, toX, toY, speed) {
                    var animDir, time, dist;
                    switch (direction) {
                        case 1:
                            animDir = 'moveUp';
                            break;
                        case 2:
                            animDir = 'moveRight';
                            break;
                        case 3:
                            animDir = 'moveDown';
                            break;
                        case 4:
                            animDir = 'moveLeft';
                            break;
                        default:
                            return;
                    }
                    if (!this.isPlaying(animDir)) {
                        this.stop();
                        this.animate(animDir, 10, -1);
                    }
                    speed = (speed > 0) ? speed : 1;
                    dist = Math.sqrt(Crafty.math.squaredDistance(this.pos()._x, this.pos()._y, toX, toY));
                    time = Math.round(((dist / GRIDSIZE) * (100 / speed))) + 1; //+1 because if time = 0, time = infinite
                    this.tweenEnd.length = 0;
                    this.tween({x: toX, y: toY}, time);
                }});

            Crafty.c("FireFunction", {
                shot: null,
                init: function () {
                    this.bind("moveEnded", function () {
                        if (this.shot) {
                            this.shot.destroy();
                        }
                    }, this);
                },
                execFire: function (dir, toX, toY, speed) {
                    this.shot = Crafty.e('2D, ' + Crafty.refWidget.renderMethod + ', Lightning');
                    this.shot.attr('x', this.pos()._x);
                    this.shot.attr('y', this.pos()._y);
                    this.shot.execMove(dir, toX, toY, speed);
                }
            });

            Crafty.c("DieFunction", {
                isDying: null,
                init: function () {
                    this.isDying = false;
                    this.bind('TweenEnd', function (e) {
                        if (this.isDying) {
                            Crafty.refWidget.fire("commandExecuted");
                            this.destroy();
                        }
                    }, this);
                },
                execDie: function () {
                    this.isDying = true;
                    this.tween({alpha: 0}, 50);
                }
            });

            Crafty.c('Lightning', {
                init: function () {
                    this.requires("MoveFunction, SpriteAnimation, Tween, SLightning")
                    .animate("moveUp", 0, 6, 3)
                    .animate("moveRight", 0, 0, 3)
                    .animate("moveDown", 0, 2, 3)
                    .animate("moveLeft", 0, 4, 3);
                }
            });

            /*---Crafty "render"---*/
            //chessboard
            for (i = 0; i < this.get('gridW'); i++) {
                for (j = 0; j < this.get('gridH'); j++) {
                    if ((i + j) % 2 === 0) {
                        Crafty.e('2D, ' + this.renderMethod + ', Color')
                                .color('rgba(255,165,0, 0.5)')
                                .attr({x: GRIDSIZE * i, y: GRIDSIZE * j, w: GRIDSIZE, h: GRIDSIZE});
                    }
                }
            }

            //Entities
            var object, pos;
            for (i = 0; i < this.get('objects').length; i++) {
                object = this.get('objects')[i];
                if (object.type === "pc") {
                    Crafty.c(object.id, {
                        init: function () {
                            this.requires("MoveFunction, FireFunction, DieFunction, SpriteAnimation, Tween, SCharacter")
                                    .animate("moveUp", 0, 0, 2)
                                    .animate("moveRight", 0, 1, 2)
                                    .animate("moveDown", 0, 2, 2)
                                    .animate("moveLeft", 0, 3, 2);
                        }
                    });
                } else {
                    Crafty.c(object.id, {
                        init: function () {
                            this.requires("MoveFunction, FireFunction, DieFunction, SpriteAnimation, Tween, SCharacter")
                                    .animate("moveUp", 9, 0, 11)
                                    .animate("moveRight", 9, 1, 11)
                                    .animate("moveDown", 9, 2, 11)
                                    .animate("moveLeft", 9, 3, 11);
                        }
                    });
                }
                pos = this.getRealXYPos([object.x, object.y]);
                Crafty.e('2D, ' + this.renderMethod + ', ' + object.id);
                Crafty(object.id).attr('x', pos[0]);
                Crafty(object.id).attr('y', pos[1]);
                Crafty(object.id).execMove(object.direction, pos[0], pos[1]);
            }
        },
        destructor: function () {
            var k;
            for (k in Crafty("*")) {
                if (Crafty("*")[k].destroy) {
                    Crafty("*")[k].destroy();
                }
            }
            Crafty.unbind('dieEnded');
            Crafty.unbind('moveEnded');
        },
        execute: function (command) {
            var object, entity, dir, pos, i;
            switch (command.type) {
                case "resetLevel":
                    for (i = 0; i < command.objects.length; i++) {
                        object = command.objects[i];
                        pos = this.getRealXYPos([object.x, object.y]);
                        Crafty(object.id).attr('x', pos[0]);
                        Crafty(object.id).attr('y', pos[1]);
                        Crafty(object.id).execMove(object.direction, pos[0], pos[1]);
                    }
                    this.fire("commandExecuted");
                    break;
                case "move":
                    object = command.object;
                    this.set("objects", object);
                    entity = object.id;
                    dir = object.direction;
                    pos = this.getRealXYPos([object.x, object.y]);
                    if (entity && Crafty(entity) && Crafty(entity).execMove) {
                        Crafty(entity).execMove(dir, pos[0], pos[1], 2);
                    }
                    break;

                case "fire":
                    object = command.object;
                    entity = object.id;
                    dir = object.direction;
                    switch (dir) {
                        case 1:
                            pos = this.getRealXYPos([object.x, object.y + object.range]);
                            break;
                        case 2:
                            pos = this.getRealXYPos([object.x + object.range, object.y]);
                            break;
                        case 3:
                            pos = this.getRealXYPos([object.x, object.y - object.range]);
                            break;
                        case 4:
                            pos = this.getRealXYPos([object.x - object.range, object.y]);
                            break;
                    }
                    if (entity && Crafty(entity) && Crafty(entity).execFire) {
                        Crafty(entity).execFire(dir, pos[0], pos[1], 7);
                    }
                    break;
                case "die":
                    object = command.object;
                    entity = object.id;
                    if (entity && Crafty(entity) && Crafty(entity).execDie) {
                        Crafty(entity).execDie();
                    }
                    break;
            }
        },
        getRealXYPos: function (position) {
            var pos = [];
            if (!position || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
                return pos;
            }
            pos.push(position[0] * GRIDSIZE); //x
            pos.push((this.get("gridH") - position[1] - 1) * GRIDSIZE); //y
            return pos;
        }

    }, {
        ATTRS: {
            gridW: {
                value: 8
            },
            gridH: {
                value: 8
            },
            objects: {}
        }
    });
    Y.namespace('Wegas').ProgGameDisplay = ProgGameDisplay;

});
