package com.wegas.log.xapi;

import java.net.URI;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Agent extends Actor {

    public static final String AGENT = "Agent";

    public Agent() {
    }

    public Agent(String name, String mbox) {
        super();
        setName(name);
        setMbox(mbox);
    }

    public Agent(String name, URI openid) {
        super();
        setName(name);
        setOpenid(openid);
    }

    public Agent(String name, Account account) {
        super();
        setName(name);
        setAccount(account);
    }

    @Override
    public String getObjectType() {
        return AGENT;
    }

}
