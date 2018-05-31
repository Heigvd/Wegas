/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.Orderable;
import com.wegas.core.persistence.variable.ModelScoped;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.util.WegasPermission;
import java.util.Collection;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.Id;
import javax.persistence.Index;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;

/**
 * One could simply use a List of String annotated with @OrderColumn, but such a setup leads to incredible
 * cache coordination bug (please re test with EE8)
 *
 * @author maxence
 *
 */
@Entity
@Table(
        uniqueConstraints = {
            @UniqueConstraint(columnNames = {"gamemodel_id", "refname"})
        },
        indexes = {
            @Index(columnList = "gamemodel_id")
        }
)
public class GameModelLanguage extends AbstractEntity implements Orderable {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Id
    @GeneratedValue
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     * arbitrary code
     */
    @Column(length = 16, columnDefinition = "character varying(16) default ''::character varying")
    @WegasEntityProperty
    private String refName;

    /**
     * short name like en, en_uk, or fr_ch
     */
    @Column(length = 16, columnDefinition = "character varying(16) default ''::character varying")
    @WegasEntityProperty
    private String code;

    /**
     * Language name to display
     */
    @WegasEntityProperty
    private String lang;

    /**
     * Order, first language is the default one
     */
    private Integer indexOrder;

    @Column(columnDefinition = "boolean default true")
    @WegasEntityProperty
    private boolean active = true;

    @ManyToOne
    @JsonIgnore
    private GameModel gameModel;

    @Override
    public Long getId() {
        return id;
    }

    @Override
    public ModelScoped.Visibility getInheritedVisibility() {
        throw new UnsupportedOperationException("Not supported yet."); //To change body of generated methods, choose Tools | Templates.
    }

    @Override
    @JsonIgnore
    public Integer getOrder() {
        return indexOrder;
    }

    public Integer getIndexOrder() {
        return indexOrder;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setIndexOrder(Integer indexOrder) {
        this.indexOrder = indexOrder;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getLang() {
        return lang;
    }

    public void setLang(String language) {
        this.lang = language;
    }

    public String getRefName() {
        return refName;
    }

    public void setRefName(String refName) {
        this.refName = refName;
    }

    public GameModel getGameModel() {
        return gameModel;
    }

    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    @Override
    public Collection<WegasPermission> getRequieredReadPermission() {
        return this.getGameModel().getRequieredReadPermission();
    }

    @Override
    public Collection<WegasPermission> getRequieredUpdatePermission() {
        return this.getGameModel().getRequieredUpdatePermission();
    }

    @Override
    public boolean isProtected() {
        return this.getGameModel().isProtected();
    }
}
