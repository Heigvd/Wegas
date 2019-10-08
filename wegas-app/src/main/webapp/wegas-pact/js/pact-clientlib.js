(function() {
    'use strict';
    var l = document.createElement('link');
    l.setAttribute(
        'href',
        'https://fonts.googleapis.com/css?family=Electrolize'
    );
    l.setAttribute('rel', 'stylesheet');
    document.head.append(l);
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
            label: "PactStats",
            children: [{
                type: "PageLoader",
                pageLoaderId: "properties",
                defaultPageId: 8 // Numéro de page 
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
    if (Y.config.Wegas.mode === 'PLAY') {
        Y.use('wegas-inbox', function() {
            var OldMessageDisplay = Y.Wegas.MessageDisplay;
            Y.Wegas.MessageDisplay = Y.Base.create(
                'wegas-message',
                OldMessageDisplay,
                [],
                {
                    initializer: function() {
                        var message = this.getMessage();
                        if (message.get('token')) {
                            Y.Wegas.Facade.Variable.script.remoteFnEval(
                                function(unread, token) {
                                    Log.post(
                                        Log.statement(
                                            unread ? 'initialized' : 'resumed',
                                            'theory',
                                            token
                                        )
                                    );
                                },
                                message.get('unread'),
                                message.get('token')
                            );
                        }
                    },
                    destructor: function() {
                        var message = this.getMessage();
                        if (message.get('token')) {
                            Y.Wegas.Facade.Variable.script.remoteFnEval(
                                function(token) {
                                    Log.post(
                                        Log.statement(
                                            'suspended',
                                            'theory',
                                            token
                                        )
                                    );
                                },
                                message.get('token')
                            );
                        }
                    },
                }
            );
        });
    }
})();
