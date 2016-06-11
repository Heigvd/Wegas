/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.rest.util.Views;
import java.io.Serializable;
import javax.persistence.*;
//import javax.xml.bind.annotation.XmlRootElement;
//import javax.xml.bind.annotation.XmlType;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.annotation.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@XmlRootElement
//@XmlType(name = "")                                                             // This forces to use Class's short name as contentType
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")
@Table(indexes = {
    @Index(columnList = "clientscriptlibrary_gamemodelid"),
    @Index(columnList = "scriptlibrary_gamemodelid"),
    @Index(columnList = "csslibrary_gamemodelid")
})
public class GameModelContent implements Serializable {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @JsonView(Views.IndexI.class)
    private Long id;
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
     * @param content
     */
    public GameModelContent(String content) {
        this.content = content;
    }

    /**
     *
     * @param contentType
     * @param content
     */
    public GameModelContent(String contentType, String content) {
        this.contentType = contentType;
        this.content = content;
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
}
