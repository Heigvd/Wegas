/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.game;

import com.wegas.core.Helper;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.rest.util.Views;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.map.annotate.JsonView;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(name = "gameenrolementkey")
public class GameEnrolmentKey extends AbstractEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @JsonView(Views.IndexI.class)
    private Long id;
    /**
     *
     */
    @Column(name = "wkey")
    private String key;
    /**
     *
     */
    private Boolean used = false;
    /**
     *
     */
    @ManyToOne(optional = false)
    @XmlTransient
    private Game game;

    /**
     *
     * @param other
     */
    @Override
    public void merge(AbstractEntity other) {
        GameEnrolmentKey newKey = (GameEnrolmentKey) other;
        this.setKey(newKey.getKey());
        //this.setUsed(key.getUsed());
    }

    /**
     *
     */
    @PreUpdate
    public void preUpdate() {
        if (this.getKey() == null || this.getKey().equals("")) {
            this.setKey(Helper.genToken(10));
        }
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
