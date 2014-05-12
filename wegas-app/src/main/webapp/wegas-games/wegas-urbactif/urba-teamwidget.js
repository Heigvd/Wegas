
Y.use("wegas-mcq-tabview", "wegas-layout-list", function() {
    Y.Wegas.TeamWidget = Y.Base.create("urba-team", Y.Widget, [Y.Wegas.Widget, Y.Wegas.Editable], {
        CONTENT_TEMPLATE: "<div><div class='urba-buttons'></div><div class='urba-panel'></div></div>",
        renderUI: function() {
            this.get("contentBox").setStyles({
                paddingLeft: "200px"
            });
            this.buttons = new Y.Wegas.List();
            this.buttons.render(this.get("contentBox").one(".urba-buttons"));
            this.get("contentBox").one(".urba-buttons").setStyles({
                display: "inline-block",
                width: "190px",
                marginLeft: "-200px",
                verticalAlign: "top",
                paddingRight: "10px"
            });
            this.get("contentBox").one(".urba-panel").setStyles({
                display: "inline-block"
            });
            this.handlers = {
                update: Y.Wegas.Facade.VariableDescriptor.after("update", this.syncUI, this)
            };
        },
        syncUI: function() {
            var i, resource, hasQuestions, team = Y.Wegas.Facade.VariableDescriptor.cache.find("name", "personnes").get("items");

            this.buttons.destroyAll();

            for (i = 0; i < team.length; i += 1) {
                resource = Y.Array.find(team[i].get("items"), function(d) {
                    return d instanceof Y.Wegas.persistence.ResourceDescriptor;
                });
                hasQuestions = Y.Array.find(team[i].get("items"), function(d) {
                    return d instanceof Y.Wegas.persistence.QuestionDescriptor && d.getInstance().get("active");
                });
                if (hasQuestions && resource) {
                    var b = this.buttons.add({
                        type: "Button",
                        label: resource.get("label"),
                        on: {
                            click: Y.bind(function(folder, e) {
                                e.target.set("selected", 2);
                                this.renderPanel(folder);
                            }, this, team[i])
                        },
                        plugins: [{
                                fn: "UnreadCount",
                                cfg: {
                                    variable: {
                                        content: "Variable.find('" + team[i].get("name") + "')"
                                    }
                                }
                            }]
                    }).item(0);
                    b.get("contentBox").setStyles({
                        display: "block",
                        width: "100%",
                        marginBottom: ".5em"
                    });
                }
            }
            this.buttons.item(0).fire("click");
        },
        destructor: function() {
            this.buttons.destroy();
            this.handlers.update.detach();
            if (this.panel) {
                this.panel.destroy();
            }
        },
        renderPanel: function(folder) {
            var panelNode = this.get("contentBox").one(".urba-panel"),
                    resource = Y.Array.find(folder.get("items"), function(d) {
                return d instanceof Y.Wegas.persistence.ResourceDescriptor;
            });
            if (this.panel) {
                this.panel.destroy();
                panelNode.empty();
            }
            this.panel = new Y.Wegas.MCQTabView({
                variable: {
                    content: "Variable.find('" + folder.get("name") + "')"
                }
            });
            Y.Wegas.Facade.VariableDescriptor.cache.getWithView(resource, "Extended", {// Retrieve the reply description from the server
                on: {
                    success: Y.bind(function(e) {
                        panelNode.prepend("<h3>" + e.response.entity.get("label") + "</h3>"
                                + "<div>" + e.response.entity.get("description") + "</div><br />");
                    }, this)
                }
            });
            this.panel.render(panelNode);
        }
    });
});