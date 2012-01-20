/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */

package com.albasim.wegas.persistence.scope;

import com.albasim.wegas.persistence.GmCardinality;
import com.albasim.wegas.persistence.VariableInstanceEntity;
import com.albasim.wegas.persistence.type.GmEnumType;
import com.albasim.wegas.persistence.users.UserEntity;
import java.util.List;
import java.util.Map;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.ManyToOne;
import javax.persistence.MapKey;
import javax.persistence.OneToMany;
import javax.persistence.Transient;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@XmlType(name = "UserScope")
public class UserScopeEntity extends ScopeEntity {
    
    
    @OneToMany(mappedBy = "scope", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    @XmlTransient
    @MapKey
    private Map<UserEntity, VariableInstanceEntity> variableInstance;
    
    /**
     * @return the variableInstance
     */
    public Map<UserEntity, VariableInstanceEntity> getVariableInstance() {
        return variableInstance;
    }
    
    public void setVariableInstance(UserEntity u, VariableInstanceEntity v) {
        this.variableInstance.put(u, v);
    }
}
  
        
