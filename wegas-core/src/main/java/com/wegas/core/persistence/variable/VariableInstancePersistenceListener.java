/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.persistence.variable;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Listen to persistence Events on VariableInstanceEntity
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class VariableInstancePersistenceListener {

    private static final Logger logger = LoggerFactory.getLogger("VariableInstancePersistenceListener");

//    /**
//     *
//     * @param instance
//     * @throws NamingException
//     */
//    @PostPersist
//    @PostUpdate
//    @PostRemove
//    private void onUpdate(VariableInstanceEntity instance) throws NamingException {
//        VariableInstanceFacade variableInstanceFacade = Helper.lookupBy(VariableInstanceFacade.class, VariableInstanceFacade.class);
//        variableInstanceFacade.onVariableInstanceUpdate(instance);
//    }
}
