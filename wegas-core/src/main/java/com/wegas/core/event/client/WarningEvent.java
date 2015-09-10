/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

/**
 * @deprecated Useless and dirty
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
public class WarningEvent extends CustomEvent {

    private static final long serialVersionUID = 1L;

    /**
     *
     */
    public WarningEvent() {
    }

    /**
     *
     * @param type
     * @param payload
     */
    public WarningEvent(String type, Object payload) {
        super(type, payload);
    }
}
