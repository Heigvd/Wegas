/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
/* global Crafty */
YUI.add('wegas-proggame-display', function(Y) {
    "use strict";

    var COMMANDEXECUTED = "commandExecuted",
        RENDERMETHOD = (Crafty.support.canvas) ? "Canvas" : "DOM",
        TILESIZE = 32,
        MARGIN_X = 3,
        MARGIN_Y = 2,
        TILE_DELTA = 10,
        Wegas = Y.Wegas,
        ProgGameDisplay,
        Promise = Y.Promise,
        ready;

    /*
     * Crafty sprites
     */
    ready = new Promise(function(resolve, reject) {
        Crafty.load(
            (function() {
                var assets = {
                    sprites: {},
                };
                assets.sprites[
                    Wegas.app.get('base') +
                        '/wegas-proggame/images/proggame-sprite-anim.png'
                ] = {
                    tile: TILESIZE,
                    tileh: TILESIZE,
                    map: {
                        CharacterSprite: [0, 0],
                        TrapSprite: [0, 9],
                        DoorSprite: [0, 10],
                        DoorSprite2: [0, 14],
                        VerticalDoor: [0, 16],
                        HorizontalDoor: [0, 18],
                        ControllerSprite: [0, 12],
                        PanelSprite: [5, 10],
                        StoneSprite: [6, 10],
                    },
                };
                assets.sprites[
                    Wegas.app.get('base') +
                        '/wegas-proggame/images/proggame-sprite-tiles_iso.png'
                ] = {
                    tile: 41,
                    tileh: TILESIZE,
                    map: { TileSprite: [0, 0] },
                };
                return assets;
            })(),
            resolve,
            undefined,
            reject
        );
    });

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
            var i, j, pos, posy, entity,
                objects = this.get("objects"),
                map = this.get("map"),
                gridH = map.length,
                gridW = map[0].length;


            pos = this.getRealXYPos({
                x: gridW + MARGIN_X + 1 ,
                y: -MARGIN_Y
            });
            posy = this.getRealXYPos({
                x: gridW + MARGIN_X + 1,
                y: gridH + MARGIN_Y
            })
            this.get("boundingBox").setStyles({
                marginTop: "12px",
                marginLeft: (Math.floor(900 - pos.x) / 2) + "px"
            });
            ready.then(function(){
                Crafty.init(pos.x, posy.y + TILE_DELTA); // Init crafty
                
                for (i = -MARGIN_Y; i < gridH + MARGIN_Y; i += 1) { // Render tiles
                    for (j = -MARGIN_X; j < gridW + MARGIN_X; j += 1) {
                        pos = this.getRealXYPos({x: j, y: i});
                        pos.y = pos.y + TILE_DELTA;
                        Crafty.e((map[i] && map[i][j] && map[i][j].y) ? "PathTile" : "EmptyTile").attr(pos);
                    }
                }
                
                Y.Object.each(objects, function(cfg) { // Render objects (PC, traps, etc.)
                    pos = this.getRealXYPos(cfg); // Place it on the map
                    entity = Crafty.e(cfg.components) // Instantiate an entity
                    .attr(Y.mix(pos, cfg.attrs));
                    if (entity.execMove) { // Allows to turn the player to the right direction
                        entity.execMove(cfg.direction, pos);
                    }
                    this.entities[cfg.id] = entity; // Save a reference so we can look up for instances
                }, this);
            }.bind(this));
        },
        bindUI: function() {
            Y.Wegas.Facade.Variable.on("WegasScriptException", function(e) {
                e.halt();
            });
            Crafty.bind(COMMANDEXECUTED, Y.bind(function() { // Every time a command is executed, 
                if (this.allowNextCommand) {
                    this.allowNextCommand = false;
                    this.fire(COMMANDEXECUTED); // notifiy the parent widget
                }
            }, this));
        },
        destructor: function() {
            Crafty("2D").destroy();
            Crafty.stop();
            Crafty.unbind(COMMANDEXECUTED);
        },
        getEntity: function(id) {
            return this.entities[id];
        },
        execute: function(command) {
            var entity, pos;
            this.allowNextCommand = true;
            ready.then(function(){
                switch (command.type) {
                    case "resetLevel":
                        Y.Object.each(command.objects, function(object) {
                            pos = this.getRealXYPos(object);
                            pos.h = 32;
                            entity = this.getEntity(object.id);
                            entity.attr(pos);
                            if (entity.execMove) {
                                entity.execMove(object.direction, pos);
                            }
                            if (typeof entity.reset === "function") {
                                entity.reset(object.attr);
                            }
                        }, this);
                        break;

                    case "move":
                        entity = this.getEntity(command.id);
                        if (entity && entity.execMove) {
                            entity.execMove(command.dir, this.getRealXYPos(command), true);
                            return;
                        }
                        break;

                    default:
                        entity = this.getEntity(command.id);
                        if (entity && typeof entity[command.type] === "function") {
                            entity[command.type](command);
                            return;
                        } else {
                            Y.log("No action defined for '" + command.type + "'", "warn", "Wegas.ProggameDisplay");
                            return;
                        }
                }
                this.fire(COMMANDEXECUTED);
            }.bind(this));
        },
        getRealXYPos: function(pos) {
            if (!pos || typeof pos.x !== "number" || typeof pos.y !== "number") {
                return {};
            }
            var x = pos.x + MARGIN_X,
                y = pos.y + MARGIN_Y;
            return {
                x: x * TILESIZE + ((this.get("map").length + MARGIN_X - y) * 16),
                y: y * 28
            };
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
     * Crafty Components
     */
    // Move component
    Crafty.c("move4Direction", {//requires Tween and spriteAnimation with "moveUp", "moveRight" "moveDown" and "moveLeft" animation
        init: function() {
            this.requires("Tween")
                .bind("TweenEnd", function() {
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
        execMove: function(direction, target, minDuration) {
            var animDir = this.dir2anim[direction];

            if (!this.isPlaying(animDir)) {
                this.doDelay = minDuration && this.reel() !== animDir;
                this.pauseAnimation();
                this.animate(animDir, -1);
            }
            this.tween(target, ProgGameDisplay.speedToFrame(ProgGameDisplay.SPEED.MOVE, this._x, this._y, target.x, target.y));
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
                .bind("TweenEnd", function() {
                    if (this.isDying) {
                        Crafty.trigger(COMMANDEXECUTED);
                        this.destroy();
                    }
                }, this);
            this.isDying = false;
        },
        die: function() {
            this.isDying = true;
            this.tween({
                alpha: 0
            }, 50);
        }
    });
    Crafty.c("Character", {
        init: function() {
            var moveSpeed = 500;
            this.requires('2D,' + RENDERMETHOD + ', CharacterSprite, SpriteAnimation, move4Direction, Speaker, Collision')
                .reel('moveUp', moveSpeed, 0, 2, 7)
                .reel('moveRight', moveSpeed, 0, 0, 7)
                .reel('moveDown', moveSpeed, 0, 2, 7)
                .reel('moveLeft', moveSpeed, 0, 1, 7)
                .reel('handsUp', moveSpeed, 0, 6, 7)
                .reel('gzRight', 2000, 0, 20, 7)
                .reel('gzLeft', 2000, 0, 21, 7)
                .collision(new Crafty.polygon([
                    0 + 17,
                    0 + TILE_DELTA + 5,
                    0,
                    28 + TILE_DELTA,
                    25,
                    28 + TILE_DELTA,
                    25 + 17,
                    0 + TILE_DELTA + 5,
                ]))
                .onHit('Collide', function() {
                    this.h -= 1;
                    this.y += 1;
                })
                .bind('TweenEnd', function() {
                    var col = this.hit('Character');
                    if (col) {
                        if (this.reel() === 'moveRight') {
                            this.attr({
                                x: this._x - 6,
                            }).animate('gzRight');
                            col[0].obj
                                .attr({ x: col[0].obj._x + 6 })
                                .animate('gzLeft');
                        } else {
                            // All other moves. up/down/left
                            this.attr({
                                x: this._x + 6,
                            }).animate('gzLeft');
                            col[0].obj
                                .attr({ x: col[0].obj._x - 6 })
                                .animate('gzRight');
                        }
                    }
                });
        },
        wave: function(times) {
            var pos = Y.clone(this.__coord);
            this.pauseAnimation()
                .bind("AnimationEnd", function() {
                    if (this._currentReelId === "handsUp") {
                        this.sprite(pos[0] / pos[2], pos[1] / pos[3]);
                    }
                })
                .animate("handsUp", times || 1);
        }
    });
    Crafty.c("Speaker", {
        say: function(text, delay, think, preventEvent) {
            if (Y.Lang.isObject(text)) { // One can also send a cfg object instead of arguments
                delay = delay || text.delay;
                think = think || text.think;
                text = text.text;
            }

            var pos = [this._x, this._y],
                textE = Crafty.e("2D, DOM, Text")
                .text(text)
                .attr({
                    z: 401,
                    visible: false
                })
                .css({
                    "background-color": "rgb(50, 50, 40)",
                    border: "7px solid #FFFFFF",
                    "-moz-border-image": "url(" + Wegas.app.get("base") + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                    "-webkit-border-image": "url(" + Wegas.app.get("base") + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                    "-o-border-image": "url(" + Wegas.app.get("base") + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                    "border-image": "url(" + Wegas.app.get("base") + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                    // "font-family": "KG Ways to Say Goodbye",
                    "line-height": "1.1em",
                    // "font-size": "1.6em",
                    "max-width": "400px",
                    color: "white",
                    padding: "4px 4px 2px"
                }),
                connector = Crafty.e("2D, DOM").css({
                background: "url(" + Wegas.app.get("base") + "/wegas-proggame/images/dialogConnector.png) 0 " + (think ? 0 : (-32 + "px"))
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
                this._renderTimer = Y.later(300, this, function() { // Attach a little later so the font file has enough time to be loaded
                    this.attach(connector)
                        .attr({
                            x: pos[0] - this._element.offsetWidth / 2 + 14,
                            y: pos[1] - this._element.offsetHeight - 32
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
            textE.bind("Remove", function() {
                this._renderTimer && this._renderTimer.cancel();
                this._endTimer && this._endTimer.cancel();
            });
            this.attach(textE);
            textE._endTimer = Y.later(delay || 2000, textE, function() {
                this.destroy();
                if (!preventEvent) {
                    Crafty.trigger(COMMANDEXECUTED);
                }
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
                .tintSprite("#D6D600", 1);
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
            this.requires("Tile, TileSprite").sprite(0, 1).attr("collides", false);
            //this.requires("Tile, TileSprite").sprite(0, Math.round(Math.random() * 3) + 1).attr("collides", false);
        }
    });
    Crafty.c("Trap", {
        init: function() {
            this.requires("Tile, TrapSprite, SpriteAnimation, Tween, Collision, GridOffset")
                .collision([10, 13], [3, 24], [10, 27], [25, 25], [28, 13]);
            //.collision([10, 13 + TILE_DELTA], [3, 24 + TILE_DELTA], [10, 27 + TILE_DELTA], [25, 25 + TILE_DELTA], [28, 13 + TILE_DELTA]);
            var c = this.__coord;
            this.reset();
            this.reel("trap", 100, c[0] / c[2], c[1] / c[3], 5);
            this._offset = {
                x: 0,
                y: TILE_DELTA
            };
            this._delayTile = Y.later(1, this, function() { // Add a tile to show where the trap is
                Crafty.e("Tile, TileSprite").sprite(0, 5).attr({
                    x: this._x,
                    y: this._y
                });
            });
            this.bind("TweenEnd", function() {
                this.pauseAnimation().visible = false;
                this._roche = Crafty.e("Tile, StoneSprite, Collision").attr({
                    x: this._x,
                    y: this._y
                });
                Crafty.trigger(COMMANDEXECUTED);
            });
        },
        trap: function() {
            var frameTime = ProgGameDisplay.speedToFrame(ProgGameDisplay.SPEED.TRAP, this._x, this._y, this._x, this._y + 64);
            this.move("n", 64);
            this.addComponent("Collide");
            this.visible = true;
            this.animate("trap", -1);
            this.tween({
                x: this._x,
                y: this._y + 60
            }, frameTime);
        },
        reset: function() {
            if (this._roche) {
                this._roche.destroy();
            }
            this.visible = false;
            this.removeComponent("Collide");
        },
        remove: function() {
            this._delayTile.cancel();
        }
    });
    Crafty.c("Door", {
        init: function() {
            this.requires("Tile, VerticalDoor, SpriteAnimation, GridOffset");

            this.rotation = 30;
            this._offset = {
                x: 16,
                y: 0
            }
            var c = this.__coord,
                doorSpeed = 500;
            this.reel("openDoor", doorSpeed, c[0] / c[2], c[1] / c[3], 5);
            this.reel("closeDoor", doorSpeed, c[0] / c[2] + 4, c[1] / c[3], -5);

            this.bind("AnimationEnd", function() {
                if (this._initialized) {
                    if (this._currentReelId === "openDoor" || this._currentReelId === "closeDoor") {
                        Crafty.trigger(COMMANDEXECUTED);
                    }
                } else { // animation finished, assume initialization ended
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
            this.reset();
        },
        doorState: function(cfg) {
            this.open = cfg.state;
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
                c = this.__coord;
            this.requires("Tile, ControllerSprite, SpriteAnimation");
            this.reel("disableController", controllerSpeed, c[0] / c[2], c[1] / c[3], 4);
            this.reel("enableController", controllerSpeed, c[0] / c[2] + 3, c[1] / c[3], -4);
            this.bind("AnimationEnd", function() {
                if (this._initialized) {
                    Crafty.trigger(COMMANDEXECUTED);
                } else { // animation finished, assume initialization ended
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
        controllerState: function(command) {
            this.enabled = command.state;
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
                y: -10
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
     * Browser must support Canvas.
     * 
     * Should extract that function in an external file.
     */
    var tmp_canvas = document.createElement("canvas");
    Crafty.c("TintSprite", {
        _color: "rgba(255,255,255,1)",
        init: function() {
            this.requires("Sprite");
            this.bind("Draw", this.__tint)
                .bind("RemoveComponent", function(e) {
                    if (e === "TintSprite") {
                        this.unbind("Draw", this.__tint);
                    }
                });
        },
        tintSprite: function(color, opacity) {
            var col = {};
            Crafty.assignColor(color, col);
            if (opacity === undefined) {
                opacity = 1;
            }
            this.__newColor = true;
            this._color = "rgba(" + col._red + "," + col._green + "," + col._blue + "," + opacity + ")";
            this.__tint();
            return this;
        },
        __tint: function() {
            if (!this.__newColor) {
                return;
            }
            // be sure to update after the sprite
            Y.later(10, this, function() {
                var img = document.createElement('img'),
                    ctx = tmp_canvas.getContext('2d');
                if (!this.__oldImg) {
                    this.__oldImg = this.img;
                }
                this.__newColor = false;
                tmp_canvas.width = this.__oldImg.width;
                tmp_canvas.height = this.__oldImg.height;
                ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
                ctx.drawImage(this.__oldImg, 0, 0);
                ctx.save();
                ctx.globalCompositeOperation = 'source-in';
                ctx.fillStyle = this._color;
                ctx.fillRect(0, 0, this.__oldImg.width, this.__oldImg.height);
                ctx.restore();
                img.src = tmp_canvas.toDataURL();
                this.img = img;
                this.trigger('Invalidate');
            });
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
