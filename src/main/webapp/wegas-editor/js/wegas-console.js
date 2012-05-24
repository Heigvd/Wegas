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
            that = this;

            this.form = new Y.inputEx.Form({
                parentEl: cb._node,
                fields: [
                {
                    name: '@class',
                    type: 'hidden',
                    value: "Script"
                }, {
                    name: 'language',
                    type: 'hidden',
                    value: "JavaScript"
                }, {
                    name: 'content',
                    type: 'ace',
                    typeInvite: 'Enter script here',
                    rows: 7
                }],
                buttons: [{
                    type: 'submit',
                    value: 'Run',
                    onClick: {
                        scope: this,
                        fn: function () {
                            Y.Wegas.app.dataSources.VariableDescriptor.rest.sendRequest({
                                request: "/Script/Run/Player/" + Y.Wegas.app.get('currentPlayer'),
                                cfg: {
                                    method: "POST",
                                    data: Y.JSON.stringify(this.form.getValue())
                                },
                                callback: {
                                    scope: this,
                                    success: function(e) {
                                        that.get(CONTENTBOX).one(".results").prepend('<div class="result">Script exectuted. Returned value: '
                                            + e.response.results.entities[0] + "</div>");
                                    },
                                    failure: function(e) {
                                        that.get(CONTENTBOX).one(".results").prepend('<div class="result">Error executing script: '
                                            + e.response.results.message + "</div>");
                                    }
                                }
                            });
                            return false;																		// stop clickEvent, to prevent form submitting
                        }
                    }
                }]
            });

            cb.append('<div class="results"></div>');
        }
    });


    Y.namespace('Wegas').Console = Console;
});