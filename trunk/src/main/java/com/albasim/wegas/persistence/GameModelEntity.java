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

import com.albasim.wegas.persistence.variabledescriptor.VariableDescriptorEntity;
import com.albasim.wegas.persistence.variableinstance.VariableInstanceEntity;

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
    @Column(name = "gamemodel_id")
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "gamemodel_seq")
    private Long id;
    /**
     * 
     */
    @NotNull
    @Pattern(regexp = "^\\w+$")
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

    @Override
    public Long getId() {
        return id;
    }

    @Override
    public void setId(Long id) {
        this.id = id;
    }

    @Override
    public String getName() {
        return name;
    }

    @Override
    public void setName(String name) {
        this.name = name;
    }

    @XmlTransient
    public Collection<VariableDescriptorEntity> getVariableDescriptors() {
        return variableDescriptors;
    }

    @XmlTransient
    public void addVariableDescriptor(VariableDescriptorEntity variableDescriptor) {
        this.variableDescriptors.add(variableDescriptor);
        variableDescriptor.setGameModel(this);
    }

    @XmlTransient
    public void setVariableDescriptors(
            List<VariableDescriptorEntity> variableDescriptors) {
        this.variableDescriptors = variableDescriptors;
    }

    @XmlTransient
    public List<VariableDescriptorEntity> getVariableInstances() {
        return variableDescriptors;
    }

    //@XmlTransient
    //@XmlElement(nillable=true)
    public void setVariableInstances(
            Collection<VariableInstanceEntity> variableInstances) {
        //this.variableInstances = variableInstances;
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
}
