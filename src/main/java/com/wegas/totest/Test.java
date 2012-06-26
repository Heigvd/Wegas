/*
 * Wegas.
 *
 * http://www.albasim.com/wegas/  *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.totest;

import com.wegas.core.persistence.game.Script;
import java.io.Serializable;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;
import javax.validation.constraints.NotNull;

/**
 *
 * @author fx
 */
@Entity
@Table(uniqueConstraints =
@UniqueConstraint(columnNames = "name"))
public class Test implements Serializable {

    @Id
    @Column(name = "gamemodelid")
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    private Long id;

    @NotNull
    //@XmlID
    //@Pattern(regexp = "^\\w+$")
    private String name = "notm";
    /**
     *
     */
    @ElementCollection
    @CollectionTable(name = "PHONE",
    joinColumns =
    @JoinColumn(name = "OWNER_ID"))
    private Map<String, Script> phones = new HashMap<>();

    /**
     * @return the phones
     */
    public Map<String, Script> getPhones() {
        return phones;
    }

    /**
     * @param phones the phones to set
     */
    public void setPhones(Map<String, Script> phones) {
        this.phones = phones;
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

    public void addPhone(String s, Script t) {
        this.phones.put(s, t);
    }

    /**
     * @return the name
     */
    public String getName() {
        return name;
    }

    /**
     * @param name the name to set
     */
    public void setName(String name) {
        this.name = name;
    }
}
