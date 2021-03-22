/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.editor.jsonschema;

import ch.albasim.wegas.annotations.BaseView;
import ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL;
import ch.albasim.wegas.annotations.JSONSchema;
import ch.albasim.wegas.annotations.ProtectionLevel;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.annotation.JsonSerialize;
import com.fasterxml.jackson.databind.util.StdConverter;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.WegasConditions.Condition;
import java.util.ArrayList;
import java.util.List;

/**
 * Specific properties for JSONInput
 */
abstract public class JSONExtendedSchema implements JSONSchema, WithView, WithErroreds, WithVisible {

    private BaseView view;

    private List<WrappedErrored> erroreds;

    private Condition visible;

    @JsonInclude(JsonInclude.Include.NON_DEFAULT)
    private int index;

    private FEATURE_LEVEL featureLevel;

    private ProtectionLevel protectionLevel;

    private Object value;

    private boolean required = false;

    @Override
    public BaseView getView() {
        return view;
    }

    @Override
    public void setView(BaseView view) {
        this.view = view;
    }

    @Override
    public List<WrappedErrored> getErroreds() {
        return erroreds;
    }

    @Override
    public void addErrored(Errored errored) {
        if (errored != null) {
            if (erroreds == null) {
                this.erroreds = new ArrayList<>();
            }
            erroreds.add(new WrappedErrored(errored));
        }
    }

    @Override
    public Condition getVisible() {
        return visible;
    }

    @Override
    public void setVisible(Condition visible) {
        this.visible = visible;
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

    @JsonSerialize(converter = FeatureLevelConverter.class)
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public FEATURE_LEVEL getFeatureLevel() {
        return featureLevel;
    }

    public void setFeatureLevel(FEATURE_LEVEL featureLevel) {
        this.featureLevel = featureLevel;
    }

    @JsonSerialize(converter = ProtectionConverter.class)
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public ProtectionLevel getProtectionLevel() {
        return protectionLevel;
    }

    public void setProtectionLevel(ProtectionLevel protectionLevel) {
        this.protectionLevel = protectionLevel;
    }

    public Object getValue() {
        return value;
    }

    public void setValue(Object value) {
        this.value = value;
    }

    public boolean isRequired() {
        return required;
    }

    public void setRequired(boolean required) {
        this.required = required;
    }

    public static class FeatureLevelConverter extends StdConverter<FEATURE_LEVEL, String> {

        @Override
        public String convert(FEATURE_LEVEL level) {
            if (FEATURE_LEVEL.DEFAULT.equals(level)) {
                return null;
            }
            return level.toString();
        }
    }

    public static class ProtectionConverter extends StdConverter<ProtectionLevel, String> {

        @Override
        public String convert(ProtectionLevel level) {
            if (ProtectionLevel.CASCADED.equals(level)) {
                return null;
            }
            return level.toString();
        }
    }
}
