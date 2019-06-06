/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

/**
 *
 * payara/payara#3994 workaround
 *
 * @author maxence
 */
public abstract class Payara3994Workaround {

    @Override
    public boolean equals(Object o) {
        return o != null && this.getClass().isAssignableFrom(o.getClass());
    }

    // payara/payara#3994 workaround
    @Override
    public int hashCode() {
        return this.getClass().hashCode();
    }
}
