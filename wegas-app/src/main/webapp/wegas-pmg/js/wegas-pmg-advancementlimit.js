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
YUI.add('wegas-pmg-advancementlimit', function(Y) {
    "use strict";

    var Wegas = Y.Wegas,
        AdvancementLimit,
        CONTENTBOX = 'contentBox';

    /**
     *  @class Add column to datatable
     *  @name Y.Wegas.AdvancementLimit
     *  @extends Y.Widget
     *  @constructor
     */
    AdvancementLimit = Y.Base.create("wegas-pmg-advancementlimit", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        /** @lends Y.Widget.AdvancementLimit */

        initializer: function() {
            this.handlers = [];
        },
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        renderUI: function() {
            var cb = this.get(CONTENTBOX),
                periodPhase1 = Y.Wegas.Facade.Variable.cache.find("name", "periodPhase1").getValue(),
                periodPhase2 = Y.Wegas.Facade.Variable.cache.find("name", "periodPhase2").getValue(),
                periodPhase3 = Y.Wegas.Facade.Variable.cache.find("name", "executionPeriods").getValue(),
                periodPhase4 = Y.Wegas.Facade.Variable.cache.find("name", "periodPhase4").getValue();

            cb.append(this.phaseNode("Initiation", "initiation", periodPhase1));
            cb.append(this.phaseNode("Planning", "planning", periodPhase2));
            cb.append(this.phaseNode("Execution", "execution", periodPhase3));
            cb.append(this.phaseNode("Closing", "closing", periodPhase4));
        },
        valueBoxNode: function(period, phase) {
            var node = Y.Node.create("<div class='wegas-template-valuebox " + phase + "'></div>"),
                boxUnits = Y.Node.create("<div class='wegas-template-valuebox-units'></div>"),
                i;

            for (i = 1; i <= period; i += 1) {
                boxUnits.append("<div class='wegas-template-valuebox-unit'>" + i + "</div>");
            }
            node.append(boxUnits);
            return node;
        },
        phaseNode: function(phaseName, phaseClass, period) {
            var phaseNode = Y.Node.create("<div class='phase phase-" + phaseClass + "'></div>");
            phaseNode.append("<p>" + phaseName + " :</p>");
            phaseNode.append(this.valueBoxNode(period, "box-" + phaseClass));
            return phaseNode;
        },
        bindUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.delegate('click', this.valueBoxClick, '.wegas-template-valuebox-unit.clickable', this); // delagate sur clickable
            cb.delegate('hover', this.valueBoxHover, this.valueBoxOut, '.wegas-template-valuebox-unit.clickable', this);
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
        },
        syncUI: function() {
            var cb = this.get(CONTENTBOX),
                phaseLimit = Y.Wegas.Facade.Variable.cache.find("name", "phaseLimit").getValue(),
                periodLimit = Y.Wegas.Facade.Variable.cache.find("name", "periodLimit").getValue(),
                phaseNode, periodNode, maxPlayer = this.getMaxPlayerPhasePeriod(), i, ii, boxNodeList;

            // First remove all classes
            cb.all(".blockPosition").removeClass("blockPosition");
            cb.all(".playerAdvancement").removeClass("playerAdvancement");
            cb.all(".clickable").removeClass("clickable");
            cb.all(".currentPlayerState").removeClass("currentPlayerState");
            cb.all(".afterBlockPosition").removeClass("afterBlockPosition");

            if (Y.Wegas.Facade.Variable.cache.find("name", "advancementLimit").getValue()) {
                // Find box and add class blockPosition
                phaseNode = cb.get('childNodes').item(phaseLimit - 1);
                if (phaseNode) {
                    periodNode = phaseNode.one("div div").get('childNodes').item(periodLimit - 1);
                    if (periodNode) {
                        this.addBlockClass(periodNode, phaseNode);
                    }
                }

                // Find boxes and add class playerAdvancement, clickable
                for (i = 0; i < 4; i++) {
                    phaseNode = cb.get('childNodes').item(i);
                    boxNodeList = phaseNode.one("div div").get('childNodes');
                    if (i < maxPlayer.phase) {
                        if (i === maxPlayer.phase - 1) {
                            for (ii = 0; ii < maxPlayer.period; ii++) {
                                if (boxNodeList.item(ii)) {
                                    if (ii === maxPlayer.period - 1) {
                                        boxNodeList.item(ii)
                                            .addClass("currentPlayerState")
                                            .addClass("clickable");
                                    } else {
                                        boxNodeList.item(ii).addClass("playerAdvancement");
                                    }
                                }
                            }
                            for (ii = maxPlayer.period; ii < boxNodeList.size(); ii++) {
                                if (boxNodeList.item(ii)) {
                                    boxNodeList.item(ii).addClass("clickable");
                                }
                            }
                        } else {
                            boxNodeList.addClass("playerAdvancement");
                        }
                    } else {
                        boxNodeList.addClass("clickable");
                    }
                }
            }
        },
        valueBoxClick: function(e) {
            var script, phase = 0, phaseDiv = e.target.ancestor().ancestor().ancestor();

            while (phaseDiv !== null) {
                phase += 1;
                phaseDiv = phaseDiv.previous();
            }

            script = 'Variable.find(gameModel, "periodLimit").setValue(self, ' + parseInt(e.target.getHTML()) + ');';
            script += 'Variable.find(gameModel, "phaseLimit").setValue(self, ' + phase + ');';

            this.showOverlay();
            Y.Wegas.Facade.Variable.script.run(script, {on: {
                    success: Y.bind(function(e) {
                        this.hideOverlay();
                    }, this)
                }});
        },
        valueBoxHover: function(e) {
            if (Y.Wegas.Facade.Variable.cache.find("name", "advancementLimit").getValue()) {
                var cb = this.get(CONTENTBOX);
                cb.all(".blockPosition").removeClass("blockPosition");
                cb.all(".afterBlockPosition").removeClass("afterBlockPosition");

                var periodNode = e.target,
                    phaseNode = periodNode.ancestor().ancestor().ancestor();

                this.addBlockClass(periodNode, phaseNode);
            }
        },
        valueBoxOut: function(e) {
            this.syncUI();
        },
        addBlockClass: function(periodNode, phaseNode) {
            var boxNodeList;

            periodNode.addClass("blockPosition");
            periodNode = periodNode.next();
            while (periodNode !== null) {
                periodNode.addClass("afterBlockPosition");
                periodNode = periodNode.next();
            }
            phaseNode = phaseNode.next();
            while (phaseNode !== null) {
                boxNodeList = phaseNode.one("div div").get('childNodes');
                boxNodeList.addClass("afterBlockPosition");
                phaseNode = phaseNode.next();
            }
        },
        getMaxPlayerPhasePeriod: function() {
            var phaseInstList = Y.Wegas.Facade.Variable.cache.find("name", "currentPhase").get("scope").get("variableInstances"),
                currentPeriodList = Y.Wegas.Facade.Variable.cache.find("name", "currentPeriod"),
                key, playerPhaseVal, playerCurrentPeriodList, playerPeriodVal,
                max = {
                phase: 0,
                period: 0
            };

            for (key in phaseInstList) {
                playerPhaseVal = phaseInstList[key].get("value");
                max.phase = Math.max(max.phase, playerPhaseVal);
            }

            playerCurrentPeriodList = currentPeriodList.item(max.phase - 1).get("scope").get("variableInstances");
            for (key in playerCurrentPeriodList) {
                playerPeriodVal = playerCurrentPeriodList[key].get("value");
                max.period = Math.max(max.period, playerPeriodVal);
            }
            return max;
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            var i;
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        ATTRS: {
        },
        NS: "advancementLimit",
        NAME: "AdvancementLimit"
    });
    Y.Wegas.AdvancementLimit = AdvancementLimit;
});
