/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import javax.ejb.Singleton;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
public class RequestIdentifierGenerator {

    private long counter = 0;

    public String getUniqueIdentifier(){
        return Long.toString(counter++, 10);
    }
}
