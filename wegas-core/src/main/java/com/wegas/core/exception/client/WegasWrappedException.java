/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class WegasWrappedException extends WegasRuntimeException {

    public WegasWrappedException(Throwable ex){
        super(ex.getMessage(), ex);
    }
}
