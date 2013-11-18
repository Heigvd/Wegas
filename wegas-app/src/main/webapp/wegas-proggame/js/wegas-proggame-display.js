/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
/*global Crafty*/
YUI.add('wegas-proggame-display', function(Y) {
    "use strict";
    var ProgGameDisplay, GRIDSIZE = 32,
            execFn = function() {
        if (Crafty.refWidget.allowNextCommand) {
            Crafty.refWidget.allowNextCommand = false;
            Crafty.refWidget.fire('commandExecuted');
        }
    };
    /**
     * Level display, should handle canvas, for now renders the level as a
     * table element.
     *
     */
    ProgGameDisplay = Y.Base.create("wegas-proggame-display", Y.Widget, [], {
        CONTENT_TEMPLATE: '<div><div class="object-layer"></div><div id="cr-stage"></div></div>',
        gridH: null,
        gridW: null,
        allowNextCommand: null,
        initializer: function() {
            this.entities = [];
            this.allowNextCommand = false;
            this.publish("commandExecuted", {});
            if (this.get('map')) {
                this.gridH = this.get('map').length;
                this.gridW = this.get('map')[0].length;
            }
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
//            Crafty.background('rgb(0,0,0)');



            for (i = 0; i < this.gridH; i += 1) {                               // Add map tiles
                for (j = 0; j < this.gridW; j += 1) {
                    cfg = map[i][j];
                    if (cfg) {
//                        Crafty.e('Tile, ' + (cfg.sprite || "TerrainSprite"))
//                                .sprite(cfg.x, cfg.y)
//                                .attr({x: GRIDSIZE * j, y: GRIDSIZE * i});
                        if (cfg.y) {
                            Crafty.e("PathTile").attr({x: GRIDSIZE * j, y: GRIDSIZE * i});
                        } else {
                            Crafty.e("EmptyTile").attr({x: GRIDSIZE * j, y: GRIDSIZE * i});
                        }
                    }
                }
            }
            /*Apply filter*/
            //Crafty.e("2D," + this.renderMethod + ", Image").image(Y.Wegas.app.get("base") + '/wegas-proggame/images/filtre.png', "repeat").attr({w: Crafty.viewport.width, h: Crafty.viewport.height});
            for (i = 0; i < objects.length; i += 1) {                              // Add map objects
                cfg = objects[i];

                entity = Crafty.e(cfg.components)
                        .attr(cfg.attrs);                                       // Instantiate an entity

                pos = this.getRealXYPos([cfg.x, cfg.y]);                        // Place it on the map
                entity.attr('x', pos[0]);
                entity.attr('y', pos[1]);

                if (entity.execMove) {                                          // Allows to turn the player to the right direction
                    entity.execMove(cfg.direction, pos[0], pos[1]);
                }
                this.entities[cfg.id] = entity;                                 // Save a reference so we can look up for instances
            }
        },
        bindUI: function() {
            Crafty.bind('commandExecuted', execFn);
        },
        destructor: function() {
            var k, components = Crafty("*");
            //Should work with Crafty("*").destroy() ....
            for (k in components) {
                if (components[k].destroy) {
                    components[k].destroy();
                }
            }
            Crafty.unbind('commandExecuted', execFn);
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
                        entity.attr('x', pos[0]).attr('y', pos[1]);
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

                case "fire":
                    entity = this.getEntity(command.id);
                    switch (object.direction) {
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
                    if (entity && entity.execFire) {
                        entity.execFire(object.direction, pos[0], pos[1]);
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
                        this.fire('commandExecuted'); // @fixme Added since commandexecuted is not working after animation
                        return;
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
                    this.allowNextCommand = false;
                    Y.log("No action defined for '" + command.type + "'", "debug", "Y.Wegas.ProggameDisplay");
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
        SPRITESHEETS: {
            t: {
                name: "terrain",
                width: 32,
                height: 32,
                tilewidth: 32,
                tileHeight: 32
            },
            tile: {
                name: "tile",
                width: 1,
                height: 4,
                tileWidth: 32,
                tileHeigth: 32
            }
        },
        OBJECTTEMPLATES: [{
                id: "Player",
                type: "pc",
                direction: 2,
                x: 0,
                y: 0,
                life: 100,
                actions: 20,
                range: 3,
                components: "PC"
            }, {
                direction: 4,
                id: "Enemy",
                type: "npc",
                x: 0,
                y: 0,
                life: 100,
                actions: 0,
                range: 2,
                collides: false,
                components: "NPC"
            }, {
                id: "Bloc1",
                type: "other",
                components: "Obstacle"
            }, {
                id: "Bloc2",
                type: "other"
            }, {
                id: "Bloc3",
                type: "other"
            }],
        SPEED: {
            MOVE: 3,
            FIRE: 7,
            TRAP: 4
        }
    });

    Y.namespace('Wegas').ProgGameDisplay = ProgGameDisplay;
    /*
     * Create Crafty Components
     */
    (function() {
        var speedToFrame = function(speed, x, y, toX, toY) {
            var dist;
            speed = (speed > 0) ? speed : 1;
            dist = Math.sqrt(Crafty.math.squaredDistance(x, y, toX, toY));
            return Math.round(((dist / GRIDSIZE) * (100 / speed))) || 1;
        };
        //Crafty.sprite(24, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/characters.png', {
        //    CharacterSprite: [0, 0]
        //});
        Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/proggame-sprite-anim.png', {
            HumanSprite: [0, 0],
            TrapSprite: [0, 9],
            DoorSprite: [0, 10],
            ControllerSprite: [0, 12]
        });
        Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/proggame-sprite-dalles.png', {
            TileSprite: [0, 0]
        });
        Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/panel.png', {
            PanelSprite: [0, 0]
        });
        //Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/lightning.png', {
        //    LightningSprite: [0, 0]
        //});
        Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/terrain.png', {
            TerrainSprite: [0, 0]
        });

        //move function
        Crafty.c('move4Direction', {//requires Tween and spriteAnimation with "moveUp", "moveRight" "moveDown" and "moveLeft" animation
            tweenEnd: null,
            init: function() {
                this.requires("Tween");
                this.tweenEnd = []; //Tween x and y. Thus, the tween end when this variable contain x and y.
                this.bind('TweenEnd', function(e) {
                    this.tweenEnd.push(e);
                    if (this.tweenEnd.length === 2) {
                        this.stop();
                        this.tweenEnd.length = 0;
                        Crafty.trigger('moveEnded');
                        Crafty.trigger('commandExecuted');
                    }
                }, this);
            },
            execMove: function(direction, toX, toY, speed) {
                var animDir = this.dir2anim[direction];

                if (!this.isPlaying(animDir)) {
                    this.stop();
                    this.animate(animDir, 4, -1);
                }
                this.tween({x: toX, y: toY}, speedToFrame(speed, this._x, this._y, toX, toY));
            },
            dir2anim: {
                1: "moveUp",
                2: "moveRight",
                3: "moveDown",
                4: "moveLeft"
            }

        });

        Crafty.c("shoot", {
            shot: null,
            init: function() {
                this.bind("moveEnded", function() {
                    if (this.shot) {
                        this.shot.destroy();
                    }
                }, this);
            },
            execFire: function(dir, toX, toY) {
                this.shot = Crafty.e('LightningShot');
                this.shot.attr('x', this.pos()._x);
                this.shot.attr('y', this.pos()._y);
                this.shot.execMove(dir, toX, toY, ProgGameDisplay.SPEED.FIRE);
            }
        });

        Crafty.c("LightningShot", {//temporary hard-coded
            init: function() {
                this.requires("2D," + Crafty.refWidget.renderMethod + ", LightningSprite, SpriteAnimation, move4Direction")
                        .animate("moveUp", 0, 6, 3)
                        .animate("moveRight", 0, 0, 3)
                        .animate("moveDown", 0, 2, 3)
                        .animate("moveLeft", 0, 4, 3);
            }
        });

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
                this.tween({alpha: 0}, 50);
            }
        });
        Crafty.c("Character", {
            init: function() {
                this.requires("2D," + Crafty.refWidget.renderMethod + ", HumanSprite, SpriteAnimation, move4Direction, Speaker")
                        .animate("moveUp", 0, 2, 7)
                        .animate("moveRight", 0, 0, 7)
                        .animate("moveDown", 0, 2, 7)
                        .animate("moveLeft", 0, 1, 7)
                        .animate("handsUp", 0, 6, 6);
            },
            shakeHands: function(times) {
                this.stop().animate("handsUp", 15, times || 1);
            }
        });
        Crafty.c("Speaker", {
            say: function(text, delay) {
                var textE = Crafty.e("2D, DOM, Text")
                        .text(text)
                        .attr({"z": 401, "visible": false})
                        .css({
                    "background-color": "rgb(50, 50, 40)",
                    "color": "white",
                    "border": "2px solid #FFFFFF",
                    "line-height": "1.1em",
                    "font-size": "0.9em",
                    "padding": "4px",
                    "max-width": "108px",
                    "visibility": "hidden"
                }), POS = [this._x, this._y];


                textE.bind("Draw", function(e) {
                    this.unbind("Draw");
                    Y.later(20, this, function() {
                        this.attr({x: POS[0] - (this._element.offsetWidth / 2) + 14, y: POS[1] - this._element.offsetHeight - 10});
                        this.visible = true;
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
//                            .animate("moveUp", 0, 0, 2)
//                            .animate("moveRight", 0, 1, 2)
//                            .animate("moveDown", 0, 2, 2)
//                            .animate("moveLeft", 0, 3, 2);
            }
        });
        Crafty.c("NPC", {
            init: function() {
                this.requires("TintSprite, Character")
                        .tintSprite("D6D600", 1);
//                            .animate("moveUp", 9, 0, 11)
//                            .animate("moveRight", 9, 1, 11)
//                            .animate("moveDown", 9, 2, 11)
//                            .animate("moveLeft", 9, 3, 11);
            }
        });
        Crafty.c("Obstacle", {
            init: function() {
                this.requires("2D," + Crafty.refWidget.renderMethod + ", TerrainSprite")
                        .sprite(23, 18);
                //{x: 23, y: 18},
                //{x: 24, y: 21},
                //{x: 21, y: 21}
            }
        });
        Crafty.c("Tile", {
            init: function() {
                this.requires("2D," + Crafty.refWidget.renderMethod);
            }
        });
        Crafty.c("GrassTile", {
            init: function() {
                this.requires("Tile, TerrainSprite")
                        .sprite(21, 5);
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
                this.requires("2D," + Crafty.refWidget.renderMethod + ",Tile, TrapSprite, SpriteAnimation, Tween");
                x = this.__coord[0] / this.__coord[2];
                y = this.__coord[1] / this.__coord[3];
                this.initialize();
                this.animate("trap", x, y, 3);
                this.bind("TweenEnd", function() {
                    this.stop();
                    Crafty.trigger('commandExecuted');
                });
            },
            execTrap: function() {
                var frameTime = speedToFrame(ProgGameDisplay.SPEED.TRAP, this._x, this._y, this._x, this._y + 64);
                this.move("n", 64);
                this.visible = true;
                this.animate("trap", 4, -1);
                this.tween({x: this._x, y: this._y + 64}, frameTime);
            },
            initialize: function() {
                this.reset();
                this.visible = false;
            }
        });
        Crafty.c("Door", {
            init: function() {
                this.requires("Tile, DoorSprite, SpriteAnimation");
                this.animate("openDoor", this.__coord[0] / this.__coord[2], this.__coord[1] / this.__coord[3], 4);
                this.animate("closeDoor", this.__coord[0] / this.__coord[2], this.__coord[1] / this.__coord[3] + 1, 4);
                this.bind("AnimationEnd", function() {
                    Crafty.trigger('commandExecuted');
                });
                this.setter("open", function(v) {
                    if (v) {
                        if (!this._open) {
                            this.animate("openDoor", 10, 0);
                        } else {
                            this.reset();
                        }
                    } else {
                        if (this._open) {
                            this.animate("closeDoor", 10, 0);
                        } else {
                            this.reset();
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
                this.reset();
                if (attrs) {
                    this.attr(attrs);
                } else {
                    this.attr({open: false});
                }
            }
        });
        Crafty.c("Panel", {
            init: function() {
                this.requires("Tile, PanelSprite, Speaker");
            }
        });
    }());
    (function() {
        var tmp_canvas = document.createElement("canvas"), COMPONENT = "TintSprite",
                ctx = tmp_canvas.getContext("2d"), draw;
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
    }());
});
