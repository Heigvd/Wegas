/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
/**
 * @fileoverview
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
YUI.add('wegas-mcq-tabview', function (Y) {
	"use strict";

	var CONTENTBOX = 'contentBox', Wegas = Y.Wegas,
		MCQTabView;

	/**
	 * @name Y.Wegas.MCQTabView
	 * @extends Y.Widget
	 * @borrows Y.WidgetChild, Y.Wegas.Widget, Y.Wegas.Editable
	 * @class Class to view and reply to questions and choices.
	 * @constructor
	 * @description  Display and allow to reply at questions and choice sent
	 *  to the current player
	 */
	MCQTabView = Y.Base.create("wegas-mcqtabview", Y.Widget, [Y.WidgetChild, Wegas.Widget, Wegas.Editable], {
		/** @lends Y.Wegas.MCQTabView# */
		// *** Lifecycle Methods *** //
		CONTENT_TEMPLATE: null,
		/**
		 * @function
		 * @private
		 * @description Set variable with initials values.
		 */
		initializer: function () {
			/**
			 * datasource from Y.Wegas.Facade.Variable
			 */
			this.dataSource = Wegas.Facade.Variable;
			this.tabView = new Y.TabView();
			/**
			 * TabView widget used to display question/choices and corresponding reply
			 */
			this.gallery = null;
			/**
			 * Reference to each used functions
			 */
			this.handlers = {};
			this.isRemovingTabs = false;
		},
		/**
		 * @function
		 * @private
		 * @description Render the TabView widget in the content box.
		 */
		renderUI: function () {
			var cb = this.get(CONTENTBOX);
			this.tabView.render(cb);
			this.tabView.get("boundingBox").addClass("horizontal-tabview");
			cb.append("<div style='clear:both'></div>");
		},
		/**
		 * @function
		 * @private
		 * @description bind function to events.
		 * When submit button is clicked, send the selected choice
		 * When datasource is updated, do syncUI;
		 */
		bindUI: function () {

			this.tabView.after("selectionChange", this.onTabSelected, this);

			this.get(CONTENTBOX).delegate("click", function (e) {

				Wegas.Panel.confirmPlayerAction(Y.bind(function () {
					this.showOverlay();
					this.dataSource.sendRequest({
						request: "/QuestionDescriptor/SelectAndValidateChoice/" + e.target.get('id')
							+ "/Player/" + Wegas.Facade.Game.get('currentPlayerId'),
						cfg: {
							method: "POST"
						},
						on: {
							success: Y.bind(this.hideOverlay, this),
							failure: Y.bind(this.hideOverlay, this)
						}
					});
				}, this));
			}, "button.yui3-button", this);

			this.handlers.response = this.dataSource.after("update", this.syncUI, this);
		},
		/**
		 * @function
		 * @private
		 * @description Clear and re-fill the TabView with active
		 * choice/questions and relatives reply.
		 * Display a message if there is no message.
		 */
		syncUI: function () {
			var questions = this.get("variable.evaluated"),
				selectedTab = this.tabView.get('selection'),
				lastSelection = (selectedTab) ? selectedTab.get('index') : 0;

			this.isRemovingTabs = true;
			this.tabView.destroyAll();                                          // Empty the tabview
			this.isRemovingTabs = false;

			if (this.gallery) {
				this.gallery.destroy();
				this.gallery = null;
			}
			if (!Y.Lang.isArray(questions)) {
				questions = [questions];
			}

			this.addQuestions(questions);

			if (this.gallery) {
				this.gallery.syncUI();
			}
			this.hideOverlay();

			if (this.tabView.isEmpty()) {
				this.get("contentBox").addClass("empty");
				this.tabView.add(new Y.Tab({
					label: "",
					content: "<center><i><br /><br /><br />" + Y.Wegas.I18n.t('mcq.empty') + "</i></center>"
				}));
				this.tabView.selectChild(0);
			} else {
				this.get("contentBox").removeClass("empty");
				if (lastSelection >= this.tabView.size()) {                     // Can occur when questions list has changed during event
					lastSelection = 0;
				}
				this.tabView.selectChild(lastSelection);
			}
		},
		addQuestions: function (questions) {

			var i, cReplyLabel, cQuestion, cQuestionInstance,
				tab, choiceDescriptor;

			for (i = 0; i < questions.length; i += 1) {
				cQuestion = questions[i];
				cQuestionInstance = cQuestion.getInstance();
				cReplyLabel = null;
				if (cQuestion instanceof Wegas.persistence.QuestionDescriptor
					&& cQuestionInstance.get("active")) {                   // If current question is active

					if (cQuestionInstance.get("replies").length > 0) {          // Find the last selected replies
						if (cQuestion.get("allowMultipleReplies")) {
							cReplyLabel = cQuestionInstance.get("replies").length + "x";
						} else {
							choiceDescriptor = cQuestionInstance.get("replies")[cQuestionInstance.get("replies").length - 1 ].getChoiceDescriptor();
							cReplyLabel = choiceDescriptor.get("title") || "";
							cReplyLabel = (cReplyLabel.length >= 15) ? cReplyLabel.substr(0, 15) + "..." : cReplyLabel;
						}
					}
					if (Y.Lang.isNull(cReplyLabel)) {
						cReplyLabel = (!cQuestion.get("allowMultipleReplies")) ? Y.Wegas.I18n.t('mcq.unanswered') : Y.Wegas.I18n.t('mcq.notDone');
					}

					tab = new Y.Tab({
						label: '<div class="'
							+ ((this.get("highlightUnanswered") && cQuestionInstance.get("replies").length === 0) ? "unread" : "")
							+ '"><div class="index-label">' + (cQuestion.get("title") || cQuestion.get("label") || "undefined") + '</div>'
							+ '<div class="index-status">' + cReplyLabel
							+ '</div></div>',
						content: "<div class=\"wegas-loading-div\"><div>"
					});
					tab.loaded = false;
					tab.cQuestion = cQuestion;
					this.tabView.add(tab);
				} else if (cQuestion instanceof Wegas.persistence.ListDescriptor) {
					this.addQuestions(cQuestion.get("items"));
				}
			}
		},
		/**
		 * @function
		 * @param e description
		 * @private
		 * @description Display selected question's description on current tab.
		 */
		onTabSelected: function (e) {
			if (e.newVal && e.newVal.cQuestion
				&& !this.isRemovingTabs && !e.newVal.loaded) {
				e.newVal.loaded = true;
				Wegas.Facade.Variable.cache.getWithView(e.newVal.cQuestion, "Extended", {// Retrieve the question/choice description from the server
					on: {
						success: Y.bind(function (tab, e) {
							var question = e.response.entity;

							this.renderTab(tab, question);

							if (question.get("pictures").length > 0) {
								this.gallery = new Wegas.util.FileLibraryGallery({
									selectedHeight: 150,
									selectedWidth: 235,
									gallery: Y.clone(question.get("pictures"))
								}).render(tab.get("panelNode").one(".description"));
							}
						}, this, e.newVal)
					}
				});
			}
		},
		renderTab: function (tab, question) {
			var i, ret, allowMultiple = question.get("allowMultipleReplies"),
				choices = tab.cQuestion.get("items"), choiceD, choiceI,
				questionInstance = tab.cQuestion.getInstance(),
				numberOfReplies = questionInstance.get("replies").length,
				answerable = allowMultiple || numberOfReplies === 0,
				reply;

			Y.log("RENDER TAB");

			ret = ['<div class="mcq-question">',
				'<div class="mcq-question-details">',
				'<div class="mcq-question-title">', question.get("title") || question.get("label") || "undefined", '</div>',
				'<div class="mcq-question-description">', question.get("description"), '</div>',
				'</div>'];

			// Display choices
			ret.push('<div class="mcq-choices">');
			for (i = 0; i < choices.length; i += 1) {
				choiceD = choices[i];
				choiceI = choiceD.getInstance();
				if (choiceI.get("active")) {
					if (answerable || questionInstance.get("replies")[0].getChoiceDescriptor().get("id") === choiceD.get("id")) {
						ret.push('<div class="mcq-choice">');
					} else {
						ret.push('<div class="mcq-choice spurned">');
					}
					ret.push('<div class="mcq-choice-name">', choiceD.get("title"), '</div>');
					ret.push('<div class="mcq-choice-description">', question.get("items")[i].get("description"), '</div>');

					if (allowMultiple) {
						ret.push('<span class="numberOfReplies">',
							"" + this.getNumberOfReplies(questionInstance, choiceD),
							'<span class="symbole">x</span></span>');
					}

					if (answerable && !this.get("readonly")) {
						ret.push('<button class="yui3-button" id="', choiceD.get("id"), '">', Y.Wegas.I18n.t('mcq.submit'), '</button>');
					} else {
						ret.push('<button class="yui3-button" disabled id="', choiceD.get("id"), '">', Y.Wegas.I18n.t('mcq.submit')
							//questionInstance.get("replies")[0].getChoiceDescriptor().get("id") === choiceD.get("id") ? "Made" : "Spurned"
							, '</button>');
					}

					ret.push('<div style="clear:both"></div>');
					ret.push('</div>'); // end mcq-choice
				}
			}
			ret.push('</div>'); // end mcq-choices


			if (numberOfReplies > 0) {
				ret.push('<div class="mcq-replies-title">', (numberOfReplies > 1 ? Y.Wegas.I18n.t('mcq.result').pluralize() : Y.Wegas.I18n.t('mcq.result')), '</div>');
				ret.push('<div class="mcq-replies">');
				for (i = numberOfReplies - 1; i >= 0; i -= 1) {
					reply = questionInstance.get("replies")[i];
					choiceD = reply.getChoiceDescriptor();
					ret.push('<div class="mcq-reply">');
					ret.push('<div class="mcq-reply-title">', choiceD.get("title"), '</div>');
					ret.push('<div class="mcq-reply-content">', reply.get("result").get("answer"), '</div>');
					ret.push('</div>'); // end mcq-reply
				}
				ret.push('</div>'); // end mcq-replies
			}
			ret.push('</div>'); // end mcq-question

			tab.set("content", ret.join(""));

		},
		/**
		 * @function
		 * @private
		 * @param {type} questionInstance
		 * @param {type} choice
		 * @returns {integer} a number
		 * @description Return the number of replies corresponding to the given choice.
		 */
		getNumberOfReplies: function (questionInstance, choice) {
			var i, occurrence = 0;
			for (i = 0; i < questionInstance.get("replies").length; i++) {
				if (questionInstance.get("replies")[i].getChoiceDescriptor().get("id") === choice.get("id")) { //can be buggy
					occurrence++;
				}
			}
			return occurrence;
		},
		getEditorLabel: function () {
			var variable = this.get("variable.evaluated");
			if (variable) {
				return variable.getEditorLabel();
			}
			return null;
		},
		/**
		 * @function
		 * @private
		 * @description Destroy TabView and detach all functions created
		 *  by this widget
		 */
		destructor: function () {
			var i;
			if (this.gallery) {
				this.gallery.destroy();
			}
			this.tabView.destroy();
			for (i in this.handlers) {
				this.handlers[i].detach();
			}
		}
	}, {
		EDITORNAME: "Question display",
		/** @lends Y.Wegas.MCQTabView */
		/**
		 * @field
		 * @static
		 * @description
		 * <p><strong>Attributes</strong></p>
		 * <ul>
		 *    <li>variable: The target variable, returned either based on the name
		 *     attribute, and if absent by evaluating the expr attribute.</li>
		 * </ul>
		 */
		ATTRS: {
			variable: {
				/**
				 * The target variable, returned either based on the name attribute,
				 * and if absent by evaluating the expr attribute.
				 */
				getter: Wegas.Widget.VARIABLEDESCRIPTORGETTER,
				_inputex: {
					_type: "variableselect",
					label: "Question folder",
					classFilter: ["ListDescriptor"]
				}
			},
			highlightUnanswered: {
				type: "boolean",
				value: true,
				_inputex: {
					label: "Higlight Unanswered",
					wrapperClassName: "inputEx-fieldWrapper wegas-advanced-feature"
				}
			},
			readonly: {
				type: "boolean",
				value: false,
				optional: true
			}
		}
	});
	Wegas.MCQTabView = MCQTabView;
});
