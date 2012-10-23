/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */

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
        'Content-Type': 'application/json;charset=ISO-8859-1',
        'Managed-Mode': 'true'
    };

    Y.namespace("Wegas").DataSource = Y.Base.create("datasource", Y.DataSource.IO, [], {
        sendInitialRequest: function () {
            if ( this.get( "initialRequest" ) !== undefined ) {                 // Use this condition so we allow empty strin e.g. ""
                var sender = ( this.rest ) ? this.rest : this;
                return sender.sendRequest({
                    request: this.get( "initialRequest" )
                });
            } else {
                return null;
            }
        }
    }, {
        ATTRS: {
            initialRequest: {}
        }
    });

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
            this.get('host').data = [];

            this.doBefore( "_defResponseFn", this.beforeResponse, this );       // When the host receives some result, we parse the result
            this.afterHostEvent( "sourceChange", this.clearCache, this );       // When the source changes, we clear the cache
        },

        /**
         * Server requests methods
         *
         * @method sendRequest
         */
        sendRequest: function ( requestCfg ) {
            requestCfg.callback = requestCfg.callback || {
                success: this._successHandler,
                failure: this._failureHandler
            };
            if ( requestCfg.cfg && Y.Lang.isObject( requestCfg.cfg.data ) ) {
                requestCfg.cfg.data = Y.JSON.stringify( requestCfg.cfg.data )
            }
            requestCfg.cfg = requestCfg.cfg || {};
            requestCfg.cfg.headers =  requestCfg.cfg.headers || {};
            Y.mix( requestCfg.cfg.headers, DEFAULTHEADERS );

            return this.get('host').sendRequest(requestCfg);
        },

        /**
         * @method beforeResponse
         * @private
         */
        beforeResponse: function ( e ) {
            var evt, i,
            response = Y.Wegas.persistence.Editable.revive( e.response.results );// Transform javascript object litterals to Y.Wegas.persistence.Entity's

            Y.log( "Response received from " + this.get( 'host' ).get( 'source' )/* + e.cfg.request*/, "log", "Wegas.RestDataSource");

            e.response.serverResponse = response
            e.response.data = this.getCache();                                  // Provides with a pointer to the datasource current content

            if (e.error) {                                                      // If there was an server error, do not update the cache
                return;
            }

            if (Lang.isArray(response)) {                                       // Non-managed response: we apply the operation for each object in the returned array
                for (i = 0; i < response.length; i += 1) {
                    this.updateCache(e.cfg.method, response[i]);
                }
            } else {
                for (i = 0; i < response.get("entities").length; i += 1) {   // Update the cache with the Entites in the reply body
                    e.response.entity = response.get("entities")[i];
                    if (Lang.isObject(e.response.entity)) {
                        this.updateCache(e.cfg.method, e.response.entity);
                    }
                }

                for (i = 0; i < response.get("events").length; i += 1) {
                    evt = response.get("events")[i];
                    if (evt instanceof Y.Wegas.persistence.EntityUpdatedEvent) {// Case 1: EntityUpdatedEvent
                        for (i = 0; i < evt.get("updatedEntities").length; i += 1) {  // Update the cache with the entites contained in the reply
                            this.updateCache("POST", evt.get("updatedEntities")[i]);
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
        updateCache: function ( method, entity ) {
            var ret = null;
            //Y.log("updateCache(" + method + ", " + entity + ")", "log", "Y.Wegas.DataSourceRest");
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
            if (ret === null) {
                this.addToCache(entity);
            }
        },

        addToCache: function (entity) {
            this.getCache().push(entity);
        },

        _successHandler: function (e) {
            Y.log("Datasource reply:" + e.response, 'log', 'Y.Wegas.DataSourceRest');
        },
        _failureHandler: function (e) {
            //console.log("DataSourceRest._failureHandler", e);
            try{
                console.error(e.response.results.message);
            }catch(ex){
                Y.error("Datasource reply:", e, 'Y.Wegas.DataSourceRest');
            }
        },

        /// *** Cache methods *** //

        /**
         * Retrieves all entities stored in the cache.
         */
        getCache: function () {
            return this.get('host').data;
        },
        /**
         *
         */
        clearCache: function () {
            var i, cache = this.getCache();
            for (i = 0; i < cache.length; i = i + 1) {
                cache[i].destroy();
            }
            cache.length = 0;
        },

        /**
         * Retrieves an entity from the cache
         *
         *  @method find
         *  @for DataSourceREST
         */
        find: function(key, val, onFindFn) {
            return this.doFind(key, val,  onFindFn, this.getCache());
        },
        /**
         * Retrieves an entity from the cache
         */
        findById: function (id) {
            return this.find("id", id  * 1);                                    // Cast to number
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
         */
        walkEntity: function(entity, callback) {
            //Y.log("walkEntity(" + entity + ")", 'log', 'Y.Wegas.DataSourceRest');
            return false;
        },

        /**
         *
         */
        testEntity: function(entity, key, needle) {
            return this.get("testFn")( entity, key, needle );
        },

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
        deleteObject: function (entity) {
            this.sendRequest({
                request: this.generateRequest(entity.toObject()),
                cfg: {
                    method: "DELETE"
                }
            });
        },

        clone: function ( id, parentData, callbacks ){
            var entity = this.findById(id).clone();
            this.post(entity, parentData, callbacks);
        },

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
        }
    }, {
        ATTRS: {
            testFn : {
                value: function(entity, key, needle) {
                    var value = ( entity.get ) ? entity.get(key) : entity[key], // Normalize item and needle values
                    needleValue = (needle.get) ? needle.get(key) :  (typeof needle === 'object') ? needle[key] : needle;

                    return value === needleValue;
                }
            }
        }
    });

    Y.namespace('Plugin').DataSourceREST = DataSourceREST;

    /**
    * Content repository dataSource REST plugin.
    */

    var CRDataSource = function () {
        CRDataSource.superclass.constructor.apply(this, arguments);
    };

    Y.extend( CRDataSource, DataSourceREST, {

        }, {
            NS: "rest",
            NAME: "CRDataSource",
            ATTRS: {

            },
            getFullpath: function ( relativePath ) {
                return Y.Wegas.app.get( "base" ) + "rest/File/GameModelId/" + Y.Wegas.app.get("currentGameModel") +
                "/read" + relativePath;
            },
            getFilename: function ( path ) {
                return path.replace(/^.*[\\\/]/, '');
            }
        });
    Y.namespace('Plugin').CRDataSource = CRDataSource;

    /**
     *
     */
    VariableDescriptorDataSourceREST = function () {
        VariableDescriptorDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.mix(VariableDescriptorDataSourceREST, {
        NS: "rest",
        NAME: "VariableDescriptorDataSourceREST"
    });
    Y.extend(VariableDescriptorDataSourceREST, DataSourceREST, {

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

        updateCache: function ( method, entity ) {
            if ( entity instanceof Y.Wegas.persistence.VariableInstance ) {
                return this.find("id", entity.get("descriptorId") *1 , function( found, needle) {
                    var i, instances = found.get( "scope" ).get( "variableInstances" );

                    for (i in instances) {
                        if (instances[i].get("id") == entity.get( "id" )) {
                            instances[i].setAttrs( entity.getAttrs() );
                        }
                    }
                    return true;
                });
            } else {
                return VariableDescriptorDataSourceREST.superclass.updateCache.apply( this, arguments );
            }
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

    Y.extend( GameModelDataSourceREST, DataSourceREST, {
        /*
         *  @fixme so we can delect scriptlibrary elemnt and still treat the reply as an gamemodel updated event
         */
        beforeResponse: function ( e) {
            if (e.request.indexOf("ScriptLibrary") != -1) {
                e.cfg.method = "POST";
            }
            GameModelDataSourceREST.superclass.beforeResponse.call( this, e );
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
        walkEntity: function(entity, callback) {
            if (entity instanceof Y.Wegas.persistence.Game) {
                if (callback(entity.get("teams"))) {
                    return true;
                }
            }
            if (entity instanceof Y.Wegas.persistence.Team) {
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

        addToCache: function (entity) {
            if (entity instanceof Y.Wegas.persistence.Team) {
                var game = this.findById(entity.get("gameId"));
                if (game) {
                    game.get("teams").push(entity)
                }
            } else if (entity instanceof Y.Wegas.persistence.Player) {
                this.findById(entity.get("teamId")).get("players").push(entity)

            } else {
                this.getCache().push(entity);
            }
        },
        generateRequest: function (data) {
            if (data[ '@class' ] === 'Team' ) {
                return '/' + data.gameId + '/Team/' + data.id;
            } else if (data[ '@class' ] === 'Player') {
                return "/" + this.getGameByTeamId( data.teamId ).get( "id" )
                + '/Team/' + data.teamId + '/Player/' + data.id;
            } else {
                return "/" + data.id;
            }
        },
        post: function (entity, parentData, callback) {
            if (entity['@class'] === 'Player') {
                this.sendRequest({
                    request: "/" + this.getGameByTeamId( parentData.id ).get( "id" )
                    + "/Team/" + parentData.id + "/Player",
                    cfg: {
                        method: "POST",
                        data: Y.JSON.stringify(entity)
                    },
                    callback: callback
                });
            } else {
                GameDataSourceREST.superclass.post.call(this, entity, parentData, callback);
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
        getTeamById: function (teamId) {
            return this.find("id", teamId * 1);
        },
        getPlayerById: function (playerId) {
            return this.find("id", playerId * 1);
        },
        /**
             *
             */
        getGameByTeamId: function (teamId) {
            var i, j, data = this.getCache();

            teamId = teamId * 1;                                                // Convert to number

            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].get("teams").length; j += 1) {
                    if (data[i].get("teams")[j].get("id") === teamId) {
                        return data[i];
                    }
                }
            }
            return null;
        },
        /**
             *
             */
        getTeamByPlayerId: function (playerId) {
            var i, j, k, cTeam, data = getCache();
            for (i = 0; i < data.length; i += 1) {
                for (j = 0; j < data[i].get("teams").length; j += 1) {
                    cTeam = data[i].get("teams")[j];
                    for (k = 0; k < cTeam.get("players").length; k += 1) {
                        if (cTeam.get("players")[k].get("id") === playerId) {
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
     *
     */
    var UserDataSourceREST = function () {
        UserDataSourceREST.superclass.constructor.apply(this, arguments);
    };

    Y.extend( UserDataSourceREST, DataSourceREST, {

        walkEntity: function( entity, callback ) {
            if ( entity.get( "accounts" ) ) {
                if ( callback(entity.get( "accounts" ) ) ) {
                    return true;
                }
            }
            return false;
        },

//      updateCache: function ( method, entity ) {
//
//            for
//            VariableDescriptorDataSourceREST.superclass.put.call(this, data, callback);
//       },

        put: function ( data, callback) {
            if ( data[ '@class' ] === "JpaAccount" ) {
                this.sendRequest({
                    request: '/Account/' + data.id,
                    cfg: {
                        method: "PUT",
                        data: Y.JSON.stringify( data )
                    },
                    callback: callback
                });
                return;
            } else {
                VariableDescriptorDataSourceREST.superclass.put.call(this, data, callback);
            }
        },

        post: function ( data, parentData, callback ) {

            if ( data["@class"] === "JpaAccount" ) {                            // Allow user creation based on a Jpa Account
                data = {
                    "@class": "User",
                    "accounts": [ data ]
                };
            }

            this.sendRequest({
                request: "",
                cfg: {
                    method: "POST",
                    data: Y.JSON.stringify( data )
                },
                callback: callback
            });
        }

    }, {
        NS: "rest",
        NAME: "UserDataSourceREST"
    });

    Y.namespace('Plugin').UserDataSourceREST = UserDataSourceREST;


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
        if(Lang.isString(request)) {
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