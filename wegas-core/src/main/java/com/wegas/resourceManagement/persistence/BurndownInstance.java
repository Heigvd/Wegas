/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.EntityIdComparator;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.VariableInstance;

import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity

/*@Table(indexes = {
 @Index(columnList = "variableinstance_id")
 })*/
public class BurndownInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    @OneToMany(mappedBy = "burndownInstance", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Iteration> iterations = new ArrayList<>();

    /**
     * Get all iterations defined within this burndown instance
     *
     * @return get all iterations
     */
    public List<Iteration> getIterations() {
        Collections.sort(this.iterations, new EntityIdComparator<>());
        return iterations;
    }

    /**
     * set iteration for this burndown instance
     *
     * @param iterations replace iteration list
     */
    public void setIterations(List<Iteration> iterations) {
        this.iterations = iterations;
    }

    /**
     * Add a new iteration
     *
     * @param iteration the new iteration to add
     */
    public void addIteration(Iteration iteration) {
        this.iterations.add(iteration);
        iteration.setBurndownInstance(this);
    }

    @Override
    public void merge(AbstractEntity a) {
        if (a instanceof BurndownInstance) {
            BurndownInstance other = (BurndownInstance) a;
            super.merge(a);
            this.setIterations(ListUtils.mergeReplace(this.getIterations(), other.getIterations()));
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + a.getClass().getSimpleName() + ") is not possible");
        }
    }
}
