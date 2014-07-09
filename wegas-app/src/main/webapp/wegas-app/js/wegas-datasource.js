/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-datasource', function(Y) {
    "use strict";

    var HOST = "host", ID = "id", POST = "POST", PUT = "PUT", ITEMS = "items",
        Lang = Y.Lang, Wegas = Y.Wegas, DataSource = Y.DataSource, Plugin = Y.Plugin,
        WegasCache, VariableDescriptorCache, GameModelCache, GameCache, PageCache;

    /**
     * @name Y.Wegas.DataSource
     * @extends Y.DataSource.IO
     * @class Custom implementation of a datasource,
     * @constructor
     */
    Wegas.DataSource = Y.Base.create("datasource", DataSource.IO, [], {
        /** @lends Y.Wegas.DataSource# */
        /**
         * @function
         * @private
         */
        initializer: function() {
            this.after("sourceChange", this.sendInitialRequest);                // When the source changes, resend inital request
        },
        /**
         * @function
         * @private
         */
        sendInitialRequest: function(cfg) {
            if (!Y.Lang.isUndefined(this.get("initialRequest"))) {               // Use this condition to allow empty strings (e.g. ")
                return this.sendRequest(Y.mix(cfg || {}, {
                    request: this.get("initialRequest"),
                    cfg: {
                        initialRequest: true
                    }
                }));
            } else if (!Y.Lang.isUndefined(this.get("initialFullRequest"))) {
                return this.sendRequest(Y.mix(cfg || {}, {
                    cfg: {
                        fullUri: Y.Wegas.app.get("base") + this.get("initialFullRequest"),
                        initialRequest: true
                    }
                }));
            }
        },
        hasInitialRequest: function() {
            return !Y.Lang.isUndefined(this.get("initialRequest")) || !Y.Lang.isUndefined(this.get("initialFullRequest"));
        },
        /**
         * Server requests methods
         *
         * @function
         */
        sendRequest: function(request) {
            request.cfg = request.cfg || {};
            request.cfg.headers = request.cfg.headers || {};
            request.on = request.on || {};
            request.on.failure = request.on.failure || Y.bind(this.fire, this, "failure");
            Y.mix(request.cfg.headers, {
                'Content-Type': 'application/json;charset=ISO-8859-1',
                'Managed-Mode': 'true'
            });
            if (Lang.isObject(request.cfg.data)) {                              // Stringify data if required
                request.cfg.data = Y.JSON.stringify(request.cfg.data);
            }
            return Wegas.DataSource.superclass.sendRequest.call(this, request);
        },
        /**
         * @hack
         */
        get: function(name) {
            var val = Wegas.DataSource.superclass.get.apply(this, arguments);
            if (Y.Lang.isUndefined(val) && this.cache) {
                return this.cache.get(name);
            } else {
                return val;
            }
        },
        /*
         * @hack Allow  hack on yui apis
         */
        _defRequestFn: function(e) {
            var uri = this.get("source"),
                io = this.get("io"),
                defIOConfig = this.get("ioConfig"),
                request = e.request,
                cfg = Y.merge(defIOConfig, e.cfg, {
                    on: Y.merge(defIOConfig, {
                        success: this.successHandler,
                        failure: this.failureHandler
                    }),
                    context: this,
                    "arguments": e
                });

            // Support for POST transactions
            if (Lang.isString(cfg.fullUri)) {
                uri = cfg.fullUri;
            } else if (Lang.isString(request)) {
                //if(cfg.method && (cfg.method.toUpperCase() === POST)) {
                //    cfg.data = cfg.data ? cfg.data+request : request;
                //}
                //else {
                uri += request;
                //}
            }
            DataSource.Local.transactions[e.tId] = io(uri, cfg);
            return e.tId;
        },
        /*
         * @hack Override so plugin host accepts string definition of classes and
         * look it up in the Y.Wegas.* package.
         */
        plug: function(Plugin, config) {
            if (!Lang.isArray(Plugin)) {
                if (Plugin && !Lang.isFunction(Plugin)) {
                    config = Plugin.cfg;
                    Plugin = Plugin.fn;
                }
                if (Plugin && !Lang.isFunction(Plugin)) {                       // @hacked
                    Plugin = Y.Plugin[Plugin];
                }
            }
            Wegas.DataSource.superclass.plug.call(this, Plugin, config);
        }
    }, {
        /** @lends Y.Wegas.DataSource */
        /**
         * @field
         * @static
         */
        ATTRS: {
            initialRequest: {},
            initialFullRequest: {}
        },
        abort: function(tId) {
            if (DataSource.Local.transactions[tId]) {
                DataSource.Local.transactions[tId].abort();
                DataSource.Local.transactions[tId] = null;                      // @hack Remove reference since YUI won't do it
            }
        }
    });
    /**
     *  @name Y.Plugin.WegasCache
     *  @class Plugin that add cache management for entites from wegas server.
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    WegasCache = Y.Base.create("WegasCache", Plugin.Base, [], {
        /** @lends Y.Plugin.WegasCache# */
        /**
         * @function
         * @private
         */
        initializer: function() {
            var host = this.get(HOST);
            host.data = [];

            this.publish("EntityUpdatedEvent", {
                broadcast: true,
                bubbles: false
            });
            this.doBefore("_defDataFn", this._beforeDefDataFn);                 // When the host receives some data, we parse the result
        },
        _beforeDefDataFn: function(e) {
            var response, data = e.data && (e.data.responseText || e.data),
                host = this.get(HOST),
                payload = e.details[0];

            response = {
                results: Y.JSON.parse(data),
                meta: {}
            };
            response.data = host.data;                                          // Provides with a pointer to the datasource current content
            payload.response = response;
            Y.log("Response received: " + host.get('source')/* + e.cfg.request*/, "log", "Wegas.DataSource");

            Wegas.Editable.use(payload.response.results, // Lookup dependencies
                Y.bind(function(payload) {

                    if (payload.cfg.initialRequest) {
                        this.clear(false);
                    }

                    payload.serverResponse = Wegas.Editable.revive(payload.response.results); // Revive
                    if (payload.serverResponse.get
                        && payload.serverResponse.get("entities")
                        && payload.serverResponse.get("entities").length > 0) {
                        payload.response.entity = payload.serverResponse.get("entities")[0];// Shortcut, useful if there is only one instance
                        payload.response.entities = payload.serverResponse.get("entities");
                    }
                    if (payload.cfg.updateCache !== false) {
                        this.onResponseRevived(payload);
                    }
                    host.fire("response", payload);
                }, this, payload));

            return new Y.Do.Halt("DataSourceJSONSchema plugin halted _defDataFn");
        },
        /**
         * Server requests methods
         *
         * @function
         */
        sendRequest: function(request) {
            //Y.log("sendRequest is depreacted, use host.sendrequest instead", "warn");
            return this.get(HOST).sendRequest(request);
        },
        /**
         * @function
         * @private
         */
        onResponseRevived: function(e) {
            var i, entity, evtPayload, response = e.serverResponse;

            this.updated = false;
            if (e.error) {                                                      // If there was an server error, do not update the cache
                return;
            }
            if (Lang.isArray(response)) {              // Non-managed response: we apply the operation for each object in the returned array
                for (i = 0; i < response.length; i += 1) {
                    this.updated = this.updateCache(e.cfg.method, response[i], !e.cfg.initialRequest) || this.updated;
                }
            } else {
                if (response.get("entities")) {
                    for (i = 0; i < response.get("entities").length; i += 1) {   // Update the cache with the Entites in the reply body
                        entity = response.get("entities")[i];
                        if (Lang.isObject(entity)) {
                            this.updated = this.updateCache(e.cfg.method, entity, !e.cfg.initialRequest) || this.updated;
                        }
                    }
                }

                for (i = 0; i < response.get("events").length; i += 1) {
                    evtPayload = Y.mix({
                        serverEvent: response.get("events")[i]
                    }, e);
                    this.fire(evtPayload.serverEvent.get("@class"), evtPayload);
                    //this.fire("serverEvent", evtPayload);
                }
            }
            if (e.cfg.updateEvent !== false && this.updated) {
                this.get(HOST).fire("update", e);
                this.updated = false;
            }
        },
        /**
         *  @function
         *  @private
         *  @param {String} method Possible values for method are: POST, PUT, DELETE, default being PUT.
         *  @param {page} entity The entity to update in the cache
         *  @return {Boolean} `true` if object could be located and method applied
         */
        updateCache: function(method, entity, updateEvent) {
            //Y.log("updateCache(" + method + ", " + entity + ")", "log", "Y.Wegas.WegasCache");
            switch (method) {
                case "DELETE":
                    if (this.find(ID, entity, function(entity, needle, index, stack) {
                        stack.splice(index, 1);
                        return true;
                    })) {
                        return true;
                    }
                    break;
                default:
                    if (this.find(ID, entity, Y.bind(function(entity, needle) {
                        entity.setAttrs(needle.getAttrs());
                        if (this.oldIds) {
                            var newEntity = Y.Array.find(entity.get("items"), function(i) {
                                return Y.Array.indexOf(this.oldIds, i.get("id")) < 0;
                            }, this);
                            this.get(HOST).fire("added", {
                                entity: newEntity
                            });
                            this.oldIds = null;
                        }
                        return true;
                    }, this))) {
                        return true;
                    }
                    break;
            }
            this.addToCache(entity, updateEvent);                                            // In case we still have not found anything
            return true;
        },
        /**
         * @function
         * @private
         */
        addToCache: function(entity, updateEvent) {
            this.getCache().push(entity);
            if (updateEvent) {
                this.get(HOST).fire("added", {
                    entity: entity
                });
            }
        },
        /// *** Cache methods *** //
        /**
         * Retrieves all entities stored in the cache.
         * @function
         * @private
         */
        getCache: function() {
            return this.get(HOST).data;
        },
        /**
         * @function
         * @private
         */
        clear: function(sendUpdateEvent) {
            var i, cache = this.getCache();
            for (i = 0; i < cache.length; i = i + 1) {
                cache[i].destroy();
            }
            cache.length = 0;
            if (sendUpdateEvent) {
                this.get(HOST).fire("update");
            }
        },
        /**
         *
         */
        findAll: function(key, needle) {
            if (!key) {
                return this.getCache();
            } else {
                // Y.log("doFind(" + needle + ")", 'log', 'Y.Wegas.WegasCache');
                var ret = [],
                    doFind = function(stack) {
                        return Y.Array.find(stack, function(item, index, array) {
                            if (this.testEntity(item, key, needle)) {                   // We check the current element if it's a match
                                ret.push(item);
                            }
                            this.walkEntity(item, doFind);
                            return false;
                        }, this);
                    };
                doFind.call(this, this.getCache());
                return ret;
            }
        },
        /**
         * Retrieves an entity from the cache
         *
         * @function
         * @private
         */
        find: function(key, val, onFindFn) {
            return this.doFind(key, val, onFindFn, this.getCache());
        },
        /**
         * Retrieves an entity from the cache
         * @function
         * @private
         */
        findById: function(id) {
            return this.find(ID, id * 1);                                    // Cast to number
        },
        /**
         * Retrives a server event with a key
         * @param String key
         * @param event || list<event> val
         * @returns a list of events
         */
        findEvent: function(key, val) {
            val = val.response.results.events || val;

            return Y.Array.map(Y.Array.each(val, function(i) {
                return i.get("val.type") === key;
            }), function(i) {
                return i.get("val.payload");
            });
        },
        /**
         *
         *  Recuresivly walk the provided stack, looking for an object with an
         *  id corresponing to needle's and apply an operation based method.
         *
         *  @function
         *  @private
         *  @param {String} method Possible values for method are: POST, PUT, DELETE, default being PUT.
         *  @param {page} The entity to update in the cache
         *  @return {Boolean} `true` if object could be located and method applied
         */
        doFind: function(key, needle, onFindFn) {
            // Y.log("doFind(" + needle + ")", 'log', 'Y.Wegas.WegasCache');
            var ret, doFind = function(stack) {
                return Y.Array.find(stack, function(item, index, array) {
                    if (this.testEntity(item, key, needle)) {                   // We check the current element if it's a match
                        ret = item;
                        if (onFindFn) {
                            onFindFn(item, needle, index, array);
                        }
                        return item;
                    }
                    return this.walkEntity(item, doFind);
                }, this);
            };
            doFind.call(this, this.getCache());
            return ret;
        },
        /**
         * This method is used to walke down an entity hierarchy, can be overriden
         * by childrn to extend look capacities. Used in Y.Wegas.GameModelCache
         * and Y.Wegas.VariableDescriptorCache
         * @function
         * @private
         */
        walkEntity: function(entity, callback) {
            //Y.log("walkEntity(" + entity + ")", 'log', 'Y.Wegas.WegasCache');
            return false;
        },
        /**
         * @function
         * @private
         */
        testEntity: function(entity, key, needle) {
            return this.get("testFn")(entity, key, needle);
        },
        /**
         * @function
         * @private
         */
        generateRequest: function(data) {
            return "/" + data.id;
        },
        /**
         * @function
         * @private
         */
        post: function(data, parent, callback) {
            var request = (parent) ? "/" + parent.get(ID) + "/" + data["@class"] : "/";

            this.sendRequest({
                request: request,
                cfg: {
                    method: POST,
                    data: data
                },
                on: callback
            });
        },
        /**
         * @function
         * @private
         */
        getObject: function(data, cfg) {
            this.sendRequest(this.generateRequest(data), cfg);
        },
        getWithView: function(entity, view, cfg) {
            cfg.request = this.generateRequest(entity.toObject()) + "?view=" + (view || "Editor");
            cfg.cfg = {
                updateCache: false
            };
            return this.sendRequest(cfg);
        },
        /**
         *
         * @function
         * @private
         * @param {type} data
         * @param {type} cfg
         * @returns {undefined}
         */
        put: function(data, cfg) {
            this.sendRequest(Y.mix({
                request: this.generateRequest(data),
                cfg: {
                    method: PUT,
                    data: data
                }
            }, cfg));
        },
        /**
         *
         * @function
         * @private
         * @param {type} entity
         * @param {type} cfg
         * @returns {undefined}
         */
        duplicateObject: function(entity, cfg) {
            this.sendRequest(Y.mix({
                request: this.generateRequest(entity.toObject()) + "/Duplicate/",
                cfg: {
                    method: POST
                }
            }, cfg));
        },
        /**
         *
         * @function
         * @private
         * @param {type} entity
         * @param {type} cfg
         * @returns {undefined}
         */
        deleteObject: function(entity, cfg) {
            this.sendRequest(Y.mix({
                request: this.generateRequest(entity.toObject()),
                cfg: {
                    method: "DELETE"
                }
            }, cfg));
        },
        /**
         * @function
         * @private
         */
        clone: function(id, parentData, callbacks) {
            var entity = this.findById(id).clone();
            this.post(entity, parentData, callbacks);
        }

    }, {
        NS: "cache",
        NAME: "WEGASCACHE",
        /** @lends Y.Plugin.WegasCache */
        ATTRS: {
            testFn: {
                value: function(entity, key, needle) {
                    var value = (entity.get) ? entity.get(key) : entity[key], // Normalize item and needle values
                        needleValue = (needle && needle.get) ? needle.get(key) : (Y.Lang.isObject(needle)) ? needle[key] : needle;

                    return value === needleValue &&
                        (!needle._classes || entity instanceof needle._classes[0]);
                }
            }
        }
    });
    Plugin.WegasCache = WegasCache;

    /**
     *  @name Y.Plugin.VariableDescriptorWegasCache
     *  @class adds management of entities of type Y.Wegas.persistence.VariableDescriptor
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    VariableDescriptorCache = function() {
        VariableDescriptorCache.superclass.constructor.apply(this, arguments);
    };
    Y.mix(VariableDescriptorCache, {
        NS: "cache",
        NAME: "VariableDescriptorCache"
    });
    Y.extend(VariableDescriptorCache, WegasCache, {
        /** @lends Y.Plugin.VariableDescriptorCache# */

        /**
         * @function
         * @private
         */
        initializer: function() {
            /**
             * Server event, triggered through the managed-mode response events.
             */
            this.on("EntityUpdatedEvent", function(e) {
                var i, entities = e.serverEvent.get("updatedEntities");
                for (i = 0; i < entities.length; i += 1) {  // Update the cache with the entites contained in the reply
                    this.updated = this.updateCache(POST, entities[i]) || this.updated;
                }

                if (e.cfg.updateEvent !== false && this.updated) {
                    this.get(HOST).fire("update", e);
                    this.updated = false;
                }
            });

            this.on("CustomEvent", function(e) {
                this.get(HOST).fire(e.serverEvent.get("val.type"), e.serverEvent.get("val.payload"));
            });
            this.on("ExceptionEvent", function(e) {
                this.get(HOST).fire("ExceptionEvent", e.serverEvent.get("val.exceptions")[0]);
            });
        },
        generateRequest: function(data) {
            if (data['@class'].indexOf("Instance") > -1) {
                return '/' + data.descriptorId + '/VariableInstance/' + data.id;
            } else {
                return "/" + data.id;
            }
        },
        /**
         * @function
         * @private
         */
        walkEntity: function(entity, callback) {
            if (entity.get && entity.get(ITEMS)) {
                return callback.call(this, entity.get(ITEMS));
            }
            //if (entity.get && entity.get("scope")) {
            //    if (callback(Y.Object.values(entity.get("scope").get("variableInstances")))) {
            //        return true;
            //    }
            //}
            return false;
        },
        /**
         * @function
         */
        updateCache: function(method, entity) {
            if (entity instanceof Wegas.persistence.VariableInstance) {
                return this.find(ID, +entity.get("descriptorId"), function(found, needle) {
                    var i, instances = found.get("scope").get("variableInstances");

                    for (i in instances) {
                        if (instances[i].get(ID) === entity.get(ID)) {
                            instances[i].setAttrs(entity.getAttrs());
                            continue;
                        }
                    }
                    return true;
                });
            } else if (entity instanceof Wegas.persistence.VariableDescriptor) {
                return VariableDescriptorCache.superclass.updateCache.apply(this, arguments);
            }
            return false;
        },
        /**
         * @function
         */
        put: function(data, cfg) {
            if (data['@class'].indexOf("Instance") !== -1) {
                this.sendRequest(Y.mix({
                    request: '/1/VariableInstance/' + data.id,
                    cfg: {
                        method: PUT,
                        data: data
                    }
                }, cfg));
                return;
            } else {
                VariableDescriptorCache.superclass.put.call(this, data, cfg);
            }
        },
        post: function(data, parent, callback) {
            var request = "";
            if (parent) {
                this.oldIds = Y.Array.map(parent.get(ITEMS), function(i) {
                    return i.get(ID);
                });
                request = "/" + parent.get(ID);
            }
            this.sendRequest({
                request: request,
                cfg: {
                    method: POST,
                    data: data
                },
                on: callback
            });
        },
        findParentDescriptor: function(entity) {
            var ret, doFind = function(stack) {
                return Y.Array.find(stack, function(item) {
                    if (item.get(ID) === entity.get(ID)) {                  // We check the current element if it's a match
                        return true;
                    }
                    if (this.walkEntity(item, doFind)) {
                        if (!ret) {
                            ret = item;
                        }
                        return true;
                    }
                    return false;
                }, this);
            };

            doFind.call(this, this.getCache());
            return ret;
        },
        move: function(entity, parentEntity, index) {
            var request,
                host = this.get(HOST),
                oParentEntity = this.findParentDescriptor(entity),
                tArray;

            tArray = (oParentEntity) ?
                oParentEntity.get(ITEMS) : this.getCache();               // Remove the item from it's existing position in the cache

            Y.log("Moving cache object from position " + Y.Array.indexOf(tArray, entity) + " to position " + index, "log", "Wegas.VariableTreeView");

            tArray.splice(Y.Array.indexOf(tArray, entity), 1);
            if (oParentEntity) {
                oParentEntity.set(ITEMS, tArray);
            }

            tArray = (parentEntity) ?
                parentEntity.get(ITEMS) : this.getCache();
            tArray.splice(index, 0, entity);                                    // Place the entity at the new position

            if (parentEntity) {                                                   // Dropped on a list descriptor
                parentEntity.set(ITEMS, tArray);
                entity.parentDescriptor = parentEntity;
                request = "/" + entity.get(ID) + "/Move/" + parentEntity.get(ID) + "/" + index;
            } else {                                                            // Dropped at root level
                entity.parentDescriptor = null;
                request = "/" + entity.get(ID) + "/Move/" + index;
            }
            host.sendRequest({
                request: request,
                cfg: {
                    method: PUT
                },
                on: {
                    success: Y.bind(function(tId, e) {
                        Y.log("Item moved", "info", "Wegas.VariableTreeView");
                        this.get(HOST).fire("update");
                    }, this),
                    failure: function(tId, e) {
                        //@todo Reset the whole treeview
                        Y.log("Error moving item", "error");
                    }
                }
            });
            // Now a hack to order cache and not need a full db refresh
            // Y.Wegas.Facade.VariableDescriptor
        }
    });
    Plugin.VariableDescriptorCache = VariableDescriptorCache;

    /**
     *  @name Y.Plugin.GameModelCache
     *  @class adds management of entities of type Y.Wegas.persistence.GameModel
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    GameModelCache = Y.Base.create("wegas-gamemodelcache", WegasCache, [], {
        /*
         *  @fixme so we can delect scriptlibrary elemnt and still treat the reply as an gamemodel updated event
         */
        onData: function(e) {
            if (e.request.indexOf("/Library/") !== -1) {
                e.cfg.method = POST;
            }
            GameModelCache.superclass.onData.call(this, e);
        },
        post: function(data, parentData, callback) {
            if (data.templateId) {
                this.sendRequest({
                    request: "/" + data.templateId,
                    cfg: {
                        method: POST,
                        data: data
                    },
                    on: callback
                });
            } else {
                GameModelCache.superclass.post.apply(this, arguments);
            }
        },
        getCurrentGameModel: function() {
            return this.findById(this.get('currentGameModelId'));
        }
    }, {
        NS: "cache",
        NAME: "GameModelCache",
        ATTRS: {
            currentGameModelId: {}
        }
    });
    Plugin.GameModelCache = GameModelCache;

    /**
     *  @name Y.Plugin.GameCache
     *  @class adds management of entities of type Y.Wegas.persistence.Game
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */

    GameCache = Y.Base.create("wegas-gamecache", WegasCache, [], {
        walkEntity: function(entity, callback) {
            var t;
            if (entity instanceof Wegas.persistence.Game) {
                t = callback.call(this, entity.get("teams"));
                if (t)
                    return t;
            }
            if (entity instanceof Wegas.persistence.Team) {
                t = callback.call(this, entity.get("players"));
                if (t)
                    return t;
            }
            if (entity.get && entity.get(ITEMS)) {
                return callback(entity.get(ITEMS));
            }
            return false;
        },
        addToCache: function(entity) {
            if (entity instanceof Wegas.persistence.Team) {
                var game = this.findById(entity.get("gameId"));
                if (game) {
                    game.get("teams").push(entity);
                }
            } else if (entity instanceof Wegas.persistence.Player) {
                this.findById(entity.get("teamId")).get("players").push(entity);

            } else {
                //this.getCache().push(entity);
                this.getCache().splice(0, 0, entity);                           // Add in first position
            }
            this.get(HOST).fire("added", {
                entity: entity
            });
        },
        /**
         * @deprecated
         */
        generateRequest: function(data) {
            if (data['@class'] === 'Team') {
                return '/' + data.gameId + '/Team/' + data.id;
            } else if (data['@class'] === 'Player') {
                return "/" + this.getGameByTeamId(data.teamId).get(ID)
                    + '/Team/' + data.teamId + '/Player/' + data.id;
            } else {
                return "/" + data.id;
            }
        },
        post: function(entity, parentData, callback) {
            if (entity["@class"] === "Player") {
                this.sendRequest({
                    request: "/" + this.getGameByTeamId(parentData.id).get(ID)
                        + "/Team/" + parentData.id + "/Player",
                    cfg: {
                        method: POST,
                        data: entity
                    },
                    on: callback
                });
            } else if (entity["@class"] === "Game") {
                this.sendRequest({
                    request: "/" + entity.gameModelId,
                    cfg: {
                        method: POST,
                        data: entity
                    },
                    on: callback
                });
            } else {
                GameCache.superclass.post.call(this, entity, parentData, callback);
            }
        },
        /* Util methods */
        getCurrentGame: function() {
            return this.findById(this.get('currentGameId'));
        },
        getCurrentPlayer: function() {
            return this.getPlayerById(this.get('currentPlayerId'));
        },
        getCurrentTeam: function() {
            return this.getTeamById(this.get('currentTeamId'));
        },
        getTeamById: function(teamId) {
            return this.find(ID, teamId * 1);
        },
        getPlayerById: function(playerId) {
            return this.find(ID, playerId * 1);
        },
        /**
         *
         */
        getGameByTeamId: function(teamId) {
            var i, j, data = this.getCache();
            teamId = teamId * 1;                                                // Convert to number

            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].get("teams").length; j += 1) {
                    if (data[i].get("teams")[j].get(ID) === teamId) {
                        return data[i];
                    }
                }
            }
            return null;
        },
        /**
         *
         */
        getTeamByPlayerId: function(playerId) {
            var i, j, k, cTeam, data = this.getCache();
            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].get("teams").length; j += 1) {
                    cTeam = data[i].get("teams")[j];
                    for (k = 0; k < cTeam.get("players").length; k += 1) {
                        if (cTeam.get("players")[k].get(ID) === playerId) {
                            return cTeam;
                        }
                    }
                }
            }
            return null;
        }
    }, {
        NS: "cache",
        NAME: "GameCache",
        ATTRS: {
            currentGameId: {},
            currentTeamId: {},
            currentPlayerId: {}
        }
    });
    Plugin.GameCache = GameCache;

    /**
     *  @name Y.Plugin.UserCache
     *  @class adds management of entities of type Y.Wegas.persistence.User
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    var UserCache = Y.Base.create("wegas-cache", WegasCache, [], {
        walkEntity: function(entity, callback) {
            if (entity.get("accounts")) {
                return callback.call(this, entity.get("accounts"));
            }
            return false;
        },
        generateRequest: function(data) {
            if (data['@class'] === 'JpaAccount') {
                return "/Account/" + data.id;
            } else {
                return "/" + data.id;
            }
        },
        post: function(data, parentData, callback) {
            if (data["@class"] === "JpaAccount") {                              // Allow user creation based on a Jpa Account
                data = {
                    "@class": "User",
                    accounts: [data]
                };
            }

            this.sendRequest({
                request: "",
                cfg: {
                    method: POST,
                    data: data
                },
                on: callback
            });
        },
        deleteAllRolePermissions: function(roleId, entityId) {
            this.sendRequest({
                request: "/DeleteAllRolePermissions/" + roleId
                    + "/" + entityId,
                cfg: {
                    method: POST
                }
            });
        }
    }, {
        NS: "cache",
        NAME: "UserCache",
        ATTRS: {
            currentUserId: {},
            currentUser: {
                getter: function() {
                    return this.findById(this.get("currentUserId"));
                }
            }
        }
    });
    Plugin.UserCache = UserCache;

    /**
     * @name Y.Plugin.PageCache
     * @extends Y.Plugin.Base
     * @class
     * @constructor
     */
    PageCache = function() {
        PageCache.superclass.constructor.apply(this, arguments);
    };
    Y.mix(PageCache, {
        NS: "cache",
        NAME: "PageCache"
    });
    Y.extend(PageCache, Plugin.Base, {
        /** @lends Y.Plugin.PageCache# */

        /**
         * @function
         * @private
         */
        initializer: function() {
            var endsWith = function(str, suffix) {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
            };
            this.get(HOST).data = {};
            this.index = null;
            this.editable = endsWith(this.get(HOST).get("source"), "/");
            this.pageQuery = {};
            this.doBefore("_defResponseFn", this.beforeResponse, this);
            /* Publishing */
            this.publish("pageUpdated");
        },
        /**
         * Server requests methods
         *
         * @fixme Il y a peut-être un problème du au remove de cette fonction dans la class parent.
         * @deprecated
         *
         * @function
         */
        sendRequest: function(requestCfg) {
            requestCfg.on = requestCfg.on || {};
            requestCfg.on.success = requestCfg.on.success || this._successHandler;
            requestCfg.on.failure = requestCfg.on.failure || this._failureHandler;
            requestCfg.cfg = requestCfg.cfg || {};
            requestCfg.cfg.Page = requestCfg.cfg.Page || '';
            requestCfg.cfg.headers = requestCfg.cfg.headers || {};
            Y.mix(requestCfg.cfg.headers, {
                'Content-Type': 'application/json;charset=ISO-8859-1',
                "Managed-Mode": "false"
            });
            this.get(HOST).sendRequest(requestCfg);
        },
        /**
         * @function
         * @private
         */
        beforeResponse: function(e) {
            var result = e.response.results,
                page = e.data ? (e.data.getResponseHeader("Page") || '') : null,
                i;

            result = (e.error) ? null : result;                                 //No Content found
            if (page === "*" || page === '') {
                for (i in result) {
                    this.pageQuery[i] = false;
                    this.setCache(i, result[i]);

                }
            } else if (page !== "index") {
                this.pageQuery[page] = false;
                this.setCache(page, result);
            } else if (page === "index") {
                this.index = result;
            }
        },
        /**
         * @function
         * @private
         */
        setCache: function(pageId, object) {
            var old = Y.JSON.stringify(this.getCache(pageId));
            if (Y.Lang.isObject(object)) {
                delete object['@name'];
                if (Y.JSON.stringify(object) !== old) {
                    this.get(HOST).data["" + pageId] = object;
                    this.fire("pageUpdated", {
                        page: this.getPage(pageId)
                    });
                }
            }
        },
        /**
         * @function
         */
        getCache: function(pageId) {
            return this.get(HOST).data["" + pageId] || null;
        },
        /**
         * @function
         */
        destroyCache: function() {
            this.get(HOST).data = {};
        },
        /**
         * @function
         */
        put: function(page, callback) {
            var pageId = page["@pageId"], pe = Y.clone(page);
            delete pe["@pageId"];
            this.sendRequest({
                request: "" + pageId,
                cfg: {
                    method: PUT,
                    data: Y.JSON.stringify(pe)
                },
                on: {
                    success: Y.bind(function(e) {
                        if (callback instanceof Function) {
                            callback(e.response.results);
                        }
                    }, this)
                }
            });
        },
        /**
         * 
         * @param {Object} entity
         * @param {Function} (optional) callback, parameters (page created, page's id, index); 
         * @returns {undefined}
         */
        createPage: function(entity, callback) {
            var pe = Y.clone(entity);
            delete pe["@pageId"];
            this.index = null;
            this.sendRequest({
                request: "",
                cfg: {
                    method: PUT,
                    data: Y.JSON.stringify(pe)
                },
                on: {
                    success: Y.bind(function(e) {

                        if (callback instanceof Function) {
                            this.getIndex(Y.bind(callback, callback, e.response.results, e.data.getResponseHeader("Page")));
                        } else {
                            this.getIndex();
                        }
                    }, this)
                }
            });
        },
        /**
         * @function
         */
        patch: function(o, callback) {
            var dmp = new diff_match_patch(),
                oldPage = this.getCache(o["@pageId"]),
                newPage = Y.merge(o),
                pageId = o["@pageId"],
                patch;
            delete newPage["@pageId"];
            if (!pageId) {
                Y.log("Failed to define page id", "error", "Y.Plugin.PageCache");
                return;
            }
            patch = dmp.patch_toText(dmp.patch_make(Y.JSON.stringify(oldPage), Y.JSON.stringify(newPage)));
            this.sendRequest({
                request: "" + pageId,
                cfg: {
                    method: PUT,
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    data: patch
                },
                on: {
                    success: Y.bind(function(e) {
                        if (callback instanceof Function) {
                            callback(e.response.results);
                        }
                    }, this)
                }
            });
        },
        editMeta: function(pageId, meta, callback) {
            this.index = null;
            this.sendRequest({
                request: "" + pageId + "/meta",
                cfg: {
                    method: PUT,
                    data: meta
                },
                on: {
                    success: Y.bind(function(e) {
                        if (callback instanceof Function) {
                            callback(e.response.results);
                        }
                    }, this)
                }
            });
        },
        duplicate: function(pageId, callback) {
            this.index = null;
            this.sendRequest({
                request: "" + pageId + "/duplicate",
                on: {
                    success: Y.bind(function(e) {
                        if (callback instanceof Function) {
                            this.getIndex(Y.bind(callback, callback, e.response.results, e.data.getResponseHeader("Page")));
                        } else {
                            this.getIndex();
                        }
                    }, this)
                }
            });
        },
        /**
         * 
         * @param {String|Number} pageId
         * @param {Function} callback,  param (page's index)
         * @returns {undefined}
         */
        deletePage: function(pageId, callback) {
            this.index = null;
            this.sendRequest({
                request: "" + pageId,
                cfg: {
                    method: 'DELETE'
                },
                on: {
                    success: Y.bind(function(e) {
                        delete this.get(HOST).data[pageId];
                        if (callback instanceof Function) {
                            callback(e.response.results);
                        }
                    }, this)
                }
            });
        },
        /**
         *
         * @param {String} pageId
         * @param {Function} callback asyc calling function with page as first param
         * @returns {Page} or null if page missing in cache.
         */
        getPage: function(pageId, callback) {
            var page = null;
            if (this.getCache(pageId)) {
                page = Y.clone(this.getCache(pageId));
                page["@pageId"] = pageId;
                if (callback instanceof Function) {
                    callback(page);
                }
            } else if (!this.pageQuery[pageId]) {
                this.pageQuery[pageId] = true;
                this.sendRequest({
                    request: "" + pageId,
                    on: {
                        success: Y.bind(function(e) {
                            var page;
                            if (callback instanceof Function) {
                                page = Y.clone(this.getCache(pageId));
                                if (page) {
                                    page["@pageId"] = pageId;
                                    callback(page);
                                }

                            }
                        }, this),
                        failure: function(e) {
                            callback(null);
                        }
                    }
                });
            }
            return page;
        },
        getIndex: function(callback) {
            var cfg = {request: "index", on: {}};
            if (this.index && callback instanceof Function) {
                callback(this.index);
            } else {
                if (callback instanceof Function) {
                    cfg.on.success = function(e) {
                        callback(e.response.results);
                    };
                }
                this.sendRequest(cfg);
            }

        },
        _successHandler: function(e) {
            Y.log("PageDatasource reply:" + e.response, "log", "Y.Plugin.PageCache");
        },
        _failureHandler: function(e) {
        }
    });
    Plugin.PageCache = PageCache;

    /*
     *
     */
    Plugin.JSONSchema = Y.Base.create("wegas-jsoncache", Plugin.Base, [], {
        /**
         * Internal init() handler.
         *
         * @method initializer
         * @private
         */
        initializer: function() {
            this.doBefore("_defDataFn", this._beforeDefDataFn);
            this.get(HOST).getPath = this.getPath;                              // @hack For file library
        },
        _beforeDefDataFn: function(e) {
            var data = e.data && (e.data.responseText || e.data),
                payload = e.details[0];
            if (e.error) {
                payload.response = {
                    meta: {},
                    results: data
                };
            } else {
                payload.response = {
                    meta: {},
                    results: Y.JSON.parse(data)
                };
            }
            this.get(HOST).fire("response", payload);
            return new Y.Do.Halt("DataSourceJSONSchema plugin halted _defDataFn");
        },
        /**
         *  @hack For file library
         */
        getPath: function() {
            return this.get("source") + "read";
        }
    }, {
        NS: "jsonschema"
    });
});
