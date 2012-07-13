/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-console', function (Y) {
    var CONTENTBOX = 'contentBox',
        Console;

    Console = Y.Base.create("wegas-console", Y.Widget, [Y.WidgetChild,  Y.Wegas.Widget], {

        form: null,

        destroyer: function () {
        },

        renderUI: function () {
            var cb = this.get(CONTENTBOX),
                el = this.get("parent").get('toolbarNode');

            this.aceField = new Y.inputEx.AceField({
                parentEl: cb,
                typeInvite: 'Enter script here',
                rows: 7
            });
            cb.append('<div class="results"></div>');

            this.runButton = new Y.Button({
                label: "<span class=\"wegas-icon wegas-icon-play\"></span>Run script",
                on: {
                    click: Y.bind(function () {
                        Y.Wegas.app.dataSources.VariableDescriptor.rest.sendRequest({
                            request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                            cfg: {
                                method: "POST",
                                data: Y.JSON.stringify({
                                    "@class": "Script",
                                    language: "JavaScript",
                                    content: this.aceField.getValue()
                                })
                            },
                            callback: {
                                scope: this,
                                success: function(e) {
                                    cb.one(".results").prepend('<div class="result">Script exectuted. Returned value: '
                                        + e.response.results.entities[0] + "</div>");
                                },
                                failure: function(e) {
                                    cb.one(".results").prepend('<div class="result">Error executing script: '
                                        + e.response.results.message + "</div>");
                                }
                            }
                        });
                    }, this)
                }
            }).render(el);
        }
    });


    Y.namespace('Wegas').Console = Console;
});