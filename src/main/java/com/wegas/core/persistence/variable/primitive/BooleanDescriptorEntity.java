/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.persistence.variable.primitive;

import com.wegas.core.persistence.variable.VariableDescriptorEntity;
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "BooleanDescriptor")
public class BooleanDescriptorEntity extends VariableDescriptorEntity<BooleanInstanceEntity> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("NumberDescriptorEntity");
}
