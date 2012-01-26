/*
 * Wegas. 
 * http://www.albasim.com/wegas/
 * 
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem⁺
 *
 * Copyright (C) 2011 
 */

package com.albasim.wegas.persistence.users;


import com.albasim.wegas.persistence.AnonymousEntity;
import java.io.Serializable;
import java.util.logging.Logger;
import javax.persistence.Entity;
import javax.persistence.GeneratedValue;
import javax.persistence.GenerationType;
import javax.persistence.Id;
import javax.persistence.Table;
import javax.persistence.UniqueConstraint;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlTransient;
import javax.xml.bind.annotation.XmlType;
import org.codehaus.jackson.annotate.JsonTypeInfo;


/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))

@XmlRootElement
@XmlType(name = "Group", propOrder = {"@class", "id", "name"})

public class GroupEntity extends AnonymousEntity {

    private static final Logger logger = Logger.getLogger("GroupEntity");

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "group_seq")
    private Long id;


    @NotNull
    @javax.validation.constraints.Pattern(regexp = "^\\w+$")
    private String name;

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
    public String getName() {
        return name;
    }


    /**
     * 
     * @param name
     */
    public void setName(String name) {
        this.name = name;
    }
}
