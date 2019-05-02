package com.wegas.editor.JSONSchema;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.wegas.editor.View.BaseView;

/**
 * Specific properties for JSONInput
 */
abstract public class JSONExtendedSchema implements JSONSchema, WithView {
    private BaseView view;

    @JsonInclude(JsonInclude.Include.NON_DEFAULT)
    private int index;

    @Override
    public BaseView getView() {
        return view;
    }

    @Override
    public void setView(BaseView view) {
        this.view = view;
    }

    /**
     * @return the index
     */
    public int getIndex() {
        return index;
    }

    /**
     * @param index the index to set
     */
    public void setIndex(int index) {
        this.index = index;
    }
}
