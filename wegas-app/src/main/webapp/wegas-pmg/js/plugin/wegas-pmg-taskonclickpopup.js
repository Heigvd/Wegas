/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 * @author Maxence Laurent <maxence.laurent@gmail.com>
 */
YUI.add('wegas-pmg-taskonclickpopup', function(Y) {
    "use strict";

    var Wegas = Y.Wegas, Taskonclickpopup, Taskontableclickpopup, Taskoniterationclickpopup;
    /**
     *  @class add a popup on a something
     *  @name Y.Plugin.Taskontableclickpopup
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    Taskonclickpopup = Y.Base.create("wegas-pmg-taskonclickpopup", Y.Plugin.Base, [Wegas.Plugin, Wegas.Editable], {
        /** @lends Y.Plugin.Taskonclickpopup */
        /**
         * Lifecycle methods
         * @function
         * @private
         */
        initializer: function() {
            this.handlers = [];
            this.detailsOverlay = new Y.Overlay({
                zIndex: 100,
                width: this.get("width"),
                constrain: true,
                visible: false
            }).render();
            this.detailsOverlay.get("contentBox").addClass("pmg-popup-overlay");
            this.bind();
        },
        bind: function() {
            Y.log("bind()", "log", "Wegas.Taskonclickpopup");
            this.handlers.push(Y.one("body").on("click", this.detailsOverlay.hide, this.detailsOverlay));
            this.onceAfterHostEvent("render", this._sync);
            this.afterHostMethod("syncUI", this._sync);
            this._customBind();
        },
        _customBind: function() {
        },
        _getTaskDescriptor: function(e) {
        },
        _sync: function() {
        },
        onClick: function(e) {
            var key, requestedField = [],
                fields = ["label", "description", 'requirements', 'duration'],
                taskDescriptor = this._getTaskDescriptor(e);

            if (taskDescriptor !== this.currentTask) {
                this.currentTask = taskDescriptor;
                this.currentPos = [e.pageX + 10, e.pageY + 20];

                for (key in fields) {
                    if (fields[key] && !taskDescriptor.get(fields[key])) {
                        requestedField.push(fields[key]);
                    }
                }

                if (requestedField.length > 0) {
                    this.request(taskDescriptor, requestedField);
                } else {
                    this.display(taskDescriptor);
                }
            } else {
                this.detailsOverlay.hide();
                this.currentTask = null;
            }

            e.halt(true);
        },
        request: function(taskDescriptor, requiredFields) {
            if (requiredFields.length > 0) {
                Wegas.Facade.Variable.cache.getWithView(taskDescriptor, "Extended", {// Retrieve the object from the server in Export view
                    on: Wegas.superbind({
                        success: function(e) {
                            var i, value;
                            for (i in requiredFields) {
                                value = e.response.entity.get(requiredFields[i]);
                                taskDescriptor.set(requiredFields[i], value);
                            }
                            this.display(taskDescriptor);
                        },
                        failure: function() {
                            this.showMessage("error", "An error occured");
                        }
                    }, this)
                });
            }
        },
        getDescriptionToDisplay: function(descriptor) {
            var i, description = descriptor.get("description"),
                requirements = descriptor.getInstance().get("requirements"),
                dataToDisplay = '<div class="field" style="padding:5px 10px">'
                + '<p class="subtitle">Description</p><p>' + description
                /*+ (description ?
                 description: "")*/
                + '</p></div><div style="padding:5px 10px" class="duration"><p><span class="subtitle">Duration: </span><span>'
                + descriptor.getInstance().get('properties').duration + ' </span></p></div>'
                + '<div style="padding:5px 10px" class="requirements"><p class="subtitle">Requirements</p>';

            for (i = 0; i < requirements.length; i += 1) {
                if (+requirements[i].get("quantity") > 0) {
                    dataToDisplay = dataToDisplay + "<p>" + requirements[i].get("quantity") + "x " +
                        Y.Wegas.persistence.Resources.GET_SKILL_LABEL(requirements[i].get("work"))
                        + " " + Wegas.PmgDatatable.TEXTUAL_SKILL_LEVEL[requirements[i].get("level")];
                }
            }
            dataToDisplay = dataToDisplay + "</div>";
            return dataToDisplay;
        },
        display: function(taskDescriptor) {
            this.detailsOverlay.set("headerContent", taskDescriptor.get("label"));
            this.detailsOverlay.setStdModContent('body', this.getDescriptionToDisplay(taskDescriptor));
            this.detailsOverlay.move(this.currentPos[0], this.currentPos[1]);
            this.detailsOverlay.show();
        },
        /**
         * Destructor methods.
         * @function
         * @private
         */
        destructor: function() {
            var i;
            this.detailsOverlay.destroy();
            for (i = 0; i < this.handlers.length; i += 1) {
                this.handlers[i].detach();
            }
        }
    }, {
        ATTRS: {
            width: {
                type: "string",
                value: "250px"
            }
        },
        NS: "taskonclickpopup"
    });
    Y.Plugin.Taskonclickpopup = Taskonclickpopup;

    /**
     *  @class add a popup on a table column
     *  @name Y.Plugin.Taskontableclickpopup
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    Taskontableclickpopup = Y.Base.create("wegas-pmg-taskontableclickpopup", Y.Plugin.Taskonclickpopup, [], {
        _customBind: function() {
            this.get("host").datatable.after("sort", this.sync, this);
            this.handlers.push(this.get("host").datatable.delegate("click", this.onClick, ".onclickpopup", this));
        },
        _getTaskDescriptor: function(e) {
            return this.get("host").datatable.getRecord(e.currentTarget).get("descriptor");
        },
        _sync: function() {
            var i, dt = this.get("host").datatable;
            for (i = 0; i < dt.get("data").size(); i += 1) {
                dt.getCell([i, this.get("column")]).addClass("onclickpopup");
            }
        }
    }, {
        ATTRS: {
            column: {
                value: 1,
                _inputex: {
                    _type: "integer",
                    label: "popup on column"
                }
            }
        },
        NS: "taskontableclickpopup"
    });
    Y.Plugin.Taskontableclickpopup = Taskontableclickpopup;


    /**
     *  @class add a popup on a table column
     *  @name Y.Plugin.Taskontableclickpopup
     *  @extends Y.Plugin.Base
     *  @constructor
     */
    Taskoniterationclickpopup = Y.Base.create("wegas-pmg-taskontableclickpopup", Y.Plugin.Taskonclickpopup, [], {
        _customBind: function() {
            //this.get("host").datatable.after("sort", this.sync, this);
            this.handlers.push(this.get("host").get("contentBox").delegate("click", this.onClick, "em.task", this));
        },
        _getTaskDescriptor: function(e) {
            Y.log(e.target.getAttribute("taskId"));
            return Y.Wegas.Facade.Variable.cache.findById(e.target.getAttribute("taskId"));
            //return this.get("host").datatable.getRecord(e.currentTarget).get("descriptor");
        },
        _sync: function() {
            //var i, dt = this.get("host").datatable;
            //for (i = 0; i < dt.get("data").size(); i += 1) {
            //    dt.getCell([i, this.get("column")]).addClass("onclickpopup");
            //}
        }
    }, {
        ATTRS: {
        },
        NS: "taskoniterationclickpopup"
    });
    Y.Plugin.Taskoniterationclickpopup = Taskoniterationclickpopup;
});