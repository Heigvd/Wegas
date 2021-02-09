/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021  School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/* global I18n, YUI */

YUI.add('wegas-scripteval', function(Y) {
    "use strict";
    var ScriptEval,
        Wegas = Y.Wegas,
        Promise = Y.Promise,
        ScriptEval = Y.Base.create("ScriptEval", Y.Plugin.Base, [], {
            /**
             *
             */
            initializer: function() {
                this.context = undefined;
                this.publish("failure");
            },
            /**
             *  A localEval with server fallback.
             *
             *  @param script The script to evaluate
             *  @param cb A callback object, containing success, failure function or just a function as success callback.
             *     First parameter passed will be result
             */
            eval: function(script, cfg, player, contextId) {
                var result;
                if (cfg instanceof Function) { // Normalize callback argument
                    cfg = {
                        on: {
                            success: cfg
                        }
                    };
                }

                try {
                    result = this.localEval(script, player); // Try to do local eval
                } catch (error) { // And if there is an error
                    Y.log("Delegate script eval after localEval failure: " + JSON.stringify(script));
                    this.remoteEval(script, cfg, player, contextId); // Use server fallback
                    return; // and stop the method
                }

                if (cfg && cfg.on && cfg.on.success instanceof Function) {
                    cfg.on.success({//                                              // Make the result from the local eval look like a server response
                        response: {
                            entity: result
                        }
                    });
                }
            },
            /**
             *
             * @param {type} script
             * @param {type} cfg
             */
            remoteEval: function(script, cfg, player, contextId) {
                var playerId;
                if (player) {
                    playerId = player.get("id");
                }
                if (Y.Lang.isString(script)) { // Normalize script argument
                    script = {
                        "@class": "Script",
                        content: script
                    };
                }

                this.get("host").sendRequest(Y.mix(cfg || {}, {
                    request: "/Script/Run/" + (playerId || Wegas.Facade.Game.get('currentPlayerId')) + (contextId ? "/" + contextId : ""),
                    cfg: {
                        method: "POST",
                        data: script
                    }
                }));
            },
            /**
             * Serialize a function which can be eval(uated)
             * Global scope and closure are lost.
             * Native functions can't be serialized
             * @template Arguments
             * @template ReturnValue
             * @param {(...args:Arguments[]) => ReturnValue} fn function to serialize
             * @param {...Arguments} args additional arguments to pass to the function (serialized)
             * @returns {string} serialized function call
             */
            serializeFn: function(fn, args) {
                var boundaryMarker = '\u2029'; // Char which shouldn't be used...
                var serialArgs = JSON.stringify(
                    Array.prototype.slice.call(arguments, 1),
                    function(key, value) {
                        if (typeof value === 'function') {
                            return (
                                boundaryMarker +
                                value.toString() +
                                boundaryMarker
                                );
                        } else if (typeof value === 'string') {
                            // In case boundaryMarker is really used... escape it
                            return value.replace(
                                new RegExp(boundaryMarker, 'g'),
                                '\\u2029'
                                );
                        }
                        return value;
                    }
                ).replace(
                    // rewrite string function as function
                    new RegExp(
                        '"' + boundaryMarker + '(.*)' + boundaryMarker + '"',
                        'g'
                        ),
                    function(m, g1) {
                        return JSON.parse('"' + g1 + '"');
                    }
                );
                return '(' + fn.toString() + ').apply(null,' + serialArgs + ')';
            },
            /**
             * Serialize a function and executs it on the server.
             * Global scope and closure are lost.
             * Native functions can't be serialized.
             *
             * Server global variables are available in function's body
             * function can optionally take some arguments which are serialized along
             * @template Arguments
             * @template ReturnValue
             * @param {(...args:Arguments[]) => ReturnValue} fn function to execute on server
             * @param {...Arguments} _args additional arguments passed to the function
             * @returns {PromiseLike<ReturnValue>} server return value;
             */
            remoteFnEval: function(fn, _args) {
                if (typeof fn !== 'function') {
                    throw new TypeError('First argument must be a function');
                }
                var args = arguments;
                return new Promise(function(resolve, reject) {
                    this.remoteEval(
                        '[' + this.serializeFn.apply(this, args) + ']', // Wrap into an array to be sure to have if as first element
                        {
                            on: {
                                success: function(res) {
                                    resolve(res.response.entity);
                                },
                                failure: reject,
                            },
                        }
                    );
                }.bind(this));
            },
            /**
             * Sugar
             */
            run: function(script, cfg, player, contextId) {
                this.remoteEval(script, cfg, player, contextId);
            },
            /**
             * Tries to evaluate the script locally, using variables cache
             * @param {String} script The script to eval localy
             * @return {Any} value locally evaluated
             */
            localEval: function(script, player) {
                return W.Sandbox.eval(script, player);
            },
            /**
             * Check current gameModel's script for errors
             * @param {Function} callback
             * @param {Function} errorCallback callback on failure
             * @returns Request id
             */
            checkGameModel: function(callback, errorCallback) {
                return this.get("host").sendRequest({
                    request: "/Script/Test/",
                    cfg: {
                        method: "GET",
                        updateCache: false,
                        headers: {
                            "Managed-Mode": false
                        }
                    },
                    on: {
                        success: function(e) {
                            if (Y.Lang.isFunction(callback)) {
                                callback(e.serverResponse);
                            }
                        },
                        failure: function(e) {
                            if (Y.Lang.isFunction(errorCallback)) {
                                errorCallback(e.serverResponse);
                            }
                        }
                    }
                });
            }
        }, {
            NS: "script"
        });
    Y.Plugin.ScriptEval = ScriptEval;

    var sandbox = undefined;

    var interceptYUI = function(context, fn) {
        return function() {
            fn.apply(context, arguments);
            return sandbox.Y;
        };
    };

    var proxyGetSet = function(obj, allowedProps) {
        if (obj) {
            var o = {};
            o.set = function(name, value) {
                if (allowedProps.indexOf(name) >= 0) {
                    obj.set(name, value);
                }
                return o;

            };
            o.get = function(name) {
                if (allowedProps.indexOf(name) >= 0) {
                    return obj.get(name);
                }
            };
            return o;
        } else {
            return undefined;
        }
    };

    var bind = function(object, fnName) {
        return object[fnName].bind(object);
    };

    var filterProperties = function(object, properties, functions) {
        var o = {};
        // expose properties as-is
        for (var i in properties) {
            var name = properties[i];
            if (object.hasOwnProperty(name)) {
                o[name] = object[name];
            }
        }
        // bind functions
        for (var i in functions) {
            var name = functions[i];
            if (object[name] && object[name].bind) {
                o[name] = bind(object, name);
            }
        }
        return o;
    };

    var proxyNode = function(node) {
        if (node) {
            return {
                append: interceptNode(node, 'append'),
                prepend: interceptNode(node, 'prepend'),
                addClass: interceptNode(node, 'addClass'),
                removeClass: interceptNode(node, 'removeClass'),
                toggleClass: interceptNode(node, 'toggleClass'),
                setContent: interceptNode(node, 'setContent'),
                setHTML: interceptNode(node, 'setHTML'),
                setStyle: interceptNode(node, 'setStyle'),
                getHTML: bind(node, 'getHTML'),
                one: interceptNode(node, 'one'),
                all: function(selector) {
                    var list = Y.all(selector);
                    return {
                        each: function(fn) {
                            list.each(function(node) {
                                var child = proxyNode(node);
                                fn(child);
                            });
                        }
                    };
                }
            };
        }
    };

    var interceptNode = function(context, fnName) {
        var fn = context[fnName];

        return (function() {
            var result = fn.apply(context, arguments);
            return proxyNode(result);
        });
    };

    /**
     *
     * @param {type} allowedEvents list oof event to expose : {event:'name', attrs: ['expostFIeld1', '...'], functions:['functionToBind']}
     *
     * @returns {Function}
     */
    var interceptOnEvent = function(context, fn, allowedEvents) {
        var allowed = allowedEvents || [];
        return function(eventName, _callback, _ctx, _args) {
            var event = allowed.find(function(eObj) {
                return eObj.name === eventName;
            });
            if (event) {
                var args = [];
                if (arguments.length) {
                    args = Array.prototype.slice.call(arguments);
                }
                if (args[1]) {
                    // intercept callback
                    var oriCb = args[1];
                    args[1] = function(payload, _restargs) {
                        var args = [];
                        if (arguments.length) {
                            args = Array.prototype.slice.call(arguments);
                            // filter payload add expose only exposed attrs
                            args[0] = filterProperties(args[0], event.attrs, event.functions);

                            oriCb.apply(context, args);
                        } else {
                            oriCb.call(context);
                        }
                    };
                }

                var ret = fn.apply(context, args);

                return {
                    evt: filterProperties(ret.evt, ['id', 'type'], []),
                    sub: ret.sub
                };
            }
        };
    };

    var expose = function(sandbox, ns, key, obj) {
        var parent = sandbox.Y.namespace(ns);
        if (parent[key]) {
            Y.mix(parent[key], obj);
        } else {
            parent[key] = obj;
        }

    };

    // array of {ns, key, object}
    var registration = [];


    var registerExpose = function(ns, key, obj) {
        registration.push({
            ns: ns,
            key: key,
            object: obj
        });
    };

    var initSandbox = function() {
        var iframe = document.createElement('iframe');
        // This is used to prevent unwanted modification from scripts.
        // One can still access main window from the sandbox (window.top) and modify it from there.
        iframe.style.display = 'none';
        iframe.setAttribute('sandbox', 'allow-same-origin');
        document.body.appendChild(iframe);
        var sandbox = iframe.contentWindow;


        //sandbox.exposeInY = function(ns, key, obj) {
        //    Y.namespace(ns)[key] = obj;
        //};

        // Whitelist some Y functions and objects
        sandbox.Y = {
            //////////////////////////////////////////////////////////////////
            // DO NOT EXPOSE as those function give access to DOM (prevent html injection)
            all: undefined, // Setting to undefined is useless but this explicitly shows that this is the intended behaviour.
            one: undefined,

            //////////////////////////////////////////////////////////////////
            // Basic safe functionalities
            mix: bind(Y, "mix"), // safe, returns first arg, do not take callback
            clone: bind(Y, "clone"), // safe, returns clone of arg and arg fucntion not leaks data
            bind: bind(Y, "bind"), // safe
            each: interceptYUI(Y, Y.each), // safe after intercepting returned value
            log: interceptYUI(Y, Y.log), // safe after intercepting returned value

            //////////////////////////////////////////////////////////////////
            // Event registration is not allowed on Y
            // -> reason1: returned value give acess to Y (evt.context)
            // -> reason2: impossible to filter payload sent to callbacks in a safe way
            //
            on: undefined,
            once: undefined,
            onceAfter: undefined,
            before: undefined,
            after: undefined,

            /////////////////////////////////////////////////////////////////7
            //Y.use: intercept callback and replace returned value
            // intercept Y.use callback
            use: function() {
                if (arguments.length) {
                    var args = Array.prototype.slice.call(arguments);
                    var i = args.length - 1;

                    if (i >= 0) {
                        // is last arg a callback ?
                        if (args[i] instanceof Function) {
                            // so intercept it
                            var cb = args[i];
                            args[i] = function(_Y, status) {
                                // and call it with sandboxed Y
                                cb(sandbox.Y, status);
                            };
                        }
                    }
                    Y.use.apply(Y, args);
                }
                return sandbox.Y;
            },
            Array: Y.Array, //safe
            Object: Y.Object, //safe

            ////////////////////////////////////////////////////////////////////////////
            // expose selecte Wegas features
            Wegas: {
                // Persistence is safe
                persistence: Y.Wegas.persistence, // safe
                // Ability to display some messages
                Alerts: {
                    showMessage: bind(Y.Wegas.Alerts, "showMessage"), // safe
                    showNotification: bind(Y.Wegas.Alerts, "showNotification") // safe
                },
                Config: Y.Wegas.Config, // safe
                Facade: {
                    Game: {
                        cache: {
                            getCurrentGame: bind(Y.Wegas.Facade.Game.cache, "getCurrentGame"), // safe
                            getCurrentTeam: bind(Y.Wegas.Facade.Game.cache, "getCurrentTeam"), // safe
                            getCurrentPlayer: bind(Y.Wegas.Facade.Game.cache, "getCurrentPlayer") // safe
                        }
                    },
                    GameModel: {
                        cache: {
                            getCurrentGameModel: bind(Y.Wegas.Facade.GameModel.cache, "getCurrentGameModel") // safe
                        }
                    },
                    Variable: {
                        on: interceptOnEvent(//Finalize and test
                            Y.Wegas.Facade.Variable,
                            Y.Wegas.Facade.Variable.on,
                            [{
                                    name: 'WegasOutOfBoundException',
                                    attrs: [
                                        'min',
                                        'max',
                                        'value',
                                        'variableName',
                                        'localizedMessage',
                                        'message'
                                    ],
                                    functions: [
                                        'halt',
                                        'stopImmediatePropagation',
                                        'stopPropagation'
                                    ]
                                }]),
                        cache: {
                            // one cache find variables and their parent
                            find: bind(Y.Wegas.Facade.Variable.cache, "find"), // safe
                            findParentDescriptor: bind(Y.Wegas.Facade.Variable.cache, "findParentDescriptor") // safe
                        },
                        script: {
                            // Calling remote script from client scripts is usually a bad practive, but it's safe
                            removeEval: bind(Y.Wegas.Facade.Variable.script, "remoteEval"),
                            run: bind(Y.Wegas.Facade.Variable.script, "run")
                        }
                    }
                },
                //
                I18n: I18n, // safe
                Helper: {
                    getTranslationAttr: bind(Y.Wegas.Helper, "getTranslationAttr"), // safe
                    stripHtml: bind(Y.Wegas.Helper, "stripHtml") // safe
                },
                PageLoader: {// get/set pageId only
                    find: function(name) {
                        return proxyGetSet(Y.Wegas.PageLoader.find(name), ["pageId"]);
                    }
                },
                Parent: {
                    // allowed to modifiy widget buttons
                    EDITMENU: Y.Wegas.Parent.EDITMENU //safe
                },
                RForm: {
                    Script: {
                        // allowed to register custom getter/setter
                        register: bind(Y.Wegas.RForm.Script, "register") // sage
                    }
                },
            },
            // resolve sandbox.Y namespace
            namespace: function(ns) {
                var nss = ns.split(".");
                var current = sandbox.Y;
                for (var i in nss) {
                    var n = nss[i];
                    current[n] = current[n] || {};
                    current = current[n];
                }
                return current;
            }
        };

        // VariableDescriptor is alias for Variable
        sandbox.Y.Wegas.Facade.VariableDescriptor = sandbox.Y.Wegas.Facade.Variable;

        // It's useless, but it's safe if global Y is intercepted
        sandbox.YUI = {
            add: function(name, cb, version, config) {
                YUI.add(name, function(_Y, name) {
                    cb(sandbox.Y, name);
                }, version, config);
            }
        };
        sandbox.I18n = sandbox.Y.Wegas.I18n; // alias
        sandbox.PageLoader = sandbox.Y.Wegas.PageLoader; // alias

        sandbox.gameModel = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel;

        // Mock ServerScript Variable Facade: Safe
        sandbox.Variable = {
            find: function(gameModel, name) {
                return Y.Wegas.Facade.Variable.cache.find("name", (Y.Lang.isString(gameModel)) ? gameModel : name);
            }
        };
        sandbox.VariableDescriptorFacade = sandbox.Variable;  //alias


        /////////////////////////////////////////////////////////////////////
        // hide sensitive functionalities
        // client script shall not send custom requests ever
        sandbox.XMLHttpRequest = undefined;
        sandbox.fetch = undefined;
        // client script is not allowed to create element a this may give access to brand new
        // window object and, this, bypass restrictions defined here
        sandbox.document.createElement = undefined;
        // we also want to remove sandbox.windows and sandbox.top
        // but these are readonly proprtes. This, such properties are hidden by sandbox.eval arguments

        for (var i in registration) {
            var entry = registration[i];
            expose(sandbox, entry.ns, entry.key, entry.object);
        }

        //////////////////////////////////////////////////////////////////////
        // MICRO TEAMPLATE
        // template often make use of client script helper
        //////////////////////////////////////////////////////////////////////
        var newRevive = function(precompiled) {
            return function(data) {
                data || (data = {});
                return precompiled.call(data, sandbox.Y, Y.Escape.html, data);
            };
        };
        Y.Template.Micro.revive = newRevive.bind(Y.Template.Micro);

        var newCompile = function(text, options) {
            /*jshint evil:true */

            var blocks = [],
                tokenClose = "\uffff",
                tokenOpen = "\ufffe",
                source;

            options = Y.merge(Y.Template.Micro.options, options);

            // Parse the input text into a string of JavaScript code, with placeholders
            // for code blocks. Text outside of code blocks will be escaped for safe
            // usage within a double-quoted string literal.
            //
            // $b is a blank string, used to avoid creating lots of string objects.
            //
            // $v is a function that returns the supplied value if the value is truthy
            // or the number 0, or returns an empty string if the value is falsy and not
            // 0.
            //
            // $t is the template string.
            source = "var $b='', $v=function (v){return v || v === 0 ? v : $b;}, $t='" +
                // U+FFFE and U+FFFF are guaranteed to represent non-characters, so no
                // valid UTF-8 string should ever contain them. That means we can freely
                // strip them out of the input text (just to be safe) and then use them
                // for our own nefarious purposes as token placeholders!
                //
                // See http://en.wikipedia.org/wiki/Mapping_of_Unicode_characters#Noncharacters
                text.replace(/\ufffe|\uffff/g, '')

                .replace(options.rawOutput, function(match, code) {
                    return tokenOpen + (blocks.push("'+\n$v(" + code + ")+\n'") - 1) + tokenClose;
                })

                .replace(options.escapedOutput, function(match, code) {
                    return tokenOpen + (blocks.push("'+\n$e($v(" + code + "))+\n'") - 1) + tokenClose;
                })

                .replace(options.code, function(match, code) {
                    return tokenOpen + (blocks.push("';\n" + code + "\n$t+='") - 1) + tokenClose;
                })

                .replace(options.stringEscape, function(match) {
                    return options.stringReplace[match] || '';
                })

                // Replace the token placeholders with code.
                .replace(/\ufffe(\d+)\uffff/g, function(match, index) {
                    return blocks[parseInt(index, 10)];
                })

                // Remove noop string concatenations that have been left behind.
                .replace(/\n\$t\+='';\n/g, '\n') +
                "';\nreturn $t;";

            // If compile() was called from precompile(), return precompiled source.
            if (options.precompile) {
                return "function (Y, $e, data) {\n" + source + "\n}";
            }

            // Otherwise, return an executable function.
            return this.revive(new sandbox.Function('Y', '$e', 'data', source));
        };
        Y.Template.Micro.compile = newCompile.bind(Y.Template.Micro);

        return sandbox;
    };

    var sandboxContext = {
        globalThis: undefined,
        window: undefined,
        top: undefined,
    };
    var ctxKeys = Y.Object.keys(sandboxContext);
    var ctxValues = Y.Object.values(sandboxContext);

    var populateSandbox = function(player) {
        sandbox.self = player;
    };

    var sandboxEval = function(script, player, noReturnValue) {
        if (!sandbox) {
            sandbox = initSandbox();
        }
        var p = player || Y.Wegas.Facade.Game.cache.getCurrentPlayer();
        populateSandbox(p);

        if (Y.Lang.isObject(script) && script.content) { // Normalize script argument
            script = script.content;
        }
        if (!noReturnValue) {
            if (Y.Lang.isFunction(script)) {
                script = "return (" + script.toString() + "())";
            } else if (script.indexOf("return") === -1) {
// AST, nope ?
                script = "return " + script;
            }
        }
        /*jslint evil: true */
        return (new sandbox.Function(ctxKeys, "\"use strict\";undefined;" + script)).apply(undefined, ctxValues);
    };

    window.W = {
        Sandbox: {
            eval: sandboxEval,
            // one may expose hardcoded helpers to sandbox
            // BE CAREFUL !!!!!
            exposeInY: function(ns, key, obj) {
                if (sandbox) {
                    // case 1: sandbox already initialized
                    expose(sandbox, ns, key, obj);
                } else {
                    // case2: sandbox not yet initialized
                    // delay register exposure and let initSandbox do it
                    registerExpose(ns, key, obj);
                }
            },
            proxyNode: proxyNode
        }
    };
});
