/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.variable.Beanjection;

/**
 * Such an entity requires some business-logic methods.
 *
 * This is mainly use to bypass default JPA time consuming methods (like
 * accessing variableInstances from scopes through such a hashMap...) via more
 * optimised methods defined in some facades
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface AcceptInjection {

    /**
     * Inject Beans 
     *
     * @param beanjection
     */
    public void setBeanjection(Beanjection beanjection);
}
