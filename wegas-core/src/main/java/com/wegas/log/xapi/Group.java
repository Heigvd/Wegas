package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.ArrayList;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Group extends Actor {

    public static final String GROUP = "Group";
    private ArrayList<Agent> member;

    public Group(ArrayList<Agent> members) {
        super();
        setMember(members);
    }

    @Override
    public String getObjectType() {
        return GROUP;
    }

    public ArrayList<Agent> getMember() {
        return member;
    }

    public void setMember(ArrayList<Agent> member) {
        this.member = member;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }

    public String toString() {
        return "";
    }
}
