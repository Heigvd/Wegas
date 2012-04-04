/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.persistence.variable;

import java.util.logging.Level;
import java.util.logging.Logger;
import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;

/**
 * Listen to persistence Events on VariableInstanceEntity
 *
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class VariableInstancePersistenceListener {

    private static final Logger logger = Logger.getLogger("VariableInstancePersistenceListener");

    @PostPersist
    private void onPersist(VariableInstanceEntity instance) {
        logger.log(Level.INFO, "Persisted : {0}(id:{1}) [Scope :{2}]", new Object[]{instance.getClass().getSimpleName(), instance.getId(), instance.getScope()});
    }

    @PostUpdate
    private void onUpdate(VariableInstanceEntity instance) {
        logger.log(Level.INFO, "Updated : {0}(id:{1}) [Scope :{2}]", new Object[]{instance.getClass().getSimpleName(), instance.getId(), instance.getScope()});
    }
}
