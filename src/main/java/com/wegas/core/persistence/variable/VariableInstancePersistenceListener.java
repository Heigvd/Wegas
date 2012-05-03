/*
 * To change this template, choose Tools | Templates
 * and open the template in the editor.
 */
package com.wegas.core.persistence.variable;

import com.wegas.core.ejb.GameManager;
import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.messaging.ejb.MessageEvent;
import java.util.logging.Level;
import javax.ejb.EJB;
import javax.enterprise.event.Event;
import javax.inject.Inject;
import javax.naming.InitialContext;
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

    /**
     *
     * @param instance
     * @throws NamingException
     */
    @PostPersist
    @PostUpdate
    @PostRemove
    private void onUpdate(VariableInstanceEntity instance) throws NamingException {
        InitialContext ctx = new InitialContext();
        VariableInstanceFacade variableInstanceFacade = (VariableInstanceFacade) ctx.lookup("java:module/VariableInstanceFacade");
        variableInstanceFacade.onVariableInstanceUpdate(instance);
    }
}
