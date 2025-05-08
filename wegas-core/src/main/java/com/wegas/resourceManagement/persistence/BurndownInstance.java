/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.resourceManagement.persistence;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.wegas.core.persistence.variable.VariableInstance;
import com.wegas.editor.ValueGenerators.EmptyArray;
import com.wegas.editor.view.Hidden;
import java.util.ArrayList;
import java.util.List;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToMany;

/**
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@Entity
public class BurndownInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    @OneToMany(mappedBy = "burndownInstance", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    @WegasEntityProperty(
            optional = false, nullable= false, proposal = EmptyArray.class,
            view = @View(value = Hidden.class, label = ""))
    private List<Iteration> iterations = new ArrayList<>();

    /**
     * Get all iterations defined within this burndown instance
     *
     * @return get all iterations
     */
    public List<Iteration> getIterations() {
        return iterations;
    }

    /**
     * set iteration for this burndown instance
     *
     * @param iterations replace iteration list
     */
    public void setIterations(List<Iteration> iterations) {
        this.iterations = iterations;
        if (this.iterations != null) {
            for (Iteration iteration : iterations) {
                iteration.setBurndownInstance(this);
            }
        }
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
}
