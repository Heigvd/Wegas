/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
////import javax.xml.bind.annotation.XmlTransient;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonView;

/**
 *
 * @author Yannick Lagger <lagger.yannick@gmail.com>
 */
@Entity
@Table(name = "gameaccountkey",
        uniqueConstraints
        = @UniqueConstraint(columnNames = {"accountkey"}))
public class GameAccountKey extends AbstractEntity {

    private static final long serialVersionUID = 1L;
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    @Column(name = "accountkey")
    private String key;
    /**
     *
     */
    private Boolean used = false;
    /**
     *
     */
    @ManyToOne(optional = false)
    //@XmlTransient
    @JsonIgnore
    private Game game;

    /**
     *
     * @param other
     */
    @Override
    public void merge(AbstractEntity other) {
        GameAccountKey newKey = (GameAccountKey) other;
        this.setKey(newKey.getKey());
        //this.setUsed(key.getUsed());
    }

    /**
     * @return the id
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * @param id the id to set
     */
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * @return the key
     */
    public String getKey() {
        return key;
    }

    /**
     * @param key the key to set
     */
    public void setKey(String key) {
        this.key = key;
    }

    /**
     * @return the used
     */
    public Boolean getUsed() {
        return used;
    }

    /**
     * @param used the used to set
     */
    public void setUsed(Boolean used) {
        this.used = used;
    }

    /**
     * @return the game
     */
    @JsonIgnore
    public Game getGame() {
        return game;
    }

    /**
     * @param game the game to set
     */
    public void setGame(Game game) {
        this.game = game;
    }
}
