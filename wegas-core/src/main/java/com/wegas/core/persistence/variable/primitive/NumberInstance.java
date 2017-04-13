/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.primitive;

import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.Helper;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.exception.client.WegasOutOfBoundException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityComparators;
import com.wegas.core.persistence.NumberListener;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.core.rest.util.Views;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.persistence.ElementCollection;
import javax.persistence.Entity;
import javax.persistence.EntityListeners;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

/**
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@EntityListeners(NumberListener.class)

/*@Table(indexes = {
 @Index(columnList = "history.numberinstance_variableinstance_id")
 })*/
public class NumberInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    private static final Logger logger = LoggerFactory.getLogger(NumberInstance.class);

    /**
     *
     */
    private double val;

    /**
     *
     */
    @ElementCollection
    @JsonView(Views.ExtendedI.class)
    //@OrderColumn
    private List<NumberHistoryEntry> history = new ArrayList<>();

    /**
     *
     */
    public NumberInstance() {
    }

    /**
     * @param value
     */
    public NumberInstance(double value) {
        this.val = value;
    }

    /**
     * @return the value
     */
    public double getValue() {
        return val;
    }

    /**
     * @param value the value to set
     */
    public void setValue(double value) {
        try {
            VariableDescriptor vd = this.findDescriptor();
            if (vd instanceof NumberDescriptor) { // @fixme (Occurs when numberinstance are used for list descriptors) (IS THAT FUCKIN EXISTING ANY MORE ???)
                NumberDescriptor desc = (NumberDescriptor) vd;

                if (!desc.isValueValid(value)) {
                    throw new WegasOutOfBoundException(desc.getMinValue(), desc.getMaxValue(), value, desc.getLabel());
                }
            }
        } catch (NullPointerException e) {
            // @fixme (occurs when instance is a defaultInstance)
        }

        this.val = value;
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
     * @return
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
                select vd.* from variabledescriptor as vd inner join variableinstance as vi on vi.variableinstance_id = vd.defaultinstance_variableinstance_id  where vd.dtype = 'ListDescriptor' and vi.dtype <> 'ListInstance';
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

    /**
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof NumberInstance) {
            super.merge(a);
            NumberInstance vi = (NumberInstance) a;
            this.setValue(vi.getValue());
            this.setHistory(vi.getHistory());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }
}
