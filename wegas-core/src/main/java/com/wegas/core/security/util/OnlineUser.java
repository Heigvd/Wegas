/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.util;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.wegas.core.security.persistence.User;
import java.io.Serializable;
import java.util.Date;

/**
 *
 * @author Maxence Laurent (maxence laurent gmail.com)
 */
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
public class OnlineUser implements Serializable {

    private static final long serialVersionUID = -8980828303309755447L;

    private final String fullname;
    private final String email;
    private final String username;
    private final Date connectionDate;
    private Date lastActivityDate;
    private final Long userId;
    private final Long mainAccountId;
    private final Long highestRole;
    private Long playerId;

    public OnlineUser(User user, long highestRole) {
        this.fullname = user.getName();
        this.username = user.getMainAccount().getUsername();
        this.email = user.getMainAccount().getEmail();
        this.connectionDate = new Date();
        this.lastActivityDate = new Date();
        this.userId = user.getId();
        this.mainAccountId = user.getMainAccount().getId();
        this.highestRole = highestRole;
        this.playerId = null;
    }

    public String getFullname() {
        return fullname;
    }

    public String getEmail() {
        return email;
    }

    public String getUsername() {
        return username;
    }

    public Date getConnectionDate() {
        return new Date(connectionDate.getTime());
    }

    public Date getLastActivityDate() {
        return new Date(lastActivityDate.getTime());
    }

    /**
     * set last activity date to now
     * @param playerId optional playerId
     */
    public void touch(Long playerId) {
        this.lastActivityDate = new Date();
        if (playerId != null) {
            this.setPlayerId(playerId);
        }
    }

    public Long getUserId() {
        return userId;
    }

    public Long getMainAccountId() {
        return mainAccountId;
    }

    public Long getHighestRole() {
        return highestRole;
    }

    public Long getPlayerId() {
        return playerId;
    }

    private void setPlayerId(Long playerId) {
        this.playerId = playerId;
    }
}
