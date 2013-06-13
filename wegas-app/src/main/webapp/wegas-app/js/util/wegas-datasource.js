/*
 * Wegas
 * http://www.albasim.ch/wegas/
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

    var HOST = "host", ID = "id", POST = "POST", PUT = "PUT",
            Lang = Y.Lang, Wegas = Y.Wegas, WegasCache, VariableDescriptorCache,
            GameModelCache, GameCache, PageCache,
            DEFAULTHEADERS = {
        'Content-Type': 'application/json;charset=ISO-8859-1',
        'Managed-Mode': 'true'
    };

    /**
     * @name Y.Wegas.DataSource
     * @extends Y.DataSource.IO
     * @class Custom implementation of a datasource,
     * @constructor
     */
    Y.namespace("Wegas").DataSource = Y.Base.create("datasource", Y.DataSource.IO, [], {
        /** @lends Y.Wegas.DataSource# */

        /**
         * @function
         * @private
         */
        initializer: function() {
            this.after("sourceChange", this.sendInitialRequest);

            //this.on("error",function(e) {
            //    //console.log("WegasCache._failureHandler", e);
            //    Y.log("Exception while sending request \"" + (e.request || "") + "\": "
            //        + (e.response.results.message || e.response.results.exception || e), "error", 'Y.Wegas.WegasCache');
            //});
            //this.on("response", function(e) {
            //    Y.log("Datasource response:" + e.response, 'log', 'Y.Wegas.WegasCache');
            //});
            //this.on("data", function(e) {
            //    Y.log("Datasource data:" + e.response, 'log', 'Y.Wegas.WegasCache');
            //});
        },
        /**
         * @function
         * @private
         */
        sendInitialRequest: function() {
            if (this.get("initialRequest") !== undefined) {                     // Use this condition to allow empty strings (e.g. ")
                return this.sendRequest({
                    request: this.get("initialRequest")
                });
            } else {
                return null;
            }
        },
        /**
         * Server requests methods
         *
         * @function
         */
        sendRequest: function(request) {
            request.cfg = request.cfg || {};
            request.cfg.headers = request.cfg.headers || {};
            Y.mix(request.cfg.headers, DEFAULTHEADERS);
            if (Lang.isObject(request.cfg.data)) {                              // Stringify data if required
                request.cfg.data = Y.JSON.stringify(request.cfg.data);
            }
            return Y.Wegas.DataSource.superclass.sendRequest.call(this, request);
        }

    }, {
        /** @lends Y.Wegas.DataSource */

        /**
         * @field
         * @static
         */
        ATTRS: {
            initialRequest: {}
        }
    });

    /**
     *  @name Y.Plugin.WegasCache
     *  @class Plugin that add cache management for entites from wegas server.
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    WegasCache = function() {
        WegasCache.superclass.constructor.apply(this, arguments);
    };

    Y.mix(WegasCache, {
        NS: "cache",
        NAME: "WegasCache"
    });

    Y.extend(WegasCache, Y.Plugin.Base, {
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

            this.doBefore("_defDataFn", this.onData, this);                     // When the host receives some data, we parse the result
            this.afterHostEvent("sourceChange", this.clear, this);              // When the source changes, clear the cache
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
        onData: function(e) {
            var data = e.data && (e.data.responseText || e.data),
                    schema = this.get('schema'),
                    payload = e.details[0];

            payload.response = Y.DataSchema.JSON.apply.call(this, schema, data) || {
                meta: {},
                results: data
            };
            payload.response.data = this.getCache();                            // Provides with a pointer to the datasource current content

            Y.log("Response received from " + this.get(HOST).get('source')/* + e.cfg.request*/, "log", "Wegas.WegasCache");

            Wegas.Editable.use(payload.response.results, // Lookup dependencies
                    Y.bind(function(payload) {
                payload.serverResponse = Wegas.Editable.revive(payload.response.results); // Revive
                if (payload.serverResponse.get
                        && payload.serverResponse.get("entities")
                        && payload.serverResponse.get("entities").length > 0) {
                    payload.response.entity = payload.serverResponse.get("entities")[0];                                 // Shortcut, useful if there is only one instance
                }
                if (payload.cfg.updateCache !== false) {
                    this.onResponseRevived(payload);
                }
                this.get(HOST).fire("response", payload);
            }, this, payload));

            return new Y.Do.Halt("DataSourceJSONSchema plugin halted _defDataFn");
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
                    this.updated = this.updateCache(e.cfg.method, response[i]) || this.updated;
                }
            } else {
                if (response.get("entities")) {
                    for (i = 0; i < response.get("entities").length; i += 1) {      // Update the cache with the Entites in the reply body
                        entity = response.get("entities")[i];
                        if (Lang.isObject(entity)) {
                            this.updated = this.updateCache(e.cfg.method, entity) || this.updated;
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
            if (this.updated) {
                this.get(HOST).fire("update", e);
            }
        },
        /**
         *  @function
         *  @private
         *  @param {String} method Possible values for method are: POST, PUT, DELETE, default being PUT.
         *  @param {page} entity The entity to update in the cache
         *  @return {Boolean} `true` if object could be located and method applied
         */
        updateCache: function(method, entity) {
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
                    if (this.find(ID, entity, function(entity, needle) {
                        entity.setAttrs(needle.getAttrs());
                        return true;
                    })) {
                        return true;
                    }
                    break;
            }
            this.addToCache(entity);                                            // In case we still have not found anything
            return true;
        },
        /**
         * @function
         * @private
         */
        addToCache: function(entity) {
            this.getCache().push(entity);
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
        clear: function() {
            var i, cache = this.getCache();
            for (i = 0; i < cache.length; i = i + 1) {
                cache[i].destroy();
            }
            cache.length = 0;

            this.get(HOST).fire("update");
        },
        /**
         *
         */
        findAll: function() {
            return this.getCache();
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
         * Retrieves a list of entities from the cache
         * @function
         * @private
         */
        filter: function(key, val) {
            var data = this.getCache(), ret = [], i;
            for (i = 0; i < data.length; i += 1) {
                if (this.testEntity(data[i], key, val)) {
                    ret.push(data[i]);
                }
            }
            return ret;
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

            // Previous version of the find fn
//            var onWalkFn = Y.bind(this.doFind, this, key, needle, onFindFn);
//            this.ret = null;
//            Y.Array.find(stack, function(item, index, array) {
//                if (this.testEntity(item, key, needle)) {                       // We check the current element if it's a match
//                    if (onFindFn) {
//                        onFindFn(item, needle, index, array);
//                    }
//                    this.ret = item;
//                    return true;
//                }
//                return this.walkEntity(item, onWalkFn);
//            }, this);
//            return this.ret;
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
        post: function(data, parentData, callback) {
            var request = (parentData) ? "/" + parentData.id + "/" + data["@class"] : "/";

            this.sendRequest({
                request: request,
                cfg: {
                    method: POST,
                    data: Y.JSON.stringify(data)
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
            cfg.request = "/" + entity.get('id') + "?view=" + (view || "Editor");
            cfg.cfg = {
                updateCache: false
            };
            return this.sendRequest(cfg);
        },
        /**
         * @function
         * @private
         */
        put: function(data, callback) {
            this.sendRequest({
                request: this.generateRequest(data),
                cfg: {
                    method: "PUT",
                    data: Y.JSON.stringify(data)
                },
                on: callback
            });
        },
        /**
         * @function
         * @private
         */
        duplicateObject: function(entity) {
            this.sendRequest({
                request: this.generateRequest(entity.toObject()) + "/Duplicate/",
                cfg: {
                    method: POST
                }
            });
        },
        /**
         * @function
         * @private
         */
        deleteObject: function(entity) {
            this.sendRequest({
                request: this.generateRequest(entity.toObject()),
                cfg: {
                    method: "DELETE"
                }
            });
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
        /** @lends Y.Plugin.WegasCache */
        ATTRS: {
            schema: {
                value: {
                    resultListLocator: "."
                            //resultFields: ["name", ID, "@class"]
                }
            },
            testFn: {
                value: function(entity, key, needle) {
                    var value = (entity.get) ? entity.get(key) : entity[key], // Normalize item and needle values
                            needleValue = (needle.get) ? needle.get(key) : (typeof needle === 'object') ? needle[key] : needle;

                    return value === needleValue;
                }
            }
        }
    });
    Y.namespace('Plugin').WegasCache = WegasCache;

    /**
     *  @name Y.Plugin.CRDataSource
     *  @class Content repository dataSource REST plugin.
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    var CRDataSource = function() {
        CRDataSource.superclass.constructor.apply(this, arguments);
    };

    Y.extend(CRDataSource, WegasCache, {}, {
        /** @lends Y.Plugin.CRDataSource */
        NS: "cache",
        NAME: "CRDataSource",
        ATTRS: {
        },
        getFullpath: function(relativePath) {
            return Wegas.app.get("base") + "rest/File/GameModelId/" + Wegas.app.get("currentGameModel") +
                    "/read" + relativePath;
        },
        getFilename: function(path) {
            return path.replace(/^.*[\\\/]/, '');
        }
    });
    Y.namespace('Plugin').CRDataSource = CRDataSource;

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

                if (this.updated) {
                    this.get(HOST).fire("update", e);
                    this.updated = false;
                }
            });

            this.on("CustomEvent", function(e) {
                this.get("host").fire(e.serverEvent.get("val.type"), e.serverEvent.get("val.payload"));
            });
        },
        /**
         * @function
         * @private
         */
        walkEntity: function(entity, callback) {
            if (entity.get && entity.get("items")) {
                return callback.call(this, entity.get("items"));
            }
            //            if (entity.get && entity.get("scope")) {
            //                if (callback(Y.Object.values(entity.get("scope").get("variableInstances")))) {
            //                    return true;
            //                }
            //            }
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
        put: function(data, callback) {
            if (data['@class'].indexOf("Instance") !== -1) {
                this.sendRequest({
                    request: '/1/VariableInstance/' + data.id,
                    cfg: {
                        method: "PUT",
                        data: Y.JSON.stringify(data)
                    },
                    on: callback
                });
                return;
            } else {
                VariableDescriptorCache.superclass.put.call(this, data, callback);
            }
        },
        post: function(data, parentData, callback) {
            var request = "";
            if (parentData) {
                switch (parentData["@class"]) {
                    case "ListDescriptor":
                    case "QuestionDescriptor":
                        request = "/" + parentData.id;
                        break;
                    default:
                        request = "/" + parentData.id + "/VariableInstance/";
                        break;
                }
            }
            this.sendRequest({
                request: request,
                cfg: {
                    method: POST,
                    data: Y.JSON.stringify(data)
                },
                on: callback
            });
        },
        findParentDescriptor: function(entity) {
            var ret, doFind = function(stack) {
                return Y.Array.find(stack, function(item) {
                    if (item.get("id") === entity.get("id")) {                  // We check the current element if it's a match
                        return true;
                    }
                    if (this.walkEntity(item, doFind)) {
                        ret = item;
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
                    host = this.get("host"),
                    oParentEntity = this.findParentDescriptor(entity),
                    tArray;

            tArray = (oParentEntity) ?
                    oParentEntity.get("items") : this.getCache();               // Remove the item from it's existing position in the cache

            Y.log("Moving cache object from position " + Y.Array.indexOf(tArray, entity) + " to position " + index, "log", "Wegas.VariableTreeView");

            tArray.splice(Y.Array.indexOf(tArray, entity), 1);

            tArray = (parentEntity) ?
                    parentEntity.get("items") : this.getCache();
            tArray.splice(index, 0, entity);                                    // Place the entity at the new position

            if (parentEntity) {                                                   // Dropped on a list descriptor
                request = "/" + entity.get("id") + "/Move/" + parentEntity.get("id") + "/" + index;
            } else {                                                            // Dropped at root level
                request = "/" + entity.get("id") + "/Move/" + index
            }
            host.sendRequest({
                request: request,
                cfg: {
                    method: "PUT"
                },
                on: {
                    success: function(tId, e) {
                        Y.log("Item moved", "info", "Wegas.VariableTreeView");
                    },
                    failure: function(tId, e) {
                        //@todo Reset the whole treeview
                    }
                }
            });
            this.find

            // Now a hack to order cache and not need a full db refresh
//            Y.Wegas.Facade.VariableDescriptor
        }
    });

    Y.namespace('Plugin').VariableDescriptorCache = VariableDescriptorCache;

    /**
     *  @name Y.Plugin.GameModelCache
     *  @class adds management of entities of type Y.Wegas.persistence.GameModel
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    GameModelCache = function() {
        GameModelCache.superclass.constructor.apply(this, arguments);
    };

    Y.mix(GameModelCache, {
        NS: "cache",
        NAME: "GameModelCache"
    });

    Y.extend(GameModelCache, WegasCache, {
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
                        data: Y.JSON.stringify(data)
                    },
                    on: callback
                });
            } else {
                GameModelCache.superclass.post.apply(this, arguments);
            }
        },
        getCurrentGameModel: function() {
            return this.findById(Wegas.app.get('currentGameModel'));
        }
    });
    Y.namespace('Plugin').GameModelCache = GameModelCache;

    /**
     *  @name Y.Plugin.GameCache
     *  @class adds management of entities of type Y.Wegas.persistence.Game
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    GameCache = function() {
        GameCache.superclass.constructor.apply(this, arguments);
    };

    Y.mix(GameCache, {
        NS: "cache",
        NAME: "GameCache"
    });

    Y.extend(GameCache, WegasCache, {
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
            if (entity.get && entity.get("items")) {
                return callback(entity.get("items"));
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
                this.getCache().push(entity);
            }
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
                        data: Y.JSON.stringify(entity)
                    },
                    on: callback
                });
            } else if (entity["@class"] === "Game") {
                this.sendRequest({
                    request: "/" + entity.gameModelId,
                    cfg: {
                        method: POST,
                        data: Y.JSON.stringify(entity)
                    },
                    on: callback
                });
            } else {
                GameCache.superclass.post.call(this, entity, parentData, callback);
            }
        },
        /* Util methods */
        getCurrentGame: function() {
            return this.findById(Wegas.app.get('currentGame'));
        },
        getCurrentPlayer: function() {
            return this.getPlayerById(Wegas.app.get('currentPlayer'));
        },
        getCurrentTeam: function() {
            return this.getTeamById(Wegas.app.get('currentTeam'));
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
    });
    Y.namespace('Plugin').GameCache = GameCache;

    /**
     *  @name Y.Plugin.UserCache
     *  @class adds management of entities of type Y.Wegas.persistence.User
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    var UserCache = function() {
        UserCache.superclass.constructor.apply(this, arguments);
    };

    Y.extend(UserCache, WegasCache, {
        walkEntity: function(entity, callback) {
            if (entity.get("accounts")) {
                return callback.call(this, entity.get("accounts"));
            }
            return false;
        },
        //updateCache: function ( method, entity ) {},

        put: function(data, callback) {
            if (data['@class'] === "JpaAccount") {
                this.sendRequest({
                    request: '/Account/' + data.id,
                    cfg: {
                        method: "PUT",
                        data: Y.JSON.stringify(data)
                    },
                    on: callback
                });
                return;
            } else {
                VariableDescriptorCache.superclass.put.call(this, data, callback);
            }
        },
        post: function(data, parentData, callback) {
            if (data["@class"] === "JpaAccount") {                              // Allow user creation based on a Jpa Account
                data = {
                    "@class": "User",
                    "accounts": [data]
                };
            }

            this.sendRequest({
                request: "",
                cfg: {
                    method: POST,
                    data: Y.JSON.stringify(data)
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
            currentUser: {
                getter: function() {
                    return this.findById(Wegas.app.get("currentUser").id);
                }
            }
        }
    });
    Y.namespace('Plugin').UserCache = UserCache;

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

    Y.extend(PageCache, Y.Plugin.Base, {
        /** @lends Y.Plugin.PageCache# */

        /**
         * @function
         * @private
         */
        initializer: function(cfg) {
            this.get(HOST).data = {};
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
            requestCfg.callback = requestCfg.callback || {
                success: this._successHandler,
                failure: this._failureHandler
            };
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
            }
        },
        /**
         * @function
         * @private
         */
        setCache: function(pageId, object) {
            var old = Y.JSON.stringify(this.getCache(pageId));
            if (Y.JSON.stringify(object) !== old) {
                this.get(HOST).data["" + pageId] = object;
                this.fire("pageUpdated", {
                    "page": this.getPage(pageId)
                });
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
                callback: callback
            });
        },
        /**
         * @function
         */
        createPage: function(entity, callback) {
            var pe = Y.clone(entity);
            delete pe["@pageId"];
            this.sendRequest({
                request: "",
                cfg: {
                    method: PUT,
                    data: Y.JSON.stringify(pe)
                },
                callback: callback
            });
        },
        /**
         * @function
         */
        patch: function(o, callback) {
            var dmp = new diff_match_patch(),
                    oldPage = this.getCache(o["@pageId"]),
                    newPage = Y.clone(o),
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
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'text/plain'
                    },
                    data: patch
                },
                callback: callback
            });
        },
        editMeta: function(pageId, meta, callback) {
            this.sendRequest({
                request: "" + pageId + "/meta",
                cfg: {
                    method: 'PUT',
                    data: meta
                },
                callback: {
                    success: Y.bind(function(e) {
                        if (callback instanceof Function) {
                            callback(e.response.results);
                        }
                    }, this)
                }
            });
        },
        duplicate: function(pageId, callback) {
            this.sendRequest({
                request: "" + pageId + "/duplicate",
                cfg: {
                    method: 'GET'
                },
                callback: Y.bind(function(e) {
                    if (callback instanceof Function) {
                        callback(e.response.results);
                    }
                }, this)
            });
        },
        /**
         * @function
         */
        deletePage: function(pageId) {
            this.sendRequest({
                request: "" + pageId,
                cfg: {
                    method: 'DELETE'
                },
                callback: {
                    success: Y.bind(function(e) {
                        delete this.get(HOST).data[e.data.getResponseHeader("Page")];
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
                        success: Y.bind(this.pageReceived, this, pageId, callback)
                    }
                });
            }
            return page;
        },
        pageReceived: function(id, callback, e) {
            var page;
            if (callback instanceof Function) {
                page = Y.clone(this.getCache(id));
                if (page) {
                    page["@pageId"] = id;
                }
                callback(page);
            }
        },
        getIndex: function(callback) {
            this.sendRequest({
                request: "index",
                callback: {
                    success: Y.bind(function(e) {
                        if (callback instanceof Function) {
                            callback(e.response.results);
                        }
                    }, this)
                }
            });
        },
        _successHandler: function(e) {

        },
        _failureHandler: function(e) {
            Y.error("PageDatasource reply:", e, 'Y.Wegas.DataSourceRest');
        }
    });
    Y.namespace('Plugin').PageCache = PageCache;

    /**
     * @FIXME We redefine this so we can use a "." selector and a "@..." field name
     */
    Y.DataSchema.JSON.getPath = function(locator) {
        var path = null,
                keys = [],
                i = 0;

        if (locator) {
            if (locator === '.') {
                return [];					// MODIFIED !!
            }

            // Strip the ["string keys"] and [1] array indexes
            locator = locator.
                    replace(/\[(['"])(.*?)\1\]/g,
                    function(x, $1, $2) {
                        keys[i] = $2;
                        return '.@' + (i++);
                    }).
                    replace(/\[(\d+)\]/g,
                    function(x, $1) {
                        keys[i] = parseInt($1, 10) | 0;
                        return '.@' + (i++);
                    }).
                    replace(/^\./, ''); // remove leading dot

            // Validate against problematic characters.
            if (!/[^\w\.\$@]/.test(locator)) {
                path = locator.split('.');
                for (i = path.length - 1; i >= 0; --i) {
                    /*if (path[i].charAt(0) === '@') {				// MODIFIED !!
                     path[i] = keys[parseInt(path[i].substr(1),10)];
                     }*/
                }
            }
            else {
            }
        }
        return path;
    };

    /*
     * @fixme hack on yui apis
     */
    Y.DataSource.IO.prototype._defRequestFn = function(e) {
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
        Y.DataSource.Local.transactions[e.tId] = io(uri, cfg);
        return e.tId;
    };

    /*
     * @FIXME We rewrite this function, should be overriden
     */
    Y.DataSchema.JSON._parseResults = function(schema, json_in, data_out) {
        var results = [],
                path,
                error;

        if (schema.resultListLocator) {
            path = Y.DataSchema.JSON.getPath(schema.resultListLocator);
            if (path) {
                results = Y.DataSchema.JSON.getLocationValue(path, json_in);
                if (results === undefined) {
                    data_out.results = [];
                    error = new Error("JSON results retrieval failure");
                }
                else {
                    if (Lang.isArray(results)) {
                        // if no result fields are passed in, then just take the results array whole-hog
                        // Sometimes you're getting an array of strings, or want the whole object,
                        // so resultFields don't make sense.
                        if (Lang.isArray(schema.resultFields)) {
                            data_out = Y.DataSchema.JSON._getFieldValues.call(this, schema.resultFields, results, data_out);
                        }
                        else {
                            data_out.results = results;
                        }
                    } else if (Lang.isObject(results)) {			// Added
                        if (Lang.isArray(schema.resultFields)) {
                            data_out = Y.DataSchema.JSON._getFieldValues.call(this, schema.resultFields, [results], data_out);
                        }
                        else {
                            data_out.results = results;
                        }
                    } else {
                        data_out.results = [];
                        error = new Error("JSON Schema fields retrieval failure");
                    }
                }
            }
            else {
                error = new Error("JSON Schema results locator failure");
            }

            if (error) {
                data_out.error = error;
            }

        }
        return data_out;
    };

    /** @Hack, use method defined in wegas-widget.js */
    Y.DataSource.IO.prototype.plug = Y.Widget.prototype.plug;
});
