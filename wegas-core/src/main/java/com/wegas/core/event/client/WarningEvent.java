/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event.client;

import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@XmlType(name = "WarningEvent")
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
