/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-console', function (Y) {
    var CONTENTBOX = 'contentBox',
    Console;

    Console = Y.Base.create("wegas-console", Y.Widget, [Y.WidgetChild,  Y.Wegas.Widget], {

        form: null,

        destructor: function () {
        },

        renderUI: function () {
            this.plug( Y.Plugin.WidgetToolbar );

            var cb = this.get(CONTENTBOX);

            this.srcField = new Y.inputEx.AceField({
                parentEl: cb,
                typeInvite: 'Enter script here',
                rows: 7
            });
            cb.append('<div class="results"></div>');

            this.runButton();
        },

        executeScript: function (scriptEntity) {
            Y.Wegas.Facade.VariableDescriptor.sendRequest({
                request: "/Script/Run/" + Y.Wegas.app.get('currentPlayer'),
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify(scriptEntity)
                },
                on: {
                    success: Y.bind(function(e) {
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result">Script exectuted. Returned value: '
                            + e.response.results.entities[0] + "</div>");
                    }, this),
                    failure: Y.bind(function(e) {
                        this.get(CONTENTBOX).one(".results").prepend('<div class="result error">Error executing script: '
                            + e.response.results.message + "</div>");
                    }, this)
                }
            });

        },

        runButton: function (){
            var el = this.toolbar.get('header');

            this.runButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>Run script",
                on: {
                    click: Y.bind(function () {
                        this.executeScript({
                            "@class": "Script",
                            language: "JavaScript",
                            content: this.srcField.getValue()
                        });
                    }, this)
                }
            }).render(el);
        }
    });


    Y.namespace('Wegas').Console = Console;
});