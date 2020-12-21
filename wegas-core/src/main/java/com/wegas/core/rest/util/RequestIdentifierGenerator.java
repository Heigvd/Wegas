/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import javax.ejb.Singleton;
import javax.inject.Inject;
import org.eclipse.microprofile.metrics.Counter;
import org.eclipse.microprofile.metrics.annotation.Metric;

/**
 *
 * @author Maxence Laurent (maxence.laurent gmail.com)
 */
@Singleton
public class RequestIdentifierGenerator {

    //private long counter = 0;

    @Inject
    @Metric(name = "requests_total", description = "Total requests", absolute = true)
    private Counter requests;

    public String getUniqueIdentifier(){
        requests.inc();
        return Long.toString(requests.getCount(), 10);
    }
}
