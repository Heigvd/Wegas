/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.View;

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
}
