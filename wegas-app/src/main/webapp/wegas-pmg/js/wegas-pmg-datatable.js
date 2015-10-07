/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @author Benjamin Gerber <ger.benjamin@gmail.com>
 */
/*global YUI*/
YUI.add("wegas-pmg-datatable", function(Y) {
    "use strict";

    var CONTENTBOX = "contentBox", Datatable, micro = new Y.Template(),
        APPRENTICE = Y.Wegas.I18n.t('pmg.grade.apprentice').capitalize(),
        JUNIOR = Y.Wegas.I18n.t('pmg.grade.junior').capitalize(),
        SENIOR = Y.Wegas.I18n.t('pmg.grade.senior').capitalize(),
        EXPERT = Y.Wegas.I18n.t('pmg.grade.expert').capitalize(),
        Wegas = Y.Wegas,
        TEMPLATES = {
            template: micro.compile('<%= Y.Object.getValue(this, this._field.split(".")) %>'),
            object: micro.compile('<% for(var i in Y.Object.getValue(this, this._field.split("."))){%> <%= Y.Object.getValue(this, this._field.split("."))[i]%> <%} %>'),
            requiredRessource: micro.compile('<% var reqs = this.get("requirements"), i; for(i=0; i< reqs.length;i+=1){%><% if (+reqs[i].get("quantity") > 0){%><p><span class="quantity"><%= reqs[i].get("quantity") %>x</span> <span class="work"><%= Y.Wegas.persistence.Resources.GET_SKILL_LABEL(reqs[i].get("work")) %></span> <span class="level"><%= Y.Wegas.PmgDatatable.TEXTUAL_SKILL_LEVEL[reqs[i].get("level")] %></span>  <% if (this.isRequirementCompleted(reqs[i])){%><span>&#10003;</span><%}%>  </p> <%}%><%}%>'),
            assignedResource: micro.compile('<% var bold=false, skillName; for(var i = 0; i < this.assignments.length; i+=1){ bold = this.assignments[i].ressourceDescriptor.isPlannedForCurrentPeriod(this.assignments[i].taskDescriptor, this.gantt); skillName = Y.Wegas.Facade.Variable.cache.findParentDescriptor(this.assignments[i].ressourceDescriptor).get("name"); if (bold) {%> <p style="font-weight: bold;"><%} else { %> <p><% } %><%= this.assignments[i].ressourceDescriptor.get("label") %> (<%= Y.Wegas.persistence.Resources.GET_SKILL_LABEL(skillName) %> <%= Y.Wegas.PmgDatatable.TEXTUAL_SKILL_LEVEL[this.assignments[i].ressourceInstance.get("properties").level] %>)</p><% } %>')
        };

    Datatable = Y.Base.create("wegas-pmg-datatable", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
        // *** Lifecycle Methods *** //
        initializer: function() {
            var i, ct = this.get("columnsCfg"),
                recordTypes = {};
            this._bypassSyncCounter = 0;
            for (i = 0; i < ct.length; i += 1) {                                //construct Datatable's columns
                Y.mix(ct[i], {
                    sortable: true,
                    allowHTML: true
                });
                if (Y.Lang.isString(ct[i].sortFn)) {
                    ct[i].sortFn = Datatable.Sort[ct[i].sortFn](ct[i]);
                }

                // Add specific getter for deep properties @hack : . and % are synonyms (@hack @shame)
                if ((ct[i].key && ct[i].key.indexOf(".") >= 0) || (ct[i].key && ct[i].key.indexOf("£") >= 0)) {  // @hack
                    // Key with points issue...
                    ct[i].key = ct[i].key.replace(/\./g, "£");  // @hack replace '.' by '%' @shame

                    recordTypes[ct[i].key] = {getter: function(i, key) {
                            var v = this.get(key.replace(/£/g, ".")); // @hack @shame
                            // Coerce to number if possible
                            return +v || v;
                        }
                    };
                }
                if (ct[i].label){
                    ct[i].label = Y.Template.Micro.compile(ct[i].label || "")();
                }
            }
            
            this.datatable = new Y.DataTable({//Using simple database
                //bodyView: Wegas.PMGBodyView,
                columns: ct,
                recordType: recordTypes
                    //recordType: PMGDatatableModel,
                    //sortable: true
            });
        },
        renderUI: function() {
            Y.log("renderUI()", "info", "Wegas.PMGDatatable");
            this.datatable.render(this.get(CONTENTBOX));
        },
        bindUI: function() {
            this.updateHandler =
                Wegas.Facade.Variable.after("update", this.syncUI, this);
        },
        bypassSync: function() {
            this._bypassSyncCounter += 1;
        },
        unbypassSync: function() {
            if (this._bypassSyncCounter <= 1) {
                this._bypassSyncCounter = 0;
            } else {
                this._bypassSyncCounter -= 1;
            }
        },
        syncUI: function() {
            if (!this._bypassSyncCounter) {
                Y.log("syncUI()", "log", "Wegas.Datatable");
                this.datatable.set("data", this.getData());
                // this.datatable.addRows(this.getData());
            }
        },
        destructor: function() {
            Y.log("destructor()", "log", "Wegas.Datatable");
            this.updateHandler.detach();
            this.datatable.destroy();
        },
        //*** Private Methods ***/
        getData: function() {
            var variables = this.get('variable.evaluated'),
                data = [];
            if (!variables) {
                this.showMessage("error", "Could not find variable");
                return [];
            } else if (!variables instanceof Wegas.persistence.ListDescriptor) {
                this.showMessage("error", "Variable is not a ListDescriptor");
                return [];
            }
            Y.Array.each(variables.get("items"), function(item) {
                if (item.getInstance().get("active")) {
                    data.push(Y.mix(item.toJSON(), {
                        descriptor: item,
                        instance: item.getInstance().toJSON()
                    }));
                }
            });
            return data;
        }
    }, {
        TEXTUAL_SKILL_LEVEL: {
            1: APPRENTICE,
            2: APPRENTICE,
            3: APPRENTICE,
            4: JUNIOR,
            5: JUNIOR,
            6: JUNIOR,
            7: SENIOR,
            8: SENIOR,
            9: SENIOR,
            10: EXPERT,
            11: EXPERT,
            12: EXPERT
        },
        ATTRS: {
            /**
             * The target variable, returned either based on the variableName attribute,
             * and if absent by evaluating the expr attribute.
             */
            variable: {
                getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
                _inputex: {
                    _type: "variableselect"
                }
            },
            columnsCfg: {
                validator: Y.Lang.isArray
            },
            defaultSort: {
                value: null,
                validator: function(s) {
                    return s === null || Y.Lang.isString(s);
                }
            }
        },
        Sort: {
            objectsort: function(col) {
                return function(a, b, dir) {
                    var aa = Y.Object.values(a.get(col.key))[0] || '',
                        bb = Y.Object.values(b.get(col.key))[0] || '';
                    if (typeof aa === "string" && typeof bb === "string") {// Not case sensitive
                        aa = aa.toLowerCase();
                        bb = bb.toLowerCase();
                    }
                    return dir ? aa < bb : aa > bb;
                };
            }
        }
    });
    Wegas.PmgDatatable = Datatable;

    Y.mix(Y.DataTable.BodyView.Formatters, {
        quality: function() {
            return function(o) {
                if (o.data.instance.properties.completeness <= 0) {
                    return "-";
                } else {
                    return +o.data.instance.properties.quality + +o.data.instance.properties.computedQuality;
                }
            };
        },
        requieredRessources: function() {
            return function(o) {
                return TEMPLATES.requiredRessource(Y.Wegas.Facade.Variable.cache.find("id", o.data.id).getInstance());
            };
        },
        assignedRessources: function() {
            var gantt = Y.Wegas.PMGHelper.computePert();
            return function(o) {
                var assignedResources = o.data.descriptor.findAssociatedRessources("assignments"),
                    data = TEMPLATES.assignedResource({
                        assignments: assignedResources,
                        gantt: gantt
                    });
                if (!data) {
                    data = " - ";
                }
                return data;
            };
        },
        template: function() {
            return function(o) {
                var data;
                o.data._field = o.column.field;
                data = TEMPLATES.template(o.data);
                if (!data) {
                    data = " - ";
                }
                return data;
            };
        },
        rounded: function() {
            return function(o) {
                return Math.round(+o.value);
            };
        },
        object: function() {
            return function(o) {
                var i, ret = [];
                for (i in o.value) {
                    ret.push(o.value[i]);
                }
                return ret.join("");
            };
        },
        skillLevel: function() {
            return function(o) {
                return Wegas.PmgDatatable.TEXTUAL_SKILL_LEVEL[o.value];
            };
        },
        "object-old": function() {
            return function(o) {
                var data = "";
                o.data._field = o.column.field;
                data = TEMPLATES.object(o.data);
                if (!data) {
                    data = " - ";
                }
                return data;
            };
        }
    });
});
