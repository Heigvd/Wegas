/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import ch.albasim.wegas.annotations.CommonView;
import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasOutOfBoundException;
import com.wegas.core.persistence.AcceptInjection;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.NumberListener;
import com.wegas.core.persistence.annotations.Errored;
import com.wegas.core.persistence.annotations.WegasConditions.And;
import com.wegas.core.persistence.annotations.WegasConditions.GreaterThan;
import com.wegas.core.persistence.annotations.WegasConditions.IsDefined;
import com.wegas.core.persistence.annotations.WegasConditions.LessThan;
import com.wegas.core.persistence.annotations.WegasRefs.Field;
import com.wegas.core.persistence.annotations.WegasRefs.Self;
import com.wegas.core.persistence.variable.Beanjection;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.EmptyArray;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.Column;
import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import javax.persistence.Transient;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@EntityListeners(NumberListener.class)
/*@Table(indexes = {
 @Index(columnList = "history.numberinstance_id")
 })*/
public class NumberInstance extends VariableInstance implements AcceptInjection {

    private static final long serialVersionUID = 1L;

    @JsonIgnore
    @Transient
    private Beanjection beans;

    /**
     *
     */
    @Column(name = "val")
    @WegasEntityProperty(
        optional = false, nullable = false,
        view = @View(label = "Value"))
    @Errored(ValueLessThanMin.class)
    @Errored(ValueGreaterThanMax.class)
    private double value;

    /**
     *
     */
    @ElementCollection
    //@JsonView(Views.ExtendedI.class)
    //@OrderColumn
    @WegasEntityProperty(
        optional = false, nullable = false, proposal = EmptyArray.class,
        view = @View(
            label = "History",
            featureLevel = CommonView.FEATURE_LEVEL.ADVANCED
        ))
    @Errored(ValueLessThanMin.class)
    private List<NumberHistoryEntry> history = new ArrayList<>();

    /**
     *
     */
    public NumberInstance() {
        // ensure there is a default constructor
    }

    /**
     * @param value
     */
    public NumberInstance(double value) {
        this.value = value;
    }

    @Override
    public void setBeanjection(Beanjection beanjection) {
        this.beans = beanjection;
    }

    /**
     * @return the value
     */
    public double getValue() {
        return value;
    }

    /**
     * @param value the value to set
     */
    public void setValue(double value) {
        VariableDescriptor vd = this.findDescriptor();
        if (vd instanceof NumberDescriptor) {
            NumberDescriptor desc = (NumberDescriptor) vd;

            if (!desc.isValueValid(value)) {
                throw new WegasOutOfBoundException(desc.getMinValue(), desc.getMaxValue(), value, desc.getName(), desc.getLabel().translateOrEmpty(this.getGameModel()));
            }
        }

        double pVal = this.value;

        if (Math.abs(value - this.value) > 0.0001) {
            // change detected
            this.value = value;

            if (!this.isDefaultInstance() && beans != null) {
                beans.getVariableInstanceFacade().fireNumberChange(this, pVal);
            }
        }
    }

    public void add(double value) {
        this.setValue(this.getValue() + value);
    }

    public void add(int value) {
        this.setValue(this.getValue() + value);
    }

    /**
     *
     */
    public void saveHistory() {
        List<Double> currentHistory = this.getHistory();
        currentHistory.add(this.getValue());
        this.setHistory(currentHistory);
    }

    /**
     * @return history of values
     */
    public List<Double> getHistory() {
        List<NumberHistoryEntry> copy = Helper.copyAndSort(this.history, new EntityComparators.OrderComparator<>());

        List<Double> h = new ArrayList<>();
        for (NumberHistoryEntry entry : copy) {
            h.add(entry.getValue());
        }
        return h;
    }

    /**
     * @param history
     */
    public void setHistory(List<Double> history) {
        this.history.clear();
        if (history != null) {
            VariableDescriptor theDesc = this.findDescriptor();
            Integer maxHSize = null;

            if (theDesc instanceof NumberDescriptor) {
                /*
                select vd.* from variabledescriptor as vd inner join variableinstance as vi on vi.id = vd.defaultinstance_id  where vd.dtype = 'ListDescriptor' and vi.dtype <> 'ListInstance';
                 */
                maxHSize = ((NumberDescriptor) theDesc).getHistorySize();
            }

            int toSave = maxHSize != null && history.size() > maxHSize ? maxHSize : history.size();
            int delta = history.size() - toSave;

            for (int i = 0; i < toSave; i++) {
                this.history.add(new NumberHistoryEntry(history.get(i + delta), i));
            }
        }
    }

    public static class ValueGreaterThanMax extends And {

        public ValueGreaterThanMax() {
            super(new IsDefined(new Field(NumberDescriptor.class, "maxValue")),
                new GreaterThan(new Self(), new Field(NumberDescriptor.class, "maxValue"))
            );
        }
    }

    public static class ValueLessThanMin extends And {

        public ValueLessThanMin() {
            super(new IsDefined(new Field(NumberDescriptor.class, "minValue")),
                new LessThan(new Self(), new Field(NumberDescriptor.class, "minValue"))
            );
        }
    }
}
