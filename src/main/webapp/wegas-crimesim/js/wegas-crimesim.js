/**
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

YUI.add('wegas-crimesim', function(Y) {
    var CONTENTBOX = 'contentBox',
    YAHOO = Y.YUI2,
    ScheduleDisplay,
    Menu = Y.Base.create("scheduledisplay-menu", Y.Widget,                      // Helper to display the menu in a positionable box
        [Y.WidgetPosition,  Y.WidgetPositionAlign, Y.WidgetStack], {

            // *** Fields *** /
            menu: null,

            // *** Lifecycle Methods *** //
            renderUI : function() {
                var cb = this.get(CONTENTBOX);

                this.menu = new YAHOO.widget.Menu("scheduledisplay-menu", {
                    visible: true,
                    position: 'static',
                    hidedelay: 100,
                    shadow: true
                });
                this.menu.render(cb._node);
            },

            bindUI : function() {
                //var bb = this.get(BOUNDINGBOX);
                //bb.on('mouseupoutside', this.hide, this);
                //bb.on('click', this.hide, this);
                this.menu.subscribe("click", this._onMenuClick, null, this);
            },
            // *** Private Methods *** //
            _onMenuClick: function(p_sType, args) {
                console.log("mm");
            },
            // *** Methods *** /
            setMenuItems: function( menuItems ) {
                this.menu.clearContent();
                this.menu.addItems(menuItems);
                this.menu.render();
            }
        });

    /**
    *  The schedule display class.
    */
    ScheduleDisplay = Y.Base.create("wegas-crimesim-scheduledisplay", Y.Widget,
        [Y.WidgetChild, Y.Wegas.Widget], {

            // *** Fields *** /
            _menu: null,

            // *** Lifecycle Methods *** //
            renderUI: function() {
                this._menu = new Menu( {
                    zIndex: 2,
                    render: true,
                    visible: true
                });
            },
            bindUI: function() {

                this.get(CONTENTBOX).delegate("click", function(e) {            // Show the "action available" menu on cell click
                    var questionId =  e.target.ancestor("tr").getAttribute("data-questionid"),
                    question = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy("id", questionId);
                    this._menu.setMenuItems(this._genMenuItems(question));
                    this._menu.get("boundingBox").appendTo(e.target);
                    this._menu.set("align", {
                        node:e.target,
                        points:["tr", "br"]
                    });
                    this._menu.show();
                }, ".schedule-available", this);

                this._menu.after('render', function(){
                    this._menu.menu.subscribe("click", this._onMenuClick, null, this);   // Handele the "action available" menu click event
                }, this)

                Y.Wegas.app.dataSources.VariableDescriptor.after("response",    // If data changes, refresh
                    function(e) {
                        this.syncUI();
                    }, this);

                Y.Wegas.app.after('currentPlayerChange', function(e) {          // If current user changes, refresh (editor only)
                    this.syncUI();
                }, this);
            },
            syncUI: function() {
                var questionsVarDesc = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariablesBy('@class', "MCQVariableDescriptor"),
                period = Y.Wegas.app.dataSources.VariableDescriptor.rest.getCachedVariableBy('name', "period"),
                i, j, acc= ['<table class="schedule-table"><tr><th class="schedule-leftcolum">Evidences</th>'],
                cb = this.get(CONTENTBOX);

                if (!period) return;

                for (i=period.minValue; i<=period.maxValue; i++){
                    acc.push('<th class="schedule-maincolum"><div>'+i+'</div></th>');
                }
                acc.push("</tr>")

                for (i=0; i<questionsVarDesc.length; i++) {
                    question = questionsVarDesc[i];
                    acc.push('<tr data-questionId="'+question.id+'"><td class="schedule-leftcolum">'+(question.label || question.name || "undefined" )+"</td>");

                    var cols = this._genTabColums(question, period);

                    for (j=0; j<cols.length; j++){
                        acc.push('<td class="'+cols[j]+'"><div></div></td>');
                    }

                    acc.push("</tr>");
                }
                acc.push("</table>");
                cb.setContent(acc.join(""));
            },


            // *** Private Methods *** /
            _onMenuClick: function(e, args) {
                var menuItem = args[1],
                reply = menuItem.value;

                Y.Wegas.app.dataSources.VariableDescriptor.rest.getRequest("MCQVariableDescriptor/Player/"+Y.Wegas.app.get('currentPlayer')+"/Reply/"+reply.id+"/RunScript/");
            },
            _genMenuItems: function(question) {
                var ret = [], i=0, reply;
                for (; i<question.replies.length; i++) {
                    reply = question.replies[i];
                    ret.push({
                        text: reply.label || reply.name || "undefined",
                        value: reply
                    });
                }
                return ret;
            },
            _genTabColums: function(question, period) {
                var ret=[], j,
                questionInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceById(question.id)
                periodInstance = Y.Wegas.app.dataSources.VariableDescriptor.rest.getInstanceBy("name", "period");

                for (j=period.minValue; j<=period.maxValue; j++){                   // Initially, all time slots are available
                    if (j>=periodInstance.value)
                        ret.push( "schedule-available" );
                    else ret.push( "schedule-past")
                }

                for (j=0; j<questionInstance.replies.length; j++) {
                    // @todo here we fill with the replies
                    }
                return ret;
            }
        }, {
            ATTRS : {
                classTxt: {
                    value: "ScheduleDisplay"
                },
                type: {
                    value: "ScheduleDisplay"
                }
            }
        });

    Y.namespace('Wegas').ScheduleDisplay = ScheduleDisplay;
});