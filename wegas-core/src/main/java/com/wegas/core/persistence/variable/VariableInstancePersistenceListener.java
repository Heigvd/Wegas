/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.Helper;
import com.wegas.core.ejb.VariableInstanceFacade;
import javax.naming.NamingException;
import javax.persistence.PostPersist;
import javax.persistence.PostRemove;
import javax.persistence.PostUpdate;
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
