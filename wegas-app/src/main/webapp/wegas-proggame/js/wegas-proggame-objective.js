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
        initializer: function() {
            this.afterHostEvent("render", function() {

                var fullObjective = this.get("fullObjective"),
                        globalObjective = this.get("globalObjective");

                if (fullObjective && !globalObjective) {
                    globalObjective = fullObjective;
                } else if (!fullObjective && globalObjective) {
                    fullObjective = globalObjective;
                }

                this.displayPopup(fullObjective);
                this.displayFix(globalObjective);

                this.objectivesHandler = Y.all(".objective").on('click', function(e) { // When summary is clicked,
                    this.displayPopup(this.popupContent);                       // redisplay the popup
                }, this);
            });
        },
        displayPopup: function(content) {
            this.get("host").showMessage("info", content);
            this.popupContent = content;
        },
        displayFix: function(content) {
            Y.all(".objective").empty().append("<h1>OBJECTIVES</h1><div class='objValue'>" +
                    (content || "No objectives to display")
                    + "</div>");
        },
        destructor: function() {
            this.objectivesHandler.detach();
        }
    }, {
        NS: "Objective",
        NAME: "Objective",
        ATTRS: {
            fullObjective: {
                type: "string",
                format: "html",
                optional: true,
                _inputex: {
                    label: "Full objective"
                }
            },
            globalObjective: {
                type: "string",
                format: "html",
                optional: true,
                _inputex: {
                    label: "Short objective"
                }
            }
        }
    });
    Y.Plugin.Objective = Objective;

});
