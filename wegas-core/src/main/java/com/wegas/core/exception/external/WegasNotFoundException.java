/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.core.exception.external;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class WegasNotFoundException extends WegasRuntimeException {

    public WegasNotFoundException(String message){
        super(message);
    }
}
