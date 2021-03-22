/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.view;

import ch.albasim.wegas.annotations.CommonView;

/**
 * @author maxence
 */
public abstract class EntityArrayFiledSelect extends CommonView {

    private final String field;

    private final String returnAttr;

    public EntityArrayFiledSelect(String returnAttr, String field) {
        this.returnAttr = returnAttr;
        this.field = field;
    }

    @Override
    public String getType() {
        return "entityarrayfieldselect";
    }

    public String getField() {
        return field;
    }

    public String getReturnAttr() {
        return returnAttr;
    }

    public static class ResultsSelect extends EntityArrayFiledSelect {

        public ResultsSelect() {
            super("name", "results");
        }
    }

    public static class StringAllowedValuesSelect extends EntityArrayFiledSelect {

        public StringAllowedValuesSelect() {
            super("name", "allowedValues");
        }
    }
}
