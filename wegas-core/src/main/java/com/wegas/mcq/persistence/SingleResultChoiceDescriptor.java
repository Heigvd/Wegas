/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.mcq.persistence;

import javax.persistence.Entity;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "SingleResultChoiceDescriptor")
@Table(name = "MCQSingleResultChoiceDescriptor")
public class SingleResultChoiceDescriptor extends ChoiceDescriptor {

    private static final long serialVersionUID = 1L;

    /**
     * When a choice is created, automatically add a result.
     */
    @PrePersist
    public void prePersist2() {
        if (this.getResults().isEmpty()) {
            this.addResult(new Result("Default"));                              // When a choice is created, automatically add a result by default
        }
    }
}
