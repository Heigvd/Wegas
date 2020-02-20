/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018  School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
/*global YUI, window, Function*/
YUI.add('wegas-datasource', function(Y) {
    "use strict";

    var HOST = "host",
        ID = "id",
        POST = "POST",
        GET = "GET",
        PUT = "PUT",
        DELETE = "DELETE",
        ITEMS = "items",
        CLASS = "@class",
        GLOBAL_UPDATE_EVENT = "update",
        Lang = Y.Lang,
        Wegas = Y.Wegas,
        DataSource = Y.DataSource,
        Plugin = Y.Plugin,
        WegasCache, VariableDescriptorCache,
        VariableInstanceCache,
        GameModelCache, GameCache, PageCache, UserCache;

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
            //            this.after("sourceChange", this.sendInitialRequest); // When the source changes, resend
            // initial request
            this.queue = new Y.Queue();
            this.after("response", function(e) { // Add request queue consumption logic
                if (e.tId === this.queuetid) {
                    Y.Wegas.app.postSendRequest();
                    this.queuetid = null;
                    this.processQueue();
                }
            });
        },
        /**
         * @function
         * @private
         */
        sendInitialRequest: function(cfg) {
            //            this.cache && this.cache.clear();
            if (!Y.Lang.isUndefined(this.get("initialRequest"))) { // Use this condition to allow empty strings (e.g. ")
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
            return !Y.Lang.isUndefined(this.get("initialRequest")) ||
                !Y.Lang.isUndefined(this.get("initialFullRequest"));
        },
        getInitialRequestsCount: function() {
            if (!Y.Lang.isUndefined(this.get("initialRequest"))) {
                if (Y.Lang.isArray(this.get("initialRequest"))) {
                    return this.get("initialRequest").length;
                }
                return 1;
            } else if (!Y.Lang.isUndefined(this.get("initialFullRequest"))) {
                return 1;
            }
            return 0;
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
                'Content-Type': 'application/json;charset=UTF-8',
                'Managed-Mode': true,
                'SocketId': Y.Wegas.app.get("socketId") || ""
            });
            if (Lang.isObject(request.cfg.data)) { // Stringify data if required
                request.cfg.data = Y.JSON.stringify(request.cfg.data);
            }
            return Wegas.DataSource.superclass.sendRequest.call(this, request);
        },
        sendQueuedRequest: function(request) {
            Y.Wegas.app.preSendRequest();
            this.queue.add(Y.bind(this.sendRequest, this, request)); // Push the request in the queue
            if (!this.queuetid) { // If a request from the queue is not already running
                this.processQueue(); // process the request
            }
        },
        processQueue: function() {
            if (this.queue.size()) { // If the request queue isn't empty,
                this.queuetid = this.queue.next()(); // run next request in the queue
            }
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
         * @hack Allow  hack on yui api
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
                if (Plugin && !Lang.isFunction(Plugin)) { // @hacked
                    Plugin = Y.Plugin[Plugin];
                }
            }
            Wegas.DataSource.superclass.plug.call(this, Plugin, config);
        },
        sendEventsFromCollector: function(collector) {

            var eventName, i, ds, dsid, events, updatedDs = {};

            collector = collector || {};
            for (dsid in collector) {
                if (collector.hasOwnProperty(dsid)) {
                    ds = collector[dsid].ds;
                    updatedDs[dsid] = ds;
                    events = collector[dsid].events;
                    for (eventName in events) {
                        var eName = eventName;
                        if (events.hasOwnProperty(eventName) && events[eventName].length > 0) {
                            for (i in events[eventName]) {
                                if (eventName === "updatedInstance") {
                                    eName = events[eventName][i].entity.get("id") + ":" + eventName;
                                }
                                ds.fire(eName, events[eventName][i]);
                            }
                        }
                    }
                }
            }

            /*
             * HACK4backwardcompat...
             * Since Descriptor and Instance datasources became two different DS,
             * the global update event is sent by different datasource depending on 
             * updated objects... 
             * 
             * Old stuff may still listen to descriptor DS event despiste 
             * the targeted object is an instance... 
             * 
             * Quick'n'ugly fix : make sure to send Variable event if Instance ds has been updated
             * 
             * -> PLEASE USE updatedDescriptor and instanceDescriptor events when applicable
             */
            if (updatedDs.hasOwnProperty(Y.Wegas.Facade.Instance._yuid)) {
                updatedDs[Y.Wegas.Facade.Variable._yuid] = Y.Wegas.Facade.Variable;
            }
            for (dsid in updatedDs) {
                updatedDs[dsid].sendUpdateEvent();
            }
        },
        sendUpdateEvent: function() {
            this.fire(GLOBAL_UPDATE_EVENT);
        },
        forceUpdateEvent: function() {
            this.sendUpdateEvent();
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
                DataSource.Local.transactions[tId] = null; // @hack Remove reference since YUI won't do it
            }
        }
    });
    /**
     *  @name Y.Plugin.WegasCache
     *  @class Plugin that add cache management for entities from wegas server.
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
            var host = this.get(HOST), indexes, i, indexOn;
            host.data = [];
            this._indexes = {
            };
            indexes = this.get("indexes");
            for (i in indexes) {
                indexOn = indexes[i];
                this._indexes[indexOn] = {};
            }

            this.publish("EntityUpdatedEvent", {
                broadcast: true,
                bubbles: false
            });
            this.doBefore("_defDataFn", this._beforeDefDataFn); // When the host receives some data, we parse the result

            this.on("ExceptionEvent", function(e) {
                var type = e.type.split(":").pop(),
                    val, min, max, msg, level;

                if (e.serverEvent) {
                    val = e.serverEvent.get("val.exceptions")[0].get("val");

                    if (this.get("host").fire(val["@class"], val)) {

                        switch (val["@class"]) {
                            case "WegasConflictException":
                                level = "error";
                                msg = Y.Wegas.I18n.t('errors.conflict');
                                break;
                            case "WegasErrorMessage":
                                level = val.level;
                                msg = val.message;
                                break;
                            case "WegasNotFoundException":
                                level = "error";
                                msg = val.message;
                                break;
                            case "WegasOutOfBoundException":
                                min = (val.min !== null ? val.min : "-∞");
                                max = (val.max !== null ? val.max : "∞");
                                level = "error";
                                msg = "\"" + val.variableName +
                                    "\" is out of bound. <br />(" + val.value + " not in [" + min + ";" + max +
                                    "])";
                                break;
                            case "WegasScriptException":
                                level = "error";
                                msg = val.message;
                                if (val.lineNumber) {
                                    msg += " at line " + val.lineNumber;
                                }
                                if (val.script) {
                                    msg += " in script " + val.script;
                                }
                                break;
                            case "WegasWrappedException":
                                level = type;
                                msg = "Unexpected error: " + val.message;
                                break;
                            default:
                                level = type;
                                msg = type + ", Severe error: " + val.message;
                                break;
                        }

                        this.__showMessage(level, msg);
                    }
                    this.get(HOST).fire("ExceptionEvent", e.serverEvent.get("val.exceptions")[0]);
                }
            });

            // Handle Websocket updated entities
            this.on("EntityUpdatedEvent", function(e) {

            });
        },
        updateEntities: function(entities, collector) {
            var i, ds;
            for (i = 0; i < entities.length; i += 1) {
                this.updateCache(POST, entities[i], collector);
            }
        },
        __showMessage: function(level, message) {
            Wegas.Alerts.showMessage(level, message);
        },
        _beforeDefDataFn: function(e) {
            var response, data = e.data && (e.data.responseText || e.data),
                host = this.get(HOST),
                payload = e.details[0];
            if (Y.Array.indexOf([0, 204], data.status) < 0) { // no abort, not empty
                response = {
                    results: Y.JSON.parse(data),
                    meta: {}
                };
                response.data = host.data; // Provides with a pointer to the datasource current content
                payload.response = response;
                //Y.log("Response received: " + host.get('source') /* + e.cfg.request*/, "log", "Wegas.DataSource");
                Y.log("Response received: " + host.get('source') + e.request, "log", "Wegas.DataSource");

                Wegas.Editable.use(payload.response.results, // Lookup dependencies
                    Y.bind(function(payload) {
                        payload.serverResponse = Wegas.Editable.revive(payload.response.results); // Revive
                        if (payload.serverResponse.get && payload.serverResponse.get("updatedEntities")) {
                            payload.response.entities = payload.serverResponse.get("updatedEntities");
                            if (payload.response.entities.length > 0) {
                                payload.response.entity = payload.response.entities[0]; // Shortcut, useful if there is
                                // only one instance
                            }
                        }
                        this.onResponseRevived(payload);
                        host.fire("response", payload);
                    }, this, payload));
            }
            return new Y.Do.Halt("DataSourceJSONSchema plugin halted _defDataFn");
        },
        /**
         * Server requests methods
         *
         * @function
         */
        sendRequest: function(request) {
            //Y.log("sendRequest is deprecated, use host.sendrequest instead", "warn");
            return this.get(HOST).sendRequest(request);
        },
        /**
         * @function
         * @private
         */
        onResponseRevived: function(e) {
            var i, entity, evtPayload, response = e.serverResponse,
                toUpdate = !e.cfg || e.cfg.updateCache !== false, collector = {};

            if (Lang.isArray(response)) { // Non-managed response: we apply the operation for each object in the returned array
                if (toUpdate) { // No Update ? No-update...
                    if (!e.error) { // If there was an server error, do not update the cache
                        for (i = 0; i < response.length; i += 1) {
                            this.updateCache(e.cfg.method, response[i], collector);
                        }
                        return;
                    }
                }
            } else if (response instanceof Y.Wegas.persistence.ManagedResponse) { // Managed-Mode ManagedResponse
                if (toUpdate) { // No Update ? No-update...

                    if (response.get("deletedEntities")) {
                        for (i = 0; i < response.get("deletedEntities").length; i += 1) { // Update the cache with the Entities in the reply body
                            entity = response.get("deletedEntities")[i];
                            if (Lang.isObject(entity)) {
                                this.updateCache(DELETE, entity, collector);
                            }
                        }
                    }

                    if (response.get("updatedEntities")) {
                        for (i = 0; i < response.get("updatedEntities").length; i += 1) { // Update the cache with the Entities in the reply body
                            entity = response.get("updatedEntities")[i];
                            if (Lang.isObject(entity)) {
                                this.updateCache(POST, entity, collector);
                            }
                        }
                    }
                }

                if (response.get("events")) {
                    for (i = 0; i < response.get("events").length; i += 1) {
                        evtPayload = Y.mix({
                            serverEvent: response.get("events")[i]
                        }, e);
                        this.fire(evtPayload.serverEvent.get(CLASS), evtPayload);
                        //this.fire("serverEvent", evtPayload);
                    }
                }
            }

            if (!e.error) { // If there was an server error, do not update the cache
                if (toUpdate) { // No Update ? No-update...
                    if ((!e.cfg || ((e.cfg.updateEvent === undefined || e.cfg.updateEvent) && !e.cfg.initialRequest))) {
                        this.get(HOST).sendEventsFromCollector(collector);
                    }
                }
            }
        },
        _insertIntoIndexes: function(entity) {
            var indexedKey, index, key;
            for (indexedKey in this._indexes) {
                if (this._indexes.hasOwnProperty(indexedKey)) {
                    index = this._indexes[indexedKey];
                    key = (entity.get ? entity.get(indexedKey) : entity[indexedKey]);
                    if (key) {
                        index[key] = entity;
                    }
                }
            }
        },
        insertIntoIndexes: function(entity) {
            this.insert([entity]);
        },
        insert: function insert(stack) {
            return Y.Array.each(stack, function(item) {
                this._insertIntoIndexes(item);
                this.walkEntity(item, this.insert);
                return false;
            }, this);
        },
        _deleteFromIndexes: function(entity) {
            var indexedKey, index, key;
            for (indexedKey in this._indexes) {
                if (this._indexes.hasOwnProperty(indexedKey)) {
                    index = this._indexes[indexedKey];
                    key = (entity.get ? entity.get(indexedKey) : entity[indexedKey]);
                    if (key) {
                        delete index[key];
                    }
                }
            }
        },
        deleteFromIndexes: function(entity) {
            this.drop([entity]);
        },
        drop: function drop(stack) {
            return Y.Array.each(stack, function(item) {
                this._deleteFromIndexes(item);
                this.walkEntity(item, this.drop);
            }, this);
        },
        _updateIndexes: function(oldAtts, newAttrs) {

        },
        updateIndexes: function(oldAttrs, newAttrs) {
            var indexedKey, index, oldKey, newKey;
            this.drop(this._getChildren(oldAttrs) || []);
            this.insert(this._getChildren(newAttrs) || []);
            for (indexedKey in this._indexes) {
                if (this._indexes.hasOwnProperty(indexedKey)) {
                    index = this._indexes[indexedKey];
                    oldKey = oldAttrs[indexedKey];
                    newKey = newAttrs[indexedKey];
                    if (oldKey !== newKey) {
                        index[newKey] = index[oldKey];
                        delete index[oldKey];
                    }
                }
            }
        },
        /**
         *  @function
         *  @private
         *  @param {String} method Possible values for method are: POST, PUT, DELETE, default being PUT.
         *  @param {page} entity The entity to update in the cache
         *  @return {Boolean} `true` if object could be located and method applied
         */
        updateCache: function(method, entity, eventsCollector) {
            var ds = this.get(HOST), dsid = ds._yuid, inCacheEntity;
            eventsCollector = eventsCollector || {};

            eventsCollector[dsid] = eventsCollector[dsid] || {ds: ds, events: {}};

            //Y.log("updateCache(" + method + ", " + entity + ")", "log", "Y.Wegas.WegasCache");

            inCacheEntity = this.find(ID, entity.get("id"));
            if (method === DELETE) {
                if (inCacheEntity) {
                    var cache, index;
                    cache = this.getCache();
                    index = cache.indexOf(inCacheEntity);

                    if (index >= 0) {
                        cache.splice(index, 1);
                        this.deleteFromIndexes(inCacheEntity);
                        eventsCollector[dsid].events["delete"] = eventsCollector[dsid].events["delete"] || [];
                        eventsCollector[dsid].events["delete"].push({"entity": inCacheEntity});
                    }
                    return true;
                }
            } else {
                // 
                if (inCacheEntity) {
                    var oldAttrs, newAttrs;
                    oldAttrs = inCacheEntity.getAttrs();
                    newAttrs = entity.getAttrs();

                    /*
                     * Due to pusher asynchronoussness, make sure not overwritting up-to-date descriptor 
                     * if newAttrs.version attrs is missing, it means entity is not versioned -> update in all case
                     * otherwise, only update if newAttrs is not older
                     */
                    if (!newAttrs.version || newAttrs.version >= oldAttrs.version) {
                        inCacheEntity.setAttrs(newAttrs);

                        this.updateIndexes(oldAttrs, newAttrs); // OK
                        // Update Entity (anywhere)
                        if (inCacheEntity instanceof Wegas.persistence.VariableDescriptor) {
                            eventsCollector[dsid].events.updatedDescriptor = eventsCollector[dsid].events.updatedDescriptor || [];
                            eventsCollector[dsid].events.updatedDescriptor.push({"entity": inCacheEntity});
                        }
                    }
                    return true;
                } else {

                    // New entitiy
                    this.addToCache(entity); // In case we still have not found anything

                    // Index the new entity and its children
                    this.insertIntoIndexes(entity);

                    eventsCollector[dsid].events.added = eventsCollector[dsid].events.added || [];
                    eventsCollector[dsid].events.added.push({
                        entity: entity,
                        parent: entity instanceof Wegas.persistence.VariableDescriptor ? entity.getParent() : null
                    });
                    return true;
                }
            }
            return false;
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
        clear: function(sendUpdateEvent) {
            var i, cache = this.getCache();
            for (i = 0; i < cache.length; i = i + 1) {
                cache[i].destroy();
            }
            cache.length = 0;
            if (sendUpdateEvent) {
                this.get(HOST).fire(GLOBAL_UPDATE_EVENT);
                // ID
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
                            if (this.testEntity(item, key, needle)) { // We check the current element if it's a match
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
            var found, needleValue;

            if (this._indexes[key]) {
                needleValue = (val && val.get) ? val.get(key) :
                    (Y.Lang.isObject(val)) ? val[key] : val;
                found = this._indexes[key][needleValue];

                if (found && onFindFn) {
                    onFindFn(found, val);
                }
            } else {
                found = this.doFind(key, val, onFindFn);
            }

            return found;
        },
        findByFn: function(fn) {
            return this.doFind(null, null, null, fn);
        },
        /**
         * Retrieves an entity from the cache
         * @function
         * @private
         */
        findById: function(id) {
            return this.find(ID, +id); // Cast to number
        },
        /**
         * Retrieves a server event with a key
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
         *  Find an entity in the cache with a key's value correspongin to neelde or needle's value
         *
         *  @function
         *  @private
         *  @param {String} key the Key to match
         *  @param {Object|String|Number|Boolean} needle needle to search for
         *  @param {function(Object, any):void} onFindFn callback function with found entity and needle
         *  @return {Object} Found entity if any
         */
        doFind: function doFind(key, needle, onFindFn, testFunction) {
            var ret,
                testFn = testFunction || this.get("testFn"),
                walkEntity = this.walkEntity.bind(this),
                findFn = function findFn(stack) {
                    Y.Array.find(stack, function find(item) { // @fixme speedup
                        if (testFn(item, key, needle)) { // We check the current element if it's a match
                            ret = item;
                            return item;
                        }
                        return walkEntity(item, findFn);
                    });
                };
            findFn(this.getCache());
            if (ret !== undefined && onFindFn) {
                onFindFn(ret, needle);
            }
            return ret;
        },
        _getChildren: function(entity) {
            return null;
        },
        /**
         * This method is used to walk down an entity hierarchy, can be overridden
         * by children to extend look capacities. Used in Y.Wegas.GameModelCache
         * and Y.Wegas.VariableDescriptorCache
         * @function
         * @private
         */
        walkEntity: function(entity, callback) {
            var children = this._getChildren(entity);
            if (children) {
                return callback.call(this, children);
            }
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
            var request = parent ? "/" + parent.get(ID) + "/" + data[CLASS] : "/";

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
            cfg = cfg || {};
            this.sendRequest(Y.mix({
                request: this.generateRequest(data),
                cfg: Y.mix({
                    method: PUT,
                    data: data
                }, cfg.cfg)
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
        sortList: function(entity, cfg) {
            this.sendRequest(Y.mix({
                request: this.generateRequest(entity.toObject()) + "/Sort",
                cfg: {
                    method: GET
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
                cfg: Y.mix({
                    method: "DELETE"
                }, cfg.cfg)
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
        /** @lends Y.Plugin.WegasCache */
        ATTRS: {
            testFn: {
                value: function(entity, key, needle) {
                    var value = (entity.get) ? entity.get(key) : entity[key], // Normalize item and needle values
                        needleValue = (needle && needle.get) ? needle.get(key) :
                        (Y.Lang.isObject(needle)) ? needle[key] : needle;

                    return value === needleValue &&
                        (!needle._classes || entity instanceof needle._classes[0]);
                }
            },
            indexes: {
                type: "array",
                value: [],
                optional: true
            }

        }
    });
    Plugin.WegasCache = WegasCache;

    /**
     *  @name Y.Plugin.VariableDescriptorCache
     *  @class adds management of entities of type Y.Wegas.persistence.VariableDescriptor
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    VariableDescriptorCache = Y.Base.create("VariableDescriptorCache", WegasCache, [], {
        /** @lends Y.Plugin.VariableDescriptorCache# */
        /**
         * @function
         * @private
         */
        initializer: function() {
            // Server event, triggered through the managed-mode response events.
            //this._indexes.name = {};
            //this._indexes.id = {};


            this.on("CustomEvent", function(e) { // TODO MOVE SOMEWHERE...
                this.get(HOST).fire(e.serverEvent.get("val.type"), e.serverEvent.get("val.payload"));
            });
        },
        generateRequest: function(data) {
            if (data[CLASS].indexOf("Instance") > -1) {
                return '/' + data.parentId + '/VariableInstance/' + data.id;
            } else {
                return "/" + data.id;
            }
        },
        _getChildren: function(entity) {
            // iternal storage is flat
            return null;
        },
        /**
         * @function
         */
        _clearAll: function() {
            var cache = this.getCache();
            while (cache.length > 0) {
                this.updateCache("DELETE", cache[0]);
            }
        },
        updateCache: function(method, entity, eventsCollector) {
            if (entity instanceof Wegas.persistence.GameModel) {
                var gm, ds, dsid, i, oldIds, newIds, newRoot = false;
                ds = this.get("host");
                dsid = ds._yuid;

                gm = Y.Wegas.Facade.GameModel.cache.find("id", entity.get("id"));

                oldIds = gm.get("itemsIds");
                newIds = entity.get("itemsIds");

                if (oldIds.length === newIds.length) {
                    for (i in oldIds) {
                        if (oldIds[i] !== newIds[i]) {
                            newRoot = true;
                            break;
                        }
                    }
                } else {
                    newRoot = true;
                }
                if (newRoot) {
                    gm.set("itemsIds", entity.get("itemsIds"));

                    eventsCollector = eventsCollector || {};
                    eventsCollector[dsid] = eventsCollector[dsid] || {ds: ds, events: {}};

                    eventsCollector[dsid].events["rootUpdate"] = [{}];
                    return Y.Wegas.Facade.Variable;
                } else {
                    return false;
                }
            } else if (entity instanceof Wegas.persistence.VariableInstance) {
                return Y.Wegas.Facade.Instance.cache.updateCache(method, entity, eventsCollector);
            } else if (entity instanceof Wegas.persistence.VariableDescriptor) {
                return VariableDescriptorCache.superclass.updateCache.apply(this, arguments);
            }
            return false;
        },
        /**
         * @function
         */
        put: function(data, cfg) {
            if (data[CLASS].indexOf("Instance") !== -1) {
                Y.Wegas.Facade.Instance.cache.put(data, cfg);
            } else {
                VariableDescriptorCache.superclass.put.call(this, data, cfg);
            }
        },
        duplicateObject: function(entity, cfg) {
            this.sendRequest(Y.mix({
                request: this.generateRequest(entity.toObject()) + "/Duplicate/",
                cfg: {
                    method: POST
                }
            }, cfg));
        },
        post: function(data, parent, callback) {
            this.sendRequest({
                request: parent ? "/" + parent.get(ID) : "",
                cfg: {
                    method: POST,
                    data: data
                },
                on: callback
            });
        },
        findParentDescriptor: function(entity) {
            if (entity.get("parentType") === "GameModel") {
                return Y.Wegas.Facade.GameModel.cache.find("id", entity.get("parentId"));
            } else {
                return this.find("id", entity.get("parentId"));
            }
        },
        move: function(entity, parentEntity, index, localOnly) {
            if (!localOnly) {
                this.get(HOST).sendRequest({
                    request: "/" + entity.get(ID) + "/Move/" + (parentEntity ? parentEntity.get(ID) + "/" : "") + index,
                    cfg: {
                        method: PUT
                    },
                    on: {
                        success: Y.bind(function(tId, e) {
                            Y.log("Item moved", "info", "Wegas.VariableTreeView");
                            // this.get(HOST).fire(GLOBAL_UPDATE_EVENT); // already fired by updateCache!
                        }, this),
                        failure: Y.bind(function(entity, parentEntity) {
                            Y.log("Error moving item", "error");
                            // Rollback move since TV was too optimistic
                            if (!parentEntity || parentEntity.get("@class") === "GameModel" || entity.getParent()
                                .get("@class") === "GameModel") {
                                this.get(HOST).fire("rootUpdate");
                            } else {
                                this.get(HOST).fire("updatedDescriptor", {entity: parentEntity});
                                this.get(HOST).fire("updatedDescriptor", {entity: entity.getParent()});
                            }
                        }, this, entity, parentEntity)
                    }
                });
            }
        },
        remoteSearch: function(query, callback, containsAll) {
            return this.sendRequest({
                request: containsAll ? "/containsAll" : "/contains",
                cfg: {
                    method: POST,
                    data: query,
                    headers: {
                        "Managed-Mode": false,
                        'Content-Type': 'text/plain'
                    }
                },
                on: {
                    success: function(e) {
                        callback(e.response.results);
                    }
                }
            });
        }
    }, {
        NS: "cache",
        NAME: "VariableDescriptorCache",
        ATTRS: {
        }
    });
    Plugin.VariableDescriptorCache = VariableDescriptorCache;

    /**
     *  @name Y.Plugin.VariableInstanceCache
     *  @class adds management of entities of type Y.Wegas.persistence.VariableInstance
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    VariableInstanceCache = Y.Base.create("VariableInstanceCache", WegasCache, [], {
        /** @lends Y.Plugin.VariableInstanceCache# */
        /**
         * @function
         * @private
         */
        initializer: function() {
            // Server event, triggered through the managed-mode response events.
            //this._indexes.name = {};
            //this._indexes.id = {};
            var indexes = this.get("indexes"), i, indexOn;
            for (i in indexes) {
                indexOn = indexes[i];
                this._indexes[indexOn] = {};
            }

            this.on("CustomEvent", function(e) { // TODO MOVE SOMEWHERE...
                Y.Wegas.Facade.Variable.fire(e.serverEvent.get("val.type"), e.serverEvent.get("val.payload"));
            });
        },
        _getChildren: function(entity) {
            if (entity["@class"] === "Scope") {
                var k, values = [];
                for (k in entity.variableInstances) {
                    if (entity.variableInstances.hasOwnProperty(k)) {
                        values.push(entity.variableInstances[k]);
                    }
                }
                return values;
            }
            return null;
        },
        sortList: function(entity, cfg) {
            Y.log("Sorting VariableInstances is forbidden");
            debugger;
        },
        close: function(id, parentData, callbacks) {
            Y.log("Cloning VariableInstance is forbidden");
            debugger;
        },
        deleteObject: function(entity, cfg) {
            Y.log("Deleting VariableInstance is forbidden");
            debugger;
        },
        duplicateObject: function(entity, cfg) {
            Y.log("duplicating VariableInstance is forbidden");
            debugger;
        },
        post: function() {
            Y.log("posting VariableInstance is forbidden");
            debugger;
        },
        /*put: function (data, cfg) {
         VariableInstanceCache.superclass.put.call(this, data, cfg);
         },*/
        generateRequest: function(data) {
            return "/" + data.parentId + "/VariableInstance/" + data.id;
        },
        /**
         * @function
         */
        updateCache: function(method, entity, eventsCollector) {

            var scope, scopeKey, descriptorId, index, ds, dsid;
            ds = this.get("host");
            dsid = ds._yuid;
            descriptorId = +entity.get("parentId");
            scopeKey = +entity.get("scopeKey");
            scope = this.find("descriptorId", descriptorId);
            eventsCollector = eventsCollector || {};

            eventsCollector[dsid] = eventsCollector[dsid] || {ds: ds, events: {}};



            if (method === DELETE) {
                //Delete is DELETE, no need to check versions
                if (scope) {
                    if (scope.variableInstances[scopeKey]) {

                        eventsCollector[dsid].events["delete"] = eventsCollector[dsid].events["delete"] || [];
                        eventsCollector[dsid].events["delete"].push({"entity": scope.variableInstances[scopeKey]});

                        delete scope.variableInstances[scopeKey];
                    }
                    if (Object.getOwnPropertyNames(scope.variableInstances).length === 0) {
                        index = this.getCache().indexOf(scope);

                        if (index >= 0) {
                            scope = this.getCache().splice(index, 1)[0];
                            this.deleteFromIndexes(scope);
                        }
                    }

                }
                return true;
            } else {
                if (!scope) {
                    scope = {
                        "@class": "Scope",
                        id: null,
                        descriptorId: descriptorId,
                        variableInstances: {}
                    };
                    this.addToCache(scope);
                    this.insertIntoIndexes(scope);
                }

                if (scope.variableInstances[scopeKey]) {

                    /*
                     * Updated instance already exists in the cache, due to pusher 
                     * asynchronoussness, make sure not overwritting up-to-date instance
                     */
                    if (entity.get("version") >= scope.variableInstances[scopeKey].get("version")) {
                        scope.variableInstances[scopeKey].setAttrs(entity.getAttrs());
                        eventsCollector[dsid].events.updatedInstance = eventsCollector[dsid].events.updatedInstance || [];
                        eventsCollector[dsid].events.updatedInstance.push({
                            entity: entity
                        });
                    }
                } else {
                    // Entity not yet known, no version to compare
                    scope.variableInstances[scopeKey] = entity;

                    eventsCollector[dsid].events.updatedInstance = eventsCollector[dsid].events.updatedInstance || [];
                    eventsCollector[dsid].events.updatedInstance.push({
                        entity: entity
                    });
                }
                return true;
            }
            return false;
        }
    }, {
        NS: "cache",
        NAME: "VariableInstanceCache",
        ATTRS: {
            indexes: {
                type: "array",
                value: [],
                optional: true
            }
        }
    });
    Plugin.VariableInstanceCache = VariableInstanceCache;



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
        },
        /**
         * hack to forward VariableInstances and VariableDescriptors to the correct cache
         * @param {type} method
         * @param {type} entity
         * @param {type} eventsCollector
         * @returns {Boolean}
         */
        updateCache: function(method, entity, eventsCollector) {
            if (entity instanceof Wegas.persistence.GameModel) {
                return GameModelCache.superclass.updateCache.apply(this, arguments);
            } else if (entity instanceof Wegas.persistence.VariableInstance) {
                return Y.Wegas.Facade.Instance.cache.updateCache(method, entity, eventsCollector);
            } else if (entity instanceof Wegas.persistence.VariableDescriptor) {
                return Y.Wegas.Facade.Variable.cache.updateCache(method, entity, eventsCollector);
            }
            return false;
        }
    }, {
        NS: "cache",
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
        _getChildren: function(entity) {
            if (entity instanceof Wegas.persistence.Game) {
                return entity.get("teams");
            }

            if (entity instanceof Wegas.persistence.Team) {
                return entity.get("players");
            }
            if (entity.get && entity.get(ITEMS)) {
                return entity.get(ITEMS);
            }

            switch (entity["@class"]) {
                case "Game":
                    return entity.teams;
                case "Team":
                    return entity.players;
            }
            return null;
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
                this.getCache().splice(0, 0, entity); // Add in first position
            }
        },
        /**
         * @deprecated
         */
        generateRequest: function(data) {
            if (data[CLASS] === 'Team') {
                return '/' + data.gameId + '/Team/' + data.id;
            } else if (data[CLASS] === 'Player') {
                return "/Team/" + data.teamId + '/Player/' + data.id;
            } else {
                return "/" + data.id;
            }
        },
        post: function(entity, parentData, callback) {
            if (entity[CLASS] === "Player") {
                this.sendRequest({
                    request: "/" + this.getGameByTeamId(parentData.id).get(ID) + "/Team/" + parentData.id + "/Player",
                    cfg: {
                        method: POST,
                        data: entity
                    },
                    on: callback
                });
            } else if (entity[CLASS] === "Game") {
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
            return this.find(ID, +teamId);
        },
        getPlayerById: function(playerId) {
            return this.find(ID, +playerId);
        },
        /**
         *
         */
        getGameByTeamId: function(teamId) {
            var i, j, data = this.getCache();
            teamId = +teamId; // Convert to number

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
        ATTRS: {
            currentGameId: {},
            currentTeamId: {},
            currentPlayerId: {},
            currentPlayer: {
                getter: "getCurrentPlayer"
            }
        }
    });
    Plugin.GameCache = GameCache;

    /**
     *  @name Y.Plugin.UserCache
     *  @class adds management of entities of type Y.Wegas.persistence.User
     *  @extends Y.Plugin.WegasCache
     *  @constructor
     */
    UserCache = Y.Base.create("wegas-cache", WegasCache, [], {
        _getChildren: function(entity) {
            if (entity instanceof Y.Wegas.persistence.User) {
                if (entity.get("accounts")) {
                    return entity.get("accounts");
                }
            } else if (entity["@class"] === "User") {
                return entity.accounts;
            }
            return null;
        },
        generateRequest: function(data) {
            if (data[CLASS] === 'JpaAccount') {
                return "/Account/" + data.id;
            } else {
                return "/" + data.id;
            }
        },
        post: function(data, parentData, callback) {
            if (data[CLASS] === "JpaAccount") { // Allow user creation based on a Jpa Account
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
        }
    }, {
        NS: "cache",
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
    Y.extend(PageCache, Plugin.Base, {
        /** @lends Y.Plugin.PageCache# */

        /**
         * @function
         * @private
         */
        initializer: function() {
            this.get(HOST).data = {};
            this.index = null;
            this.editable = undefined;//endsWith(this.get(HOST).get("source"), "/");
            this.pageQuery = {};
            this.doBefore("_defResponseFn", this.beforeResponse, this);
            /* Publishing */
            this.publish("pageUpdated");
            this.publish("forcePageUpdate");
            this.publish("forceIndexUpdate");
        },
        arePagesHardcoded: function() {
            var endsWith = function(str, suffix) {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
            };

            return !endsWith(this.get(HOST).get("source"), "/");
        },
        isEditable: function() {
            if (this.editable === undefined) {
                var gm = Y.Wegas.Facade.GameModel.cache.getCurrentGameModel();
                // neither static pages nor the ones which come from a model are editable
                this.editable = !this.arePagesHardcoded() && !gm.dependsOnModel();
            }
            return this.editable;
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
                'Content-Type': 'application/json;charset=UTF-8',
                "Managed-Mode": "false"
            });
            return this.get(HOST).sendRequest(requestCfg);
        },
        /**
         * @function
         * @private
         */
        beforeResponse: function(e) {
            if (e.error) {
                return;
            }
            var result = e.response.results,
                page = e.data ? (e.data.getResponseHeader("Page") || '') : null,
                i;

            result = (e.error) ? null : result; //No Content found
            if (page === "*" || page === '') {
                for (i in result) {
                    if (result.hasOwnProperty(i)) {
                        this.pageQuery[i] = false;
                        this.setCache(i, result[i]);
                    }
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
            var old = Y.JSON.stringify(this.getCache(pageId)),
                page;
            if (Y.Lang.isObject(object)) {
                delete object['@name'];
                delete object['@index'];
                if (Y.JSON.stringify(object) !== old) {
                    this.get(HOST).data["" + pageId] = object;
                    page = Y.clone(object);
                    page["@pageId"] = pageId;
                    this.fire("pageUpdated", {
                        page: page
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
        clear: function() {
            this.get(HOST).data = {};
        },
        /**
         * @function
         */
        put: function(page, callback) {
            var pageId = page["@pageId"],
                pe = Y.clone(page);
            delete pe["@pageId"];
            return this.sendRequest({
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
            return this.sendRequest({request: "", cfg: {
                    method: PUT,
                    data: Y.JSON.stringify(pe)
                },
                on: {
                    success: Y.bind(function(e) {
                        if (callback instanceof Function) {
                            this.getIndex(Y.bind(callback,
                                callback,
                                e.response.results,
                                e.data.getResponseHeader("Page")));
                        } else {
                            this.getIndex();
                        }
                    }, this)
                }
            });
        },
        createFolder: function(entity, callback) {
            var folder = Y.clone(entity);
            this.index = null;
            /*return this.sendRequest({request: "",
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
             });*/
        },
        /**
         * @function
         */
        patch: function(o, callback) {
            /*global diff_match_patch*/
            // var dmp = new diff_match_patch(),
            var oldPage = this.getCache(o["@pageId"]),
                newPage = Y.merge(o),
                pageId = o["@pageId"],
                patch;
            delete newPage["@pageId"];
            if (!pageId) {
                Y.log("Failed to define page id", "error", "Y.Plugin.PageCache");
                return;
            }
            //            patch = dmp.patch_toText(dmp.patch_make(Y.JSON.stringify(oldPage),
            // Y.JSON.stringify(newPage)));
            patch = jsonpatch.compare(oldPage, newPage);
            return this.sendRequest({
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
        renameItem: function(path, name, callback) {
            this.index = null;
            return this.sendRequest({
                request: "rename",
                cfg: {
                    method: PUT,
                    data: {
                        path: path,
                        name: name
                    }
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
            return this.sendRequest({
                request: "" + pageId + "/duplicate",
                on: {
                    success: Y.bind(function(e) {
                        if (callback instanceof Function) {
                            this.getIndex(Y.bind(callback,
                                callback,
                                e.response.results,
                                e.data.getResponseHeader("Page")));
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
            return this.sendRequest({
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
        forceIndexUpdate: function() {
            this.index = null;
            this.getIndex(Y.bind(function() {
                this.fire("forceIndexUpdate", {});
            }, this));
        },
        forceUpdate: function(pageId) {
            Y.later(1000, this, function() {
                this.get(HOST).data["" + pageId] = undefined;
                this.getPage(pageId, Y.bind(function() {
                    this.fire("forcePageUpdate", {
                        pageId: pageId
                    });
                }, this));
            });
        },
        /**
         *
         * @param {String} pageId
         * @param {Function} callback async calling function with page as first param
         * @returns {Page} or null if page missing in cache.
         */
        getPage: function(pageId, callback) {
            var page = null;
            if (pageId === "default" && this.arePagesHardcoded()) {
                pageId = 1;
            }
            if (this.getCache(pageId)) {
                page = Y.clone(this.getCache(pageId));
                page["@pageId"] = pageId;
                if (callback instanceof Function) {
                    callback(page);
                }
            } else if (!this.pageQuery[pageId]) {
                this.pageQuery[pageId] = true;
                return this.sendRequest({
                    request: "" + pageId,
                    on: {
                        success: Y.bind(function(e) {
                            var page;
                            this.pageQuery[pageId] = false;
                            if (callback instanceof Function) {
                                var pId = e.data.getResponseHeader("Page") || pageId;
                                page = Y.clone(this.getCache(pId));
                                if (page) {
                                    page["@pageId"] = pId;
                                    callback(page);
                                }
                            }
                        }, this),
                        failure: Y.bind(function(e) {
                            this.pageQuery[pageId] = false;
                            if (Y.Lang.isFunction(callback)) {
                                callback(null);
                            }
                        }, this)
                    }
                });
            }
        },
        move: function(pageId, pos, callback) {
            this.getMeta(pageId, Y.bind(function(meta) {
                if (+meta.index === pos) {
                    //Same pos. return old index
                    this.getIndex(callback);

                } else {
                    this.index = null;
                    return this.sendRequest({
                        request: "" + pageId + "/move/" + pos,
                        cfg: {
                            method: PUT
                        },
                        on: {
                            success: function(e) {
                                if (callback instanceof Function) {
                                    callback(e.response.results);
                                }
                            }
                        }
                    });
                }
            }, this));
        },
        getMeta: function(pageId, callback) {
            this.getIndex(function(index) {
                if (Y.Lang.isFunction(callback)) {
                    if (Y.Lang.isArray(index)) {
                        callback(Y.clone(Y.Array.find(index, function(i) {
                            return "" + i.id === "" + pageId;
                        })));
                    } else {
                        callback(null);
                    }
                }
            });
        },
        getIndex: function(callback) {
            var cfg = {
                request: "index",
                on: {}
            };
            if (this.index && callback instanceof Function) {
                callback(this.index);
            } else {
                if (callback instanceof Function) {
                    cfg.on.success = function(e) {
                        callback(e.response.results);
                    };
                }
                // @FIXME: let some time for servers to sync.
                Y.later(1000, this, this.sendRequest, cfg);
            }
        },
        _successHandler: function(e) {
            Y.log("PageDatasource reply:" + e.response, "log", "Y.Plugin.PageCache");
        },
        _failureHandler: function(e) {
        }
    }, {
        NS: "cache",
        NAME: "PageCache"
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
            this.get(HOST).getPath = this.getPath; // @hack For file library
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

    /**
     *
     */
    Y.namespace("Plugin").ServerLog = Y.Base.create("ServerLog", Y.Plugin.Base, [], {
        initializer: function() {
            this.timer = null;
            this.logs = [];
            this.onHostEvent(["*:log", "*:warn", "*:info", "*:error", "*:debug"], function(e) {
                this.logs.push({
                    type: e.type.split(":").pop(),
                    val: e.details[0]
                });
                this._out();
            });
            this.onHostEvent("ExceptionEvent", function(e) {
                var type = e.type.split(":").pop();
                // Y.Widget.getByNode("#centerTabView").get("selection")
                // .showMessage(type, "Server error: " + e.message);

                this.logs.push({
                    type: "error",
                    val: e.details[0]
                });
                this._out();
            });
        },
        _out: function() {
            if (this.timer) {
                this.timer.cancel();
            }
            this.timer = Y.later(20, this, function() {
                Y.Plugin.ServerLog.output(this.logs);
                this.logs.length = 0;
            });
        },
        destructor: function() {
            if (this.timer) {
                this.timer.cancel();
                this.logs.length = 0;
            }
        }
    }, {
        output: function(logs) {
            var cur;
            if (window.console) {
                if (window.console.groupCollapsed) {
                    window.console.groupCollapsed("Server logs");
                }
                while (logs.length) {
                    cur = logs.shift();
                    if (window.console[cur.type]) {
                        window.console[cur.type](cur.val);
                    }
                }
                if (window.console.groupEnd) {
                    window.console.groupEnd();
                }
            }
        },
        NS: "serverlog"
    });
});
