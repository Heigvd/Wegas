/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.CommonView;
import static ch.albasim.wegas.annotations.CommonView.FEATURE_LEVEL.ADVANCED;
import ch.albasim.wegas.annotations.DependencyScope;
import ch.albasim.wegas.annotations.IMergeable;
import ch.albasim.wegas.annotations.Scriptable;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasCallback;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import ch.albasim.wegas.annotations.WegasExtraProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.exception.client.WegasOutOfBoundException;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.WegasConditions.And;
import com.wegas.core.persistence.annotations.WegasConditions.IsDefined;
import com.wegas.core.persistence.annotations.WegasConditions.LessThan;
import com.wegas.core.persistence.annotations.WegasEntity;
import com.wegas.core.persistence.annotations.WegasRefs.Field;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.editor.ValueGenerators.Twenty;
import com.wegas.editor.view.Hidden;
import com.wegas.editor.view.NumberView;
import jakarta.persistence.Entity;
import jakarta.persistence.Transient;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@WegasEntity(callback = NumberDescriptor.ValdateDefaultValue.class)
public class NumberDescriptor extends VariableDescriptor<NumberInstance> implements PrimitiveDescriptorI<Double> {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @WegasEntityProperty(order = -1, // update bound before the default instance
            view = @View(
                    label = "Minimum",
                    layout = CommonView.LAYOUT.shortInline,
                    value = NumberView.WithNegInfinityPlaceholder.class,
                    index = 1
            ))
    @Errored(NumberDescBoundsConstraint.class)
    private Double minValue;
    /**
     *
     */
    @WegasEntityProperty(order = -1, // update bound before the default instance
            view = @View(
                    label = "Maximum",
                    layout = CommonView.LAYOUT.shortInline,
                    value = NumberView.WithInfinityPlaceholder.class,
                    index = 2
            ))
    @Errored(NumberDescBoundsConstraint.class)
    private Double maxValue;

    /**
     *
     */
    //@Column(columnDefinition = "integer default 20")
    @WegasEntityProperty(
            proposal = Twenty.class,
            view = @View(
                    label = "Maximum history size",
                    featureLevel = ADVANCED,
                    index = 700
            ))
    private Integer historySize;// = 20;

    /**
     *
     */
    public NumberDescriptor() {
        super();
    }

    /**
     *
     * @param name
     */
    public NumberDescriptor(String name) {
        super(name);
    }

    /**
     *
     * @param name
     * @param defaultInstance
     */
    public NumberDescriptor(String name, NumberInstance defaultInstance) {
        super(name, defaultInstance);
    }

    /**
     *
     * @return the minValue
     */
    public Double getMinValue() {
        return minValue;
    }

    /**
     * @param minValue the minValue to set
     */
    public void setMinValue(Double minValue) {
        this.minValue = minValue;
    }

    /**
     * @return the maxValue
     */
    public Double getMaxValue() {
        return maxValue;
    }

    /**
     * @param maxValue the maxValue to set
     */
    public void setMaxValue(Double maxValue) {
        this.maxValue = maxValue;
    }

    /**
     *
     * @return the max value
     */
    @JsonIgnore
    @Transient
    public double getMaxValueD() {
        return this.maxValue;
    }

    /**
     *
     * @return the minimum value
     */
    @JsonIgnore
    @Transient
    public double getMinValueD() {
        return this.minValue;
    }

    public Integer getHistorySize() {
        return historySize;
    }

    public void setHistorySize(Integer historySize) {
        if (historySize != null && historySize >= 0) {
            this.historySize = historySize;
        } else {
            this.historySize = null;
        }
    }

    // ~~~ Sugar for scripts ~~~
    /**
     *
     * @param p
     * @param value
     */
    @Override
    @Scriptable(label = "set", dependsOn = DependencyScope.NONE)
    public void setValue(Player p, Double value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void setValue(Player p, int value) {
        this.getInstance(p).setValue(value);
    }

    /**
     *
     * @return the defaule value
     */
    @Transient
    @WegasExtraProperty(
            nullable = false,
            view = @View(label = "Default value", value = Hidden.class))
    public double getDefaultValue() {
        // ugly hack used by crimesim.
        return this.getDefaultInstance().getValue();
    }

    /**
     *
     * @param value
     */
    @Deprecated
    public void setDefaultValue(double value) {
        // only used to explicitely ignore while serializing
    }

    /**
     *
     * @param p
     * @param value
     */
    @Scriptable(dependsOn = DependencyScope.NONE)
    public void add(Player p, double value) {
        this.getInstance(p).add(value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void sub(Player p, double value) {
        NumberInstance instance = this.getInstance(p);
        instance.setValue(instance.getValue() - value);
    }

    /**
     *
     * @param p
     * @param value
     */
    public void add(Player p, int value) {
        this.getInstance(p).add(value);
    }

    /**
     *
     * @param p
     *
     * @return value of player p instance
     */
    @Scriptable(label = "value", dependsOn = DependencyScope.SELF)
    @Override
    public Double getValue(Player p) {
        return this.getInstance(p).getValue();
    }

    public boolean isValueValid(double value) {
        return !(this.getMaxValue() != null && value > this.getMaxValueD() || (this.getMinValue() != null && value < this.getMinValueD()));
    }

    public static class ValdateDefaultValue implements WegasCallback {

        @Override
        public void postUpdate(IMergeable entity, Object ref, Object identifier) {
            if (entity instanceof NumberDescriptor) {
                NumberDescriptor nd = (NumberDescriptor) entity;
                NumberInstance ni = nd.getDefaultInstance();
                double value = ni.getValue();

                if (!nd.isValueValid(value)) {
                    throw new WegasOutOfBoundException(nd.getMinValue(),
                            nd.getMaxValue(), value, nd.getName(), nd.getLabel().translateOrEmpty(nd.getGameModel()));
                }
            }
        }
    }

    /**
     * Check bound consistency.
     * Applicable to any object which defined minValue & maxValue
     */
    public static class NumberDescBoundsConstraint extends And {

        public NumberDescBoundsConstraint() {
            super(
                    new IsDefined(new Field(null, "minValue")),
                    new IsDefined(new Field(null, "maxValue")),
                    new LessThan(new Field(null, "maxValue"), new Field(null, "minValue"))
            );
        }
    }
}
