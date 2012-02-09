/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */
package com.wegas.persistence;

import com.wegas.ejb.AnonymousEntityManager;
import com.wegas.persistence.variabledescriptor.VariableDescriptorEntity;

import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.logging.Logger;

import javax.persistence.CascadeType;
import javax.persistence.Column;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.OneToMany;
import javax.persistence.PrePersist;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Pattern;
import javax.xml.bind.annotation.XmlID;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
@XmlType(name = "GameModel", propOrder = {"@class", "id", "name", "teams"})
public class GameModelEntity extends NamedEntity implements Serializable {

    private static final Logger logger = Logger.getLogger("GameModelEntity");
    //private static final Pattern p = Pattern.compile("(^get\\()([a-zA-Z0-9_\"]+)(\\)$)");
    /**
     * 
     */
    @Id
    @XmlID
    @Column(name = "gamemodel_id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gamemodel_seq")
    private Long id;
    /**
     * 
     */
    @NotNull
    //@Pattern(regexp = "^\\w+$")
    private String name;
    /**
     * 
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL})
    private List<VariableDescriptorEntity> variableDescriptors;
    /**
     * 
     */
    @OneToMany(mappedBy = "gameModel", cascade = {CascadeType.ALL})
    private List<TeamEntity> teams;

    /**
     * 
     * @return
     */
    @Override
    public Long getId() {
        return id;
    }

    /**
     * 
     * @param id
     */
    @Override
    public void setId(Long id) {
        this.id = id;
    }

    /**
     * 
     * @return
     */
    @Override
    public String getName() {
        return name;
    }

    /**
     * 
     * @param name
     */
    @Override
    public void setName(String name) {
        this.name = name;
    }

    /**
     * 
     * @return
     */
    @XmlTransient
    public Collection<VariableDescriptorEntity> getVariableDescriptors() {
        return variableDescriptors;
    }

    /**
     * 
     * @param variableDescriptor
     */
    @XmlTransient
    public void addVariableDescriptor(VariableDescriptorEntity variableDescriptor) {
        this.variableDescriptors.add(variableDescriptor);
        variableDescriptor.setGameModel(this);
    }

    /**
     * 
     * @param variableDescriptors
     */
    public void setVariableDescriptors(
            List<VariableDescriptorEntity> variableDescriptors) {
        this.variableDescriptors = variableDescriptors;
        for (VariableDescriptorEntity vd : variableDescriptors) {
            vd.setGameModel(this);
        }
    }

    /**
     * @return the teams
     */
    public List<TeamEntity> getTeams() {
        return this.teams;
    }

    /**
     * @param teams the teams to set
     */
    public void setTeams(List<TeamEntity> teams) {
        this.teams = teams;
    }

    @PrePersist
    private void prePersist() {
        for (TeamEntity t : this.teams) {
            t.setGameModel(this);
        }
    }

    /**
     * 
     */
    public void reset(AnonymousEntityManager aem) {
        for (VariableDescriptorEntity vd : this.getVariableDescriptors()) {
            vd.getScope().reset(aem);
        }
    }
}
