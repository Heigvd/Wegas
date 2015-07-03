/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
/*global YUI*/
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
                nbPeriods = [],
                i, name,
                defaultNames = Y.Wegas.PMGHelper.defaultPhaseNames;

            nbPeriods.push(Y.Wegas.Facade.Variable.cache.find("name", "periodPhase1").getMaxValue());
            nbPeriods.push(Y.Wegas.Facade.Variable.cache.find("name", "periodPhase2").getMaxValue());
            nbPeriods.push(Y.Wegas.Facade.Variable.cache.find("name", "executionPeriods").getValue());
            nbPeriods.push(Y.Wegas.Facade.Variable.cache.find("name", "periodPhase4").getMaxValue());

            for (i = 1; i < 5; i += 1) {
                name = Y.Wegas.Facade.Variable.cache.find("name", "phase" + i + "Name");
                name = (name ? name.getValue() : defaultNames[i-1]);
                cb.append(this.phaseNode(name, nbPeriods[i - 1], i));
            }
        },
        valueBoxNode: function(period, phaseNumber) {
            var node = Y.Node.create("<div class='wegas-template-valuebox box-phase" + phaseNumber + "'></div>"),
                boxUnits = Y.Node.create("<div class='wegas-template-valuebox-units'></div>"),
                i;

            for (i = 1; i <= period; i += 1) {
                boxUnits.append("<div class='wegas-template-valuebox-unit'>" + i + "</div>");
                if (phaseNumber === 3 && i === period) {
                    boxUnits.append("<div class='wegas-template-valuebox-unit'>...</div>");
                }
            }
            node.append(boxUnits);
            return node;
        },
        phaseNode: function(phaseName, nbPeriod, phaseNumber) {
            var node = Y.Node.create("<div class='phase'></div>");
            node.append("<p>" + phaseName + "</p>");
            node.append(this.valueBoxNode(nbPeriod, phaseNumber));
            return node;
        },
        bindUI: function() {
            var cb = this.get(CONTENTBOX);
            cb.delegate('click', this.valueBoxClick, '.wegas-template-valuebox-unit.clickable', this); // delagate sur clickable
            cb.delegate('hover', this.valueBoxHover, this.valueBoxOut, '.wegas-template-valuebox-unit.clickable', this);
            this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
        },
        isEnabled: function() {
            var advLimitDesc = Y.Wegas.Facade.Variable.cache.find("name", "advancementLimit");
            return (advLimitDesc === undefined || advLimitDesc.getValue());
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

            if (this.isEnabled()) {
                // Find box and add class blockPosition
                phaseNode = cb.get('childNodes').item(phaseLimit - 1);
                if (phaseNode) {
                    if (periodLimit > phaseNode.one("div div").get('childNodes').size()) {
                        periodLimit = phaseNode.one("div div").get('childNodes').size();
                    }
                    periodNode = phaseNode.one("div div").get('childNodes').item(periodLimit - 1);
                    if (periodNode) {
                        this.addBlockClass(periodNode, phaseNode);
                    }
                }

                // Find boxes and add class playerAdvancement, clickable
                for (i = 0; i < 4; i += 1) {
                    phaseNode = cb.get('childNodes').item(i);
                    boxNodeList = phaseNode.one("div div").get('childNodes');
                    if (i < maxPlayer.phase) {
                        if (i === maxPlayer.phase - 1) {
                            for (ii = 0; ii < maxPlayer.period; ii += 1) {
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
                            for (ii = maxPlayer.period; ii < boxNodeList.size(); ii += 1) {
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
            var script, phase = 0, phaseDiv = e.target.ancestor().ancestor().ancestor(),
                val;

            while (phaseDiv !== null) {
                phase += 1;
                phaseDiv = phaseDiv.previous();
            }

            if (e.target.getHTML() === "...") {
                val = Y.Wegas.Facade.Variable.cache.find("name", "executionPeriods").getValue() + 1;
            } else {
                val = parseInt(e.target.getHTML(), 10);
            }

            script = 'Variable.find(gameModel, "periodLimit").setValue(self, ' + val + ');';
            script += 'Variable.find(gameModel, "phaseLimit").setValue(self, ' + phase + ');';

            this.showOverlay();
            Y.Wegas.Facade.Variable.script.run(script, {on: {
                    success: Y.bind(function(e) {
                        this.hideOverlay();
                    }, this)
                }});
        },
        valueBoxHover: function(e) {
            if (this.isEnabled()) {
                var cb = this.get(CONTENTBOX),
                    periodNode, phaseNode;
                cb.all(".blockPosition").removeClass("blockPosition");
                cb.all(".afterBlockPosition").removeClass("afterBlockPosition");

                periodNode = e.target;
                phaseNode = periodNode.ancestor().ancestor().ancestor();

                this.addBlockClass(periodNode, phaseNode);
            }
        },
        valueBoxOut: function(e) {
            this.syncUI();
        },
        addBlockClass: function(periodNode, phaseNode) {
            periodNode.addClass("blockPosition");
            periodNode = periodNode.next();
            while (periodNode !== null) {
                periodNode.addClass("afterBlockPosition");
                periodNode = periodNode.next();
            }
            phaseNode = phaseNode.next();
            while (phaseNode !== null) {
                phaseNode.one("div div").get('childNodes').addClass("afterBlockPosition");
                phaseNode = phaseNode.next();
            }
        },
        getMaxPlayerPhasePeriod: function() {
            var phaseInstList = Y.Wegas.Facade.Variable.cache.find("name", "currentPhase").get("scope").get("variableInstances"),
                currentPeriodList = Y.Wegas.Facade.Variable.cache.find("name", "currentPeriod"),
                key, playerCurrentPeriodList,
                max = {
                    phase: 0,
                    period: 0
                };

            for (key in phaseInstList) {
                if (phaseInstList.hasOwnProperty(key)) {
                    max.phase = Math.max(max.phase, phaseInstList[key].get("value"));
                }
            }

            playerCurrentPeriodList = currentPeriodList.item(max.phase - 1).get("scope").get("variableInstances");
            for (key in playerCurrentPeriodList) {
                if (playerCurrentPeriodList.hasOwnProperty(key)) {
                    max.period = Math.max(max.period, playerCurrentPeriodList[key].get("value"));
                }
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
