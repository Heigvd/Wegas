/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import javax.persistence.Entity;
import javax.persistence.PrePersist;
import javax.persistence.Table;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@Table(name = "MCQSingleResultChoiceDescriptor")
public class SingleResultChoiceDescriptor extends ChoiceDescriptor {

    private static final long serialVersionUID = 1L;

    /**
     * When a choice is created, automatically add a result.
     */
    @PrePersist
    public void prePersist2() {
        if (this.getResults().isEmpty()) {
            Result result = new Result();
            result.setName("default");
            this.addResult(result);
        }
    }
}
