/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-datasourcerest', function(Y) {
	 
    var Lang = Y.Lang,
    VariableDescriptorDataSourcePlugin,
    
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
            var data = this.get('host').data;
            if (e.response.results[1] && e.response.results[1].errors) {        // We have errors in the reply
                var errorMsg = "";
	    
                for (var i = 0; i<e.response.results.length;i++) {
                    if (e.response.results[i].errors){
                        for (var j=0; j<e.response.results[i].errors.length;j++) {
                            errorMsg += e.response.results[i].errors[j];
                        }
                    }
                }
                alert(errorMsg);
            } else {                                                            // Treat reply
                for (var i=0;i<e.response.results.length;i++) {
                    var cEl = e.response.results[i];
                    if (cEl['@class'] == "StringVariableInstance")  {
                        
                        Y.Array.each(data, function(o, index, a) {
                            for (var i in o.scope.variableInstances) {
                                if (o.scope.variableInstances[i].id == cEl.id) {
                                    o.scope.variableInstances[i] = Y.merge(o.scope.variableInstances[i], cEl);                                
                                }
                            }
                        });
                    } else {
                        
                        var loaded = false;
                        /* data = Y.Array.filter(this._data, function(o){
                            return !(o.id == e.response.results[i].id);
                        }, this);
                        */
                        Y.Array.each(data, function(o, index, a) {
                            if (o.id == cEl.id) {
                                a[index] = Y.merge(o, cEl);
                                loaded = true
                            }
                        });
                        if (!loaded) data.push(cEl);
                        
                    }
                }
            //this._data = this._data.concat(e.response.results);
            }
	    
            e.response.results = data;
        },
        getCachedVariables: function() {
            var host = this.get('host');
            return host.data;
        },
        getCachedVariableById: function(id) {
            var host = this.get('host');
            for (var i in host.data) {                                          // We first check in the cache if the data is available
                if (host.data[i].id == id) {
                    return host.data[i];
                }
            }
            return null;
        },
        getCachedVariableBy: function(key, val) {
            var host = this.get('host');
            for (var i in host.data) {                                          // We first check in the cache if the data is available
                if (host.data[i][key] == val) {
                    return host.data[i];
                }
            }
            return null;
        },
        getCachedVariablesBy: function(key, val) {
            var host = this.get('host'),
            ret = [];
            for (var i in host.data) {                                          // We first check in the cache if the data is available
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
        put: function(data) {
            var host = this.get('host'),
            request = (data.id)?"/"+data.id:"";
              
            if (data['@class'] == 'StringVariableInstance') {
                request = '/1/varinst/'+data.id;
            }
            
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
        post: function(data) {
            var host = this.get('host');
	    
            host.sendRequest({
                //request: (data.id)?"/"+data.id:"",
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
            //alert("Error sending REST post request!");
            var errorMsg = "";
	    
            if (e.response.results) {
                for (var i = 0; i<e.response.results.length;i++) {
                    if (e.response.results[i].errors){
                        for (var j=0; j<e.response.results[i].errors.length;j++) {
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
    
    
    DataSourceVariableDescriptorREST = function() {
        DataSourceVariableDescriptorREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(DataSourceVariableDescriptorREST, {
        NS: "rest",
        NAME: "DataSourceVariableDescriptorREST"
    });

    Y.extend(DataSourceVariableDescriptorREST, DataSourceREST, {
        
        post: function(data) {
            /* switch (data['@class']) {
                case 'ListVariableDescriptor':
                    data['defaultVariableInstance'] = data.defaultListVariableInstance;
                    break;
                case 'StringVariableDescriptor':
                    data['defaultVariableInstance'] = data.defaultStringVariableInstance;
                    break;
            };
            delete data.defaultListVariableInstance;
            delete data.defaultStringVariableInstance;*/
            DataSourceVariableDescriptorREST.superclass.post.call(this, data);
        },
        
        getInstanceBy: function(key, val) {
            var el = this.getCachedVariableBy(key, val);
            switch (el.scope['@class']) {
                case 'UserScope':
                    return el.scope.variableInstances[Y.Wegas.app.get('currentUserId')];
                    break;
                case 'TeamScope':
                    return el.scope.variableInstances[Y.Wegas.app.get('currentTeamId')];
                    break;
                case 'GameScope':
                    return el.scope.variableInstances[0];
                    break;  
            }
        }
    });
    
    Y.namespace('Plugin').DataSourceVariableDescriptorREST = DataSourceVariableDescriptorREST;
    	
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
    
    // FIXME we rewrite this function, needs to be overriden
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