/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.ListUtils;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity

/*@Table(indexes = {
 @Index(columnList = "variableinstance_id")
 })*/
public class BurndownInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    @OneToMany(mappedBy = "burndownInstance", cascade = CascadeType.ALL)
    private List<Iteration> iterations = new ArrayList<>();

    /**
     * Get all iterations defined within this burndown instance
     *
     * @return
     */
    public List<Iteration> getIterations() {
        return iterations;
    }

    /**
     * set iteration for this burndown instance
     *
     * @param iterations
     */
    public void setIterations(List<Iteration> iterations) {
        this.iterations = iterations;
    }


    public void addIteration(Iteration iteration) {
        this.iterations.add(iteration);
        iteration.setBurndownInstance(this);
    }

    @Override
    public void merge(AbstractEntity a) {
        BurndownInstance other = (BurndownInstance) a;
        ListUtils.mergeReplace(iterations, other.getIterations());
    }
}
