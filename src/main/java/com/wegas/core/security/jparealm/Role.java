/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.jparealm;

import java.io.Serializable;
import java.util.Set;
import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(name = "roles")
@Cacheable(true)
public class Role implements Serializable {

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @Basic(optional = false)
    @Column(length = 100)
    private String name;
    /**
     *
     */
    @Basic(optional = false)
    @Column(length = 255)
    private String description;
    /**
     *
     */
    @ElementCollection
    @JoinTable(name = "roles_permissions")
    private Set<String> permissions;

    /**
     *
     */
    protected Role() {
    }

    /**
     *
     * @param name
     */
    public Role(String name) {
        this.name = name;
    }

    /**
     *
     * @return
     */
    public Long getId() {
        return id;
    }

    /**
     *
     * @param id
     */
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

    /**
     *
     * @return
     */
    public String getDescription() {
        return description;
    }

    /**
     *
     * @param description
     */
    public void setDescription(String description) {
        this.description = description;
    }

    /**
     *
     * @return
     */
    public Set<String> getPermissions() {
        return permissions;
    }

    /**
     *
     * @param permissions
     */
    public void setPermissions(Set<String> permissions) {
        this.permissions = permissions;
    }
}
