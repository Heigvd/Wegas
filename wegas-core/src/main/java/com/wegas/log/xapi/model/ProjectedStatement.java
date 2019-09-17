/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi.model;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.text.StringEscapeUtils;

/**
 *
 * @author maxence
 */
public class ProjectedStatement {

    private String actor;
    private String team;
    private String game;
    private String objectId;
    private String objectType;
    private String objectDesc;
    private String result;
    private String timestamp;
    private String verb;

    public ProjectedStatement() {
    }

    public ProjectedStatement(Map<String, Object> object) {
        this.actor = (String) object.get("actor");
        this.timestamp = (String) object.get("timestamp");
        this.verb = (String) object.get("verb");
        this.objectId = (String) object.get("object_id");
        this.objectType = (String) object.get("object_type");

        this.objectDesc = null;
        Map<String, String> oDesc = (Map<String, String>) object.get("object_desc");
        if (oDesc != null) {
            Optional<String> any = oDesc.values().stream().findAny();
            if (any.isPresent()) {
                this.objectDesc = any.get();
            }
        }

        this.result = (String) object.get("result");

        List<String> groups = (List<String>) object.get("grouping");
        for (String group : groups) {
            if (group.startsWith("internal://wegas/team")) {
                this.team = group.substring(22);
            } else if (group.startsWith("internal://wegas/game")) {
                this.game = group.substring(22);
            }
        }
    }

    public String getActor() {
        return actor;
    }

    public void setActor(String actor) {
        this.actor = actor;
    }

    public String getObjectId() {
        return objectId;
    }

    public void setObjectId(String objectId) {
        this.objectId = objectId;
    }

    public String getObjectType() {
        return objectType;
    }

    public void setObjectType(String objectType) {
        this.objectType = objectType;
    }

    public String getObjectDesc() {
        return objectDesc;
    }

    public void setObjectDesc(String objectDesc) {
        this.objectDesc = objectDesc;
    }

    public String getResult() {
        return result;
    }

    public void setResult(String result) {
        this.result = result;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
    }

    public String getVerb() {
        return verb;
    }

    public void setVerb(String verb) {
        this.verb = verb;
    }

    public String getTeam() {
        return team;
    }

    public void setTeam(String team) {
        this.team = team;
    }

    public String getGame() {
        return game;
    }

    public void setGame(String game) {
        this.game = game;
    }

    public static void writeCSVHeaders(StringBuilder sb, String sep) {
        sb.append("timestamp").append(sep)
                .append("actor").append(sep)
                .append("team").append(sep)
                .append("game").append(sep)
                .append("verb").append(sep)
                .append("object id").append(sep)
                .append("object type").append(sep)
                .append("object description").append(sep)
                .append("result").append(System.lineSeparator());
    }

    private String escape(Object v) {
        if (v != null) {
            return StringEscapeUtils.escapeCsv(v.toString());
        } else {
            return "";
        }
    }

    public void writeCSVRecord(StringBuilder sb, String sep) {
        sb.append(escape(timestamp)).append(sep)
                .append(escape(actor)).append(sep)
                .append(escape(team)).append(sep)
                .append(escape(game)).append(sep)
                .append(escape(verb)).append(sep)
                .append(escape(objectId)).append(sep)
                .append(escape(objectType)).append(sep)
                .append(escape(objectDesc)).append(sep)
                .append(escape(result)).append(System.lineSeparator());
    }
}
