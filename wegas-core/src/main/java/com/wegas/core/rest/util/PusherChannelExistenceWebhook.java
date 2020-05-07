/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
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

    public PusherChannelExistenceWebhook() {
        // ensure there is an empty constructor
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
