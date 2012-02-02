/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *                                                                                                 m                                                                                                                                                                                                                                                                                                                                    mm
 * Copyright (C) 2011 
 */
package com.albasim.wegas.persistence.variableinstance;

import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import java.util.List;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "ListVariableInstance")
public class ListVariableInstanceEntity extends VariableInstanceEntity {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = Logger.getLogger("StringVariableInstanceEntity");
    @OneToMany(cascade = {CascadeType.ALL})
    private List<VariableDescriptorEntity> variableDescriptors;

    /**
     * @return the variableDescriptors
     */
    public List<VariableDescriptorEntity> getVariableDescriptors() {
        return variableDescriptors;
    }

    /**
     * @param variableDescriptors the variableDescriptors to set
     */
    @XmlTransient
    public void setVariableDescriptors(List<VariableDescriptorEntity> variableDescriptors) {
        this.variableDescriptors = variableDescriptors;
    }
    
    /**
     * 
     * @param vd
     */
    @XmlTransient 
    public void addVariableDescriptor(VariableDescriptorEntity vd) {
        this.variableDescriptors.add(vd);
    }
}