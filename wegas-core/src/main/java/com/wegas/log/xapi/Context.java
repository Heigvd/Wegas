package com.wegas.log.xapi;

import com.google.gson.JsonElement;
import com.google.gson.JsonObject;

import java.util.HashMap;

/*
 * Copied from gov.adlnet.xapi.model when removing learning locker + xapi logging.
 * This file must be kept here so that any scenario script that would be based on it can run safely.
 */

public class Context {
    private String registration;
    private String revision;
    private String platform;
    private String language;
    private Actor instructor;
    private Group team;
    private StatementReference statement;
    private ContextActivities contextActivities;
    private HashMap<String, JsonElement> extensions;

    public ContextActivities getContextActivities() {
        return this.contextActivities;
    }

    public void setContextActivities(ContextActivities ca) {
        this.contextActivities = ca;
    }

    public String getRegistration() {
        return registration;
    }

    public void setRegistration(String registration) {
        this.registration = registration;
    }

    public Actor getInstructor() {
        return instructor;
    }

    public void setInstructor(Actor instructor) {
        this.instructor = instructor;
    }

    public Group getTeam() {
        return team;
    }

    public void setTeam(Group team) {
        this.team = team;
    }

    public String getRevision() {
        return revision;
    }

    public void setRevision(String revision) {
        this.revision = revision;
    }

    public String getPlatform() {
        return platform;
    }

    public void setPlatform(String platform) {
        this.platform = platform;
    }

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public StatementReference getStatement() {
        return statement;
    }

    public void setStatement(StatementReference statement) {
        this.statement = statement;
    }

    public HashMap<String, JsonElement> getExtensions() {
        return extensions;
    }

    public void setExtensions(HashMap<String, JsonElement> extensions) {
        this.extensions = extensions;
    }

    public JsonElement serialize() {
        return new JsonObject();
    }
}
