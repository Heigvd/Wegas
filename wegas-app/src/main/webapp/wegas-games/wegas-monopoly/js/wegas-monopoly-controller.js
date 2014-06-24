/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
YUI.add('wegas-monopoly-controller', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, MonopolyController;

    /**
     *  @class Monopoly controller
     *  @name Y.Plugin.MonopolyController
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    MonopolyController = Y.Base.create("wegas-monopoly-controller", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.MonopolyController */

        /**
         * @function
         * @private
         */
        initializer: function() {
            this.afterHostEvent("render", function() {
                this.dice = this.get("host").item(0);
                this.diceAfter();

                this.buy = this.get("host").item(1);
                this.boxValue = Wegas.Facade.VariableDescriptor.cache.find("name", "boxValue").getAttrs().items;
                this.buyProperty();

                this.display = this.get("host").item(5);
                this.display.checkState();

                this.restart = this.get("host").item(3);
                this.checkRestart();
                this.clickRestart();

                this.next = this.get("host").item(2);
                this.clickNext();
            });
        },
        diceAfter: function() {
            this.dice.after("diceRolling", function() {
                this.dice.rollButton.disable();
            }, this);
            this.dice.after("diceRolled", this.setPion, this);
        },
        setPion: function(e) {
            this.display.setPion(e.target.result);
            this.display.setState("afterRoll");
        },
        clickNext: function() {
            var turn = Wegas.Facade.VariableDescriptor.cache.find("name", "turnOf"),
                player;
            this.next.on("click", function() {
                if (turn.get("scope") instanceof Wegas.persistence.GameModelScope) { //@fixme when gameScope works
                    player = Wegas.Facade.Game.cache.getCurrentGame().get("teams");
                    this.nextPlayer("teams", turn, player);
                } else if (turn.get("scope") instanceof Wegas.persistence.TeamScope) {
                    this.nextPlayer("players", turn, player);
                    player = Wegas.Facade.Game.cache.getCurrentTeam().get("players");
                }
            }, this);
        },
        nextPlayer: function(scope, turn, player) {
            var i;
            for (i = 0; i < player.length; i++) {
                if (turn.get("scope").getInstance().get("value") == Wegas.Facade.Game.cache.getCurrentGame().get(scope)[i].get("id")) {
                    i++
                    if (i == player.length) {
                        this.display.setCurrentPlayer(Wegas.Facade.Game.cache.getCurrentGame().get(scope)[0].get("id"));
                    } else {
                        this.display.setCurrentPlayer(Wegas.Facade.Game.cache.getCurrentGame().get(scope)[i].get("id"));
                    }
                }
            }
            this.display.setState("wait");
        },
        checkRestart: function() {
            this.restartValue = Wegas.Facade.VariableDescriptor.cache.find("name", "restart").getInstance().get("value");
            if (this.restartValue == "true") {
                Y.one('.game .yui3-togglebutton').addClass('yui3-button-selected');
            } else {
                Y.one('.game .yui3-togglebutton').removeClass('yui3-button-selected');
            }
        },
        clickRestart: function(e) {
            this.restart.on("click", function() {
                // check if all player have true TODO

                // change restart status
                if (this.restartValue == "true") {
                    this.restartValue = "false";
                } else {
                    this.restartValue = "true";
                }
                Wegas.Facade.VariableDescriptor.script.run("restart.value =" + this.restartValue + ";");
            })
        },
        buyProperty: function() {
            this.buy.on("click", function() {
                var position, money;
                position = Wegas.Facade.VariableDescriptor.cache.find("name", "position").getInstance().get("value");
                position--;
                // check if property is free
                if (this.boxValue[position].getInstance().get("properties").playerId != "" ||
                    this.boxValue[position].getInstance().get("properties").playerId == "notBuyable") {
                    alert("this property is not buyable");
                    return;
                }
                // check if have enough money
                money = Wegas.Facade.VariableDescriptor.cache.find("name", "money").getInstance().get("value");
                if (this.boxValue[position].getInstance().get("properties").value <= money) {
                    this.setMoney(money - this.boxValue[position].getInstance().get("properties").value);
                    // add property
                    this.boxValue[position].getInstance().get("properties").playerId = Wegas.Facade.Game.get('currentPlayerId');
                    Wegas.Facade.VariableDescriptor.sendRequest({
                        request: "/" + this.boxValue[position].getInstance().get("descriptorId") + "/VariableInstance/" + this.boxValue[position].getInstance().get("id"),
                        cfg: {
                            method: "PUT",
                            data: this.boxValue[position].getInstance().toJSON()
                        },
                        on: {
                            success: Y.bind(function(e) {
                                this.display.checkPropertyBuyable();
                            }, this)
                        }
                    });
                } else {
                    alert("You have not enought money");
                }
            }, this);

        },
        setMoney: function(value) {
            Wegas.Facade.VariableDescriptor.script.run("money.value =" + value + ";");
        }

    }, {
        NS: "MonopolyController",
        NAME: "MonopolyController"
    });
    Y.Plugin.MonopolyController = MonopolyController;

});
