/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.ejb.nashorn;



import jdk.nashorn.api.scripting.ClassFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 *
 * @author maxence
 */
public class NHClassFilter implements ClassFilter {

    Logger logger = LoggerFactory.getLogger(NHClassFilter.class);

    @Override
    public boolean exposeToScripts(String string) {
        return true;
    }
}
