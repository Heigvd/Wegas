 /*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.persistence.game.Player;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class Email {

    private String subject;
    private String from;
    private String body;
    private Player[] to;

    public Email() {
    }

    public String getSubject() {
        return subject;
    }

    public void setSubject(String subject) {
        this.subject = subject;
    }

    public String getFrom() {
        return from;
    }

    public void setFrom(String from) {
        this.from = from;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Player[] getTo() {
        return to;
    }

    public void setTo(Player[] to) {
        this.to = to;
    }
}
