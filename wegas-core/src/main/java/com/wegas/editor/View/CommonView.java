package com.wegas.editor.View;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.util.StdConverter;

public class CommonView extends BaseView {

    public static enum LAYOUT {
        none, inline, shortInline;
    }

    private String label = "";

    private String description = "";

    private Boolean borderTop = false;

    private LAYOUT layout = LAYOUT.none;

    /**
     * @return the label
     */
    final public String getLabel() {
        return label;
    }

    /**
     * @param label the label to set
     * @return this
     */
    final public CommonView setLabel(String label) {
        this.label = label;
        return this;
    }

    /**
     * @return the description
     */
    final public String getDescription() {
        return description;
    }

    /**
     * @param description the description to set
     * @return this
     */
    final public CommonView setDescription(String description) {
        this.description = description;
        return this;
    }

    /**
     * @return the layout
     */
    @JsonSerialize(converter = LayoutConverter.class)
    final public LAYOUT getLayout() {
        return layout;
    }

    /**
     * @param layout the layout to set
     * @return this
     */
    final public CommonView setLayout(LAYOUT layout) {
        this.layout = layout;
        return this;
    }

    /**
     * @return the borderTop
     */
    @JsonInclude(JsonInclude.Include.NON_DEFAULT)
    final public Boolean getBorderTop() {
        return borderTop;
    }

    /**
     * @param borderTop the borderTop to set
     * @return this
     */
    final public CommonView setBorderTop(Boolean borderTop) {
        this.borderTop = borderTop;
        return this;
    }

    public static class LayoutConverter extends StdConverter<LAYOUT, String> {

        @Override
        public String convert(LAYOUT value) {
            if (LAYOUT.none.equals(value))
                return null;
            return value.toString();
        }

    }

    public static class NoneFalse extends StdConverter<Boolean, Boolean> {

        @Override
        public Boolean convert(Boolean value) {
            if (Boolean.FALSE.equals(value))
                return null;
            return value;
        }

    }
}