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
YUI.add('wegas-datasourcerest', function(Y) {
    "use strict";

    var HOST = "host", ID = "id", POST = "POST",
            Lang = Y.Lang, Wegas = Y.Wegas, DataSourceREST, VariableDescriptorDataSourceREST,
            GameModelDataSourceREST, GameDataSourceREST, PageDataSourceREST,
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
        },
        /**
         * @function
         * @private
         */
        sendInitialRequest: function() {
            if (this.get("initialRequest") !== undefined) {                // Use this condition so we allow empty strin e.g. ""
                var sender = this.rest || this;
                return sender.sendRequest({
                    request: this.get("initialRequest")
                });
            } else {
                return null;
            }
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
     *  @name Y.Plugin.DataSourceREST
     *  @class Plugin that add cache management for entites from wegas server.
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    DataSourceREST = function() {
        DataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(DataSourceREST, {
        NS: "rest",
        NAME: "DataSourceREST"
    });

    Y.extend(DataSourceREST, Y.Plugin.Base, {
        /** @lends Y.Plugin.DataSourceREST# */
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
            this.afterHostEvent("sourceChange", this.clearCache, this);         // When the source changes, clear the cache
        },
        /**
         * Server requests methods
         *
         * @function
         */
        sendRequest: function(request) {
            request.on = request.on || {
                success: this._successHandler,
                failure: this._failureHandler
            };
            if (request.cfg && Lang.isObject(request.cfg.data)) {
                request.cfg.data = Y.JSON.stringify(request.cfg.data);
            }
            request.cfg = request.cfg || {};
            request.cfg.headers = request.cfg.headers || {};
            Y.mix(request.cfg.headers, DEFAULTHEADERS);

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

            Y.log("Response received from " + this.get(HOST).get('source')/* + e.cfg.request*/, "log", "Wegas.RestDataSource");

            Wegas.Editable.use(payload.response.results, // Lookup dependencies
                    Y.bind(function(payload) {
                payload.serverResponse = Wegas.Editable.revive(payload.response.results); // Revive
                this.onResponseRevived(payload);
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
            if (Lang.isArray(response)) {                 // Non-managed response: we apply the operation for each object in the returned array
                for (i = 0; i < response.length; i += 1) {
                    this.updated = this.updateCache(e.cfg.method, response[i]) || this.updated;
                }
            } else {
                for (i = 0; i < response.get("entities").length; i += 1) {      // Update the cache with the Entites in the reply body
                    entity = response.get("entities")[i];
                    if (Lang.isObject(entity)) {
                        this.updated = this.updateCache(e.cfg.method, entity) || this.updated;
                    }
                    e.response.entity = entity;                                 // Shortcut, useful if there is only one instance
                }

                for (i = 0; i < response.get("events").length; i += 1) {
                    evtPayload = {
                        serverEvent: response.get("events")[i]
                    };
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
            //Y.log("updateCache(" + method + ", " + entity + ")", "log", "Y.Wegas.DataSourceRest");
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
        /**
         * @function
         * @private
         */
        _successHandler: function(e) {
            Y.log("Datasource reply:" + e.response, 'log', 'Y.Wegas.DataSourceRest');
        },
        /**
         * @function
         * @private
         */
        _failureHandler: function(e) {
            //console.log("DataSourceRest._failureHandler", e);
            Y.log("Exception while sending request \"" + (e.request || "") + "\": "
                    + (e.response.results.message || e.response.results.exception || e), "error", 'Y.Wegas.DataSourceRest');
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
        clearCache: function() {
            var i, cache = this.getCache();
            for (i = 0; i < cache.length; i = i + 1) {
                cache[i].destroy();
            }
            cache.length = 0;

            this.get(HOST).fire("update");
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
        doFind: function(key, needle, onFindFn, stack) {
            //Y.log("doFind(" + needle + ")", 'log', 'Y.Wegas.DataSourceRest');
            var onWalkFn = Y.bind(this.doFind, this, key, needle, onFindFn);

            this.ret = null;

            Y.Array.find(stack, function(item, index, array) {
                if (this.testEntity(item, key, needle)) {                       // We check the current element if it's a match
                    if (onFindFn) {
                        onFindFn(item, needle, index, array);
                    }
                    this.ret = item;
                    return true;
                }
                return this.walkEntity(item, onWalkFn);
            }, this);
            return this.ret;
        },
        /**
         * This method is used to walke down an entity hierarchy, can be overriden
         * by childrn to extend look capacities. Used in Y.Wegas.GameModelDataSourceRest
         * and Y.Wegas.VariableDescriptorDataSourceRest
         * @function
         * @private
         */
        walkEntity: function(entity, callback) {
            //Y.log("walkEntity(" + entity + ")", 'log', 'Y.Wegas.DataSourceRest');
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
        getObject: function(data) {
            this.sendRequest(this.generateRequest(data));
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
        /** @lends Y.Plugin.DataSourceREST */
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
    Y.namespace('Plugin').DataSourceREST = DataSourceREST;

    /**
     *  @name Y.Plugin.CRDataSource
     *  @class Content repository dataSource REST plugin.
     *  @extends Y.Plugin.DataSourceREST
     *  @constructor
     */
    var CRDataSource = function() {
        CRDataSource.superclass.constructor.apply(this, arguments);
    };

    Y.extend(CRDataSource, DataSourceREST, {}, {
        /** @lends Y.Plugin.CRDataSource */
        NS: "rest",
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
     *  @name Y.Plugin.VariableDescriptorDataSourceREST
     *  @class adds management of entities of type Y.Wegas.persistence.VariableDescriptor
     *  @extends Y.Plugin.DataSourceREST
     *  @constructor
     */
    VariableDescriptorDataSourceREST = function() {
        VariableDescriptorDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(VariableDescriptorDataSourceREST, {
        NS: "rest",
        NAME: "VariableDescriptorDataSourceREST"
    });

    Y.extend(VariableDescriptorDataSourceREST, DataSourceREST, {
        /** @lends Y.Plugin.VariableDescriptorDataSourceREST# */

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
            }, this);
        },
        /**
         * @function
         * @private
         */
        walkEntity: function(entity, callback) {
            if (entity.get && entity.get("items")) {
                if (callback(entity.get("items"))) {
                    return true;
                }
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
                return this.find(ID, entity.get("descriptorId") * 1, function(found, needle) {
                    var i, instances = found.get("scope").get("variableInstances");

                    for (i in instances) {
                        if (instances[i].get(ID) === entity.get(ID)) {
                            instances[i].setAttrs(entity.getAttrs());
                        }
                    }
                    return true;
                });
            } else if (entity instanceof Wegas.persistence.VariableDescriptor) {
                return VariableDescriptorDataSourceREST.superclass.updateCache.apply(this, arguments);
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
                VariableDescriptorDataSourceREST.superclass.put.call(this, data, callback);
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
        }
    });

    Y.namespace('Plugin').VariableDescriptorDataSourceREST = VariableDescriptorDataSourceREST;

    /**
     *  @name Y.Plugin.GameModelDataSourceREST
     *  @class adds management of entities of type Y.Wegas.persistence.GameModel
     *  @extends Y.Plugin.DataSourceREST
     *  @constructor
     */
    GameModelDataSourceREST = function() {
        GameModelDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(GameModelDataSourceREST, {
        NS: "rest",
        NAME: "GameModelDataSourceREST"
    });

    Y.extend(GameModelDataSourceREST, DataSourceREST, {
        /*
         *  @fixme so we can delect scriptlibrary elemnt and still treat the reply as an gamemodel updated event
         */
        beforeResponse: function(e) {
            if (e.request.indexOf("ScriptLibrary") !== -1) {
                e.cfg.method = POST;
            }
            GameModelDataSourceREST.superclass.beforeResponse.call(this, e);
        },
        getCurrentGameModel: function() {
            return this.findById(Wegas.app.get('currentGameModel'));
        }
    });
    Y.namespace('Plugin').GameModelDataSourceREST = GameModelDataSourceREST;

    /**
     *  @name Y.Plugin.GameDataSourceREST
     *  @class adds management of entities of type Y.Wegas.persistence.Game
     *  @extends Y.Plugin.DataSourceREST
     *  @constructor
     */
    GameDataSourceREST = function() {
        GameDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(GameDataSourceREST, {
        NS: "rest",
        NAME: "GameDataSourceREST"
    });

    Y.extend(GameDataSourceREST, DataSourceREST, {
        walkEntity: function(entity, callback) {
            if (entity instanceof Wegas.persistence.Game) {
                if (callback(entity.get("teams"))) {
                    return true;
                }
            }
            if (entity instanceof Wegas.persistence.Team) {
                if (callback(entity.get("players"))) {
                    return true;
                }
            }
            if (entity.get && entity.get("items")) {
                if (callback(entity.get("items"))) {
                    return true;
                }
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
                GameDataSourceREST.superclass.post.call(this, entity, parentData, callback);
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
    Y.namespace('Plugin').GameDataSourceREST = GameDataSourceREST;

    /**
     *  @name Y.Plugin.UserDataSourceREST
     *  @class adds management of entities of type Y.Wegas.persistence.User
     *  @extends Y.Plugin.DataSourceREST
     *  @constructor
     */
    var UserDataSourceREST = function() {
        UserDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.extend(UserDataSourceREST, DataSourceREST, {
        walkEntity: function(entity, callback) {
            if (entity.get("accounts")) {
                if (callback(entity.get("accounts"))) {
                    return true;
                }
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
                VariableDescriptorDataSourceREST.superclass.put.call(this, data, callback);
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
        NS: "rest",
        NAME: "UserDataSourceREST",
        ATTRS: {
            currentUser: {
                getter: function() {
                    return this.findById(Wegas.app.get("currentUser").id);
                }
            }
        }
    });
    Y.namespace('Plugin').UserDataSourceREST = UserDataSourceREST;

    /**
     * @name Y.Plugin.PageDataSourceREST
     * @extends Y.Plugin.Base
     * @class
     * @constructor
     */
    PageDataSourceREST = function() {
        PageDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(PageDataSourceREST, {
        NS: "rest",
        NAME: "PageDataSourceREST"
    });

    Y.extend(PageDataSourceREST, Y.Plugin.Base, {
        /** @lends Y.Plugin.PageDataSourceREST# */

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
                'Content-Type': 'application/json;charset=ISO-8859-1'
            });

            return this.get(HOST).sendRequest(requestCfg);
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
                    method: 'PUT',
                    data: Y.JSON.stringify(pe)
                },
                callback: callback
            });
        },
        /**
         * @function
         */
        post: function(entity, callback) {
            var pe = Y.clone(entity);
            delete pe["@pageId"];
            this.sendRequest({
                request: "new",
                cfg: {
                    method: POST,
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
            patch = dmp.patch_toText(dmp.patch_make(Y.JSON.stringify(oldPage), Y.JSON.stringify(newPage)));
            this.sendRequest({
                request: "" + pageId,
                cfg: {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'text/plain;charset=ISO-8859-1'
                    },
                    data: patch
                },
                callback: callback
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
        getPage: function(pageId) {
            var page = null;
            if (this.getCache(pageId)) {
                page = Y.clone(this.getCache(pageId));
                page["@pageId"] = pageId;
            } else if (!this.pageQuery[pageId]) {
                this.pageQuery[pageId] = true;
                this.sendRequest({
                    request: "" + pageId,
                    sync: true
                });
            }

            return page;
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
            try {
                console.error(e.error.message);
            } catch (ex) {
                Y.error("PageDatasource reply:", e, 'Y.Wegas.DataSourceRest');
            }
        }
    });
    Y.namespace('Plugin').PageDataSourceREST = PageDataSourceREST;

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
        if (Lang.isString(request)) {
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
