/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.rest.util.Views;
import java.io.Serializable;
import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Embeddable
@JsonIgnoreProperties(value = {"imageUri"})
public class GameModelProperties implements Serializable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    private Boolean freeForAll = false;
    /**
     *
     */
    private Boolean guestAllowed = false;
    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    private String pagesUri = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    private String cssUri = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    private String websocket = "";

    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    private String logID = "";
    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    private String scriptUri = "";

    /**
     *
     */
    @JsonView({Views.ExtendedI.class})
    private String clientScriptUri = "";
    /**
     *
     */
    private String iconUri = "";

    /**
     *
     */
    public GameModelProperties() {
    }

    /**
     *
     * @param other
     */
    public void merge(GameModelProperties other) {
        this.setFreeForAll(other.getFreeForAll());
        this.setGuestAllowed(other.getGuestAllowed());
        this.setPagesUri(other.getPagesUri());
        this.setIconUri(other.getIconUri());
        this.setWebsocket(other.getWebsocket());
        this.setLogID(other.getLogID());
        this.setCssUri(other.getCssUri());
        this.setScriptUri(other.getScriptUri());
        this.setClientScriptUri(other.getClientScriptUri());
    }

    /**
     * Is a guest allowed to create/join a team on this gameModel ?
     *
     * @return whether or not a guest is allowed to create or join a team within this gameModel
     */
    public Boolean getGuestAllowed() {
        return guestAllowed;
    }

    /*
     * Allow or forbid guest to create or join team
     *
     * @param guestAllowed is a guest allowed to create or join a team ?
     */
    public void setGuestAllowed(Boolean guestAllowed) {
        this.guestAllowed = guestAllowed;
    }

    /**
     * Is the game designed to be played individually (freeForAll = true) or played as a team (freeForAll =false)
     * "FreeForAll" iz bad wording...
     *
     * @return the freeForAll true if the game is designed to be played alone
     */
    public Boolean getFreeForAll() {
        return freeForAll;
    }

    /**
     * @param freeForAll the freeForAll to set
     */
    public void setFreeForAll(Boolean freeForAll) {
        this.freeForAll = freeForAll;
    }

    /**
     * @return the pagesUri
     */
    public String getPagesUri() {
        return pagesUri;
    }

    /**
     * @param pagesUri the pagesUri to set
     */
    public void setPagesUri(String pagesUri) {
        this.pagesUri = pagesUri;
    }

    /**
     * @return the cssUri
     */
    public String getCssUri() {
        return cssUri;
    }

    /**
     * @param cssUri the cssUri to set
     */
    public void setCssUri(String cssUri) {
        this.cssUri = cssUri;
    }

    /**
     * @return the websocket
     */
    public String getWebsocket() {
        return websocket;
    }

    /**
     * @param websocket the websocket to set
     */
    public void setWebsocket(String websocket) {
        this.websocket = websocket;
    }

    /**
     *
     * @return logID
     */
    public String getLogID() {
        return logID;
    }

    /**
     *
     * @param logID logID to set
     */
    public void setLogID(String logID) {
        this.logID = logID;
    }

    /**
     *
     * @return static server script URI
     */
    public String getScriptUri() {
        return scriptUri;
    }

    /**
     *
     * @param scriptUri
     */
    public void setScriptUri(String scriptUri) {
        this.scriptUri = scriptUri;
    }

    /**
     * @return the iconUri
     */
    public String getIconUri() {
        return iconUri;
    }

    /**
     * @param iconUri the iconUri to set
     */
    public void setIconUri(String iconUri) {
        this.iconUri = iconUri;
    }

    /**
     * @return the clientScriptUri
     */
    public String getClientScriptUri() {
        return clientScriptUri;
    }

    /**
     * @param clientScriptUri the clientScriptUri to set
     */
    public void setClientScriptUri(String clientScriptUri) {
        this.clientScriptUri = clientScriptUri;
    }

}
