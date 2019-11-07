package ch.albasim.wegas.annotations;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class BaseView {
    public String getType() {
        return null;
    }
}