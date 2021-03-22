(function() {
    'use strict';
    var SEQUENCE_OBJECT = 'sequence',
        l = document.createElement('link');
    l.setAttribute(
        'href',
        'https://fonts.googleapis.com/css?family=Electrolize'
    );
    l.setAttribute('rel', 'stylesheet');
    document.head.append(l);
    
    // If navigator is MS-Edge, check that it's Chromium, otherwise a nasty stack overflow will happen in PACT.
    var browser = (function (agent) {
        switch (true) {
            case agent.indexOf("edge") > -1: return "old-edge";
            case agent.indexOf("edg") > -1: return "edge";
            case agent.indexOf("opr") > -1 && !!window.opr: return "opera";
            case agent.indexOf("chrome") > -1 && !!window.chrome: return "chrome";
            case agent.indexOf("trident") > -1: return "ie";
            case agent.indexOf("firefox") > -1: return "firefox";
            case agent.indexOf("safari") > -1: return "safari";
            default: return "other";
        }
    })(window.navigator.userAgent.toLowerCase());
    Y.log('Navigator: ' + browser);
    if (browser === "old-edge") {
        alert("You are using an OLD version of the Edge browser,\nwhich is NOT compatible with this game.\n \nPlease download the latest version of Edge from\nwww.microsoft.com/edge \n \nYou may also switch to Firefox or Chrome.");
        alert("Vous utilisez une VIEILLE version du navigateur Edge,\nqui n'est PAS compatible avec ce jeu.\n \nVeuillez télécharger la dernière version de Edge sur\nwww.microsoft.com/edge \n \nVous pouvez aussi passer à Firefox ou Chrome.");
    }
    
    /**
     * @param {(...args:unknown[])=>void} fn
     * @param {number} wait
     */
    function debounce(fn, wait) {
        /** @type {number | undefined} */
        var timeout;
        if (typeof fn !== 'function') {
            throw Error('first argument must be a function');
        }
        function debounced() {
            var ctx = this,
                args = arguments;
            function invoke() {
                timeout = undefined;
                fn.apply(ctx, args);
            }
            clearTimeout(timeout);
            timeout = setTimeout(invoke, wait);
        }
        debounced.cancel = function() {
            clearTimeout(timeout);
        };
        return debounced;
    }
    Y.namespace('Wegas.Config').Dashboards = {
        overview: 'WegasDashboard.getOverview();',
    };

    var varLabel = function(name) {
        return Y.Wegas.Facade.Variable.cache.find('name', name).getEditorLabel();
    };

    // NB: This is a server-side function !
    // Enable entering game levels as 1.1 and convert them to internal representation, i.e. 11.
    var adjustLevel = function(val) {
        if (val >= 1.1 && val <= 99.9) {
            return val * 10;
        } else {
            ErrorManager.throwWarn('Une valeur entre 1.1 et 99.9 est attendue.');
        }
    };

    Y.namespace('Wegas.Config').CustomImpacts = function() {
        return [
            [
                'Modifier une variable de jeu',
                'var adjustLevel=' +
                    adjustLevel +
                    ';' +
                    'Variable.find(gameModel, "levelLimit").setValue(self, adjustLevel(${"type":"number", "view": {"label":"' +
                    varLabel('levelLimit') +
                    '", "description":"Entrer une valeur numérique entre 1.1 et 99.9 (écran final)"}}));',
            ],
        ];
    };

    Y.namespace("Wegas.Config").ExtraTabs = [
        {
            label: "Stats de base",
            targetMode: "host",
            children: [{
                type: "PactStats"
            }]
        }
    ];

    app.once('render', function() {
        /* global Y */
        if (Y.config.Wegas.mode === 'EDIT') {
            Y.use('wegas-react-form', function() {
                Y.Wegas.RForm.Script.register('getter', {
                    'Action.changeLevel': {
                        label: '[ProgGame] change Level',
                        arguments: [
                            {
                                type: 'string',
                                view: {
                                    type: 'pageselect',
                                },
                            },
                        ],
                    },
                });
            });
        }
        if (Y.config.Wegas.mode === 'PLAY') {
            // Focus blur xapi
            var blured = false;
            var blur = debounce(function() {
                blured = true;
                Y.Wegas.Facade.Variable.script.remoteFnEval(function() {
                    Log.post(Log.statement('suspended', 'proggame'));
                });
            }, 3000);
            window.addEventListener('focus', function() {
                if (blured) {
                    blured = false;
                    Y.Wegas.Facade.Variable.script.remoteFnEval(function() {
                        Log.post(Log.statement('resumed', 'proggame'));
                    });
                } else {
                    blur.cancel();
                }
            });
            window.addEventListener('blur', blur);
            window.addEventListener('beforeunload', function() {
                Y.Wegas.Facade.Variable.script.remoteFnEval(function() {
                    Log.post(Log.statement('suspended', 'proggame'));
                });
                app.destroy(); // Allow destructor to do their thing (Log)
            });
            Y.Wegas.Facade.Variable.script.remoteFnEval(function() {
                Log.post(Log.statement('resumed', 'proggame'));
            });
        }
    });
    // @TODO remove EDIT in production
    if (Y.config.Wegas.mode === 'PLAY' || Y.config.Wegas.mode === 'EDIT') {
        Y.use('wegas-inbox', function() {
            var OldMessageDisplay = Y.Wegas.MessageDisplay;
            Y.Wegas.MessageDisplay = Y.Base.create(
                'wegas-message',
                OldMessageDisplay,
                [],
                {
                    initializer: function() {
                        var message = this.getMessage(),
                            topic = message.get('token') || I18n.t(message.get("subject")).replace(/\s/g,"") || "TheoryWithoutTitle";
                        if (topic) {
                            Y.Wegas.Facade.Variable.script.remoteFnEval(
                                function(unread, topic) {
                                    Log.post(
                                        Log.statement( unread ? 'initialized' : 'resumed', 'theory', topic)
                                    );
                                },
                                message.get('unread'),
                                topic
                            );
                            Y.Wegas.ProgGameLevel.prototype.addToSequence({
                                type: "THEORY-RESUMED",
                                topic: topic
                            });
                        }
                    },
                    destructor: function() {
                        var message = this.getMessage(),
                            topic = message.get('token') || I18n.t(message.get("subject")).replace(/\s/g,"") || "TheoryWithoutTitle";
                        if (topic) {
                            Y.Wegas.Facade.Variable.script.remoteFnEval(
                                function(topic) {
                                    Log.post( Log.statement( 'suspended', 'theory', topic));
                                },
                                topic
                            );
                            Y.Wegas.ProgGameLevel.prototype.addToSequence({
                                type: "THEORY-SUSPENDED",
                                topic: topic
                            });
                        }
                    },
                }
            );
        });
    }
})();
