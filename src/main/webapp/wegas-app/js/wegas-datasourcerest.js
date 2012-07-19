/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-datasourcerest', function (Y) {
    "use strict";

    var Lang = Y.Lang,
    DataSourceREST,
    VariableDescriptorDataSourceREST,
    GameModelDataSourceREST,
    GameDataSourceREST,
    DEFAULTHEADERS = {
        'Content-Type': 'application/json; charset=utf-8',
        'Managed-Mode': 'true'
    };
    /**
     *  @class DataSourceREST
     *  @module Wegas
     *  @constructor
     */
    DataSourceREST = function () {
        DataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(DataSourceREST, {
        NS: "rest",
        NAME: "DataSourceREST"
    });

    Y.extend(DataSourceREST, Y.Plugin.Base, {

        initializer: function () {
            this.doBefore("_defResponseFn", this.beforeResponse, this);
            this.get('host').data = [];
        },


        /// *** Server requests methods *** //
        sendRequest: function (requestCfg) {
            requestCfg.callback = requestCfg.callback || {
                success: this._successHandler,
                failure: this._failureHandler
            };
            requestCfg.cfg = requestCfg.cfg || {};
            requestCfg.cfg.headers =  requestCfg.cfg.headers || DEFAULTHEADERS;

            this.get('host').sendRequest(requestCfg);
        },


        beforeResponse: function (e) {
            Y.log("Response received from " + this.get('host').get('source')/* + e.cfg.request*/, "info", "Wegas.RestDataSource");
            e.data = this.getCache();
            e.serverResponse = Y.Wegas.persistence.Entity.revive(e.response.results);

            if (Lang.isArray(e.serverResponse)) {                               // Non-managed response: we apply the operation for each object in the returned array
                for (i = 0; i < e.serverResponse.length; i += 1) {
                    this.updateCache(e.cfg.method, e.serverResponse[i], this.getCache());
                }
            } else {
                for (i = 0; i < e.serverResponse.get("entities").length; i += 1) {       // Update the cache with the Entites in the reply body
                    this.updateCache(e.cfg.method, e.serverResponse.get("entities")[i], this.getCache());
                }

                for (i = 0; i < e.serverResponse.get("events").length; i += 1) {
                    evt = e.serverResponse.get("events")[i];
                    if (evt.get('@class') == "EntityUpdatedEvent") {
                        for (i = 0; i < evt.updatedEntities.length; i += 1) {         // Update the cache with the entites in the reply
                            this.updateCache("POST", evt.updatedEntities[i], this.getCache());
                        }
                    }
                }
            }

        },

        /**
         *  @method updateCache
         *  @param {String} method Possible values for method are: POST, PUT, DELETE, default being PUT.
         *  @param {entity} The entity to update in the cache
         *  @return {Boolean} `true` if object could be located and method applied
         *  @for DataSourceREST
         */
        updateCache: function (method, entity) {
            var ret = false;

            switch (method) {
                case "DELETE":
                    ret = this.find("id", entity, function(entity, needle, index, stack) {
                        stack.splice(index, 1);
                        return true;
                    });
                    break;
                default:
                    ret = this.find("id", entity, function(entity, needle) {
                        entity.setAttrs(needle.getAttrs());
                        return true;
                    });
                    break;
            }
            if (!ret) {
                this.getCache().push(entity);
            };
        },

        _successHandler: function (e) {
            Y.log("Datasource reply:" + e.response, 'log', 'Y.Wegas.DataSourceRest');
        },
        _failureHandler: function (e) {
            //console.log("DataSourceRest._failureHandler", e);
            Y.error("Datasource reply:" + e, 'Y.Wegas.DataSourceRest');
        },

        /// *** Cache methods *** //



        /**
         * @deprecated, here for retrocompatibility
         */
        getCachedVariableBy: function (key, val) {
            Y.log("Function getCachedVariableBy() is deprecated, use find(key, val)");
            return this.find(key, val);
        },
        getCachedVariablesBy: function (key, val) {
            Y.log("Function getCachedVariablesBy() is deprecated, use filter(key, val)");
            return this.filter(key, val);
        },
        getCachedVariableById: function (id) {
            Y.log("Function getCachedVariableById() is deprecated, use findById(key, val)");
            return this.findById(id);                     // Cast to number
        },

        /**
         * Retrieves all entities stored in the cache.
         */
        getCache: function () {
            return this.get('host').data;
        },

        /**
         * Retrieves an entity from the cache
         *
         *  @method find
         *  @for DataSourceREST
         */
        find: function(key, needle, onFindFn) {
            return this.doFind(this.getCache(), key, needle,  onFindFn);
        },
        /**
         * Retrieves an entity from the cache
         */
        findById: function (id) {
            return this.find("id", id  * 1);                              // Cast to number
        },
        /**
         * Retrieves a list of entities from the cache
         */
        filter: function (key, val) {
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
         *  @method doFind
         *  @param {String} method Possible values for method are: POST, PUT, DELETE, default being PUT.
         *  @param {entity} The entity to update in the cache
         *  @return {Boolean} `true` if object could be located and method applied
         *  @for DataSourceREST
         */
        doFind: function(stack, key, needle, onFindFn) {
            return Y.Array.find(stack, function(item, index, array) {
                if (this.testEntity(item, key, needle)) {                       // We check the current element if it's a match
                    if (onFindFn) {
                        onFindFn(item, needle, array);
                    }
                    return true;
                }
                return this.walkEntity(item, Y.bind(this.findBy, this, needle, stack, key, onFindFn));
            }, this);
        },

        /**
         *
         */
        walkEntity: function(item, callback) {
            var acc = false;
            if (item.get && item.get("items")) {
            // acc = callback(this.get("items"));
            }
            return acc;
        },

        /**
         *
         */
        testEntity: function(entity, key, needle) {
            var value = ( entity.get ) ? entity.get(key) : entity[key],          // Normalize item and needle values
            needleValue = (needle.get) ? needle.get(key) :  (typeof needle === 'object') ? needle[key] : needle;

            return value === needleValue;
        },


        /* @deprecated from here */
        generateRequest: function (data) {
            return "/" + data.id;
        },

        post: function (data, parentData, callback) {

            var request = (parentData) ? "/" + parentData.id + "/" + data["@class"] : "/";

            this.sendRequest({
                request: request,
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify(data)
                },
                callback: callback
            });
        },

        getObject: function (data) {
            this.sendRequest(this.generateRequest(data));
        },
        put: function (data, callback) {
            this.sendRequest({
                request: this.generateRequest(data),
                cfg: {
                    method: "PUT",
                    data: Y.JSON.stringify(data)
                },
                callback: callback
            });
        },
        deleteObject: function (data) {
            this.sendRequest({
                request: this.generateRequest(data),
                cfg: {
                    method: "DELETE"
                }
            });
        }

    });

    Y.namespace('Plugin').DataSourceREST = DataSourceREST;

    VariableDescriptorDataSourceREST = function () {
        VariableDescriptorDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(VariableDescriptorDataSourceREST, {
        NS: "rest",
        NAME: "VariableDescriptorDataSourceREST"
    });

    Y.extend(VariableDescriptorDataSourceREST, DataSourceREST, {

        applyOperation: function (method, needle, stack) {
            if (needle.get("@class").indexOf("Instance") !== -1) {
                instances = this.getCachedVariableById(cEl["descriptorId"]).scope.variableInstances;
                for (k in instances) {
                    if (instances.hasOwnProperty(k) && instances[k].id === cEl.id) {
                        instances[k] = Y.merge(instances[i], cEl);
                    }
                };
            } else if (!this.lookupAndDo(method, needle, stack)) {
                stack.push(needle);
            };
        },

        put: function (data, callback) {
            if (data['@class'].indexOf("Instance") !== -1) {
                this.sendRequest({
                    request: '/1/VariableInstance/' + data.id,
                    cfg: {
                        method: "PUT",
                        data: Y.JSON.stringify(data)
                    },
                    callback: callback
                });
                return;
            } else {
                VariableDescriptorDataSourceREST.superclass.put.call(this, data, callback);
            }
        },

        post: function (data, parentData, callback) {
            var request = "";
            if (parentData) {
                switch (parentData["@class"]) {
                    case "ListDescriptor":
                    case "QuestionDescriptor":
                        request = "/ListDescriptor/" + parentData.id;
                        break;
                    default:
                        request = "/" + parentData.id + "/VariableInstance/";
                        break;
                }
            }
            this.sendRequest({
                request: request,
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify(data)
                },
                callback: callback
            });
        }
    });

    Y.namespace('Plugin').VariableDescriptorDataSourceREST = VariableDescriptorDataSourceREST;


    GameModelDataSourceREST = function () {
        GameModelDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(GameModelDataSourceREST, {
        NS: "rest",
        NAME: "GameModelDataSourceREST"
    });

    Y.extend(GameModelDataSourceREST, DataSourceREST, {
        updateCache2: function (e) {
            var cEl, i;

            for (i = 0; i < e.response.results.entities.length; i += 1) {
                cEl = e.response.results.entities[i];
                if (!cEl) {

                } else if (cEl['@class'] === "Team") {
                //@TODO is this case still in use ??
                } else {
                    // @fixme so we can delect scriptlibrary elemnt and still treat the reply as an gamemodel updated event
                    if (e.request.indexOf("ScriptLibrary") != -1) e.cfg.method = "POST";
                    this.applyOperation(e.cfg.method, cEl, e.data);
                }
            }
        },
        getCurrentGameModel: function () {
            return this.findById(Y.Wegas.app.get('currentGameModel'))
        }
    });

    Y.namespace('Plugin').GameModelDataSourceREST = GameModelDataSourceREST;

    GameDataSourceREST = function () {
        GameDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(GameDataSourceREST, {
        NS: "rest",
        NAME: "GameDataSourceREST"
    });

    Y.extend(GameDataSourceREST, DataSourceREST, {

        updateCache2: function (e) {
            var cEl, i, game, team;                                             // Treat reply

            Y.log("Response received", "info", "Y.Wegas.GameDataSourceREST");

            for (i = 0; i < e.response.results.get("entities").length; i += 1) {
                cEl = e.response.results.get("entities")[i];

                if (!cEl) {

                } else if (cEl.get('@class') === "Team") {
                    game = this.getCachedVariableBy('id', cEl.gameId);
                    this.applyOperation(e.cfg.method, cEl, game.teams);

                } else if (cEl.get('@class') === "Player") {
                    team = this.getTeamById(cEl.teamId);
                    this.applyOperation(e.cfg.method, cEl, team.players);

                } else {
                    this.applyOperation(e.cfg.method, cEl, e.data);
                }
            }
        },
        generateRequest: function (data) {
            if (data['@class'] === 'Team') {
                return '/' + data.gameId + '/Team/' + data.id;
            } else if (data['@class'] === 'Player') {
                return "/" + this.getGameByTeamId(data.teamId).id
                + '/Team/' + data.teamId + '/Player/' + data.id;
            } else {
                return "/" + data.id;
            }
        },
        post: function (data, parentData, callback) {
            if (data['@class'] === 'Player') {

                this.sendRequest({
                    request: "/" + this.getGameByTeamId(parentData.id).id + "/Team/" + parentData.id + "/Player",
                    cfg: {
                        method: "POST",
                        data: Y.JSON.stringify(data)
                    },
                    callback: callback
                });
            } else {
                GameDataSourceREST.superclass.post.call(this, data, parentData, callback);
            }
        },

        /* Util methods */
        getCurrentGame: function () {
            return this.getCachedVariableById(Y.Wegas.app.get('currentGame'));
        },
        getCurrentPlayer: function () {
            return this.getPlayerById(Y.Wegas.app.get('currentPlayer'));
        },
        getCurrentTeam: function () {
            return this.getTeamById(Y.Wegas.app.get('currentTeam'));
        },
        getPlayerById: function (playerId) {
            var i, j, k, data = this.getCache();

            playerId = playerId * 1;                                            // Convert to number

            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].get("teams").length; j += 1) {
                    for (k = 0; k < data[i].get("teams")[j].get("players").length; k += 1) {
                        if (data[i].get("teams")[j].get("players")[k].id === playerId) {
                            return data[i].get("teams")[j].get("players")[k];
                        }
                    }
                }
            }
            return null;
        },
        getGameByTeamId: function (teamId) {
            var i, j, data = this.get('host').data;

            teamId = teamId * 1;                                                // Convert to number

            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].teams.length; j += 1) {
                    if (data[i].teams[j].id === teamId) {
                        return data[i];
                    }
                }
            }
            return null;
        },
        getTeamById: function (teamId) {
            var i, j, data = this.getCache();

            teamId = teamId * 1;                                                // Convert to number

            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].get("teams").length; j += 1) {
                    if (data[i].get("teams")[j].get("id") === teamId) {
                        return data[i].get("teams")[j];
                    }
                }
            }
            return null;
        },
        getTeamByPlayerId: function (playerId) {
            var i, j, k, data = this.get('host').data;
            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].teams.length; j += 1) {
                    for (k = 0; k < data[i].teams[j].players.length; k += 1) {
                        if (data[i].teams[j].players[k].id === playerId) {
                            return data[i].teams[j];
                        }
                    }
                }
            }
            return null;
        }


    });

    Y.namespace('Plugin').GameDataSourceREST = GameDataSourceREST;

    /**
     * FIXME We redefine this so we can use a "." selector and a "@..." field name
     */
    Y.DataSchema.JSON.getPath = function(locator) {
        var path = null,
        keys = [],
        i = 0;

        if (locator) {
            if (locator == '.') return [];					// MODIFIED !!

            // Strip the ["string keys"] and [1] array indexes
            locator = locator.
            replace(/\[(['"])(.*?)\1\]/g,
                function (x,$1,$2) {
                    keys[i]=$2;
                    return '.@'+(i++);
                }).
            replace(/\[(\d+)\]/g,
                function (x,$1) {
                    keys[i]=parseInt($1,10)|0;
                    return '.@'+(i++);
                }).
            replace(/^\./,''); // remove leading dot

            // Validate against problematic characters.
            if (!/[^\w\.\$@]/.test(locator)) {
                path = locator.split('.');
                for (i=path.length-1; i >= 0; --i) {
                    /*if (path[i].charAt(0) === '@') {				// MODIFIED !!
			path[i] = keys[parseInt(path[i].substr(1),10)];
		    }*/
                    }
            }
            else {
            }
        }
        return path;
    }

    // @fixme hack on yui apis
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
        if(Y.Lang.isString(request)) {
            //if(cfg.method && (cfg.method.toUpperCase() === "POST")) {
            //    cfg.data = cfg.data ? cfg.data+request : request;
            //}
            //else {
            uri += request;
        //}
        }
        Y.DataSource.Local.transactions[e.tId] = io(uri, cfg);
        return e.tId;
    }

    // @FIXME We rewrite this function, should be overriden
    Y.DataSchema.JSON._parseResults = function(schema, json_in, data_out) {
        var results = [],
        path,
        error;

        if(schema.resultListLocator) {
            path = Y.DataSchema.JSON.getPath(schema.resultListLocator);
            if(path) {
                results = Y.DataSchema.JSON.getLocationValue(path, json_in);
                if (results === undefined) {
                    data_out.results = [];
                    error = new Error("JSON results retrieval failure");
                }
                else {
                    if(Lang.isArray(results)) {
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
    }
});