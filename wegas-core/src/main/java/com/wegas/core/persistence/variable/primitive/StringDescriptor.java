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
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
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
public class StringDescriptor extends VariableDescriptor<StringInstance>
        implements PrimitiveDescriptorI<String>, Enumeration {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(StringDescriptor.class);
    /**
     *
     */
    //@NotNull
    //@Pattern(regexp = "^\\w*$")
    private String validationPattern;

    /**
     * List of allowed categories
     */
    @OneToMany(mappedBy = "parentString", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonDeserialize(using = EnumItem.ListDeserializer.class)
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
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof StringDescriptor) {
            StringDescriptor other = (StringDescriptor) a;
            this.setValidationPattern(other.getValidationPattern());

            super.merge(a);

            // make sure to use getCategories to sort them
            this.setAllowedValues(ListUtils.mergeLists(this.getAllowedValues(), other.getAllowedValues()));

            Helper.setNameAndLabelForLabelledEntityList(this.getAllowedValues(), "item", this.getGameModel());

            /*String value = this.getDefaultInstance().getValue();
            if (!this.isValueAllowed(value)) {
                throw WegasErrorMessage.error("Value \"" + value + "\" not allowed !");
            }*/
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
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
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setValue(Player p, TranslatableContent value) {
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

    @Override
    public Boolean containsAll(List<String> criterias) {
        return super.containsAll(criterias)
                || this.itemsContainsAll(criterias);
    }
}
