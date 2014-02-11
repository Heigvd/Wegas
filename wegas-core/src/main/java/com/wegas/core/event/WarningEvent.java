/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.event;

import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@XmlType(name = "WarningEvent")
public class WarningEvent extends CustomEvent {

    public WarningEvent() {
    }

    public WarningEvent(String type, Object payload) {
        super(type, payload);
    }
}
