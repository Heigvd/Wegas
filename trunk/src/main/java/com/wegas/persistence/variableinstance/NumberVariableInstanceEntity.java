/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence.variableinstance;

import com.wegas.persistence.AnonymousEntity;
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "StringVariableInstance")
public class NumberVariableInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("StringVariableInstanceEntity");
    private double content;

    /**
     * @return the content
     */
    public double getContent() {
        return content;
    }

    /**
     * @param content the content to set
     */
    public void setContent(double content) {
        this.content = content;
    }

    /**
     * 
     * @param a
     */
    @Override
    public void merge(AnonymousEntity a) {
        NumberVariableInstanceEntity vi = (NumberVariableInstanceEntity) a;
        this.setContent(vi.getContent());
    }
}