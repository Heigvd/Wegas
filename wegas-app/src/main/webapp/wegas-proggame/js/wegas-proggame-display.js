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
    var ProgGameDisplay, GRIDSIZE = 32;
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
//            Crafty.e("2D," + this.renderMethod + ", Image").image(Y.Wegas.app.get("base") + '/wegas-proggame/images/filtre.png', "repeat").attr({w: Crafty.viewport.width, h: Crafty.viewport.height});
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
            Crafty.bind('commandExecuted', function() {
                if (Crafty.refWidget.allowNextCommand) {
                    Crafty.refWidget.allowNextCommand = false;
                    Crafty.refWidget.fire('commandExecuted');
                }
            });
        },
        destructor: function() {
            var k, components = Crafty("*");
            //Should work with Crafty("*").destroy() ....
            for (k in components) {
                if (components[k].destroy) {
                    components[k].destroy();
                }
            }
            Crafty.unbind('dieEnded');
            Crafty.unbind('moveEnded');
            Crafty.unbind('commandExecuted');
        },
        getEntity: function(id) {
            return this.entities[id];
        },
        execute: function(command) {
            var object, entity, pos, i;

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
                    }
                    this.fire("commandExecuted");
                    break;
                case "move":
                    object = command.object;
                    this.set("objects", object);// @fixme why?
                    entity = this.getEntity(object.id);
                    pos = this.getRealXYPos([object.x, object.y]);
                    this.allowNextCommand = true;
                    if (entity && entity.execMove) {
                        entity.execMove(object.direction, pos[0], pos[1], ProgGameDisplay.SPEED.MOVE);
                    } else {
                        this.fire('commandExecuted');
                    }
                    break;
                case "fire":
                    entity = this.getEntity(command.object.id);
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
                    this.allowNextCommand = true;
                    if (entity && entity.execFire) {
                        entity.execFire(object.direction, pos[0], pos[1]);
                    } else {
                        this.fire('commandExecuted');
                    }
                    break;
                case "die":
                    entity = this.getEntity(command.object.id);
                    this.allowNextCommand = true;
                    if (entity && entity.execDie) {
                        entity.execDie();
                    } else {
                        this.fire('commandExecuted');
                    }
                    break;
                case "trap":
                    entity = this.getEntity(command.object.id);
                    this.allowNextCommand = true;
                    if (entity && entity.execTrap) {
                        entity.execTrap();
                    } else {
                        this.fire('commandExecuted');
                    }
                    break;
                case "say":
                    entity = this.getEntity(command.object.id);
                    this.allowNextCommand = true;
                    if (entity && typeof entity.say === 'function') {
                        entity.say(/*text[, duration(3500)]*/);                         //@TODO : insert vars
                    } else {
                        this.fire('commandExecuted');
                    }
                    break;
                default:
                    Y.log("No action defined for '" + command.type + "'");
            }
        },
        getRealXYPos: function(position) {
            var pos = [];
            if (!position || typeof position[0] !== 'number' || typeof position[1] !== 'number') {
                return pos;
            }
            pos.push(position[0] * GRIDSIZE); //x
            pos.push((this.gridH - position[1] - 1) * GRIDSIZE); //y
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
            FIRE: 7
        }
    });

    Y.namespace('Wegas').ProgGameDisplay = ProgGameDisplay;
    /*
     * Create Crafty Components 
     */
    (function() {

        Crafty.sprite(24, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/characters.png', {
            CharacterSprite: [0, 0]
        });
        Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/proggame-sprite-marcheanim.png', {
            HumanSprite: [0, 0]
        });
        Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/proggame-sprite-dalles.png', {
            TileSprite: [0, 0]
        });
        Crafty.sprite(32, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/lightning.png', {
            LightningSprite: [0, 0]
        });
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
                        Crafty.trigger('moveEnded');
                        Crafty.trigger('commandExecuted');
                    }
                }, this);
            },
            execMove: function(direction, toX, toY, speed) {
                var time, dist,
                        animDir = this.dir2anim(direction);

                if (!this.isPlaying(animDir)) {
                    this.stop();
                    this.animate(animDir, 10, -1);
                }
                speed = (speed > 0) ? speed : 1;
                dist = Math.sqrt(Crafty.math.squaredDistance(this.pos()._x, this.pos()._y, toX, toY));
                time = Math.round(((dist / GRIDSIZE) * (100 / speed))) + 1; //+1 because if time = 0, time = infinite
                this.tweenEnd.length = 0;
                this.tween({x: toX, y: toY}, time);
            },
            dir2anim: function(direction) {
                switch (direction) {
                    case 1:
                        return "moveUp";
                    case 2:
                        return "moveRight";
                    case 3:
                        return "moveDown";
                    case 4:
                        return "moveLeft";
                    default:
                        return null;
                }
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
                this.shot.execMove(dir, toX, toY, ProgGameDisplay.MOVE.FIRE);
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
                        .animate("moveLeft", 0, 1, 7);
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
                this.requires("Character");
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
                this.requires("Tile, TerrainSprite").sprite(15, 6);
            },
            execTrap: function() {
                this.sprite(15, 11);
                Y.later(5000, this, function() {
                    this.sprite(15, 6);
                    Crafty.trigger('commandExecuted');
                });
            }
        });
    }());
});