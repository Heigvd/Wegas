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
        BOUNDING_TEMPLATE: "<div><div class=\"chess-label-p2\"></div>"
                + "<div class=\"chess-status\">Loading</div>"
                + "<div class=\"chess-label-p1\"></div></div>",
        BOARDSIZE: 8,
        initializer: function() {
            this.board = [];
            for (var i = 0; i < this.BOARDSIZE; i++) {                    // Fill the board with empty arrays
                this.board.push([]);
            }
            this.side = 1;
        },
        renderUI: function() {
            var i, pieces = this.getPieces(),
                    bb = this.get("boundingBox"),
                    currentGame = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                    currentPlayers = currentGame.get("teams")[0].get("players"),
                    cPlayerId = Y.Wegas.app.get("currentPlayer");

            this.side = 0;
            if (currentPlayers[0].get("id") === cPlayerId) {
                this.side = 1;
            } else if (currentPlayers[1].get("id") === cPlayerId) {
                this.side = -1;
            }
            for (i = 0; i < pieces.length; i += 1) {
                this.renderPiece(pieces[i]);
            }
            bb.one(".chess-label-p1").setContent(currentPlayers[0].get("name"));
            bb.one(".chess-label-p2").setContent(currentPlayers[1].get("name"));

        },
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
                Y.Wegas.Facade.VariableDescriptor.sendRequest({
                    request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                    cfg: {
                        method: "POST",
                        data: {
                            "@class": "Script",
                            language: "JavaScript",
                            content: "move(\"" + this.currentTarget.cfg.name + "\", \"" + this.pos2string(e.target.cfg) + "\");"
                        }
                    }
                });
            }, ".chess-move", this);
        },
        syncUI: function() {
            Y.log("syncUI()", "info", "Wegas.ChessBoard");

            this.unselectCurrentPiece();

            var i, cNode, cb = this.get(CONTENTBOX),
                    bb = this.get("boundingBox"),
                    pieces = this.getPieces(),
                    treated = [],
                    allPiecesNodes = cb.all(".chess-piece"),
                    currentTurn = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "currentTurn").getInstance().get("value"),
                    statusNode = bb.one(".chess-status");

            cb.removeClass("chess-playing");
            if (currentTurn === 0) {
                statusNode.setContent("Waiting for a second player to join before starting game.");
            } else if (currentTurn !== this.side) {
                statusNode.setContent("Waiting for opponent's move");
            } else {
                statusNode.setContent("Your turn to play");
                cb.addClass("chess-playing");
            }
            for (i = 0; i < pieces.length; i += 1) {
                var cfg = pieces[i],
                        cNode = cb.one(".chess-piece-" + cfg.name + cfg.side);

                if (cNode) {                                                    // case 1: Piece has been moved
                    treated.push(cNode);
                    if (cfg.x !== cNode.cfg.x || cfg.x !== cNode.cfg.y) {

                        cNode.transition(Y.mix({
                            easing: 'ease-out',
                            duration: 0.75
                        }, this.formatPos(cfg)));

                        this.removePieceAt(cNode.cfg);
                        cNode.cfg = Y.mix(cfg, cNode.cfg);
                        this.board[cNode.cfg.x][cNode.cfg.y] = cNode.cfg;
                    }
                } else {                                                        // Case 2: Piece was added to the board (start game)
                    this.renderPiece(cfg);
                }
            }

            for (i = 0; i < allPiecesNodes.size(); i += 1) {                    // Case 3: Piece is not present anymore, we destroy it
                var item = allPiecesNodes.item(i);
                if (treated.indexOf(item) === -1) {
                    this.removePieceAt(item.cfg);
                    item.remove(true);
                }
            }
        },
        getPieces: function() {
            var i, j,
                    pieces = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "pieces"),
                    cPlayerPieces,
                    currentGame = Y.Wegas.Facade.Game.cache.getCurrentGame(),
                    currentPlayers = currentGame.get("teams")[0].get("players"),
                    side = 1,
                    ret = [];

            for (j = 0; j < 2; j += 1) {                                        // Only render pieces for the two first players, other are spectators
                cPlayerPieces = pieces.getInstance(currentPlayers[j].get("id")).get("properties");

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
        getPieceAt: function(cfg) {
            if (this.board[cfg.x]) {
                return this.board[cfg.x][cfg.y];
            }
            return null;
        },
        removePieceAt: function(cfg) {
            this.board[cfg.x][cfg.y] = null;
        },
        getAvailableMoves: function(cfg) {
            var i, j, moves = [], finalMoves = [],
                    genLine = function(dirs, length) {
                for (i = 0; i < dirs.length; i += 1) {
                    var d = dirs[i], occupant = null;
                    for (j = 1; j < length && !occupant; j += 1) {
                        var m = {
                            x: cfg.x + (j * d.x),
                            y: cfg.y + (j * d.y)
                        };
                        occupant = this.getPieceAt(m);
                        if (this.isValidMove(m)) {
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
                    moves = moves.concat(genLine.call(this, dirs, 8));
                    break;
                case "bishop":
                    var dirs = [{x: 1, y: 1}, {x: -1, y: 1}, {x: 1, y: -1}, {x: -1, y: -1}];
                    moves = moves.concat(genLine.call(this, dirs, 8));
                    break;
                case "king":
                    var dirs = [{x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 0, y: -1}];
                    moves = moves.concat(genLine.call(this, dirs, 2));
                    break;
                case "tower":
                    var dirs = [{x: 1, y: 0}, {x: 0, y: 1}, {x: -1, y: 0}, {x: 0, y: -1}];
                    moves = moves.concat(genLine.call(this, dirs, 8));
                    break;
                default:                                                        // Pawns
                    var factor = ((cfg.y === 1 && cfg.side === 1)
                            || (cfg.y === 6 && cfg.side === -1)) ? 3 : 2;       // When it's their 1st move, pawns can move by 2

                    moves = moves.concat(genLine.call(this, [{x: 0, y: cfg.side}], factor));
                    break;
            }

            for (i = 0; i < moves.length; i += 1) {                             // Finally, remove any move that is on an enemy
                var m = moves[i];                                               // or out of the board
                if (this.isValidMove(m)) {
                    finalMoves.push(m);
                }
            }
            return finalMoves;
        },
        isValidMove: function(cfg) {
            var occupant = this.getPieceAt(cfg);
            return (cfg.x >= 0 && cfg.x < 8
                    && cfg.y >= 0 && cfg.y < 8
                    && (!occupant || (occupant.side !== this.side && occupant.type !== "king")));
        },
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

            this.board[cfg.x][cfg.y] = cfg;
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