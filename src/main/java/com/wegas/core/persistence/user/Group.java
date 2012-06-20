/*
 * Wegas.
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem é
 *
 * Copyright (C) 2012
 */

package com.wegas.core.persistence.user;


import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.*;
import javax.validation.constraints.NotNull;
import javax.xml.bind.annotation.XmlRootElement;
import javax.xml.bind.annotation.XmlType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;


/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */

@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
@XmlRootElement
@XmlType(name = "Group", propOrder = {"@class", "id", "name"})

public class Group extends AbstractEntity {

    private static final Logger logger = LoggerFactory.getLogger("GroupEntity");

    @Id
    @GeneratedValue
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

    /**
     *
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        throw new UnsupportedOperationException("Not supported yet.");
    }
}
