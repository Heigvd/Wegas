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
            var i, j;

            Crafty.init(GRIDSIZE * this.gridW, GRIDSIZE * this.gridH);

            Crafty.refWidget = this;
            this.initCrafty();

            Crafty.background('rgb(110,110,110)');

            var i, j, cfg, pos, entity,
                    objects = this.get('objects'),
                    map = this.get('map');

            for (i = 0; i < this.gridH; i += 1) {                               // Add map tiles
                for (j = 0; j < this.gridW; j += 1) {
                    cfg = map[i][j];
                    if (cfg) {
                        Crafty.e('Tile, ' + (cfg.sprite || "TerrainSprite"))
                                .sprite(cfg.x, cfg.y)
                                .attr({x: GRIDSIZE * j, y: GRIDSIZE * i});
                    }
                }
            }

            for (i = 0; i < objects.length; i++) {                              // Add map objects
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
                        entity.execMove(object.direction, pos[0], pos[1], 2);
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
                        entity.execFire(object.direction, pos[0], pos[1], 7);
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
        },
        initCrafty: function() {
            if (Crafty.support.canvas) {
                Crafty.canvas.init();
                this.renderMethod = 'Canvas';
            } else {
                this.renderMethod = 'DOM';
            }

            Crafty.sprite(24, 32, Y.Wegas.app.get("base") + '/wegas-proggame/images/characters.png', {
                CharacterSprite: [0, 0]
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
                execFire: function(dir, toX, toY, speed) {
                    this.shot = Crafty.e('LightningShot');
                    this.shot.attr('x', this.pos()._x);
                    this.shot.attr('y', this.pos()._y);
                    this.shot.execMove(dir, toX, toY, speed);
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
                    this.bind('TweenEnd', function(e) {
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
                    this.requires("2D," + Crafty.refWidget.renderMethod + ", CharacterSprite, SpriteAnimation, move4Direction");
                }
            });
            Crafty.c("PC", {
                init: function() {
                    this.requires("Character")
                            .animate("moveUp", 0, 0, 2)
                            .animate("moveRight", 0, 1, 2)
                            .animate("moveDown", 0, 2, 2)
                            .animate("moveLeft", 0, 3, 2);
                }
            });
            Crafty.c("NPC", {
                init: function() {
                    this.requires("Character")
                            .animate("moveUp", 9, 0, 11)
                            .animate("moveRight", 9, 1, 11)
                            .animate("moveDown", 9, 2, 11)
                            .animate("moveLeft", 9, 3, 11);
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
                    //    {
                    //        "name": "g",
                    //        "x": [21, 22, 21],
                    //        "y": [5, 5, 11]
                    //    }, {
                    //        "name": "e",
                    //        "x": 17,
                    //        "y": 5
                    //    }, {
                    //        "name": "w",
                    //        "x": 21,
                    //        "y": 17
                    //    }
                }
            });
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
                components: "PlayableCharacter"
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
                components: "NotPlayableCharacter"
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
            }]
    });

    Y.namespace('Wegas').ProgGameDisplay = ProgGameDisplay;
});