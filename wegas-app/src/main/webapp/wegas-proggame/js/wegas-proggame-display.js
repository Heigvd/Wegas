/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 * @author Francois-Xavier Aexecmoeberhard <fx@red-agent.com>
 */
/* global Crafty */
YUI.add('wegas-proggame-display', function(Y) {
    "use strict";

    var COMMANDEXECUTED = "commandExecuted",
            RENDERMETHOD = (Crafty.support.canvas) ? 'Canvas' : "DOM",
            TILESIZE = 32,
            Wegas = Y.Wegas, ProgGameDisplay;

    /**
     * Level display, should handle canvas, for now renders the level as a
     * table element.
     */
    ProgGameDisplay = Y.Base.create("wegas-proggame-display", Y.Widget, [], {
        CONTENT_TEMPLATE: '<div><div class="object-layer"></div><div id="cr-stage"></div></div>',
        initializer: function() {
            this.entities = [];
            this.allowNextCommand = false;
        },
        renderUI: function() {
            var i, j, pos, entity,
                    objects = this.get('objects'),
                    map = this.get('map'),
                    gridH = map.length,
                    gridW = map[0].length;

            Crafty("*").destroy();                                              // @HACK Destructor sometimes not called !

            Crafty.init(TILESIZE * gridW, TILESIZE * gridH);                    // Init crafty

            if (Crafty.support.canvas) {
                Crafty.canvas.init();                                           // Init crafty's canvas support
            }

            for (i = 0; i < gridH; i += 1) {                                    // Render tiles
                for (j = 0; j < gridW; j += 1) {
                    Crafty.e((map[i][j] && map[i][j].y) ? "PathTile" : "EmptyTile").attr({
                        x: TILESIZE * j,
                        y: TILESIZE * i
                    });
                }
            }

            Y.Object.each(objects, function(cfg) {                              // Render objects (PC, traps, etc.)
                pos = this.getRealXYPos([cfg.x, cfg.y]);                        // Place it on the map
                entity = Crafty.e(cfg.components)                               // Instantiate an entity
                        .attr(Y.mix({
                            x: pos[0],
                            y: pos[1]
                        }, cfg.attrs));
                if (entity.execMove) {                                          // Allows to turn the player to the right direction
                    entity.execMove(cfg.direction, pos[0], pos[1]);
                }
                this.entities[cfg.id] = entity;                                 // Save a reference so we can look up for instances
            }, this);
        },
        bindUI: function() {
            Crafty.bind(COMMANDEXECUTED, Y.bind(this.execFn, this));
        },
        destructor: function() {
            Crafty("*").destroy();
            Crafty.unbind(COMMANDEXECUTED, this.execFn);
        },
        execFn: function() {
            if (this.allowNextCommand) {
                this.allowNextCommand = false;
                this.fire(COMMANDEXECUTED);
            }
        },
        getEntity: function(id) {
            return this.entities[id];
        },
        execute: function(command) {
            var object, entity, pos, i;
            this.allowNextCommand = true;

            switch (command.type) {
                case "resetLevel":
                    for (i = 0; i < command.objects.length; i += 1) {
                        object = command.objects[i];
                        pos = this.getRealXYPos([object.x, object.y]);
                        entity = this.getEntity(object.id);
                        entity.attr({
                            x: pos[0],
                            y: pos[1],
                            h: 32
                        });
                        if (entity.execMove) {
                            entity.execMove(object.direction, pos[0], pos[1]);
                        }
                        if (typeof entity.reset === "function") {
                            entity.reset(object.attr);
                        }
                    }
                    break;

                case "move":
                    entity = this.getEntity(command.id);
                    pos = this.getRealXYPos([command.x, command.y]);

                    if (entity && entity.execMove) {
                        entity.execMove(command.dir, pos[0], pos[1], ProgGameDisplay.SPEED.MOVE, true);
                        return;
                    }
                    break;

                case "Die":
                case "Trap":
                    entity = this.getEntity(command.id);
                    if (entity && entity["exec" + command.type]) {
                        entity["exec" + command.type]();
                        return;
                    }
                    break;

                case "say":
                    entity = this.getEntity(command.id);
                    if (entity && typeof entity.say === 'function') {
                        entity.say(command.text, command.duration);
                        return;
                    }
                    break;

                case "doorState":
                    entity = this.getEntity(command.id);
                    if (entity && typeof entity.doorState === 'function') {
                        entity.doorState(command.state);
                        return;
                    }
                    break;

                case "controllerState":
                    entity = this.getEntity(command.id);
                    if (entity && typeof entity.controllerState === 'function') {
                        entity.controllerState(command.state);
                    }
                    break;

                case "wave":
                    entity = this.getEntity(command.id);
                    if (entity && typeof entity.wave === 'function') {
                        entity.wave(command.times);
                    }
                    this.fire(COMMANDEXECUTED);                                 // continue, non blocking action.
                    return;

                default:
                    //this.allowNextCommand = false;
                    //Y.log("No action defined for '" + command.type + "'", "debug", "Wegas.ProggameDisplay");
                    return;

                    //case "fire":
                    //    entity = this.getEntity(command.id);
                    //    switch (object.direction) {
                    //        case 1:
                    //            pos = this.getRealXYPos([object.x, object.y + object.range]);
                    //            break;
                    //        case 2:
                    //            pos = this.getRealXYPos([object.x + object.range, object.y]);
                    //            break;
                    //        case 3:
                    //            pos = this.getRealXYPos([object.x, object.y - object.range]);
                    //            break;
                    //        case 4:
                    //            pos = this.getRealXYPos([object.x - object.range, object.y]);
                    //            break;
                    //    }
                    //    if (entity && entity.execFire) {
                    //        entity.execFire(object.direction, pos[0], pos[1]);
                    //        return;
                    //    }
                    //    break;
            }
            this.fire(COMMANDEXECUTED);
        },
        getRealXYPos: function(position) {
            if (!position || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
                return [];
            }
            return [position[0] * TILESIZE, position[1] * TILESIZE];            // [x, y]
        }
    }, {
        ATTRS: {
            map: {
                validator: Y.Lang.isArray
            },
            objects: {
                value: []
            }
        },
        SPEED: {// Tile per second unit
            MOVE: 1,
            FIRE: 5,
            TRAP: 2
        },
        SPRITESHEETS: {
            TileSprite: {
                width: 1,
                height: 4
            }
        },
        speedToFrame: function(speed, x, y, toX, toY) {
            speed = (speed > 0) ? speed : 1;
            var dist = Math.sqrt(Crafty.math.squaredDistance(x, y, toX, toY));
            return Math.round(((dist / TILESIZE) * (1000 / speed))) || 1;
        }
    });
    Wegas.ProgGameDisplay = ProgGameDisplay;

    /*
     * Crafty sprites
     */
    Crafty.sprite(TILESIZE, TILESIZE, Wegas.app.get("base") + '/wegas-proggame/images/proggame-sprite-anim.png', {
        HumanSprite: [0, 0],
        TrapSprite: [0, 9],
        DoorSprite: [0, 10],
        DoorSprite2: [0, 14],
        VerticalDoor: [0, 16],
        HorizontalDoor: [0, 18],
        ControllerSprite: [0, 12],
        PanelSprite: [5, 10],
        StoneSprite: [6, 10]
    });
    Crafty.sprite(TILESIZE, TILESIZE, Wegas.app.get("base") + '/wegas-proggame/images/proggame-sprite-tiles.png', {
        TileSprite: [0, 0]
    });

    /*
     * Crafty Components
     */
    // Move component
    Crafty.c('move4Direction', {//requires Tween and spriteAnimation with "moveUp", "moveRight" "moveDown" and "moveLeft" animation
        init: function() {
            this.requires("Tween")
                    .bind('TweenEnd', function() {
                        this.pauseAnimation().resetAnimation();
                        if (this.doDelay) {
                            this.doDelay = false;
                            Y.later(500, this, function() {
                                Crafty.trigger(COMMANDEXECUTED);
                            });
                        } else {
                            Crafty.trigger(COMMANDEXECUTED);
                        }
                    }, this);
        },
        execMove: function(direction, toX, toY, speed, minDuration) {
            var animDir = this.dir2anim[direction];

            if (!this.isPlaying(animDir)) {
                this.doDelay = minDuration && this.reel() !== animDir;
                this.pauseAnimation();
                this.animate(animDir, -1);
            }
            this.tween({
                x: toX,
                y: toY
            }, ProgGameDisplay.speedToFrame(speed, this._x, this._y, toX, toY));
        },
        dir2anim: {
            1: "moveUp",
            2: "moveRight",
            3: "moveDown",
            4: "moveLeft"
        }
    });
    Crafty.c("die", {
        isDying: null,
        init: function() {
            this.requires("Tween")
                    .bind('TweenEnd', function() {
                        if (this.isDying) {
                            Crafty.trigger(COMMANDEXECUTED);
                            this.destroy();
                        }
                    }, this);
            this.isDying = false;
        },
        execDie: function() {
            this.isDying = true;
            this.tween({
                alpha: 0
            }, 50);
        }
    });
    Crafty.c("Character", {
        init: function() {
            var moveSpeed = 500;
            this.requires("2D," + RENDERMETHOD + ", HumanSprite, SpriteAnimation, move4Direction, Speaker, Collision")
                    .reel("moveUp", moveSpeed, 0, 2, 7)
                    .reel("moveRight", moveSpeed, 0, 0, 7)
                    .reel("moveDown", moveSpeed, 0, 2, 7)
                    .reel("moveLeft", moveSpeed, 0, 1, 7)
                    .reel("handsUp", moveSpeed, 0, 6, 7)
                    .reel("gzRight", 2000, 0, 20, 7)
                    .reel("gzLeft", 2000, 0, 21, 7)
                    .onHit("Collide", function() {
                        this.h -= 1;
                        this.y += 1;
                    })
                    .bind("TweenEnd", function() {
                        var col = this.hit("Character");
                        if (col) {
                            if (this._currentReelId === "moveRight") {
                                this.attr({
                                    x: this._x - 6
                                }).animate("gzRight");
                                col[0].obj.attr({
                                    x: col[0].obj._x + 6
                                }).animate("gzLeft");
                            } else {                                            // All other moves. up/down/left
                                this.attr({
                                    x: this._x + 6
                                }).animate("gzLeft");
                                col[0].obj.attr({
                                    x: col[0].obj._x - 6
                                }).animate("gzRight");
                            }
                        }
                    });
        },
        wave: function(times) {
            var POS = Y.clone(this.__coord);
            this.pauseAnimation()
                    .bind("AnimationEnd", function() {
                        if (this._currentReelId === 'handsUp') {
                            this.sprite(POS[0] / POS[2], POS[1] / POS[3]);
                        }
                    })
                    .animate("handsUp", 15, times || 1);
        }
    });
    Crafty.c("Speaker", {
        say: function(text, delay, think) {
            var textE = Crafty.e("2D, DOM, Text")
                    .text(text.toUpperCase())
                    .attr({
                        z: 401,
                        visible: false
                    })
                    .css({
                        "background-color": "rgb(50, 50, 40)",
                        border: "7px solid #FFFFFF",
                        "-moz-border-image": "url(" + Wegas.app.get('base') + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                        "-webkit-border-image": "url(" + Wegas.app.get('base') + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                        "-o-border-image": "url(" + Wegas.app.get('base') + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                        "border-image": "url(" + Wegas.app.get('base') + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                        "font-family": "KG Ways to Say Goodbye",
                        "line-height": "1.1em",
                        "font-size": "1.6em",
                        "max-width": "400px",
                        color: "white",
                        padding: "4px 4px 2px"
                    }),
                    POS = [this._x, this._y],
                    connector = Crafty.e("2D, DOM").css({
                background: "url(" + Wegas.app.get('base') + "/wegas-proggame/images/dialogConnector.png) 0 " + (think ? 0 : (-32 + "px"))
            }).attr({
                z: 402,
                visible: false
            });

            textE.bind("Draw", function() {
                this.unbind("Draw");
                this.css({
                    width: "initial",
                    height: "initial"
                });
                Y.later(300, this, function() {                                 // Attach a little later so the font file has enough time to be loaded
                    this.attach(connector)
                            .attr({
                                x: POS[0] - (this._element.offsetWidth / 2) + 14,
                                y: POS[1] - this._element.offsetHeight - 32
                            });
                    this.visible = true;
                    connector.shift(this._element.offsetWidth / 2 - 16, this._element.offsetHeight - 7)
                            .css({
                                width: "32px",
                                height: "32px"
                            });
                    connector.visible = true;
                });
            });
            this.attach(textE);
            Y.later(delay || 3500, textE, function() {
                this.destroy();
                Crafty.trigger(COMMANDEXECUTED);
            });
        }
    });
    Crafty.c("PC", {
        init: function() {
            this.requires("Character");
        }
    });
    Crafty.c("NPC", {
        init: function() {
            this.requires("TintSprite, Character")
                    .tintSprite("D6D600", 1);
        }
    });
    Crafty.c("Tile", {
        init: function() {
            this.requires("2D," + RENDERMETHOD);
        }
    });
    Crafty.c("EmptyTile", {
        init: function() {
            this.requires("Tile, TileSprite").sprite(0, 0).attr("collides", true);
        }
    });
    Crafty.c("PathTile", {
        init: function() {
            this.requires("Tile, TileSprite").sprite(0, Math.round(Math.random() * 3) + 1).attr("collides", false);
        }
    });
    Crafty.c("Trap", {
        _roche: null,
        init: function() {
            this.requires("Tile, TrapSprite, SpriteAnimation, Tween, Collision")
                    .collision([10, 13], [3, 24], [10, 27], [25, 25], [28, 13]);
            var x = this.__coord[0] / this.__coord[2],
                    y = this.__coord[1] / this.__coord[3];
            this.reset();
            this.reel("trap", 100, x, y, 5);
            this.bind("TweenEnd", function() {
                this.pauseAnimation().visible = false;
                this._roche = Crafty.e("Tile, StoneSprite, Collision").attr({
                    x: this._x,
                    y: this._y
                });
                Crafty.trigger(COMMANDEXECUTED);
            });
        },
        execTrap: function() {
            var frameTime = ProgGameDisplay.speedToFrame(ProgGameDisplay.SPEED.TRAP, this._x, this._y, this._x, this._y + 64);
            this.move("n", 64);
            this.addComponent("Collide");
            this.visible = true;
            this.animate("trap", -1);
            this.tween({
                x: this._x,
                y: this._y + 64
            }, frameTime);
        },
        reset: function() {
            if (this._roche) {
                this._roche.destroy();
            }
            this.visible = false;
            this.removeComponent("Collide");
        }
    });
    Crafty.c("Door", {
        init: function() {
            var c = this.__coord, doorSpeed = 500;

            this.requires("Tile, VerticalDoor, SpriteAnimation");
            this.reel("openDoor", doorSpeed, c[0] / c[2], c[1] / c[3], 5);
            this.reel("closeDoor", doorSpeed, c[0] / c[2] + 4, c[1] / c[3], -5);

            this.bind("AnimationEnd", function() {
                if (this._initialized) {
                    if (this._currentReelId === "openDoor" || this._currentReelId === "closeDoor") {
                        Crafty.trigger(COMMANDEXECUTED);
                    }
                } else {                                                        // animation finished, assume initialization ended
                    this._initialized = true;
                }
            });
            this.setter("open", function(v) {
                if (v) {
                    if (!this._open) {
                        this.animate("openDoor", 1);
                    } else {
                        if (this._initialized) {
                            Crafty.trigger(COMMANDEXECUTED);
                        } else {
                            this._initialized = true;
                        }
                    }
                } else {
                    if (this._open) {
                        this.animate("closeDoor", 1);
                    } else {
                        if (this._initialized) {
                            Crafty.trigger(COMMANDEXECUTED);
                        } else {
                            this._initialized = true;
                        }
                    }
                }
                this._open = v;
            });
            this.initialize();
        },
        doorState: function(state) {
            this.open = state;
        },
        reset: function(attrs) {
            this._initialized = false;
            if (attrs) {
                this.attr(attrs);
            } else {
                this.attr({
                    open: false
                });
            }
        }
    });
    Crafty.c("Controller", {
        init: function() {
            var controllerSpeed = 500,
                    c = this._coord;
            this.requires("Tile, ControllerSprite, SpriteAnimation");
            this.reel("disableController", controllerSpeed, c[0] / c[2], c[1] / c[3], 4);
            this.reel("enableController", controllerSpeed, c[0] / c[2] + 3, c[1] / c[3], -4);
            this.bind("AnimationEnd", function() {
                if (this._initialized) {
                    Crafty.trigger(COMMANDEXECUTED);
                } else {                                                        // animation finished, assume initialization ended
                    this._initialized = true;
                }
            });
            this.setter("enabled", function(v) {
                if (v) {
                    if (!this._enabled) {
                        this.animate("disableController");
                    } else {
                        if (this._initialized) {
                            Crafty.trigger(COMMANDEXECUTED);
                        } else {
                            this._initialized = true;
                        }
                    }
                } else {
                    if (this._enabled) {
                        this.animate("enableController");
                    } else {
                        if (this._initialized) {
                            Crafty.trigger(COMMANDEXECUTED);
                        } else {
                            this._initialized = true;
                        }
                    }
                }
                this._enabled = v;
            });
            this.reset();
        },
        controllerState: function(state) {
            this.enabled = state;
        },
        reset: function(attrs) {
            this._initialized = false;
            if (attrs) {
                this.attr(attrs);
            } else {
                this.attr({
                    enabled: false
                });
            }
        }
    });
    Crafty.c("Panel", {
        init: function() {
            this.requires("Tile, PanelSprite, Speaker, GridOffset");
            this._offset = {
                x: 6,
                y: -22
            };

        }
    });
    Crafty.c("GridOffset", {
        init: function() {
            this.requires("2D");
            var attr = this.attr;
            this.attr = function(key, val) {
                var i;
                if (arguments.length === 2 && Y.Object.hasKey(this._offset, key)) {
                    return attr.apply(this, [key, val + this._offset[key]]);
                }
                for (i in this._offset) {
                    if (this._offset.hasOwnProperty(i)) {
                        if (key[i]) {
                            key[i] += this._offset[i];
                        }
                    }
                }
                return attr.apply(this, arguments);

            };
            this._offset = {
                x: 0,
                y: 0
            };
        },
        _offset: null

    });
    /**
     * TintSprite component. Should be included before the actual sprite.
     * Browser should support Canvas.
     * 
     * Should extract that function in an external file.
     */
    var tmp_canvas = document.createElement("canvas");
    Crafty.c("TintSprite", {
        _color: Crafty.toRGB("FFFFFF"),
        init: function() {
            this.bind("Draw", this.draw)
                    .bind("RemoveComponent", function(e) {
                        if (e === "TintSprite") {
                            this.unbind("Draw", this.draw);
                        }
                    });
        },
        tintSprite: function(color, opacity) {
            this.__newColor = true;
            this._color = Crafty.toRGB(color, opacity);
            this.trigger("Change");
            return this;
        },
        draw: function() {
            var img = document.createElement("img"),
                    ctx = tmp_canvas.getContext("2d");
            if (!this.__oldImg) {
                this.__oldImg = this.img;
            } else if (!this.__newColor) {
                return;
            }
            this.__newColor = false;
            tmp_canvas.width = this.__oldImg.width;
            tmp_canvas.height = this.__oldImg.height;
            ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
            ctx.drawImage(this.__oldImg, 0, 0);
            ctx.save();
            ctx.globalCompositeOperation = "source-in";
            ctx.fillStyle = this._color;
            ctx.beginPath();
            ctx.fillRect(0, 0, this.__oldImg.width, this.__oldImg.height);
            ctx.closePath();
            ctx.restore();
            img.src = tmp_canvas.toDataURL();
            this.img = img;
        }
    });
    //Crafty.c("shoot", {
    //    shot: null,
    //    init: function() {
    //        this.bind("moveEnded", function() {
    //            if (this.shot) {
    //                this.shot.destroy();
    //            }
    //        }, this);
    //    },
    //    execFire: function(dir, toX, toY) {
    //        this.shot = Crafty.e('LightningShot');
    //        this.shot.attr('x', this.pos()._x);
    //        this.shot.attr('y', this.pos()._y);
    //        this.shot.execMove(dir, toX, toY, ProgGameDisplay.SPEED.FIRE);
    //    }
    //});
    //
    //Crafty.c("LightningShot", {//temporary hard-coded
    //    init: function() {
    //        this.requires("2D," + RENDERMETHOD + ", LightningSprite, SpriteAnimation, move4Direction")
    //                .animate("moveUp", 0, 6, 3)
    //                .animate("moveRight", 0, 0, 3)
    //                .animate("moveDown", 0, 2, 3)
    //                .animate("moveLeft", 0, 4, 3);
    //    }
    //});
});
