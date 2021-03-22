/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence;

import com.wegas.core.persistence.variable.Beanjection;

/**
 * Such an entity requires some business-logic methods.
 * <p>
 * This is mainly use to bypass default JPA time consuming methods (like accessing variableInstances
 * from scopes through such a hashMap...) via more optimised methods defined in some facades
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public interface AcceptInjection {

    /**
     * Inject Beans
     *
     * @param beanjection
     */
    void setBeanjection(Beanjection beanjection);
}
