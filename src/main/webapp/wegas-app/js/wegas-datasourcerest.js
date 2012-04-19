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
            'Content-Type': 'application/json; charset=utf-8'
        };

    DataSourceREST = function () {
        DataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(DataSourceREST, {
        NS: "rest",
        NAME: "DataSourceREST"
    });

    Y.extend(DataSourceREST, Y.Plugin.Base, {

        initializer: function () {
            //this.doBefore("_defRequestFn", this._beforeDefRequestFn);
            this.doBefore("_defResponseFn", this._beforeDefResponseFn, this);
            this.get('host').data = [];
        },

        applyOperation: function (method, needle, stack) {
            var i;
            for (i = 0; i < stack.length; i += 1) {
                if (stack[i].id === needle.id) {
                    switch (method) {
                    case "DELETE":
                        //@fixme is there a memory leak here ??
                        stack.splice(i, 1);
                        //delete stack[i];
                        return;
                    default:
                        //stack[i] = Y.merge(stack[i], needle);
                        delete stack[i];
                        stack[i] = needle;
                        return;
                    }
                }
            }
            stack.push(needle);
        },

        _beforeDefResponseFn: function (e) {
            var cEl, i,
                data =  this.get('host').data;

            for (i = 0; i < e.response.results.length; i += 1) {                // Treat reply
                cEl = e.response.results[i];
                if (cEl) {
                    this.applyOperation(e.cfg.method, cEl, data);
                }
            }
            e.response.results = data;
        },
        getCachedVariables: function () {
            return this.get('host').data;
        },
        getCachedVariableBy: function (key, val) {
            var host = this.get('host'), i;
            for (i in host.data) {                                              // We first check in the cache if the data is available
                if (host.data.hasOwnProperty(i) && host.data[i][key] === val) {
                    return host.data[i];
                }
            }
            return null;
        },
        getCachedVariablesBy: function (key, val) {
            var host = this.get('host'), ret = [], i;
            for (i in host.data) {                                              // We first check in the cache if the data is available
                if (host.data.hasOwnProperty(i) && host.data[i][key] === val) {
                    ret.push(host.data[i]);
                }
            }
            return ret;
        },
        getCachedVariableById: function (id) {
            return this.getCachedVariableBy("id", id  * 1);                     // Cast to number
        },

        getById: function (id) {
            var host = this.get('host');

            host.sendRequest({
                request: "/" + id,
                cfg: {
                    headers: DEFAULTHEADERS
                },
                callback: {
                    success: this._successHandler,
                    failure: this._failureHandler
                }
            });

        },

        sendRequest: function (request, cfg, data, callback) {
            callback = callback || {
                success: this._successHandler,
                failure: this._failureHandler
            };
            cfg = cfg || {};
            cfg.headers =  cfg.headers || DEFAULTHEADERS;
            if (data) {
                cfg.data = Y.JSON.stringify(data);
            }
            this.get('host').sendRequest({
                request: request,
                cfg: cfg,
                callback: callback
            });
        },
        getRequest: function (request) {
            this.sendRequest('/' + request);
        },
        /**
         * @fixme the parameters should be (request, data, parentData)
         */
        post: function (data, parentData, request) {
            request = request || ((parentData) ? "/" + parentData.id + "/" + data["@class"] :  "");

            this.sendRequest(request, {
                method: "POST"
            }, data);
        },
        generateRequest: function (data) {
            return "/" + data.id;
        },
        put: function (data) {
            this.sendRequest(this.generateRequest(data), {
                method: "PUT"
            }, data);
        },
        deleteObject: function (data) {
            this.sendRequest(this.generateRequest(data), {
                method: "DELETE"
            });
        },
        _successHandler: function (e) {
            Y.log("Datasource reply:" + e.response, 'log', 'Y.Wegas.DataSourceRest');
            //data = Y.JSON.stringify(e.response, null, 2);
        },
        _failureHandler: function (e) {
            alert("Error sending REST post request!");
            var errorMsg = "", i, j;

            if (e.response.results) {
                for (i = 0; i < e.response.results.length; i += 1) {
                    if (e.response.results[i].errors){
                        for (j = 0; j < e.response.results[i].errors.length; j += 1) {
                            errorMsg += e.response.results[i].errors[j];
                        //   e.response.results[i].errors = null;
                        }
                    }
                }
                alert(errorMsg);
            } else if (e.error) {
                alert(e.error.message);
            }
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

        _beforeDefResponseFn: function (e) {
            var cEl, i,
                data = this.get('host').data;                                   // Treat reply

            Y.log("Response received", "info", "Y.Wegas.VariableDescriptorDataSourceREST");

            for (i = 0; i < e.response.results.length; i += 1) {
                cEl = e.response.results[i];
                if (!cEl) {
                } else if (cEl['@class'] === "StringInstance" ||
                    cEl['@class'] === "NumberInstance" ||
                    cEl['@class'] === "InboxInstance"||
                    cEl['@class'] === "MCQInstance") {

                    Y.Array.each(data, function (o) {
                        var j;
                        for (j in o.scope.variableInstances) {
                            if (o.scope.variableInstances.hasOwnProperty(j) && o.scope.variableInstances[j].id === cEl.id) {
                                o.scope.variableInstances[j] = Y.merge(o.scope.variableInstances[i], cEl);
                            }
                        }
                    });
                } else {
                    this.applyOperation(e.cfg.method, cEl, data);
                }
            }
            e.response.results = data;
        },
        put: function (data, request) {
            request = request || ((data.id) ? "/" + data.id : "");

            switch (data['@class']) {
            case 'StringInstance':
            case 'MCQInstance':
            case 'NumberInstance':
            case 'InboxInstance':
                request = '/1/VariableInstance/' + data.id;
                break;
            }

            VariableDescriptorDataSourceREST.superclass.put.call(this, data, request);
        },
        getInstanceById: function (id) {
            return this.getInstanceBy('id', id);
        },
        getInstanceBy: function (key, val) {
            var el = this.getCachedVariableBy(key, val);
            if (!el) {
                return null;
            }
            switch (el.scope['@class']) {
                case 'PlayerScope':
                    return el.scope.variableInstances[Y.Wegas.app.get('currentPlayer')];
                case 'TeamScope':
                    return el.scope.variableInstances[Y.Wegas.app.get('currentTeam')];
                case 'GameModelScope':
                case 'GameScope':
                    return el.scope.variableInstances[0];
            }
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
        _beforeDefResponseFn: function (e) {
            var cEl, i,
                data = this.get('host').data;                                   // Treat reply

            for (i = 0; i < e.response.results.length; i += 1) {
                cEl = e.response.results[i];
                if (!cEl) {

                } else if (cEl['@class'] === "Team") {
                    //@TODO is this case still in use ??
                } else {
                    this.applyOperation(e.cfg.method, cEl, data);
                }
            }
            e.response.results = data;
        },
        put: function (data, request) {
            GameModelDataSourceREST.superclass.put.call(this, data, request);
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

        _beforeDefResponseFn: function (e) {
            var cEl, i, game, team,
                data = this.get('host').data;                                  // Treat reply

            Y.log("Response received", "info", "Y.Wegas.GameDataSourceREST");

            for (i = 0; i < e.response.results.length; i += 1) {
                cEl = e.response.results[i];

                if (!cEl) {

                } else if (cEl['@class'] === "Team") {
                    game = this.getCachedVariableBy('id', cEl.gameId);
                    this.applyOperation(e.cfg.method, cEl, game.teams);

                } else if (cEl['@class'] === "Player") {
                    team = this.getTeamById(cEl.teamId);
                    this.applyOperation(e.cfg.method, cEl, team.players);

                } else {
                    this.applyOperation(e.cfg.method, cEl, data);
                }
            }
            e.response.results = data;
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
        post: function (data, parentData, request) {
            if (data['@class'] === 'Player') {
                request = "/" + this.getGameByTeamId(parentData.id).id + "/Team/" + parentData.id + "/Player";
            }
            GameDataSourceREST.superclass.post.call(this, data, parentData, request);
        },

        deleteObject: function (data, callback) {
            if (data['@class'] === 'Team') {
                this.sendRequest('/' + data.gameId + '/Team/' + data.id, {
                    method: "DELETE"
                });
            } else if (data['@class'] === 'Player') {
                this.sendRequest("/" + data.id, {
                    method: "DELETE"
                });
            } else {
                GameDataSourceREST.superclass.deleteObject.call(this, data, callback);
            }
        },
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
            var i, j, k, data = this.get('host').data;

            playerId = playerId * 1;                                            // Convert to number

            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].teams.length; j += 1) {
                    for (k = 0; k < data[i].teams[j].players.length; k += 1) {
                        if (data[i].teams[j].players[k].id === playerId) {
                            return data[i].teams[j].players[k];
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
            var i, j, data = this.get('host').data;

            teamId = teamId * 1;                                                // Convert to number

            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].teams.length; j += 1) {
                    if (data[i].teams[j].id === teamId) {
                        return data[i].teams[j];
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
                            data_out.results = [results];
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

    //FIXME Hack so plugin host accepts string definition of classes
    Y.DataSource.IO.prototype.plug = function(Plugin, config) {
        var i, ln, ns;

        if (Lang.isArray(Plugin)) {
            for (i = 0, ln = Plugin.length; i < ln; i++) {
                this.plug(Plugin[i]);
            }
        } else {
            if (Plugin && !Lang.isFunction(Plugin)) {
                config = Plugin.cfg;
                Plugin = Plugin.fn;
            }
            if (Plugin && !Lang.isFunction(Plugin)) {			// !Added
                Plugin = Y.Plugin[Plugin];
            }

            // Plugin should be fn by now
            if (Plugin && Plugin.NS) {
                ns = Plugin.NS;

                config = config || {};
                config.host = this;

                if (this.hasPlugin(ns)) {
                    // Update config
                    this[ns].setAttrs(config);
                } else {
                    // Create new instance
                    this[ns] = new Plugin(config);
                    this._plugins[ns] = Plugin;
                }
            }
        }
        return this;
    };

});