/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.exception.internal;

import jdk.nashorn.api.scripting.NashornException;

/**
 * Wrap runtime NashornException within a Wegas internal exception
 *
 * @author maxence
 */
public class WegasNashornException extends WegasInternalException {

    /**
     *
     */
    public WegasNashornException(NashornException ex) {
        super(ex);
    }
}
