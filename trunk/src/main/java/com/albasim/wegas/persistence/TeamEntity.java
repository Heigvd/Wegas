/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */

package com.albasim.wegas.persistence;


import com.albasim.wegas.persistence.users.*;
import com.albasim.wegas.persistence.AnonymousEntity;
import java.io.Serializable;
import java.util.Collection;
import java.util.logging.Logger;
import javax.persistence.CascadeType;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Inheritance;
import javax.persistence.InheritanceType;
import javax.persistence.JoinColumn;
import javax.persistence.JoinTable;
import javax.persistence.ManyToMany;
import javax.persistence.ManyToOne;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;

/**
 *
 * @author maxence
 */

@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = {"gamemodel_id", "name"}))
@Inheritance(strategy = InheritanceType.JOINED)

@XmlRootElement
@XmlType(name = "Team", propOrder = {"@class", "id", "name"})
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "@class")

public class TeamEntity extends AnonymousEntity {

    private static final Logger logger = Logger.getLogger("GroupEntity");

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "team_seq")
    private Long id;


    @NotNull
    @javax.validation.constraints.Pattern(regexp = "^\\w+$")
    private String name;
    
    
    @ManyToMany(cascade = CascadeType.ALL)
    @JoinTable(name = "user_team",
    joinColumns = {
        @JoinColumn(name = "userId")
    },
    inverseJoinColumns = {
        @JoinColumn(name = "teamId")
    })
    private Collection<UserEntity> users;
    
    /**
     * The game model this belongs to
     */
    @ManyToOne
    @NotNull
    @XmlTransient
    private GameModel gameModel;

    @Override
    public Long getId() {
        return id;
    }


    @Override
    public void setId(Long id) {
        this.id = id;
    }


    public String getName() {
        return name;
    }


    public void setName(String name) {
        this.name = name;
    }
    
    
    @Override
    public AnonymousEntity getParent() {
        return null;
    }

    /**
     * @return the gameModel
     */
    @XmlTransient
    public GameModel getGameModel() {
        return gameModel;
    }

    /**
     * @param gameModel the gameModel to set
     */
    @XmlTransient
    public void setGameModel(GameModel gameModel) {
        this.gameModel = gameModel;
    }

    /**
     * @return the users
     */
    public Collection<UserEntity> getUsers() {
        return users;
    }

    /**
     * @param users the users to set
     */
    public void setUsers(Collection<UserEntity> users) {
        this.users = users;
    }
}
