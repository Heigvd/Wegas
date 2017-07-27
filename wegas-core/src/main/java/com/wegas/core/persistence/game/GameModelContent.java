/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.rest.util.Views;
import java.io.Serializable;
import javax.persistence.*;
//import javax.xml.bind.annotation.XmlRootElement;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;
import java.util.Objects;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@XmlRootElement
//@XmlType(name = "")                                                             // This forces to use Class's short name as contentType
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@Table(indexes = {
    @Index(columnList = "clientscriptlibrary_gamemodelid")
    ,
    @Index(columnList = "scriptlibrary_gamemodelid")
    ,
    @Index(columnList = "csslibrary_gamemodelid")
    ,
    @Index(columnList = "csslibrary_gamemodelid, scriptlibrary_gamemodelid, clientscriptlibrary_gamemodelid, contentKey", unique = true)
})
public class GameModelContent implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @JsonView(Views.IndexI.class)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "csslibrary_gamemodelid")
    private GameModel csslibrary_GameModel;

    @ManyToOne
    @JoinColumn(name = "scriptlibrary_gamemodelid")
    private GameModel scriptlibrary_GameModel;

    @ManyToOne
    @JoinColumn(name = "clientscriptlibrary_gamemodelid")
    private GameModel clientscriptlibrary_GameModel;

    private String contentKey;

    /**
     *
     */
    private String contentType;
    /**
     *
     */
    @Lob
    @Basic(optional = false, fetch = FetchType.LAZY)
    //@Column(columnDefinition = "text")
    //@JsonView({Views.Export.class})
    private String content = "";

    /**
     *
     */
    public GameModelContent() {
    }

    /**
     *
     * @param key
     * @param content
     * @param contentType
     */
    public GameModelContent(String key, String content, String contentType) {
        this.contentKey = key;
        this.content = content;
        this.contentType = contentType;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) {
            return true;
        }
        if (obj == null) {
            return false;
        }
        if (getClass() != obj.getClass()) {
            return false;
        }
        final GameModelContent other = (GameModelContent) obj;
        if (!Objects.equals(this.contentKey, other.contentKey)) {
            return false;
        }
        if (!Objects.equals(this.id, other.id)) {
            return false;
        }
        if (!Objects.equals(this.csslibrary_GameModel, other.csslibrary_GameModel)) {
            return false;
        }
        if (!Objects.equals(this.scriptlibrary_GameModel, other.scriptlibrary_GameModel)) {
            return false;
        }
        if (!Objects.equals(this.clientscriptlibrary_GameModel, other.clientscriptlibrary_GameModel)) {
            return false;
        }
        return true;
    }

    @JsonIgnore
    public GameModel getClientscriptlibrary_GameModel() {
        return clientscriptlibrary_GameModel;
    }

    public void setClientscriptlibrary_GameModel(GameModel clientscriptlibrary_GameModel) {
        this.clientscriptlibrary_GameModel = clientscriptlibrary_GameModel;
    }

    /**
     * @return the contentType
     */
    public String getContentType() {
        return contentType;
    }

    /**
     * @param contentType the contentType to set
     */
    public void setContentType(String contentType) {
        this.contentType = contentType;
    }

    /**
     * @return the content
     */
    public String getContent() {
        return content;
    }

    /**
     * @param content the content to set
     */
    public void setContent(String content) {
        this.content = content;
    }

    @JsonIgnore
    public GameModel getCsslibrary_GameModel() {
        return csslibrary_GameModel;
    }

    public void setCsslibrary_GameModel(GameModel csslibrary_GameModel) {
        this.csslibrary_GameModel = csslibrary_GameModel;
    }

    /**
     * @return the id
     */
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    @JsonIgnore
    public String getContentKey() {
        return contentKey;
    }

    public void setContentKey(String contentKey) {
        this.contentKey = contentKey;
    }

    @JsonIgnore
    public GameModel getScriptlibrary_GameModel() {
        return scriptlibrary_GameModel;
    }

    public void setScriptlibrary_GameModel(GameModel scriptlibrary_GameModel) {
        this.scriptlibrary_GameModel = scriptlibrary_GameModel;
    }

    @JsonIgnore
    private GameModel getGameModel() {
        if (this.clientscriptlibrary_GameModel != null) {
            return clientscriptlibrary_GameModel;
        } else if (this.scriptlibrary_GameModel != null) {
            return scriptlibrary_GameModel;
        } else {
            return csslibrary_GameModel;
        }
    }

    @Override
    public int hashCode() {
        int hash = 7;
        hash = 29 * hash + Objects.hashCode(this.id);
        hash = 29 * hash + Objects.hashCode(csslibrary_GameModel);
        hash = 29 * hash + Objects.hashCode(scriptlibrary_GameModel);
        hash = 29 * hash + Objects.hashCode(clientscriptlibrary_GameModel);
        hash = 29 * hash + Objects.hashCode(this.contentKey);
        return hash;
    }

}
