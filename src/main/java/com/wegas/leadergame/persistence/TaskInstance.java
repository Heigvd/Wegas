/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.leadergame.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.variable.VariableInstance;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "QuestionInstance")
public class TaskInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        TaskInstance other = (TaskInstance) a;
    }

}
