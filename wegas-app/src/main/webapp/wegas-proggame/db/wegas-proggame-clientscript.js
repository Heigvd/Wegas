Y.use("wegas-layout", function(Y) {
    Y.Wegas.Layout.EDITMENU = Y.clone(Y.Wegas.Layout.EDITMENU);
    Y.Wegas.Layout.EDITMENU[1].plugins[0].cfg.children.push({
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