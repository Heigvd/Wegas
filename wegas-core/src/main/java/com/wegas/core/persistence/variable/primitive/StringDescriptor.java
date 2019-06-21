/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.annotations.WegasEntityProperty;
import com.wegas.core.merge.utils.WegasCallback;
import com.wegas.core.persistence.Mergeable;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.annotations.Scriptable;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.View.ArrayView;
import com.wegas.editor.View.Hidden;
import com.wegas.editor.View.I18nHtmlView;
import com.wegas.editor.View.View;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;
import jdk.nashorn.api.scripting.JSObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
/*@Table(indexes = {
 @Index(columnList = "allowedvalues.stringdescriptor_variabledescriptor_id")
 })*/
@WegasEntity(callback = StringDescriptor.StringDescriptorMergeCallback.class)
public class StringDescriptor extends VariableDescriptor<StringInstance>
        implements PrimitiveDescriptorI<String>, Enumeration {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(StringDescriptor.class);
    /**
     *
     */
    //@NotNull
    //@Pattern(regexp = "^\\w*$")
    @WegasEntityProperty(view = @View(label ="Pattern", value = Hidden.class))
    private String validationPattern;

    /**
     * List of allowed categories
     */
    @OneToMany(mappedBy = "parentString", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonDeserialize(using = EnumItem.ListDeserializer.class)
    @WegasEntityProperty(
            optional = false, nullable = false, proposal = EmptyArray.class,
            view = @View(label= "Allowed Values", value = ArrayView.HighlightAndSortable.class))
    //@WegasEntityProperty(callback = EnumItem.EnumItemMergeCallback.class)
    private List<EnumItem> allowedValues = new ArrayList<>();

    /**
     *
     */
    public StringDescriptor() {
    }

    /**
     *
     * @param name
     */
    public StringDescriptor(String name) {
        this.name = name;
    }

    /**
     * @return the validationPattern
     */
    public String getValidationPattern() {
        return validationPattern;
    }

    /**
     * @param validationPattern the validationPattern to set
     */
    public void setValidationPattern(String validationPattern) {
        this.validationPattern = validationPattern;
    }

    /**
     * get allowed values
     *
     * @return list of allowed values
     */
    public List<EnumItem> getAllowedValues() {
        return this.getSortedEnumItems();
    }

    @Override
    public List<EnumItem> getEnumItems() {
        return this.allowedValues;
    }

    /**
     * set allowed values
     *
     * @param allowedValues
     */
    public void setAllowedValues(List<EnumItem> allowedValues) {
        this.allowedValues = allowedValues;
        if (this.allowedValues != null) {
            int i = 0;
            for (EnumItem aValue : this.allowedValues) {
                aValue.setOrder(i++);
                registerItem(aValue);
            }
        }
    }

    @Override
    public void registerItem(EnumItem item) {
        item.setParentString(this);
        if (item.getLabel() != null) {
            item.getLabel().setParentDescriptor(this);
        }
    }

    /*
     * SUGARY
     */
    /**
     *
     * @param p
     *
     * @return value of player instance
     */
    @Override
    @Scriptable(label = "value")
    public String getValue(Player p) {
        return this.getInstance(p).getValue();
    }

    /**
     *
     * @param p
     * @param value
     */
    @Override
    public void setValue(Player p, String value) {
        this.getInstance(p).setValue(value, p.getLang());
    }

    /**
     *
     * @param p
     * @param value
     */
    @Scriptable
    public void setValue(Player p,
            @Param(view = @View(label = "", value = I18nHtmlView.class)) TranslatableContent value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setValue(Player p, JSObject value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     * @param value
     *
     * @return
     */
    @Scriptable(label = "selected value is")
    public boolean isValueSelected(Player p, String value) {
        StringInstance instance = this.getInstance(p);

        String[] values = instance.parseValues(instance.getValue());

        for (String v : values) {
            if (v != null && v.equals(value)) {
                return true;
            }
        }
        return false;
    }

    /**
     *
     * @param p
     * @param value
     *
     * @return
     */
    @Scriptable(label = "selected value is not")
    public boolean isNotSelectedValue(Player p, String value) {
        return !this.isValueSelected(p, value);
    }

    public boolean isValueAllowed(String value) {
        if (value == null || value.isEmpty()) {
            return true;
        }

        if (allowedValues != null && !allowedValues.isEmpty()) {
            for (EnumItem aValue : this.getAllowedValues()) {
                if (value.equals(aValue.getName())) {
                    return true;
                }
            }
            return false;
        }

        return true;
    }

    public static class StringDescriptorMergeCallback implements WegasCallback {

        @Override
        public void postUpdate(Mergeable entity, Object ref, Object identifier) {
            if (entity instanceof StringDescriptor) {
                StringDescriptor sd = (StringDescriptor) entity;
                // set names and labels unique
                Helper.setNameAndLabelForLabelledEntityList(sd.getAllowedValues(), "item", sd.getGameModel());
            }
        }

    }
}
