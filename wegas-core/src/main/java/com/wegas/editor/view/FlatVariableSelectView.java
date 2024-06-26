/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.view;

import ch.albasim.wegas.annotations.CommonView;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * @author maxence
 */
public abstract class FlatVariableSelectView extends CommonView {

    private final Class<? extends Mergeable>[] classFilter;
    private final Integer maxLevel;
    private final Integer[] selectableLevels;

    public FlatVariableSelectView(Integer maxLevel, Integer[] selectableLevels,
        Class<? extends Mergeable>... classFilter) {
        this.maxLevel = maxLevel;
        if (selectableLevels != null) {
            this.selectableLevels = Arrays.copyOf(selectableLevels, selectableLevels.length);
        } else {
            this.selectableLevels = null;
        }
        this.classFilter = classFilter;
    }

    @Override
    public String getType() {
        return "flatvariableselect";
    }

    /**
     * @return null, a string or a list of json class name
     */
    public Object getClassFilter() {
        if (classFilter != null && classFilter.length > 0) {
            if (classFilter.length == 1) {
                return Mergeable.getJSONClassName(classFilter[0]);
            } else {
                List<String> r = new ArrayList<>();
                for (Class<? extends Mergeable> kl : classFilter) {
                    r.add(Mergeable.getJSONClassName(kl));
                }
                return r;
            }
        }
        return null;
    }

    public Integer getMaxLevel() {
        return maxLevel;
    }

    public Integer[] getSelectableLevels() {
        return selectableLevels;
    }

    /**
     * Default flat variable select which shows all variables.
     */
    public static class VariableFlatSelector extends FlatVariableSelectView {

        public VariableFlatSelector() {
            super(null, null);
        }
    }

    /**
     * Flat variable selector which shows task descriptor only.
     */
    public static class TaskFlatSelector extends FlatVariableSelectView {

        public TaskFlatSelector() {
            super(null, null, TaskDescriptor.class);
        }
    }

    /**
     * Flat variable selector which shows numbers and texts.
     */
    public static class TextOrNumberSelector extends FlatVariableSelectView {

        public TextOrNumberSelector() {
            super(null, null, NumberDescriptor.class, TextDescriptor.class);
        }
    }

}
