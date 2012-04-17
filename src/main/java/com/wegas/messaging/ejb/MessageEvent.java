/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.messaging.ejb;

import com.wegas.messaging.persistence.variable.MessageEntity;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
public class MessageEvent {

    /**
     *
     */
    private String type;
    /**
     *
     */
    private MessageEntity message;

    /**
     * @return the type
     */
    public String getType() {
        return type;
    }

    /**
     * @param type the type to set
     */
    public void setType(String type) {
        this.type = type;
    }

    /**
     * @return the message
     */
    public MessageEntity getMessage() {
        return message;
    }

    /**
     * @param message the message to set
     */
    public void setMessage(MessageEntity message) {
        this.message = message;
    }
}
