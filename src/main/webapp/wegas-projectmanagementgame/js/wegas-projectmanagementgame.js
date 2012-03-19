/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-projectmanagementgame', function(Y) {
    var CONTENTBOX = 'contentBox',

    PMGChoiceDisplay = Y.Base.create("wegas-pmgchoicedisplay", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        _tabView: null,

        _genTabs: function() {

        },

        bindUI: function() {
            this.get(CONTENTBOX).delegate("click", function(e) {
                Y.Wegas.app.dataSources.VariableDescriptor.rest.getRequest("MCQVariableDescriptor/Player/"+Y.Wegas.app.get('currentPlayer')+"/Reply/"+e.target.get('id')+"/RunScript/");
            }, "input[type=submit]", this);

            Y.Wegas.app.dataSources.VariableDescriptor.after("response", function(e) {
                this.syncUI();
            }, this);

            Y.Wegas.app.after('currentPlayerChange', function(e) {
                this.syncUI();
            }, this);
        },

        syncUI: function() {
            var questions = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariablesBy('@class', "MCQVariableDescriptor"),
            selectedTab = this._tabView.get('selection'),
            lastSelection = (selectedTab)?selectedTab.get('index'):0,
            i=0, j, cReplyLabel,cQuestion, ret, cQuestionInstance, firstChild;

            this._tabView.removeAll();

            for (; i<questions.length; i++) {
                cQuestion = questions[i];
                ret = [];
                cQuestionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceById(cQuestion.id),
                firstChild = true;

                if (cQuestionInstance.active) {
                    if (cQuestionInstance.replies.length == 0 || cQuestion.allowMultipleReplies) {
                        ret.push('<div class="h4">Answers</div>'+
                            '<div class="replies">');
                        for (j=0; j<cQuestion.replies.length; j++) {
                            ret.push('<div class="reply '+((firstChild)?"first-child":"")+'">'+
                                '<bold>'+cQuestion.replies[j].name+'</bold>'+
                                '<div>'+cQuestion.replies[j].description+'</div>'+
                                '<input type="submit" id="'+cQuestion.replies[j].id+'" value="Submit"></input>'+
                                '<div style="clear:both"></div>'+
                                '</div>');
                            firstChild = false;
                        }
                        ret.push('</div>');
                    } else {
                        ret.push('<div class="h4">Selected answer</div>'+
                            '<div class="replies">');
                        //for (var j=0; j<cQuestion.replies.length; j++) {
                        ret.push('<div class="reply first-child">'+
                            '<bold>'+cQuestionInstance.replies[0].name+'</bold>'+
                            '<div>'+cQuestionInstance.replies[0].description+'</div>'+
                            '<div style="clear:both"></div>'+
                            '</div>');
                        //}
                        ret.push('</div><div class="h4">Results</div>'+
                            '<div class="replies"><div class="reply first-child">'+cQuestionInstance.replies[0].answer+'</div></div>');
                    }
                    cReplyLabel = (cQuestionInstance.replies.length == 0)?'unanswered':cQuestionInstance.replies[0].name;
                    this._tabView.add({
                        "label": '<div class="left">'+cQuestion.label+'</div><div class="right">'+cReplyLabel+'</div>',
                        "content": '<div class="h2">Details</div>'+
                        '<div class="content">'+
                        '<div class="h4">'+cQuestion.label+'</div>'+
                        '<div class="description">'+cQuestion.description+'</div>'+
                        ret.join('')+
                        '</div>'
                    });
                }
            }
            /* @fixme */
            Y.later(100, this, function(){
                this._tabView.selectChild(lastSelection);
            });
        },
        renderUI: function () {
            this._tabView = new Y.TabView({
                children: []
            });

            this._tabView.render(this.get(CONTENTBOX).append('<div></div>'));
            this.get(CONTENTBOX).one("ul").prepend(
                '<li class="yui3-tab yui3-widget" role="presentation"><div class="h2">Choices to be made during this week</div></li>'
                +'<li class=" yui3-widget pmg-subtitle" role="presentation"><div class="left">Name</div><div class="right">Your choice</div><div style="clear:both"></div></li>')
        }
    }, {
        ATTRS : {
            classTxt: {
                value: 'PMGChoiceDisplay'
            },
            type: {
                value: "PMGChoiceDisplay"
            }
        }
    });

    Y.namespace('Wegas').PMGChoiceDisplay = PMGChoiceDisplay;
});