/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-datasourcerest', function(Y) {
	 
    var Lang = Y.Lang,
    VariableDescriptorDataSourceREST,
    GameModelDataSourceREST,
    
    DataSourceREST = function() {
        DataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(DataSourceREST, {
        NS: "rest",
        NAME: "DataSourceREST"
    });

    Y.extend(DataSourceREST, Y.Plugin.Base, {
	
        _data: [],
	
        initializer: function(config) {
            //this.doBefore("_defRequestFn", this._beforeDefRequestFn);
            this.doBefore("_defResponseFn", this._beforeDefResponseFn, this);
            this.get('host').data = [];
        },
        _beforeDefRequestFn: function(e) {
        },
        _beforeDefResponseFn: function(e) {
            var data = this.get('host').data,                                   
            cEl, loaded, i=0;
            for (;i<e.response.results.length;i++) {                     // Treat reply
                cEl = e.response.results[i];
                if (!cEl) {
                    
                } else {
                    loaded = false;
                    Y.Array.each(data, function(o, index, a) {
                        if (o.id == cEl.id) {
                            a[index] = Y.merge(o, cEl);
                            loaded = true
                        }
                    });
                    if (!loaded) data.push(cEl);
                        
                }
            }
            e.response.results = data;
        },
        getCachedVariables: function() {
            var host = this.get('host');
            return host.data;
        },
        getCachedVariableById: function(id) {
            var host = this.get('host'), i;
            for (i in host.data) {                                          // We first check in the cache if the data is available
                if (host.data[i].id == id) {
                    return host.data[i];
                }
            }
            return null;
        },
        getCachedVariableBy: function(key, val) {
            var host = this.get('host'), i;
            for (i in host.data) {                                          // We first check in the cache if the data is available
                if (host.data[i][key] == val) {
                    return host.data[i];
                }
            }
            return null;
        },
        getCachedVariablesBy: function(key, val) {
            var host = this.get('host'),
            ret = [], i;
            for (i in host.data) {                                          // We first check in the cache if the data is available
                if (host.data[i][key] == val) {
                    ret.push(host.data[i]);
                }
            }
            return ret;
        },
        getById: function(id) {  
            var host = this.get('host');
            
            host.sendRequest({
                request: "/"+id,
                cfg: {
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                },
                callback: {
                    success: this._successHandler,
                    failure: this._failureHandler
                }
            });
	    
        },
        getRequest: function(request) {
            var host = this.get('host');
              
            host.sendRequest({
                request: '/'+request,
                cfg: {
                    method: "GET",
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    }
                },
                callback: {
                    success: this._successHandler,
                    failure: this._failureHandler
                }
            });
        },
        put: function(data, request) {
            var host = this.get('host');
            
            request = request || ((data.id)?"/"+data.id:"")
            
            host.sendRequest({
                request: request,
                cfg: {
                    method: "PUT",
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    data: Y.JSON.stringify(data)
                },
                callback: {
                    success: this._successHandler,
                    failure: this._failureHandler
                }
            });
        },
        post: function(data, parentData) {
            var host = this.get('host'),
            request = (parentData)? "/"+parentData.id+"/"+data["@class"] :  "" ;
	    
            host.sendRequest({
                request: request,
                cfg: {
                    method: "POST",
                    headers: {
                        'Content-Type': 'application/json; charset=utf-8'
                    },
                    data: Y.JSON.stringify(data)
                },
                callback: {
                    success: this._successHandler,
                    failure: this._failureHandler
                }
            });
        },
        _successHandler: function(e){
            Y.log("Datasource reply:"+ e.response, 'log', 'Wegas.DataSourceRest');
        //data = Y.JSON.stringify(e.response, null, 2);
        // host.sendRequest('/');
        },
        _failureHandler: function(e){
            alert("Error sending REST post request!");
            var errorMsg = "",
            i = 0, j
	    
            if (e.response.results) {
                for (; i<e.response.results.length;i++) {
                    if (e.response.results[i].errors){
                        for (j=0; j<e.response.results[i].errors.length;j++) {
                            errorMsg += e.response.results[i].errors[j];
                        //   e.response.results[i].errors = null;
                        }
                    }
                }
                alert(errorMsg);
            } else if (e.error) alert(e.error.message);
        }
        
    });
    
    Y.namespace('Plugin').DataSourceREST = DataSourceREST;
    
    VariableDescriptorDataSourceREST = function() {
        VariableDescriptorDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(VariableDescriptorDataSourceREST, {
        NS: "rest",
        NAME: "VariableDescriptorDataSourceREST"
    });

    Y.extend(VariableDescriptorDataSourceREST, DataSourceREST, {
        
        _beforeDefResponseFn: function(e) {
            var data = this.get('host').data,                                   // Treat reply
            cEl, i=0, loaded;
            for (;i<e.response.results.length;i++) {
                cEl = e.response.results[i];
                if (!cEl) {
                } else if (cEl['@class'] == "StringVariableInstance" ||
                    cEl['@class'] == "NumberVariableInstance"||
                    cEl['@class'] == "MCQVariableInstance")  {
                        
                    Y.Array.each(data, function(o, index, a) {
                        for (var i in o.scope.variableInstances) {
                            if (o.scope.variableInstances[i].id == cEl.id) {
                                o.scope.variableInstances[i] = Y.merge(o.scope.variableInstances[i], cEl);                                
                            }
                        }
                    });
                } else {
                    loaded = false;
                    Y.Array.each(data, function(o, index, a) {
                        if (o.id == cEl.id) {
                            a[index] = Y.merge(o, cEl);
                            loaded = true
                        }
                    });
                    if (!loaded) data.push(cEl);
                        
                }
            }
            e.response.results = data;
        },
        put: function(data) {
            var request = (data.id)?"/"+data.id:"";
            
            switch (data['@class']) {
                case 'StringVariableInstance' :
                case 'MCQVariableInstance' :
                case 'NumberVariableInstance' :
                    
                    request = '/1/varinst/'+data.id;
                    break;
            }
            
            VariableDescriptorDataSourceREST.superclass.put.call(this, data, request);
        },
        getInstanceById: function(id) {
            return this.getInstanceBy('id', id);
        },
        getInstanceBy: function(key, val) {
            var el = this.getCachedVariableBy(key, val);
            if (!el) return null;
            switch (el.scope['@class']) {
                case 'PlayerScope':
                    return el.scope.variableInstances[Y.Wegas.app.get('currentPlayer')];
                    break;
                case 'TeamScope':
                    return el.scope.variableInstances[Y.Wegas.app.get('currentTeam')];
                    break;
                case 'GameModelScope':
                case 'GameScope':
                    return el.scope.variableInstances[0];
                    break;  
            }
        }
    });
    
    Y.namespace('Plugin').VariableDescriptorDataSourceREST = VariableDescriptorDataSourceREST;
    
    
    GameModelDataSourceREST = function() {
        GameModelDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(GameModelDataSourceREST, {
        NS: "rest",
        NAME: "GameModelDataSourceREST"
    });

    Y.extend(GameModelDataSourceREST, DataSourceREST, {
        _beforeDefResponseFn: function(e) {
            var data = this.get('host').data,                                   // Treat reply
            cEl, i=0, loaded;
            for (;i<e.response.results.length;i++) {
                cEl = e.response.results[i];
                if (!cEl) {
                    
                } else if (cEl['@class'] == "Team" )  {
                    Y.Array.each(data, function(o, index, a) {
                        for (var j in o.teams) {
                            if (o.teams[j].id == cEl.id) {
                                o.teams[j] = Y.merge(o.teams, cEl);                                
                            }
                        }
                    });
                } else {
                    loaded = false;
                    Y.Array.each(data, function(o, index, a) {
                        if (o.id == cEl.id) {
                            a[index] = Y.merge(o, cEl);
                            loaded = true
                        }
                    });
                    if (!loaded) data.push(cEl);
                        
                }
            }
            e.response.results = data;
        },
        put: function(data) {
              
            if (data['@class'] == 'Team' ) {
                request = '/1/team/'+data.id;
            }
            
            GameModelDataSourceREST.superclass.put.call(this, data, request);
        },
        getGameById: function(gameId) {
            this.getCachedVariable
        },
        
        getGameBy: function(key, val) {
        }
    });
    
    Y.namespace('Plugin').GameModelDataSourceREST = GameModelDataSourceREST;
    
    GameDataSourceREST = function() {
        GameDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(GameDataSourceREST, {
        NS: "rest",
        NAME: "GameDataSourceREST"
    });

    Y.extend(GameDataSourceREST, DataSourceREST, {
        _beforeDefResponseFn: function(e) {
            var data = this.get('host').data,                                   // Treat reply
            cEl, i=0, loaded, game;
            for (;i<e.response.results.length;i++) {
                cEl = e.response.results[i];
                loaded = false;
                if (!cEl) {
                    
                } else if (cEl['@class'] == "Team" )  {
                    game = this.getCachedVariableBy('id', cEl.gameId);
                    for (var j=0;j<game.teams.length;j++) {
                        if (game.teams[j].id == cEl.id) {
                            game.teams[j] = cEl; 
                            loaded = true;
                        }
                    }
                    if (!loaded) game.teams.push(cEl);
                } else if (cEl['@class'] == "Player" )  {
                    for (var f=0;f<data.length;f++) {
                        for (var j=0;j<data[f].teams.length;j++) {
                            for (var k=0;k<data[f].teams[j].players.length;k++) {
                                if (data[f].teams[j].players[k].id == cEl.id) {
                                    data[f].teams[j].players[k] = cEl;
                                    loaded = true;
                                }
                            }
                        }
                    }
                } else {
                    loaded = false;
                    Y.Array.each(data, function(o, index, a) {
                        if (o.id == cEl.id) {
                            a[index] = Y.merge(o, cEl);
                            loaded = true
                        }
                    });
                    if (!loaded) data.push(cEl);
                        
                }
            }
            e.response.results = data;
        },
        put: function(data, request) {
              
            if (data['@class'] == 'Team' ) {
                /* @fixme */
                request = '/'+data.gameId+'/Team/'+data.id;
            } else if (data['@class'] == 'Player' ) {
                /* @fixme */
                request = '/1/player/'+data.id;
            }
            
            GameModelDataSourceREST.superclass.put.call(this, data, request);
        },
        getCurrentGame: function() {
            return this.getCachedVariableById(Y.Wegas.app.get('currentGame'));
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