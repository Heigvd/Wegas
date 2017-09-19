/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.exception.client;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class WegasUniqueConstraintException extends WegasRuntimeException {

    private static final long serialVersionUID = 6279387286731157409L;

    public WegasUniqueConstraintException(Throwable cause){
        super(cause);
    }
}
