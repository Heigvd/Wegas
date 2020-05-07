/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.persistence.game.Player;
import java.util.Arrays;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@JsonIgnoreProperties(value = {"dummy"})
public class Email {

    private String subject;
    private String from;
    private String replyTo;
    private String body;
    private Player[] to;

    public Email() {
        // useless but ensure there is an empty constructor
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

    public String getReplyTo() {
        return replyTo;
    }

    public void setReplyTo(String replyTo) {
        this.replyTo = replyTo;
    }

    public String getBody() {
        return body;
    }

    public void setBody(String body) {
        this.body = body;
    }

    public Player[] getTo() {
        if (to != null) {
            return Arrays.copyOf(to, to.length);
        } else {
            return new Player[0];
        }
    }

    public void setTo(Player[] to) {
        this.to = Arrays.copyOf(to, to.length);
    }
}
