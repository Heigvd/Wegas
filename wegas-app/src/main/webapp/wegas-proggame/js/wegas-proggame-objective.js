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
YUI.add('wegas-proggame-objective', function(Y) {

    /**
     *  @class Display the proggame objectives
     *  @name Y.Plugin.Objective
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    var Objective = Y.Base.create("wegas-proggame-objective", Y.Plugin.Base, [Y.Wegas.Plugin, Y.Wegas.Editable], {
        popupContent: null,
        initializer: function() {
            var fullObjective = this.get("fullObjective"),
                    globalObjective = this.get("globalObjective");
            this.afterHostEvent("render", function() {
                if (fullObjective && globalObjective) {
                    this.displayPopup(fullObjective);
                    this.displayFix(globalObjective);
                } else if (fullObjective && !globalObjective) {
                    this.displayPopup(fullObjective);
                    this.displayFix(fullObjective);
                } else if (!fullObjective && globalObjective) {
                    this.displayPopup(globalObjective);
                    this.displayFix(globalObjective);
                } else {
                    this.popupContent = "No objective to display";
                    this.displayFix(this.popupContent);

                }

                this.reDisplayPopup();
            });
        },
        displayPopup: function(content) {
            this.get("host").showMessage("info", content);
            this.popupContent = content;
        },
        displayFix: function(content) {
            var div = Y.one(".objective"), node;
            node = "<h1>Objectives</h1><div class='objValue'>" + content + "</div>";
            if (div) {
                div.get('childNodes').remove();
                div.append(node);
            }
        },
        reDisplayPopup: function() {
            Y.all(".objective").on('click', function(e) {
                this.displayPopup(this.popupContent);
            }, this);
        }
    }, {
        NS: "Objective",
        NAME: "Objective",
        ATTRS: {
            fullObjective: {
                type: "string",
                format: "html",
                _inputex: {
                    label: "Full objective"
                }
            },
            globalObjective: {
                type: "string",
                format: "html",
                _inputex: {
                    label: "Global objective"
                }
            }
        }
    });
    Y.Plugin.Objective = Objective;
});
