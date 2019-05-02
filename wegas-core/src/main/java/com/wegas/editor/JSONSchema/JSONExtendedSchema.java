package com.wegas.editor.JSONSchema;

import com.wegas.editor.View.BaseView;

/**
 * Specific properties for JSONInput
 */
abstract public class JSONExtendedSchema implements JSONSchema, WithView {
    private BaseView view;

    @Override
    public BaseView getView() {
        return view;
    }

    @Override
    public void setView(BaseView view) {
        this.view = view;
    }
}
