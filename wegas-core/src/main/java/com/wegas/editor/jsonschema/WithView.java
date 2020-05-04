package com.wegas.editor.jsonschema;

import ch.albasim.wegas.annotations.BaseView;
import com.fasterxml.jackson.annotation.JsonInclude;

public interface WithView {
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    BaseView getView();

    void setView(BaseView view);

}