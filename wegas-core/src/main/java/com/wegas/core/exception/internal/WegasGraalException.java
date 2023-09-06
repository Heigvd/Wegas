/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.internal;

/**
 * Wrap runtime graal exception within a Wegas internal exception
 *
 * @author maxence
 */
public class WegasGraalException extends WegasInternalException {

    /**
     *
     */
    public WegasGraalException(Exception ex) {
        super(ex);
    }
}
