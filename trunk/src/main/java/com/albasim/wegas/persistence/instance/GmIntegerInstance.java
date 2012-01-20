/*
 * MetAlbasim is super koool. http://www.albasim.com
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2010, 2011 
 *
 * MetAlbasim is distributed under the ??? license
 *
 */
package com.albasim.wegas.persistence.instance;

import com.albasim.wegas.exception.InvalidContent;
import com.albasim.wegas.persistence.GmInstance;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.type.GmIntegerType;
import java.util.List;
import javax.persistence.Entity;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.PreUpdate;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author maxence
 */
@Entity
@XmlRootElement
@XmlType(name = "IntegerI")
public class GmIntegerInstance extends GmInstance {

    private Integer v;
/*
    @OneToMany(mappedBy = "integerInstance")
    @XmlTransient
    private List<VariableInstanceEntity> gmVariableInstances;
*/
    public Integer getV() {
        return v;
    }


    public void setV(Integer v) {
        this.v = v;
    }


    /**
     * Retrieve the list of all variable linked to this integer instance by a EqualCardinality
     * @return 
     */
    @XmlTransient
    public List<VariableInstanceEntity> getGmVariableInstances() {
        return null;
    }

    
    @XmlTransient
    public void setGmVariableInstances(List<VariableInstanceEntity> gmVariableInstances) {
       // this.gmVariableInstances = gmVariableInstances;
    }

    

    @PrePersist
    @PreUpdate
    void checkValue() {
        GmIntegerType type = (GmIntegerType) this.getInstanceOf();
        if (!type.checkValue(this.v)) {
            throw new InvalidContent("INT value out of range");
        }
    }


}
