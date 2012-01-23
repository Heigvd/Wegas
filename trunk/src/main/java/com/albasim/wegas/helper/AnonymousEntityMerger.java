/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.albasim.wegas.helper;

import com.albasim.wegas.persistence.AnonymousEntity;
import com.albasim.wegas.persistence.GameModelEntity;
import com.albasim.wegas.persistence.scope.ScopeEntity;
import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.albasim.wegas.persistence.variableinstance.StringVariableInstanceEntity;
import com.albasim.wegas.persistence.variableinstance.VariableInstanceEntity;

/**
 *
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
 */
public class AnonymousEntityMerger {
    
    public static AnonymousEntity merge(AnonymousEntity original, AnonymousEntity updated) {
        
        if (original instanceof GameModelEntity) {
            GameModelEntity ogm = (GameModelEntity) original;
            GameModelEntity ugm = (GameModelEntity) updated;
        } else if (original instanceof VariableDescriptorEntity) {
            VariableDescriptorEntity ogm = (VariableDescriptorEntity) original;
            VariableDescriptorEntity ugm = (VariableDescriptorEntity) updated;
            ogm.setName(ugm.getName());
            AnonymousEntityMerger.merge(ogm.getScope(), ugm.getScope());
            AnonymousEntityMerger.merge(ogm.getDefaultVariableInstance(), ugm.getDefaultVariableInstance());
        } else if (original instanceof ScopeEntity) {
            ScopeEntity o = (ScopeEntity) original;
            ScopeEntity u = (ScopeEntity) updated;
        } else if (original instanceof StringVariableInstanceEntity) {
            StringVariableInstanceEntity o = (StringVariableInstanceEntity) original;
            StringVariableInstanceEntity u = (StringVariableInstanceEntity) updated;
            o.setContent(u.getContent());
        }
        return original;
    }
}
