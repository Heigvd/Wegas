/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi.model;

import com.wegas.core.XlsxSpreadsheet;
import java.time.Instant;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.apache.commons.text.StringEscapeUtils;
import org.apache.poi.ss.usermodel.CellStyle;

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
    private Date timestamp;
    private String verb;
    private Boolean success;
    private Boolean completion;

    public ProjectedStatement() {
        // some empty statement
    }

    public ProjectedStatement(Map<String, Object> object) {
        this.actor = (String) object.get("actor");

        String sDate = (String) object.get("timestamp");
        Instant instant = ZonedDateTime.parse(sDate, DateTimeFormatter.ISO_OFFSET_DATE_TIME).toInstant();
        this.timestamp = Date.from(instant);

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
        this.success = (Boolean) object.get("success");
        this.completion = (Boolean) object.get("completion");

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

    public Boolean getSuccess() {
        return success;
    }

    public void setSuccess(Boolean success) {
        this.success = success;
    }

    public Boolean getCompletion() {
        return completion;
    }

    public void setCompletion(Boolean completion) {
        this.completion = completion;
    }

    public Date getTimestamp() {
        return timestamp != null ? new Date(timestamp.getTime()) : null;
    }

    public void setTimestamp(Date timestamp) {
        if (timestamp != null) {
            this.timestamp = new Date(timestamp.getTime());
        } else {
            this.timestamp = null;
        }
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
            .append("success").append(sep)
            .append("completion").append(sep)
            .append("result").append(System.lineSeparator());
    }

    private String escape(Object v) {
        if (v != null) {
            return StringEscapeUtils.escapeCsv(v.toString());
        } else {
            return "";
        }
    }

    @Deprecated
    public void writeCSVRecord(StringBuilder sb, String sep) {
        sb.append(escape(timestamp)).append(sep)
            .append(escape(actor)).append(sep)
            .append(escape(team)).append(sep)
            .append(escape(game)).append(sep)
            .append(escape(verb)).append(sep)
            .append(escape(objectId)).append(sep)
            .append(escape(objectType)).append(sep)
            .append(escape(objectDesc)).append(sep)
            .append(escape(success)).append(sep)
            .append(escape(completion)).append(sep)
            .append(escape(result)).append(System.lineSeparator());
    }

    public static void writeXSLXHeaders(XlsxSpreadsheet xlsx, CellStyle style) {
        //xlsx.newRow();
        xlsx.addValue("timestamp", style);
        xlsx.addValue("actor", style);
        xlsx.addValue("team", style);
        xlsx.addValue("game", style);
        xlsx.addValue("verb", style);
        xlsx.addValue("object id", style);
        xlsx.addValue("object type", style);
        xlsx.addValue("object description", style);
        xlsx.addValue("success", style);
        xlsx.addValue("completion", style);
        xlsx.addValue("result", style);
    }

    public void writeXLSXRecord(XlsxSpreadsheet xlsx, CellStyle style) {
        xlsx.newRow();
        xlsx.addValue(timestamp, style);
        xlsx.addValue(escape(actor), style);
        xlsx.addValue(escape(team), style);
        xlsx.addValue(escape(game), style);
        xlsx.addValue(escape(verb), style);
        xlsx.addValue(escape(objectId), style);
        xlsx.addValue(escape(objectType), style);
        xlsx.addValue(escape(objectDesc), style);
        xlsx.addValue(escape(success), style);
        xlsx.addValue(escape(completion), style);
        xlsx.addValue(escape(result), style);
    }
}
