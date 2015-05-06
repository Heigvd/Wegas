/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.core.persistence;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.variable.primitive.NumberInstance;

import javax.persistence.PostPersist;
import javax.persistence.PostUpdate;

/**
 * @author Cyril Junod <cyril.junod at gmail.com>
 */
public class NumberListener {

    /**
     * https://java.net/jira/browse/GLASSFISH-21195
     *
     * @param number received from EntityListener
     * @see RequestManager#numberChanged
     */
    @PostUpdate
    public void change(Object number) {
        if (number instanceof NumberInstance) {
            NumberInstance n = (NumberInstance) number;
            if (n.getScope() != null) {
                RequestFacade.lookup().getRequestManager().numberChanged(n);
            }
        }

    }
}
