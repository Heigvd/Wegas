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
public class WegasIncompatibleType extends WegasRuntimeException {

    private static final long serialVersionUID = -8755889719505476805L;

    public WegasIncompatibleType(String message){
        super(message);
    }
}
