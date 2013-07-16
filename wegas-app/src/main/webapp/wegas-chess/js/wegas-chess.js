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
YUI.add("wegas-chess", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", ChessBoard;

    ChessBoard = Y.Base.create("wegas-chessboard", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
        BOUNDING_TEMPLATE: "<div>"
                + "<div class=\"chess-label-p2\"></div>"
                + "<div class=\"chess-status\">Loading</div>"
                + "<div class=\"chess-label-p1\"></div></div>",
        BOARDSIZE: 8,
        /**
         *
         */
        initializer: function() {
            this.side = 0;
        },
        /**
         *
         */
        bindUI: function() {
            var cb = this.get(CONTENTBOX),
                    bb = this.get("boundingBox");

            this.updateHandler = Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this);

            bb.delegate("click", function(e) {                                  // Piece selection: display available move for selected
                if (e.target === this.currentTarget) {                          // Unselect piece if we click for a second time on it
                    this.unselectCurrentPiece();
                    return;
                }
                this.unselectCurrentPiece();
                this.currentTarget = e.target;

                e.target.addClass("chess-piece-selected");
                var i, moves = this.getAvailableMoves(e.target.cfg);

                for (i = 0; i < moves.length; i += 1) {
                    var cNode = Y.Node.create("<div class=\"chess-move\"></div>");
                    cNode.setStyles(this.formatPos(moves[i]));
                    cNode.cfg = moves[i];
                    cb.appendChild(cNode);
                }
            }, ".chess-playing .chess-piece-playable", this);

            cb.delegate("click", function(e) {                                  // Move selection: move selected piece to target position

                var colidee = this.getPieceAt(e.target.cfg),
                        script = "move(\"" + this.currentTarget.cfg.name + "\", \"" + this.pos2string(e.target.cfg) + "\");";

                if (colidee) {                                                  // If there is a clolidee
                    script += "destroy(\"" + colidee.name + "\");";             // destroy it
                }

                Y.Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                    cfg: {
                        method: "POST",
                        data: {
                            "@class": "Script",
                            language: "JavaScript",
                            content: script
                        }
                    }
                });
            }, ".chess-move", this);
        },
        /**
         *
         */
        syncUI: function() {
            Y.log("syncUI()", "info", "Wegas.ChessBoard");

            this.unselectCurrentPiece();

            var i, cNode, cb = this.get(CONTENTBOX),
                    bb = this.get("boundingBox"),
                    pieces = this.getPieces(),
                    treated = [],
                    allPiecesNodes = cb.all(".chess-piece"),
                    currentTurn = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "currentTurn").getInstance().get("value"),
                    statusNode = bb.one(".chess-status"),
                    currentGame = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                    players = currentGame.get("teams")[0].get("players"),
                    cPlayerId = Y.Wegas.app.get("currentPlayer");

            this.side = 0;                                                      // Determine which side
            if (players[0].get("id") === cPlayerId) {
                this.side = 1;
            } else if (players[1].get("id") === cPlayerId) {
                this.side = -1;
            }

            cb.removeClass("chess-playing");
            if (currentTurn === 0) {
                statusNode.setContent("Waiting for a second player to join before starting game. You will need to refresh page to start game.");
                return;
            } else if (currentTurn !== this.side) {
                statusNode.setContent("Waiting for opponent's move");
            } else {
                statusNode.setContent("Your turn to play");
                cb.addClass("chess-playing");
            }

            bb.one(".chess-label-p1").setContent(players[0].get("name"));
            bb.one(".chess-label-p2").setContent(players[1].get("name"));

            for (i = 0; i < pieces.length; i += 1) {
                var cfg = pieces[i],
                        cNode = cb.one(".chess-piece-" + cfg.name + cfg.side);

                if (cNode) {                                                    // case 1: Piece has been moved
                    treated.push(cNode);
                    if (cfg.x !== cNode.cfg.x || cfg.y !== cNode.cfg.y) {
                        cNode.transition(Y.mix({
                            easing: 'ease-out',
                            duration: 0.75
                        }, this.formatPos(cfg)));

                        cNode.cfg = Y.mix(cfg, cNode.cfg);
                    }
                } else {                                                        // Case 2: Piece was added to the board (start game)
                    this.renderPiece(cfg);
                }
            }

            for (i = 0; i < allPiecesNodes.size(); i += 1) {                    // Case 3: Piece is not present anymore, we destroy it
                var item = allPiecesNodes.item(i);
                if (treated.indexOf(item) === -1) {
                    item.remove(true);
                }
            }
        },
        destructor: function() {
            this.updateHandler.detach();
        },
        /**
         *
         */
        getPieces: function() {
            var i, j,
                    pieces = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "pieces"),
                    cPlayerPieces,
                    currentGame = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                    players = currentGame.get("teams")[0].get("players"),
                    side = 1,
                    ret = [];

            if (players.length < 2) {
                return [];
            }

            for (j = 0; j < 2; j += 1) {                                        // Only render pieces for the two first players, other are spectators
                cPlayerPieces = pieces.getInstance(players[j].get("id")).get("properties");

                for (i in cPlayerPieces) {
                    var cfg = Y.mix(this.string2pos(cPlayerPieces[i]), {
                        side: side,
                        name: i,
                        type: this.name2type(i)
                    });
                    ret.push(cfg);
                }
                side = -1;
            }
            return ret;
        },
        /**
         *
         */
        getPieceAt: function(pos) {
            return Y.Array.find(this.getPieces(), function(item) {
                return item.x === pos.x && item.y === pos.y;
            });
        },
        /**
         *
         */
        getAvailableMoves: function(cfg) {
            var i, j, moves = [], finalMoves = [],
                    genLine = function(dirs, length) {
                for (i = 0; i < dirs.length; i += 1) {
                    var d = dirs[i], collidee = null;
                    for (j = 1; j < length && !collidee; j += 1) {
                        var m = {
                            x: cfg.x + (j * d.x),
                            y: cfg.y + (j * d.y)
                        };
                        collidee = this.getPieceAt(m);
                        if (this.isValidMove(m, cfg)) {
                            moves.push(m);
                        }
                    }
                }
                return moves;
            };

            switch (cfg.type) {
                case "horse":
                    moves.push({x: cfg.x + 1, y: cfg.y + 2});
                    moves.push({x: cfg.x - 1, y: cfg.y + 2});
                    moves.push({x: cfg.x + 1, y: cfg.y - 2});
                    moves.push({x: cfg.x - 1, y: cfg.y - 2});
                    moves.push({x: cfg.x + 2, y: cfg.y + 1});
                    moves.push({x: cfg.x - 2, y: cfg.y + 1});
                    moves.push({x: cfg.x + 2, y: cfg.y - 1});
                    moves.push({x: cfg.x - 2, y: cfg.y - 1});
                    break;

                case "queen":
                    var dirs = [{x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 0, y: -1},
                        {x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
                    moves = genLine.call(this, dirs, 8);
                    break;

                case "bishop":
                    var dirs = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
                    moves = genLine.call(this, dirs, 8);
                    break;

                case "king":
                    var dirs = [{x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 0, y: -1},
                        {x: 1, y: 1}, {x: 1, y: -1}, {x: -1, y: 1}, {x: -1, y: -1}];
                    moves = genLine.call(this, dirs, 2);
                    break;

                case "tower":
                    var dirs = [{x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 0, y: -1}];
                    moves = genLine.call(this, dirs, 8);
                    break;

                case "pawn":                                                    // Pawns
                    var i, factor = ((cfg.y === 1 && cfg.side === 1)
                            || (cfg.y === 6 && cfg.side === -1)) ? 3 : 2; // When it's their 1st move, pawns can move by 2,

                    moves = genLine.call(this, [{x: 0, y: cfg.side}], factor);

                    for (i = 0; i < 2; i += 1) {                                // Pawn eat on til up, left and right
                        var factor = (i === 0) ? 1 : -1,
                                m = {
                            x: cfg.x + factor,
                            y: cfg.y + this.side
                        };
                        if (this.getPieceAt(m)) {
                            moves.push(m);
                        }
                        //colidee = this.getPieceAt({                           // Pawn also eat "En passant"
                        //    x: cfg.x + factor,
                        //    y: cfg.y
                        //});
                        //if (colidee && colidee.side !== this.side) {
                        //    m.enPassant = true;
                        //    moves.push(m);
                        //}
                    }
                    break;

                default:
                    Y.log("Unknow piece type", "error", "Wegas.ChessBoard");
                    break
            }

            for (i = 0; i < moves.length; i += 1) {                             // Finally, remove any move that is on an enemy
                var m = moves[i];                                               // or out of the board
                if (this.isValidMove(m, cfg)) {
                    finalMoves.push(m);
                }
            }
            return finalMoves;
        },
        /**
         *
         */
        isValidMove: function(pos, cfg) {
            var collidee = this.getPieceAt(pos);
            return (pos.x >= 0 && pos.x < 8
                    && pos.y >= 0 && pos.y < 8
                    && (!collidee ||
                    (collidee.side !== this.side
                            && collidee.type !== "king"
                            && (cfg.type !== "pawn" || pos.x !== cfg.x)
                            )));
        },
        /**
         *
         */
        renderPiece: function(cfg) {
            var cNode, cb = this.get(CONTENTBOX);

            cNode = Y.Node.create("<div class=\"chess-piece "
                    + "chess-piece-" + cfg.name + cfg.side                      // Piece unique identifier
                    + ((cfg.side === this.side) ? " chess-piece-playable " : "")// wether it's playable or not
                    + " chess-side" + cfg.side
                    + " chess-" + cfg.type + "\"></div>");                      // piece type

            cNode.setStyles(this.formatPos(cfg));
            cNode.cfg = cfg;
            cb.appendChild(cNode);
        },
        unselectCurrentPiece: function() {
            var cb = this.get(CONTENTBOX);
            this.currentTarget = null;
            cb.all(".chess-piece-selected").removeClass("chess-piece-selected");
            cb.all(".chess-move").remove(true);
        },
        formatPos: function(vec) {
            var WIDTH = 552,
                    CASEWIDTH = WIDTH / 8;
            return {
                top: (WIDTH - ((vec.y + 1) * CASEWIDTH)) + "px",
                left: (vec.x * CASEWIDTH) + "px",
                width: CASEWIDTH,
                height: CASEWIDTH
            };
        },
        /**
         *
         * @param {String} a sting position like a8, b2, etc.
         * @returns {Object} a pos object of type {x: 0, y:0}
         */
        string2pos: function(str) {
            var poses = ["a", "b", "c", "d", "e", "f", "g", "h"];
            return {x: poses.indexOf(str.substr(0, 1).toLowerCase()), y: +str.substr(1) - 1};
        },
        pos2string: function(cfg) {
            var poses = ["a", "b", "c", "d", "e", "f", "g", "h"];
            return poses[cfg.x] + (cfg.y + 1);
        },
        name2type: function(str) {
            return str.replace(/[0-9]/g, "");
        }
    });

    Y.namespace("Wegas").ChessBoard = ChessBoard;
});