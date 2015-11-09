/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

/**
 *
 * @fileoverview
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
YUI.add("wegas-entitychooser", function (Y) {
	"use strict";
	var CONTENTBOX = "contentBox", EntityChooser;

	EntityChooser = Y.Base.create("wegas-entitychooser",
		Y.Widget,
		[Y.WidgetChild,
			Y.Wegas.Widget,
			Y.Wegas.Editable],
		{
			CONTENT_TEMPLATE: "<div><ul class='chooser-entities'></ul><div class='chooser-widget'></div></div>",
			renderUI: function () {
				var items = (this.get("variable.evaluated") ? (this.get("flatten") ? this.get("variable.evaluated").flatten() : this.get("variable.evaluated").get("items")) : []),
					i, entityBox = this.get(CONTENTBOX).one(".chooser-entities"), length = items.length,
					filter = [];


				if (this.get("classFilter")) {
					if (!Y.Lang.isArray(this.get("classFilter"))) {
						filter.push(this.get("classFilter"));
					} else {
						filter = filter.concat(this.get("classFilter"));
					}
				}

				for (i = 0; i < length; i += 1) {
					if (filter.length === 0 || filter.find(function (item) {
						return item === items[i].get("@class");
					})) {
						entityBox.append("<li class='chooser-entity' data-name='" + items[i].get("name") + "'>" +
							(items[i].get("title") || items[i].get("label")) + "</li>");
					}
				}
			},
			bindUI: function () {
				this.get(CONTENTBOX).delegate("click", function (e) {
					this.genWidget(e.target.getData("name"));
					this.get(CONTENTBOX).all(".chooser-choosen").removeClass("chooser-choosen");
					e.target.addClass("chooser-choosen");
				}, ".chooser-entities .chooser-entity", this);
			},
			genWidget: function (name) {
				var cfg = this.get("widget"),
					ctx = this;
				Y.Wegas.Editable.use(cfg, function (Y) {
					if (ctx.widget) {
						ctx.widget.set(ctx.get("widgetAttr"), {name: name});
					} else {
						cfg[ctx.get("widgetAttr")] = {name: name};
						Y.Wegas.use(cfg, Y.bind(function () {
							this.widget = Y.Wegas.Widget.create(cfg);
							this.widget.render(this.get(CONTENTBOX).one(".chooser-widget"));
							this.widget.on(["*:message", "*:showOverlay", "*:hideOverlay"], this.fire, this); // Event on the loaded
						}, ctx));
					}
				});
			},
			syncUI: function () {

			}

		},
		{
			ATTRS: {
				variable: {
					getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
					_inputex: {
						_type: "variableselect",
						legend: "Folder",
						classFilter: ["ListDescriptor"]
					}
				},
				widget: {
					value: {type: "HistoryDialog"},
					getter: function (v) {
						return Y.JSON.parse(Y.JSON.stringify(v));
					},
					_inputex: {
						_type: "group",
						fields: [{
								type: "string",
								name: "type",
								label: "Type"
							}]
					}
				},
				widgetAttr: {
					value: "dialogueVariable",
					type: "string"
				},
				flatten: {
					type: "boolean",
					value: "true"
				},
				classFilter: {
					type: "array",
					_inputex: {
						elementType: {
							required: true,
							type: "select",
							choices: Y.Wegas.persistence.AVAILABLE_TYPES
						}
					}
				}
			}
		});
	Y.Wegas.EntityChooser = EntityChooser;
});
