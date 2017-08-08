/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.rest.util;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class PusherChannelExistenceWebhook {

    private String channel;

    private String name;

    private Long time_ms;

    public PusherChannelExistenceWebhook() {
    }

    public String getChannel() {
        return channel;
    }

    public void setChannel(String channel) {
        this.channel = channel;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "PusherWebhook: " + channel + "/" + name;
    }
}
