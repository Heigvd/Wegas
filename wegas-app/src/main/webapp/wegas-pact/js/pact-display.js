/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 * @author Cyril Junod <cyril.junod at gmail.com>
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
/* global Crafty */
YUI.add('pact-display', function(Y) {
    'use strict';

    var COMMANDEXECUTED = 'commandExecuted',
        RENDERMETHOD = Crafty.support.canvas ? 'Canvas' : 'DOM',
        SCALE = 1.2,
        TILESIZE = 32,
        MARGIN_X = 3,
        MARGIN_Y = 2,
        TILE_DELTA = 10,
        Wegas = Y.Wegas,
        ProgGameDisplay,
        Promise = Y.Promise,
        ready,
        HIT_BOX = new Crafty.polygon([
            0 + 15,
            0 + TILE_DELTA + 5,
            0,
            28 + TILE_DELTA,
            25,
            28 + TILE_DELTA,
            25 + 15,
            0 + TILE_DELTA + 5,
        ]);

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
                        '/wegas-pact/images/proggame-sprite-anim.png'
                ] = {
                    tile: TILESIZE,
                    tileh: TILESIZE,
                    map: {
                        // CharacterSprite: [0, 0],
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
                        '/wegas-pact/images/proggame-sprite-tiles_iso_v4.png'
                ] = {
                    tile: 41,
                    tileh: TILESIZE,
                    map: {
                        EmptyT: [0, 2],
                        PathT: [0, 0],
                        TrapT: [0, 1],
                    },
                };
                assets.sprites[
                    Wegas.app.get('base') +
                        '/wegas-pact/images/sprite_sheet_girl.png'
                ] = {
                    tile: TILESIZE,
                    tileh: TILESIZE,
                    map: {
                        CharacterSprite: [0, 0],
                    },
                };
                assets.sprites[
                    Wegas.app.get('base') +
                        '/wegas-pact/images/sprite_sheet_girl_blond.png'
                ] = {
                    tile: TILESIZE,
                    tileh: TILESIZE,
                    map: {
                        BlondSprite: [0, 0],
                    },
                };
                assets.sprites[
                    Wegas.app.get('base') +
                        '/wegas-pact/images/sprite_sheet_monstre.png'
                ] = {
                    tile: TILESIZE,
                    tileh: TILESIZE,
                    map: {
                        MonsterSprite: [0, 0],
                    },
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
    ProgGameDisplay = Y.Base.create(
        'pact-display',
        Y.Widget,
        [],
        {
            CONTENT_TEMPLATE:
                '<div><div class="object-layer"></div><div id="cr-stage"></div></div>',
            initializer: function() {
                this.entities = [];
                this.allowNextCommand = false;
            },
            renderUI: function() {
                var i,
                    j,
                    pos,
                    posy,
                    entity,
                    objects = this.get('objects'),
                    map = this.get('map'),
                    gridH = map.length,
                    gridW = map[0].length;

                pos = this.getRealXYPos({
                    x: gridW + MARGIN_X + 1,
                    y: -MARGIN_Y,
                });
                posy = this.getRealXYPos({
                    x: gridW + MARGIN_X + 1,
                    y: gridH + MARGIN_Y,
                });
                ready.then(
                    function() {
                        Crafty.init(
                            pos.x * SCALE,
                            (posy.y + TILE_DELTA) * SCALE
                        ); // Init crafty
                        Crafty.viewport.scale(SCALE);
                        for (i = -MARGIN_Y; i < gridH + MARGIN_Y; i += 1) {
                            // Render tiles
                            for (j = -MARGIN_X; j < gridW + MARGIN_X; j += 1) {
                                pos = this.getRealXYPos({ x: j, y: i });
                                pos.y = pos.y + TILE_DELTA;
                                pos.x = pos.x - 3;
                                pos.z = 0;
                                // if (map[i] && map[i][j] && map[i][j].y) {
                                Crafty.e(
                                    map[i] && map[i][j] && map[i][j].y
                                        ? 'PathTile'
                                        : 'EmptyTile'
                                ).attr(pos);
                                // }
                            }
                        }

                        Y.Object.each(
                            objects,
                            function(cfg) {
                                // Render objects (PC, traps, etc.)
                                pos = this.getRealXYPos(cfg); // Place it on the map
                                entity = Crafty.e(cfg.components) // Instantiate an entity
                                    .attr(Y.mix(pos, { z: 1 }, cfg.attrs));
                                if (entity.execMove) {
                                    // Allows to turn the player to the right direction
                                    entity.execMove(cfg.direction, pos);
                                }
                                this.entities[cfg.id] = entity; // Save a reference so we can look up for instances
                            },
                            this
                        );
                    }.bind(this)
                );
            },
            bindUI: function() {
                Y.Wegas.Facade.Variable.on('WegasScriptException', function(e) {
                    e.halt();
                });
                Crafty.bind(
                    COMMANDEXECUTED,
                    Y.bind(function() {
                        // Every time a command is executed,
                        if (this.allowNextCommand) {
                            this.allowNextCommand = false;
                            this.fire(COMMANDEXECUTED); // notifiy the parent widget
                        }
                    }, this)
                );
            },
            destructor: function() {
                Crafty('2D').destroy();
                Crafty.stop();
                Crafty.unbind(COMMANDEXECUTED);
            },
            getEntity: function(id) {
                return this.entities[id];
            },
            execute: function(command) {
                ready.then(
                    function() {
                        var entity, pos;
                        this.allowNextCommand = true;

                        switch (command.type) {
                            case 'resetLevel':
                                Y.Object.each(
                                    command.objects,
                                    function(object) {
                                        pos = this.getRealXYPos(object);
                                        pos.h = 32;
                                        entity = this.getEntity(object.id);
                                        entity.attr(pos);
                                        if (entity.execMove) {
                                            entity.execMove(
                                                object.direction,
                                                pos
                                            );
                                        }
                                        if (
                                            typeof entity.reset === 'function'
                                        ) {
                                            entity.reset(object.attr);
                                        }
                                    },
                                    this
                                );
                                break;

                            case 'move':
                                entity = this.getEntity(command.id);
                                if (entity && entity.execMove) {
                                    entity.execMove(
                                        command.dir,
                                        this.getRealXYPos(command),
                                        true
                                    );
                                    return;
                                }
                                break;

                            case 'gameWon':
                            case 'gameLost':
                            case 'log':
                                break;

                            default:
                                entity = this.getEntity(command.id);
                                if (
                                    entity &&
                                    typeof entity[command.type] === 'function'
                                ) {
                                    entity[command.type](command);
                                    return;
                                } else {
                                    Y.log(
                                        "No action defined for '" +
                                            command.type +
                                            "'",
                                        'warn',
                                        'Wegas.ProggameDisplay'
                                    );
                                }
                        }
                        this.fire(COMMANDEXECUTED);
                    }.bind(this)
                );
            },
            getRealXYPos: function(pos) {
                if (
                    !pos ||
                    typeof pos.x !== 'number' ||
                    typeof pos.y !== 'number'
                ) {
                    return {};
                }
                var x = pos.x + MARGIN_X,
                    y = pos.y + MARGIN_Y;
                return {
                    x:
                        x * TILESIZE +
                        (this.get('map').length + MARGIN_X - y) * 16,
                    y: y * 28,
                };
            },
        },
        {
            ATTRS: {
                map: {
                    validator: Y.Lang.isArray,
                },
                objects: {
                    value: [],
                },
            },
            SPEED: {
                // Tile per second unit
                MOVE: 1,
                FIRE: 5,
                TRAP: 2,
            },
            speedToFrame: function(speed, x, y, toX, toY) {
                speed = speed > 0 ? speed : 1;
                var dist = Math.sqrt(
                    Crafty.math.squaredDistance(x, y, toX, toY)
                );
                return Math.round((dist / TILESIZE) * (1000 / speed)) || 1;
            },
        }
    );
    Wegas.ProgGameDisplay = ProgGameDisplay;
    /*
     * Crafty Components
     */
    // Move component
    Crafty.c('move4Direction', {
        //requires Tween and spriteAnimation with "moveUp", "moveRight" "moveDown" and "moveLeft" animation
        init: function() {
            this.requires('Tween').bind(
                'TweenEnd',
                function() {
                    this.pauseAnimation().resetAnimation();
                    if (this.doDelay) {
                        this.doDelay = false;
                        Y.later(500, this, function() {
                            Crafty.trigger(COMMANDEXECUTED);
                        });
                    } else {
                        Crafty.trigger(COMMANDEXECUTED);
                    }
                },
                this
            );
        },
        execMove: function(direction, target, minDuration) {
            var animDir = this.dir2anim[direction];
            if (direction === 4) {
                this.flip('X');
            } else {
                this.unflip('X');
            }
            if (!this.isPlaying(animDir)) {
                this.doDelay = minDuration && this.reel() !== animDir;
                this.pauseAnimation();
                this.animate(animDir, -1);
            }
            this.tween(
                target,
                ProgGameDisplay.speedToFrame(
                    ProgGameDisplay.SPEED.MOVE,
                    this._x,
                    this._y,
                    target.x,
                    target.y
                )
            );
        },
        dir2anim: {
            1: 'moveDown',
            2: 'moveRight',
            3: 'moveUp',
            4: 'moveLeft',
        },
    });
    Crafty.c('die', {
        isDying: null,
        init: function() {
            this.requires('Tween').bind(
                'TweenEnd',
                function() {
                    if (this.isDying) {
                        Crafty.trigger(COMMANDEXECUTED);
                        this.destroy();
                    }
                },
                this
            );
            this.isDying = false;
        },
        die: function() {
            this.isDying = true;
            this.tween(
                {
                    alpha: 0,
                },
                500
            );
        },
    });
    Crafty.c('Character', {
        init: function() {
            var moveSpeed = 1000;
            this.requires(
                '2D,' +
                    RENDERMETHOD +
                    ', CharacterSprite, SpriteAnimation, move4Direction, Speaker, Collision'
            )
                .reel('moveUp', moveSpeed, 0, 2, 4)
                .reel('moveRight', moveSpeed, 0, 0, 7)
                .reel('moveDown', moveSpeed, 0, 1, 4)
                .reel('moveLeft', moveSpeed, 0, 0, 7)
                .reel('handsUp', moveSpeed, 0, 6, 7)
                .reel('fall', 1000, 0, 4, 9)
                .reel('endAnim', 500, 0, 3, 7)
                .collision(HIT_BOX)
                .onHit('Collide', function(_data, first) {
                    if (first) {
                        this.pauseAnimation().animate('fall');
                    }
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
        outside: function() {
            this.pauseAnimation()
                .one('AnimationEnd', function() {
                    if (this._currentReelId === 'fall') {
                        Crafty.trigger(COMMANDEXECUTED);
                    }
                })
                .animate('fall');
        },
        wave: function(times) {
            var pos = Y.clone(this.__coord);
            this.pauseAnimation()
                .one('AnimationEnd', function() {
                    if (this._currentReelId === 'handsUp') {
                        this.sprite(pos[0] / pos[2], pos[1] / pos[3]);
                    }
                })
                .animate('handsUp', times || 1);
        },
    });
    Crafty.c('Speaker', {
        say: function(text, delay, think, preventEvent) {
            if (Y.Lang.isObject(text)) {
                // One can also send a cfg object instead of arguments
                delay = delay || text.delay;
                think = think || text.think;
                text = text.text;
            }

            var pos = [this._x * SCALE, this._y * SCALE],
                textE = Crafty.e('2D, DOM, Text')
                    .text(text)
                    .attr({
                        z: 401,
                        visible: false,
                    })
                    .css({
                        'background-color': 'rgba(9, 93, 89, 0.8)',
                        border: '4px solid transparent',
                        'border-image':
                            'url(' +
                            Wegas.app.get('base') +
                            '/wegas-pact/images/blackboard_LEFT_cadre.png) 4 stretch',
                        'border-image-width': '2px',
                        'font-size': '1em',
                        width: 'auto',
                        margin: '2px',
                    });
            textE._element.classList.add('pact-display-say');
            textE.one('Draw', function() {
                this.css({
                    width: 'initial',
                    height: 'initial',
                });
                this._renderTimer = Y.later(10, this, function() {
                    this.attr({
                        x:
                            pos[0] -
                            this._element.offsetWidth / 2 +
                            (TILESIZE * SCALE) / 2,
                        y: pos[1] - this._element.offsetHeight - 8, // 8 = arrow height.
                    });
                    this.visible = true;
                });
            });
            textE.bind('Remove', function() {
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
        },
    });
    Crafty.c('Monster', {
        init: function() {
            var moveSpeed = 500;
            this.requires(
                '2D,' +
                    RENDERMETHOD +
                    ', MonsterSprite, SpriteAnimation, move4Direction, Speaker, Collision'
            )
                .reel('moveUp', moveSpeed, 0, 2, 5)
                .reel('moveRight', moveSpeed, 0, 2, 5)
                .reel('moveDown', moveSpeed, 0, 2, 5)
                .reel('moveLeft', moveSpeed, 0, 2, 5)
                .reel('endAnim', 500, 0, 1, 4)
                .reel('say', 200, 0, 4, 8)
                .collision(HIT_BOX);
        },
        sayAnimation: function(times) {
            var pos = Y.clone(this.__coord);
            this.pauseAnimation()
                .one('AnimationEnd', function() {
                    if (this._currentReelId === 'say') {
                        this.sprite(pos[0] / pos[2], pos[1] / pos[3]);
                    }
                })
                .animate('say', times || 1);
        },
    });
    Crafty.c('Blond', {
        init: function() {
            this.requires(
                '2D,' +
                    RENDERMETHOD +
                    ', BlondSprite, SpriteAnimation, Speaker, Collision'
            )
                .reel('say', 200, 0, 2, 3)
                .reel('endAnim', 500, 0, 0, 8)
                .collision(HIT_BOX);
        },
        sayAnimation: function(times) {
            var pos = Y.clone(this.__coord);
            this.pauseAnimation()
                .one('AnimationEnd', function() {
                    if (this._currentReelId === 'say') {
                        this.sprite(pos[0] / pos[2], pos[1] / pos[3]);
                    }
                })
                .animate('say', times || 1);
        },
    });
    Crafty.c('PC', {
        init: function() {
            this.requires('Character');
            this.onHit('NPC', function(_data, first) {
                if (first && this.getReel('endAnim') !== undefined) {
                    this.pauseAnimation().animate('endAnim');
                }
            });
        },
    });
    Crafty.c('NPC', {
        init: function() {
            this.requires('Blond');
            this.onHit('PC', function(_data, first) {
                if (first && this.getReel('endAnim') !== undefined) {
                    this.pauseAnimation().animate('endAnim');
                }
            });
        },
    });
    Crafty.c('Tile', {
        init: function() {
            this.requires('2D,' + RENDERMETHOD);
        },
    });
    Crafty.c('EmptyTile', {
        init: function() {
            this.requires('Tile, EmptyT').attr('collides', true);
        },
    });
    Crafty.c('PathTile', {
        init: function() {
            this.requires('Tile, PathT');
        },
    });
    Crafty.c('Trap', {
        init: function() {
            this.requires(
                'Tile, TrapSprite, SpriteAnimation, Tween, Collision, GridOffset'
            ).collision(
                new Crafty.polygon([10, 13, 3, 24, 10, 27, 25, 25, 28, 13])
            );
            //.collision([10, 13 + TILE_DELTA], [3, 24 + TILE_DELTA], [10, 27 + TILE_DELTA], [25, 25 + TILE_DELTA], [28, 13 + TILE_DELTA]);
            var c = this.__coord;
            this.reset();
            this.reel('trap', 100, c[0] / c[2], c[1] / c[3], 5);
            this._offset = {
                x: -3,
                y: TILE_DELTA,
            };
            this._delayTile = Y.later(1, this, function() {
                // Add a tile to show where the trap is
                Crafty.e('Tile, TrapT').attr({ x: this._x, y: this._y });
            });
            this.bind('TweenEnd', function() {
                this.pauseAnimation().visible = false;
                this._roche = Crafty.e('Tile, StoneSprite').attr({
                    x: this._x,
                    y: this._y,
                });
                Crafty.trigger(COMMANDEXECUTED);
            });
        },
        trap: function() {
            var frameTime = ProgGameDisplay.speedToFrame(
                ProgGameDisplay.SPEED.TRAP,
                this._x,
                this._y,
                this._x,
                this._y + 64
            );
            this.move('n', 64);
            this.addComponent('Collide');
            this.visible = true;
            this.animate('trap', -1);
            this.tween(
                {
                    x: this._x,
                    y: this._y + 64,
                },
                frameTime
            );
        },
        reset: function() {
            if (this._roche) {
                this._roche.destroy();
            }
            this.visible = false;
            this.removeComponent('Collide');
        },
        remove: function() {
            this._delayTile.cancel();
        },
    });
    Crafty.c('Door', {
        init: function() {
            this.requires('Tile, VerticalDoor, SpriteAnimation, GridOffset');

            this.rotation = 30;
            this._offset = {
                x: 16,
                y: 0,
            };
            var c = this.__coord,
                doorSpeed = 500;
            this.reel('openDoor', doorSpeed, c[0] / c[2], c[1] / c[3], 5);
            this.reel('closeDoor', doorSpeed, c[0] / c[2] + 4, c[1] / c[3], -5);

            this.bind('AnimationEnd', function() {
                if (this._initialized) {
                    if (
                        this._currentReelId === 'openDoor' ||
                        this._currentReelId === 'closeDoor'
                    ) {
                        Crafty.trigger(COMMANDEXECUTED);
                    }
                } else {
                    // animation finished, assume initialization ended
                    this._initialized = true;
                }
            });
            this.setter('open', function(v) {
                if (v) {
                    if (!this._open) {
                        this.animate('openDoor', 1);
                    } else {
                        if (this._initialized) {
                            Crafty.trigger(COMMANDEXECUTED);
                        } else {
                            this._initialized = true;
                        }
                    }
                } else {
                    if (this._open) {
                        this.animate('closeDoor', 1);
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
                    open: false,
                });
            }
        },
    });
    Crafty.c('Controller', {
        init: function() {
            var controllerSpeed = 500,
                c = this.__coord;
            this.requires('Tile, ControllerSprite, SpriteAnimation');
            this.reel(
                'disableController',
                controllerSpeed,
                c[0] / c[2],
                c[1] / c[3],
                4
            );
            this.reel(
                'enableController',
                controllerSpeed,
                c[0] / c[2] + 3,
                c[1] / c[3],
                -4
            );
            this.bind('AnimationEnd', function() {
                if (this._initialized) {
                    Crafty.trigger(COMMANDEXECUTED);
                } else {
                    // animation finished, assume initialization ended
                    this._initialized = true;
                }
            });
            this.setter('enabled', function(v) {
                if (v) {
                    if (!this._enabled) {
                        this.animate('disableController');
                    } else {
                        if (this._initialized) {
                            Crafty.trigger(COMMANDEXECUTED);
                        } else {
                            this._initialized = true;
                        }
                    }
                } else {
                    if (this._enabled) {
                        this.animate('enableController');
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
                    enabled: false,
                });
            }
        },
    });
    Crafty.c('Panel', {
        init: function() {
            this.requires('Tile, PanelSprite, Speaker, GridOffset');
            this._offset = {
                x: 6,
                y: -10,
            };
        },
    });
    Crafty.c('GridOffset', {
        init: function() {
            this.requires('2D');
            var attr = this.attr;
            this.attr = function(key, val) {
                var i;
                if (
                    arguments.length === 2 &&
                    Y.Object.hasKey(this._offset, key)
                ) {
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
                y: 0,
            };
        },
        _offset: null,
    });
    /**
     * TintSprite component. Should be included before the actual sprite.
     * Browser must support Canvas.
     *
     * Should extract that function in an external file.
     */
    var tmp_canvas = document.createElement('canvas');
    Crafty.c('TintSprite', {
        _color: 'rgba(255,255,255,1)',
        init: function() {
            this.requires('Sprite');
            this.bind('Draw', this.__tint).bind('RemoveComponent', function(e) {
                if (e === 'TintSprite') {
                    this.unbind('Draw', this.__tint);
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
            this._color =
                'rgba(' +
                col._red +
                ',' +
                col._green +
                ',' +
                col._blue +
                ',' +
                opacity +
                ')';
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
        },
    });
    Crafty.c('Light', {
        required: '2D, Canvas',
        init: function() {
            var l = Crafty.e('LightSource');
            l.attr({
                x: this._x + TILESIZE / 2,
                y: this._y + TILESIZE / 2,
            });
            this.attach(l);
        },
    });
    Crafty.createLayer('LightLayer', 'Canvas', { z: 50 });
    Crafty.c('LightSource', {
        required: '2D, Canvas',
        events: {
            Draw: '__draw_light',
        },
        radius: 40,
        _lights: [],
        tmp_canvas: document.createElement('canvas'),
        init: function() {
            // Crafty.createLayer('LightLayer', 'Canvas', { z: 3 });
            // this.z = 3;
            // this.w = 2 * this.radius;
            // this.h = 2 * this.radius;
            this._lights.push(this);
            this.ready = true;
        },
        /**
         *
         * @param {number} w
         * @param {number} h
         */
        __prepareLight: function(w, h) {
            this.tmp_canvas.width = w;
            this.tmp_canvas.height = h;
            /** @type {CanvasRenderingContext2D} */
            var ctx = this.tmp_canvas.getContext('2d');
            ctx.clearRect(0, 0, w, h);
            var r1 = this.radius - 20;
            var r2 = this.radius;
            var radGrd = ctx.createRadialGradient(0, 0, r1, 0, 0, r2);
            radGrd.addColorStop(0, 'rgba( 0, 0, 0,  1 )');
            radGrd.addColorStop(0.4, 'rgba( 0, 0, 0, .1 )');
            radGrd.addColorStop(1, 'rgba( 0, 0, 0,  0 )');
            ctx.fillStyle = radGrd;
            this._lights.forEach(function(l) {
                ctx.save();
                ctx.translate(l._x, l._y);
                ctx.fillRect(-r2, -r2, 2 * r2, 2 * r2);
                ctx.restore();
            });
            return this.tmp_canvas;
        },
        __draw_light: function(o) {
            /** @type {CanvasRenderingContext2D} */
            var ctx = o.ctx;
            var w = ctx.canvas.width;
            var h = ctx.canvas.height;

            // var p = this._parent;
            // if (p == null) {
            //     return;
            // }
            // var r1 = this.radius - 20;
            // var r2 = this.radius;
            this._mbr = {
                _x: 0,
                _y: 0,
                _w: w,
                _h: h,
            };
            var s = this.__prepareLight(w, h);
            ctx.save();
            ctx.globalCompositeOperation = 'destination-in';
            ctx.drawImage(s, 0, 0);
            // ctx.fillStyle = '#31302f';
            // ctx.fillRect(0, 0, w, h);
            // ctx.globalCompositeOperation = 'destination-in';
            // var radGrd = ctx.createRadialGradient(
            //     p._x,
            //     p._y,
            //     r1,
            //     p._x,
            //     p._y,
            //     r2
            // );
            // radGrd.addColorStop(0, 'rgba( 0, 0, 0,  1 )');
            // radGrd.addColorStop(0.4, 'rgba( 0, 0, 0, .1 )');
            // radGrd.addColorStop(1, 'rgba( 0, 0, 0,  0 )');
            // ctx.fillStyle = radGrd;
            // ctx.fillRect(p._x - r2, p._y - r2, 2 * r2, 2 * r2);
            ctx.restore();
        },
        remove: function() {
            var id = this._lights.indexOf(this);
            this._lights.splice(id, 1);
        },
    });
    Crafty.defaultShader(
        'Sprite',
        new Crafty.WebGLShader(
            'attribute vec2 aPosition;\n' +
                'attribute vec3 aOrientation;\n' +
                'attribute vec4 aColor;\n' +
                'attribute vec2 aLayer;\n' +
                'attribute vec2 aTextureCoord;\n' +
                '\n' +
                '\n' +
                'varying mediump vec3 vTextureCoord;\n' +
                'varying lowp vec4 vColor;\n' +
                '\n' +
                'uniform vec4 uViewport;\n' +
                'uniform mediump vec2 uTextureDimensions;\n' +
                '\n' +
                'mat4 viewportScale = mat4(2.0 / uViewport.z, 0, 0, 0,    0, -2.0 / uViewport.w, 0,0,    0, 0,1,0,    -1,+1,0,1);\n' +
                'vec4 viewportTranslation = vec4(uViewport.xy, 0, 0);\n' +
                '\n' +
                'void main() {\n' +
                '  vec2 pos = aPosition;\n' +
                '  vec2 entityOrigin = aOrientation.xy;\n' +
                '  mat2 entityRotationMatrix = mat2(cos(aOrientation.z), sin(aOrientation.z), -sin(aOrientation.z), cos(aOrientation.z));\n' +
                '  \n' +
                '  pos = entityRotationMatrix * (pos - entityOrigin) + entityOrigin ;\n' +
                '  gl_Position = viewportScale * (viewportTranslation + vec4(pos, 1.0/(1.0+exp(aLayer.x) ), 1) );\n' +
                '  vTextureCoord = vec3(aTextureCoord, aLayer.y);\n' +
                '  vColor = aColor;\n' +
                '}\n',
            'precision mediump float;\n' +
                'varying mediump vec3 vTextureCoord;\n' +
                'varying lowp vec4 vColor;\n' +
                '\n' +
                'uniform sampler2D uSampler;\n' +
                'uniform mediump vec2 uTextureDimensions;\n' +
                '\n' +
                'void main(void) {\n' +
                '  highp vec2 coord =   vTextureCoord.xy / uTextureDimensions;\n' +
                '  mediump vec4 base_color = texture2D(uSampler, coord); \n' +
                '  lowp vec4 tinted_color = vec4( base_color.r * (1.0 - vColor.a) + vColor.r * vColor.a, base_color.g * (1.0 - vColor.a) + vColor.g * vColor.a, base_color.b * (1.0 - vColor.a) + vColor.b * vColor.a, base_color.a);\n' +
                '  gl_FragColor = vec4(tinted_color.rgb*tinted_color.a*vTextureCoord.z, tinted_color.a*vTextureCoord.z);\n' +
                '}\n',
            [
                { name: 'aColor', width: 4 },
                { name: 'aPosition', width: 2 },
                { name: 'aOrientation', width: 3 },
                { name: 'aLayer', width: 2 },
                { name: 'aTextureCoord', width: 2 },
            ],
            function(e, _entity) {
                var co = e.co;
                // Write texture coordinates
                e.program.writeVector(
                    'aTextureCoord',
                    co.x,
                    co.y,
                    co.x,
                    co.y + co.h,
                    co.x + co.w,
                    co.y,
                    co.x + co.w,
                    co.y + co.h
                );
                if (_entity._color) {
                    var col = {};
                    Crafty.assignColor(_entity._color, col);
                    e.program.writeVector(
                        'aColor',
                        col._red / 255,
                        col._green / 255,
                        col._blue / 255,
                        col._strength
                    );
                }
            }
        )
    );
});
