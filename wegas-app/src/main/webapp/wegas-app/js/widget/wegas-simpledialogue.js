/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Anthony Geiser <antho.geiser@gmail.com>
 */
YUI.add("wegas-simpledialogue", function (Y) {
	"use strict";

	var CONTENTBOX = "contentBox", SimpleDialogue;

	SimpleDialogue = Y.Base.create("wegas-simpledialogue", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable], {
		CONTENT_TEMPLATE: '<div><div class="dialogue"><div class="talk"></div><div class="response"><ul class="responseElements"></ul></div></div></div>',
		initializer: function () {
			this.handlers = {};
		},
		bindUI: function () {
			this.handlers.update = Y.Wegas.Facade.Variable.after("update", this.syncUI, this);
			this.handlers.change = this.after("dialogueVariableChange", this.syncUI, this);

			this.get(CONTENTBOX).delegate('click', function (e) {
				var no = parseInt(e.currentTarget.getAttribute("response_no"));
				if (this.availableActions[no]) {
					this.currentDialogue.doTransition(this.availableActions[no]);
				}
			}, '.dialogue .response .responseElements li', this);
		},
		syncUI: function () {
			this.currentDialogue = this.get("dialogueVariable.evaluated");

			if (!this.currentDialogue) {
				this.get(CONTENTBOX).one('.dialogue .talk').insert("Dialog variable could not be found");
				return;
			}
			var state = this.currentDialogue.getCurrentState();
			this.displayText(state.get('text'));
			if (!state instanceof Y.Wegas.persistence.DialogueDescriptor) {
				Y.log("State isn't a dialogue state.", 'error', 'SimpleDialogue');
				return;
			}
			state.getAvailableActions(Y.bind(this.readStateContent, this));
		},
		destructor: function () {
			for (var i in this.handlers) {
				this.handlers[i].detach();
			}
		},
		readStateContent: function (availableActions) {
			this.availableActions = availableActions;
			this.displayResponse(availableActions);
		},
		displayText: function (textParts) {
			textParts = (textParts === null || Y.Lang.isUndefined(textParts)) ? "" : textParts;
			this.get(CONTENTBOX).one('.dialogue .talk').setHTML("<p>" + textParts + "</p>");
		},
		displayResponse: function (availableActions) {
			var i, responseNode = this.get(CONTENTBOX).one('.dialogue .response .responseElements');
			responseNode.setContent("");
			if (!availableActions || this.get("readonly")) {
				return;
			}
			for (i = 0; i < availableActions.length; i++) {
				responseNode.insert('<li response_no="' + i + '">' + availableActions[i].get('actionText') + '</li>');
			}
		}
	}, {
		ATTRS: {
			dialogueVariable: {
				getter: Y.Wegas.Widget.VARIABLEDESCRIPTORGETTER,
				_inputex: {
					_type: "variableselect",
					label: "Dialogue",
					classFilter: ["DialogueDescriptor"]
				}
			},
			readonly: {
				type: "boolean",
				value: false,
				optional: true
			}
		}
	});
	Y.Wegas.SimpleDialogue = SimpleDialogue;
});
