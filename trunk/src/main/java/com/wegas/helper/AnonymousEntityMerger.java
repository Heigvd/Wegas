/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.helper;

import com.wegas.persistence.AnonymousEntity;
import com.wegas.persistence.GameModelEntity;
import com.wegas.persistence.scope.ScopeEntity;
import com.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.wegas.persistence.variableinstance.StringVariableInstanceEntity;

/**
 *
 * @author Francois-Xavier Aeberhard <francois-xavier.aeberhard@red-agent.com>
 */
public class AnonymousEntityMerger {
    
    /**
     * 
     * @param original
     * @param updated
     * @return
     */
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
