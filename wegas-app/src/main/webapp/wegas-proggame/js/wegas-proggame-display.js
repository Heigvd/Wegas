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
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
YUI.add('wegas-proggame-display', function (Y) {
    "use strict";

    var CONTENTBOX = 'contentBox',
            GRIDSIZE = 31;

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
                            Crafty.trigger('moveEnded');
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
                value: 9
            },
            gridH: {
                value: 9
            },
            objects: {
            }
        }
    });
    Y.namespace('Wegas').ProgGameDisplay = ProgGameDisplay;
});