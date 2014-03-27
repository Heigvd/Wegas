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
 */
/*global Crafty*/
YUI.add('wegas-proggame-display', function(Y) {
    "use strict";
    var ProgGameDisplay, GRIDSIZE = 32;

    /**
     * Level display, should handle canvas, for now renders the level as a
     * table element.
     */
    ProgGameDisplay = Y.Base.create("wegas-proggame-display", Y.Widget, [], {
        CONTENT_TEMPLATE: '<div><div class="object-layer"></div><div id="cr-stage"></div></div>',
        initializer: function() {
            this.entities = [];
            this.allowNextCommand = false;
            this.publish("commandExecuted", {});
            if (this.get('map')) {
                this.gridH = this.get('map').length;
                this.gridW = this.get('map')[0].length;
            }
            Crafty("*").destroy(); // @HACK: Destructor sometimes not called !
        },
        renderUI: function() {
            var i, j, cfg, pos, entity,
                objects = this.get('objects'),
                map = this.get('map');

            Crafty.init(GRIDSIZE * this.gridW, GRIDSIZE * this.gridH);
            /* allow overflow, for text (say). Works only for DOM elements*/
            Crafty.stage.elem.style.overflow = "visible";
            Crafty.refWidget = this;
            if (Crafty.support.canvas) {
                Crafty.canvas.init();
                this.renderMethod = 'Canvas';
            } else {
                this.renderMethod = 'DOM';
            }
            //Crafty.background('rgb(0,0,0)');

            for (i = 0; i < this.gridH; i += 1) { // Add map tiles
                for (j = 0; j < this.gridW; j += 1) {
                    cfg = map[i][j];
                    if (cfg) {
                        //Crafty.e('Tile, ' + (cfg.sprite || "TerrainSprite"))
                        //        .sprite(cfg.x, cfg.y)
                        //        .attr({x: GRIDSIZE * j, y: GRIDSIZE * i});
                        if (cfg.y) {
                            Crafty.e("PathTile").attr({
                                x: GRIDSIZE * j,
                                y: GRIDSIZE * i
                            });
                        } else {
                            Crafty.e("EmptyTile").attr({
                                x: GRIDSIZE * j,
                                y: GRIDSIZE * i
                            });
                        }
                    }
                }
            }
            /*Apply filter*/
            //Crafty.e("2D," + this.renderMethod + ", Image").image(Y.Wegas.app.get("base") + '/wegas-proggame/images/filtre.png', "repeat").attr({w: Crafty.viewport.width, h: Crafty.viewport.height});
            Y.Object.each(objects, function(cfg) { // Add map objects
                pos = this.getRealXYPos([cfg.x, cfg.y]); // Place it on the map
                entity = Crafty.e(cfg.components) // Instantiate an entity
                .attr(Y.mix({
                    x: pos[0],
                    y: pos[1]
                }, cfg.attrs));

                if (entity.execMove) { // Allows to turn the player to the right direction
                    entity.execMove(cfg.direction, pos[0], pos[1]);
                }
                this.entities[cfg.id] = entity; // Save a reference so we can look up for instances

            }, this);
        },
        bindUI: function() {
            Crafty.bind('commandExecuted', this.execFn);
        },
        destructor: function() {
            //   var k, components = Crafty("*");
            //Should work with Crafty("*").destroy() ....
            //            for (k in components) {
            //                if (components[k].destroy) {
            //                    components[k].destroy();
            //                }
            //            }
            Crafty("*").destroy();
            Crafty.unbind('commandExecuted', this.execFn);
        },
        execFn: function() {
            if (Crafty.refWidget.allowNextCommand) {
                Crafty.refWidget.allowNextCommand = false;
                Crafty.refWidget.fire('commandExecuted');
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
                    for (i = 0; i < command.objects.length; i++) {
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
                        if (typeof entity.initialize === "function") {
                            entity.initialize(object.attr);
                        }
                    }
                    break;

                case "move":
                    entity = this.getEntity(command.id);
                    pos = this.getRealXYPos([command.x, command.y]);

                    if (entity && entity.execMove) {
                        entity.execMove(command.dir, pos[0], pos[1], ProgGameDisplay.SPEED.MOVE);
                        return;
                    }
                    break;

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

                case "yell":
                    entity = this.getEntity(command.id);
                    if (entity && typeof entity.shakeHands === 'function') {
                        entity.shakeHands(command.times);
                    }
                    this.fire('commandExecuted'); // continue, non blocking action.
                    return;

                default:
                    //this.allowNextCommand = false;
                    //Y.log("No action defined for '" + command.type + "'", "debug", "Y.Wegas.ProggameDisplay");
                    return;

            }
            this.fire('commandExecuted');
        },
        getRealXYPos: function(position) {
            var pos = [];
            if (!position || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
                return pos;
            }
            pos.push(position[0] * GRIDSIZE); //x
            pos.push((position[1]) * GRIDSIZE); //y
            return pos;
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
        SPEED: { // Tile per second unit
            MOVE: 1,
            FIRE: 5,
            TRAP: 2
        },
        SPRITESHEETS: {
            TileSprite: {
                width: 1,
                height: 4
                //tileWidth: 32,
                //tileHeigth: 32
            }
        }
    });
    Y.namespace('Wegas').ProgGameDisplay = ProgGameDisplay;

    /*
     * Crafty Components
     */
    var speedToFrame = function(speed, x, y, toX, toY) {
        var dist;
        speed = (speed > 0) ? speed : 1;
        dist = Math.sqrt(Crafty.math.squaredDistance(x, y, toX, toY));
        return Math.round(((dist / GRIDSIZE) * (1000 / speed))) || 1;
    };
    Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/proggame-sprite-anim2.png', {
        HumanSprite: [0, 0],
        TrapSprite: [0, 9],
        DoorSprite: [0, 10],
        DoorSprite2: [0, 14],
        VerticalDoor: [0, 16],
        HorizontalDoor: [0, 18],
        ControllerSprite: [0, 12]
    });
    Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/proggame-sprite-dalles.png', {
        TileSprite: [0, 0]
    });
    Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/panneau.png', {
        PanelSprite: [0, 0]
    });
    Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/roche111.png', {
        Roche: [0, 0]
    });

    //move function
    Crafty.c('move4Direction', { //requires Tween and spriteAnimation with "moveUp", "moveRight" "moveDown" and "moveLeft" animation
        init: function() {
            this.requires("Tween");
            this.bind('TweenEnd', function(e) {
                this.pauseAnimation().resetAnimation();
                Crafty.trigger('moveEnded');
                Crafty.trigger('commandExecuted');
            }, this);
        },
        execMove: function(direction, toX, toY, speed) {
            var animDir = this.dir2anim[direction];

            if (!this.isPlaying(animDir)) {
                this.pauseAnimation();
                this.animate(animDir, -1);
            }
            this.tween({
                x: toX,
                y: toY
            }, speedToFrame(speed, this._x, this._y, toX, toY));
        },
        dir2anim: {
            1: "moveUp",
            2: "moveRight",
            3: "moveDown",
            4: "moveLeft"
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
    //        this.requires("2D," + Crafty.refWidget.renderMethod + ", LightningSprite, SpriteAnimation, move4Direction")
    //                .animate("moveUp", 0, 6, 3)
    //                .animate("moveRight", 0, 0, 3)
    //                .animate("moveDown", 0, 2, 3)
    //                .animate("moveLeft", 0, 4, 3);
    //    }
    //});

    Crafty.c("die", {
        isDying: null,
        init: function() {
            this.requires("Tween");
            this.isDying = false;
            this.bind('TweenEnd', function() {
                if (this.isDying) {
                    Crafty.trigger('commandExecuted');
                    this.destroy();
                }
            }, this);
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
            this.requires("2D," + Crafty.refWidget.renderMethod + ", HumanSprite, SpriteAnimation, move4Direction, Speaker, Collision")
                .reel("moveUp", moveSpeed, 0, 2, 7)
                .reel("moveRight", moveSpeed, 0, 0, 7)
                .reel("moveDown", moveSpeed, 0, 2, 7)
                .reel("moveLeft", moveSpeed, 0, 1, 7)
                .reel("handsUp", moveSpeed, 0, 6, 7)
                .reel("gzRight", 3000, 0, 20, 7)
                .reel("gzLeft", 3000, 0, 21, 7)
                .onHit("Collide", function() {
                    this.h -= 1;
                    this.y += 1;
                }).bind("TweenEnd", function(e) {
                    var col = this.hit("Character");
                    if (col) {
                        if (this._currentReelId === "moveRight") {
                            this.attr({
                                x: this._x - 6
                            }).animate("gzRight");
                            col[0].obj.attr({
                                x: col[0].obj._x + 6
                            }).animate("gzLeft");
                        } else { // All other moves. up/down/left
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
        shakeHands: function(times) {
            var POS = Y.clone(this.__coord);
            this.pauseAnimation().bind("AnimationEnd", function() {
                if (this._currentReelId === 'handsUp') {
                    this.sprite(POS[0] / POS[2], POS[1] / POS[3]);
                }
            }).animate("handsUp", 15, times || 1);
        }
    });
    Crafty.c("Speaker", {
        say: function(text, delay, think) {
            var textE = Crafty.e("2D, DOM, Text")
                .text(text.toUpperCase())
                .attr({
                    z: 401,
                    visible: false,
                })
                .css({
                    "background-color": "rgb(50, 50, 40)",
                    border: "7px solid #FFFFFF",
                    "-moz-border-image": "url(" + Y.Wegas.app.get('base') + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                    "-webkit-border-image": "url(" + Y.Wegas.app.get('base') + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                    "-o-border-image": "url(" + Y.Wegas.app.get('base') + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                    "border-image": "url(" + Y.Wegas.app.get('base') + '/wegas-proggame/images/dialog.png' + ") 7 stretch",
                    "font-family": "KG Ways to Say Goodbye, Verdana, Arial",
                    "line-height": "1.1em",
                    "font-size": "1.6em",
                    "max-width": "400px",
                    color: "white",
                    padding: "4px 4px 2px",
                    visibility: "hidden"
                }),
                POS = [this._x, this._y],
                connector = Crafty.e("2D, DOM").css({
                    background: "url(" + Y.Wegas.app.get('base') + "/wegas-proggame/images/dialogConnector.png) 0 " + (think ? 0 : (+-32 + "px")),
                    width: "32px",
                    height: "32px",
                    visibility: "hidden"
                }).attr({
                    z: 402,
                    visible: false
                });

            textE.bind("Draw", function(e) {
                this.unbind("Draw");
                this.css({
                    "width": "initial",
                    "height": "initial"
                });
                //Y.later(20, this, function() {
                Y.later(400, this, function() { // Attach a little later so the font file has enough time to be loaded
                    textE.attach(connector);
                    this.attr({
                        x: POS[0] - (this._element.offsetWidth / 2) + 14,
                        y: POS[1] - this._element.offsetHeight - 32
                    });
                    this._children[0].shift(this._element.offsetWidth / 2 - 16, this._element.offsetHeight - 7);
                    this.visible = true;
                    this._children[0].css({
                        "width": "32px",
                        "height": "32px"
                    });
                    this._children[0].visible = true;
                });

            });
            this.attach(textE);
            Y.later(delay || 3500, textE, function() {
                this.destroy();
                Crafty.trigger('commandExecuted');
            });
        }
    });
    Crafty.c("PC", {
        init: function() {
            this.requires("Character");
            //.animate("moveUp", 0, 0, 2)
            //.animate("moveRight", 0, 1, 2)
            //.animate("moveDown", 0, 2, 2)
            //.animate("moveLeft", 0, 3, 2);
        }
    });
    Crafty.c("NPC", {
        init: function() {
            this.requires("TintSprite, Character")
                .tintSprite("D6D600", 1);
            //.animate("moveUp", 9, 0, 11)
            //.animate("moveRight", 9, 1, 11)
            //.animate("moveDown", 9, 2, 11)
            //.animate("moveLeft", 9, 3, 11);
        }
    });
    Crafty.c("Tile", {
        init: function() {
            this.requires("2D," + Crafty.refWidget.renderMethod);
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
        init: function() {
            var x, y;
            this.requires("Tile, TrapSprite, SpriteAnimation, Tween, Collision")
                .collision([10, 13], [3, 24], [10, 27], [25, 25], [28, 13]);
            x = this.__coord[0] / this.__coord[2];
            y = this.__coord[1] / this.__coord[3];
            this.initialize();
            this.reel("trap", 100, x, y, 5);
            this.bind("TweenEnd", function() {
                this.pauseAnimation().visible = false;
                this._roche = Crafty.e("Tile, Roche, Collision").attr({
                    x: this._x,
                    y: this._y
                });
                Crafty.trigger('commandExecuted');
            });
        },
        execTrap: function() {
            var frameTime = speedToFrame(ProgGameDisplay.SPEED.TRAP, this._x, this._y, this._x, this._y + 64);
            this.move("n", 64);
            this.addComponent("Collide");
            this.visible = true;
            this.animate("trap", -1);
            this.tween({
                x: this._x,
                y: this._y + 64
            }, frameTime);
        },
        initialize: function() {
            this._roche && this._roche.destroy();
            this.visible = false;
            this.removeComponent("Collide");
        },
        _roche: null
    });
    Crafty.c("Door", {
        init: function() {
            var doorSpeed = 500;
            this.requires("Tile, VerticalDoor, SpriteAnimation");
            this.reel("openDoor", doorSpeed, this.__coord[0] / this.__coord[2], this.__coord[1] / this.__coord[3], 5);
            this.reel("closeDoor", doorSpeed, this.__coord[0] / this.__coord[2] + 4, this.__coord[1] / this.__coord[3], -5);
            //            this.animate("openDoor", this.__coord[0] / this.__coord[2], this.__coord[1] / this.__coord[3], 4);
            //            this.animate("closeDoor", this.__coord[0] / this.__coord[2], this.__coord[1] / this.__coord[3] + 1, 4);
            this.setter("open", function(v) {
                var animEndFn = function(e) {
                    if (this._currentReelId === "openDoor" || this._currentReelId === "closeDoor") {
                        Crafty.trigger('commandExecuted');
                    }
                };
                if (v) {
                    if (!this._open) {
                        this.unbind("AnimationEnd", animEndFn).bind("AnimationEnd", animEndFn).animate("openDoor", 1);
                    } else {
                        //  this.reset();
                        Crafty.trigger('commandExecuted');
                    }
                } else {
                    if (this._open) {
                        this.unbind("AnimationEnd", animEndFn).bind("AnimationEnd", animEndFn).animate("closeDoor", 1);
                    } else {
                        //  this.reset();
                        Crafty.trigger('commandExecuted');
                    }
                }
                this._open = v;
            });
            this.initialize();
        },
        doorState: function(state) {
            this.open = state;
        },
        initialize: function(attrs) {
            //   this.reset();
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
            var controllerSpeed = 500;
            this.requires("Tile, ControllerSprite, SpriteAnimation");
            this.reel("disableController", controllerSpeed, this.__coord[0] / this.__coord[2], this.__coord[1] / this.__coord[3], 4);
            this.reel("enableController", controllerSpeed, this.__coord[0] / this.__coord[2] + 3, this.__coord[1] / this.__coord[3], -4);
            this.setter("enabled", function(v) {
                var animEndFn = function(e) {
                    Crafty.trigger('commandExecuted');
                };
                if (v) {
                    if (!this._enabled) {
                        this.unbind("AnimationEnd", animEndFn).bind("AnimationEnd", animEndFn).animate("disableController");
                    } else {
                        Crafty.trigger('commandExecuted');
                    }
                } else {
                    if (this._enabled) {
                        this.unbind("AnimationEnd", animEndFn).bind("AnimationEnd", animEndFn).animate("enableController");
                    } else {
                        Crafty.trigger('commandExecuted');
                    }
                }
                this._enabled = v;
            });
            this.initialize();
        },
        controllerState: function(state) {
            this.enabled = state;
        },
        initialize: function(attrs) {
            // this.reset();
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
            this.attr = function(args) {
                if (arguments.length === 2 && Y.Object.hasKey(this._offset, arguments[0])) {
                    return attr.apply(this, [arguments[0], arguments[1] += this._offset[arguments[0]]]);
                } else {
                    for (var i in this._offset) {
                        if (arguments[0][i]) {
                            arguments[0][i] += this._offset[i];
                        }
                    }
                    return attr.apply(this, arguments);
                }

            }
            this._offset = {
                x: 0,
                y: 0
            };
        },
        _offset: null

    })

    // TintSprite Component
    var tmp_canvas = document.createElement("canvas"),
        COMPONENT = "TintSprite",
        ctx = tmp_canvas.getContext("2d"),
        draw;
    draw = function() {
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
        var img = document.createElement("img");
        img.src = tmp_canvas.toDataURL();
        this.img = img;
    };
    /**
     * Component TintSprite
     * Should be included before the actual sprite.
     * Browser should support Canvas.
     */
    Crafty.c(COMPONENT, {
        _color: Crafty.toRGB("FFFFFF"),
        init: function() {
            this.bind("Draw", draw).bind("RemoveComponent", function(e) {
                if (e === COMPONENT) {
                    this.unbind("Draw", draw);
                }
            });
        },
        tintSprite: function(color, opacity) {
            this.__newColor = true;
            this._color = Crafty.toRGB(color, opacity);
            this.trigger("Change");
            return this;
        }
    });
});
