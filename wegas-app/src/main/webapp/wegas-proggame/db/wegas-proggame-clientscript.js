Y.use("wegas-parent", function(Y) {
    Y.Wegas.Parent.EDITMENU = Y.clone(Y.Wegas.Parent.EDITMENU);
    Y.Wegas.Parent.EDITMENU["addBtn"].cfg.plugins[0].cfg.children.push({
        type: "Button",
        label: "ProgGame Level",
        plugins: [{
                fn: "AddChildWidgetAction",
                cfg: {
                    childType: "ProgGameLevel"
                }
            }
        ]
    });
});