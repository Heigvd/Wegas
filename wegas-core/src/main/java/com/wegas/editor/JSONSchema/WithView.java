package com.wegas.editor.JSONSchema;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.wegas.editor.View.BaseView;

public interface WithView {
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    BaseView getView();

    void setView(BaseView view);

}