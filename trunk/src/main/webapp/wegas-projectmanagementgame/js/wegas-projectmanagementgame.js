/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-projectmanagementgame', function(Y) {
    var Lang = Y.Lang,
    CONTENTBOX = 'contentBox',
    PMGChoiceDisplay = Y.Base.create("wegas-pmgchoicedisplay", Y.Widget, [Y.WidgetChild, Y.Wegas.Widget], {
        _tabView: null,
        
        _genTabs: function() {
            
        },
        
        bindUI: function() {
            var questions = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariablesBy('@class', "MCQVariableDescriptor");
            
            this.get(CONTENTBOX).delegate("click", function(e) {    
                Y.Wegas.app.dataSources.VariableDescriptor.rest.getRequest("mcqvariable/player/"+Y.Wegas.app.get('currentUserId')+"/reply/"+e.target.get('id')+"/runscript/");
            }, "input[type=submit]", this);
            
            Y.Wegas.app.dataSources.VariableDescriptor.after("response", function(e) {
                this.syncUI();
            }, this);
            
            Y.Wegas.app.after('currentUserIdChange', function(e) {
                this.syncUI();
            }, this);
        },
        
        syncUI: function() {            
            var questions = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariablesBy('@class', "MCQVariableDescriptor");
            
            this._tabView.removeAll();
            
            for (var i=0; i<questions.length; i++) {
                var cQuestion = questions[i],
                replies = [];
                for (var j=0; j<cQuestion.replies.length; j++) {
                    replies.push('<div class="reply">'+
                        '<bold>'+cQuestion.replies[j].name+'</bold>'+
                        '<div>'+cQuestion.replies[j].description+'</div>'+
                        '<input type="submit" id="'+cQuestion.replies[j].id+'" value="Submit"></input>'+
                        '<div style="clear:both"></div>'+
                        '</div>');
                }
                this._tabView.add({
                    "label": cQuestion.label,
                    "content": '<div class="h2">Details</div>'+
                    '<div class="content">'+
                    '<div class="h4">'+cQuestion.label+'</div>'+
                    '<div class="description">'+cQuestion.description+'</div>'+
                    '<div class="h4">Answers</div>'+
                    '<div class="replies">'+replies.join('')+'</div>'+
                    
                    '</div>'
                });
            }
            
        },
        renderUI: function () {
            this._tabView = new Y.TabView({
                children: []
            });

            this._tabView.render(this.get(CONTENTBOX).append('<div></div>'));
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