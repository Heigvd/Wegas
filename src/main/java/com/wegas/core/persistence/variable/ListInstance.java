/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *                                                                                                 m                                                                                                                                                                                                                                                                                                                                    mm
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.mcq.persistence.ChoiceInstanceEntity;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonSubTypes;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "ListInstance")
public class ListInstance extends VariableInstance {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(ListInstance.class);

    @Override
    public void merge(AbstractEntity a) {
        // @fixme make this abstract if there really is nothing to do
    }
}