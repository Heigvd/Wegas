/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
YUI.add("wegas-text-input", function (Y) {
	"use strict";
	var CONTENTBOX = "contentBox", TextInput, StringInput, SelectInput,
		Wegas = Y.Wegas;
	/**
	 * @name Y.Wegas.TextInput
	 * @extends Y.Widget
	 * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
	 * @class class to edit text
	 * @constructor
	 */
	TextInput = Y.Base.create("wegas-text-input", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
		/** @lends Y.Wegas.TextInput# */


		CONTENT_TEMPLATE: "<div>" +
			"<div class=\"wegas-input-label\"></div>" +
			"<div class=\"wegas-text-input-editor\"></div>" +
			"<div class=\"wegas-text-input-toolbar\"><span class=\"status\"></span></div>" +
			"</div>",
		initializer: function () {
			this.handlers = [];
		},
		/**
		 * @function
		 * @private
		 */
		renderUI: function () {
//            Y.once("domready", function() {
			if (this.get("label")) {
				this.get("contentBox").one(".wegas-input-label").setContent(this.get("label"));
			}

			if (this.get("readonly")) {
				this.get("contentBox").one(".wegas-text-input-editor").setContent(this.getInitialContent());
			} else {
				this.editor = new tinymce.Editor(this.get("contentBox").one(".wegas-text-input-editor").getDOMNode(), {
					plugins: [
						"autolink link image lists code media table contextmenu paste advlist textcolor"
							//textcolor wordcount autosave advlist charmap print preview hr anchor pagebreak spellchecker directionality
					],
					external_plugins: {
						"dynamic_toolbar": Y.Wegas.app.get("base") + "wegas-editor/js/plugin/wegas-tinymce-dynamictoolbar.js"
					},
					//toolbar1: "bold italic bullist | link image media code addToolbarButton",
					toolbar1: "bold italic bullist | link code addToolbarButton",
					toolbar2: "forecolor backcolor underline alignleft aligncenter alignright alignjustify table",
					toolbar3: "fontselect fontsizeselect styleselect",
					// formatselect removeformat underline unlink forecolor backcolor anchor previewfontselect fontsizeselect styleselect spellchecker template
					// contextmenu: "link image inserttable | cell row column deletetable | formatselect forecolor",
					menubar: false,
					statusbar: false,
					relative_urls: false,
					toolbar_items_size: 'small',
					hidden_tootlbar: [2, 3],
					setup: Y.bind(function (editor) {
						//editor.on('keyUp', Y.bind(this._keyup, this)); // Update on editor update
						editor.on('keyUp', Y.bind(this._onChange, this)); // Update on editor update
						//editor.on('NodeChange', Y.bind(this.setContent, this)); // Update on editor update
						this.editor = editor;
					}, this),
					image_advtab: true,
					autoresize_min_height: 35,
					autoresize_max_height: 500,
					content_css: [
						Wegas.app.get("base") + "wegas-editor/css/wegas-inputex-rte.css"
					],
					style_formats: [{// Style formats
							title: 'Title 1',
							block: 'h1'
						}, {
							title: 'Title 2',
							block: 'h2'
								// styles : {
								//    color : '#ff0000'
								// }
						}, {
							title: 'Title 3',
							block: 'h3'
						}, {
							title: 'Normal',
							inline: 'span'
						}, {
							title: "Code",
							//icon: "code",
							block: "code"
						}]}, tinymce.EditorManager);
				this.editor.render();
				//this.setContent();
				if (this.get("showSaveButton")) {
					this.addButton = new Wegas.Button({
						label: "<span class=\"wegas-icon wegas-icon-save\"></span>",
						tooltip: "Save",
						cssClass: "wegas-text-input-save",
						on: {
							click: Y.bind(this.onSave, this)
						}
					}).render(this.get("contentBox").one(".wegas-text-input-toolbar"));
				}
			}
			// }, this);
		},
		bindUI: function () {
			this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
		},
		syncUI: function () {
			this.setContent();
		},
		setContent: function () {
			Y.later(100, this, function () {
				var content = this.getInitialContent();
				if (content != this._initialContent) {
					this._initialContent = content;
					this.editor.setContent(content);
				}
				/*var tmceI = tinyMCE.get(this.get("contentBox").one(".wegas-text-input-editor"));
				 if (tmceI) {
				 tmceI.setContent(this.getInitialContent());
				 }*/

			});
		},
		getInitialContent: function () {
			return this.get("variable.evaluated").getInstance().get("value");
		},
		setStatus: function (msg) {
			if (this.get("showStatus")) {
				this.get("contentBox").one(".status").setContent("<p>" + msg + "</p>");
			}
		},
		_onChange: function () {
			this.setStatus("Not saved");
			this.valueChanged(this.editor.getContent());

			if (!this.get("showSaveButton")) {
				if (this.wait) {
					this.wait.cancel();
				}
				this.wait = Y.later(750, this, function () {
					this.wait = null;
					this.onSave();
				});
			}
		},
		valueChanged: function (newValue) {
			// To Be Overwritten
		},
		onSave: function () {
			var value = this.editor.getContent(),
				msg = (this.save(value) ? "Saved" : "Something went wrong");
			this.setStatus(msg);
		},
		save: function (value) {
			var theVar = this.get("variable.evaluated").getInstance();
			this._initialContent = value;
			theVar.set("value", value);
			Y.Wegas.Facade.Variable.cache.put(theVar.toObject());
			return true;
		},
		getEditorLabel: function () {
			return "TextInput";
		},
		destructor: function () {
			Y.Array.each(this.handlers, function (h) {
				h.detach();
			});
			if (this.addButton) {
				this.addButton.destroy();
			}
		}
	}, {
		/** @lends Y.Wegas.TextInput */
		EDITORNAME: "TextInput",
		ATTRS: {
			/**
			 * The target variable, returned either based on the name attribute,
			 * and if absent by evaluating the expr attribute.
			 */
			variable: {
				getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
				_inputex: {
					_type: "variableselect",
					label: "variable",
					classFilter: ["TextDescriptor"]
				}
			},
			readonly: {
				//getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
				type: "boolean",
				value: false,
				optional: true
					/*_inputex: {
					 _type: "variableselect",
					 label: "Editable",
					 classFilter: ["BooleanDescriptor"]
					 }*/
			},
			showSaveButton: {
				type: "boolean",
				value: true,
				optional: true
			},
			showStatus: {
				type: "boolean",
				value: true,
				optional: true
			},
			label: {
				type: "string",
				optional: true
			}
		}
	});
	Y.Wegas.TextInput = TextInput;


	StringInput = Y.Base.create("wegas-string-input", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
		CONTENT_TEMPLATE: "<div>" +
			"<div class=\"wegas-input-label\"></div>" +
			"<div class=\"wegas-input-text\"></div>" +
			"</div>",
		initializer: function () {
			this.handlers = [];
			this._initialValue = undefined;
		},
		destructor: function () {
			Y.Array.each(this.handlers, function (h) {
				h.detach();
			});
		},
		/**
		 * Try to save value.
		 * @param {type} value the new value to save
		 * @returns {Boolean} true is the value has been saved, false otherwise
		 */
		updateValue: function (value) {
			var desc = this.get("variable.evaluated"),
				inst = desc.getInstance(),
				allowedValues = desc.get("allowedValues");

			if (allowedValues && allowedValues.length > 0) {
				if (!allowedValues.find(function (item) {
					return item === value;
				}, this)) {
					this.showMessage("error", Y.Wegas.I18n.t('errors.lessThan', {value: value, min: min}));
					return false;
				}
			}

			if (inst.get("value") !== value) {
				inst.set("value", value);
				Y.Wegas.Facade.Variable.cache.put(inst.toObject());
			}
			return true;
		},
		renderUI: function () {
			var desc = this.get("variable.evaluated"),
				inst = desc.getInstance(),
				allowedValues = desc.get("allowedValues"),
				readonly = this.get("readonly.evaluated"),
				CB = this.get("contentBox"),
				input = CB.one(".wegas-input-text"),
				label = CB.one(".wegas-input-label"),
				i, value, content;


			if (this.get("label")) {
				label.setContent(this.get("label"));
			}

			if (allowedValues && allowedValues.length > 0) {
				// SELECT
				content = ['<select>'];
				content.push("<option value=\"\" disabled selected>--select--</option>");
				for (i in allowedValues) {
					value = allowedValues[i];
					content.push("<option value=\"" + value + "\" " +
						(value === inst.get("value") ? "selected=''" : "") +
						">" + value + "</option>");
				}
				content.push('</select>');

				input.setContent(content.join(""));
			} else {
				// INPUT
				input.setContent("<input value=\"" + value + "\" />");
			}
		},
		syncUI: function () {
			var desc = this.get("variable.evaluated"),
				allowedValues = desc.get("allowedValues"),
				inst = desc.getInstance(),
				CB = this.get("contentBox"),
				value = inst.get("value"),
				readonly = this.get("readonly.evaluated"),
				input, select, option;

			if (allowedValues && allowedValues.length > 0) {
				select = CB.one("select");
				select.set("disabled", readonly);
				if (this._initialValue !== value) {
					this._initialValue = value;
					option = select.one("option[value='" + value + "']");
					option && option.setAttribute("selected");
				}
			} else {
				input = CB.one("input");
				input.set("disabled", readonly);
				if (this._initialValue !== value) {
					this._initialValue = value;
					input.set("value", value);
				}
			}
		},
		bindUI: function () {
			var input, select;
			this.handlers.push(Y.Wegas.Facade.Variable.after("update", this.syncUI, this));
			input = this.get(CONTENTBOX).one("input");
			if (input) {
				this.handlers.push(input.on("blur", this.updateFromInput, this));
			}
			select = this.get(CONTENTBOX).one("select");
			if (select) {
				this.handlers.push(select.on("change", this.updateFromSelect, this));
			}
		},
		updateFromSelect: function (e) {
			this.updateValue(e.target.get("value"));
		},
		updateFromInput: function (e) {
			var input = this.get(CONTENTBOX).one("input"),
				data = input.getData(),
				value = input.get("value");

			if (data.wait) {
				data.wait.cancel();
			}
			data.wait = Y.later(200, this, function () {
				data.wait = null;
				this.updateValue(value);
			});
		}
	}, {
		/** @lends Y.Wegas.StringInput */
		EDITORNAME: "StringInput",
		ATTRS: {
			/**
			 * The target variable, returned either based on the name attribute,
			 * and if absent by evaluating the expr attribute.
			 */
			variable: {
				getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
				_inputex: {
					_type: "variableselect",
					label: "variable",
					classFilter: ["NumberDescriptor"]
				}
			},
			readonly: {
				getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
				type: "boolean",
				value: false,
				optional: true,
				_inputex: {
					_type: "script",
					expects: "condition"
				}
			},
			label: {
				type: "string",
				optional: true
			}
		}
	});
	Wegas.StringInput = StringInput;


});
