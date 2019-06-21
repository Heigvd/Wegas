package com.wegas.editor.View;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class BaseView {
    public String getType() {
        return null;
    }
}