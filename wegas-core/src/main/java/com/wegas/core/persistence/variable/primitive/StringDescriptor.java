/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasCallback;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.wegas.core.Helper;
import com.wegas.core.i18n.persistence.TranslatableContent;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.Param;
import com.wegas.core.persistence.annotations.WegasConditions.And;
import com.wegas.core.persistence.annotations.WegasConditions.GreaterThan;
import com.wegas.core.persistence.annotations.WegasConditions.IsEmpty;
import com.wegas.core.persistence.annotations.WegasConditions.Not;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.persistence.annotations.WegasRefs;
import com.wegas.core.persistence.annotations.WegasRefs.Field;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.jsonschema.JSONArray;
import com.wegas.editor.jsonschema.JSONString;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.ValueGenerators.One;
import com.wegas.editor.ValueGenerators.False;
import com.wegas.editor.view.ArrayView;
import com.wegas.editor.view.EntityArrayFiledSelect;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.I18nStringView;
import com.wegas.editor.view.NumberView;
import com.wegas.editor.Visible;
import com.wegas.mcq.persistence.QuestionDescriptor.CheckPositiveness;
import edu.emory.mathcs.backport.java.util.Arrays;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.FetchType;
import javax.persistence.OneToMany;
import jdk.nashorn.api.scripting.JSObject;

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
    /**
     *
     */
    //@NotNull
    //@Pattern(regexp = "^\\w*$")
    @WegasEntityProperty(view = @View(label = "Pattern", value = Hidden.class))
    private String validationPattern;

    /**
     * List of allowed categories
     */
    @OneToMany(mappedBy = "parentString", cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true)
    @JsonDeserialize(using = EnumItem.ListDeserializer.class)
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(label = "Allowed Values", value = ArrayView.HighlightAndSortable.class))
    //@WegasEntityProperty(callback = EnumItem.EnumItemMergeCallback.class)
    private List<EnumItem> allowedValues = new ArrayList<>();

    /**
     * Maximum number of allowed values a user can select
     */
    @WegasEntityProperty(proposal = One.class,
        view = @View(
            label = "Maximum",
            layout = CommonView.LAYOUT.shortInline,
            value = NumberView.WithInfinityPlaceholder.class,
            index = 1
        ))
    @Errored(CheckPositiveness.class)
    @Visible(IsEnumeration.class)
    private Integer maxSelectable;

    /**
     * If several allowed values are selectable, is their order relevant ?
     */
    @WegasEntityProperty(proposal = False.class,
        view = @View(
            label = "Sortable",
            layout = CommonView.LAYOUT.shortInline,
            index = 2
        ))
    @Visible(IsEnumerationWithMax.class)
    private Boolean sortable;

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

    public Integer getMaxSelectable() {
        return maxSelectable;
    }

    public void setMaxSelectable(Integer maxSelectable) {
        this.maxSelectable = maxSelectable;
    }

    public Boolean getSortable() {
        return sortable;
    }

    public void setSortable(Boolean sortable) {
        this.sortable = sortable;
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
        @Param(view = @View(label = "", value = I18nStringView.class)) TranslatableContent value) {
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
     * Count the number of selected values
     *
     * @param p the player
     *
     * @return
     */
    @Scriptable(label = "number of selected values")
    public int countSelectedValues(Player p) {
        StringInstance instance = this.getInstance(p);

        String[] values = instance.parseValues(instance.getValue());

        return values.length;
    }

    /**
     * Get the position of the value, starting at position 1
     *
     * @param p     instance owner
     * @param value the value to search
     *
     * @return position of the value or null if value not present
     */
    @Scriptable(label = "position of value, starting at 1")
    public Integer getPositionOfValue(Player p,
        @Param(view = @View(label = "", value = EntityArrayFiledSelect.StringAllowedValuesSelect.class)) String value) {
        StringInstance instance = this.getInstance(p);

        List values = Arrays.asList(instance.parseValues(instance.getValue()));
        int indexOf = values.indexOf(value);
        if (indexOf >= 0) {
            return indexOf + 1;
        } else {
            return null;
        }
    }

    /**
     *
     * @param p
     * @param value
     *
     * @return
     */
    @Scriptable(label = "selected value is")
    public boolean isValueSelected(Player p,
        @Param(view = @View(label = "", value = EntityArrayFiledSelect.StringAllowedValuesSelect.class)) String value) {
        StringInstance instance = this.getInstance(p);

        String[] values = instance.parseValues(instance.getValue());

        for (String v : values) {
            if (v != null && v.equals(value)) {
                return true;
            }
        }
        return false;
    }

    public static class JSONArrayOfAllowedValues extends JSONArray {

        public JSONArrayOfAllowedValues() {
            JSONString aValues = new JSONString(false);
            aValues.setView(new EntityArrayFiledSelect.StringAllowedValuesSelect());
            this.setItems(aValues);
        }
    }

    /**
     *
     * @param p
     * @param expectedValues list of expected value
     * @param strictOrder    is values order important ?
     *
     * @return
     */
    @Scriptable(label = "selected values are")
    public boolean areSelectedValues(Player p,
        @Param(
            schema = JSONArrayOfAllowedValues.class,
            view = @View(
                label = "Values",
                value = ArrayView.HighlightAndSortable.class)
        ) List<String> expectedValues,
        @Param(view = @View(label = "Must respect order"), proposal = False.class) boolean strictOrder) {
        StringInstance instance = this.getInstance(p);

        List<String> values = Arrays.asList(instance.parseValues(instance.getValue()));

        if (values.size() == expectedValues.size()) {
            if (strictOrder) {
                for (int i = 0; i < expectedValues.size(); i++) {
                    if (!Objects.equals(values.get(i), expectedValues.get(i))) {
                        return false;
                    }
                }
                return true;
            } else {
                for (String expectedValue : expectedValues) {
                    if (!values.contains(expectedValue)) {
                        return false;
                    }
                }
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
    @Scriptable(label = "value is not selected")
    public boolean isNotSelectedValue(Player p,
        @Param(view = @View(label = "", value = EntityArrayFiledSelect.StringAllowedValuesSelect.class)) String value) {
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
        public void postUpdate(IMergeable entity, Object ref, Object identifier) {
            if (entity instanceof StringDescriptor) {
                StringDescriptor sd = (StringDescriptor) entity;
                // set names and labels unique
                Helper.setNameAndLabelForLabelledEntityList(sd.getAllowedValues(), "item", sd.getGameModel());
            }
        }

    }

    public static class IsEnumeration extends Not {

        public IsEnumeration() {
            super(new IsEmpty(new Field(null, "allowedValues")));
        }
    }

    public static class IsEnumerationWithMax extends And {

        public IsEnumerationWithMax() {
            super(
                new IsEnumeration(),
                new GreaterThan(
                    new Field(null, "maxSelectable"),
                    new WegasRefs.Const(1)
                )
            );
        }
    }
}
