/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.persistence;

import com.wegas.core.persistence.AbstractEntity;
import java.util.HashSet;
import java.util.Set;
import javax.persistence.*;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(name = "roles", uniqueConstraints = {
    @UniqueConstraint(columnNames = "name")
})
@NamedQueries({
    @NamedQuery(name = "findPermissionByGameModelId", query = "SELECT DISTINCT roles FROM Role roles WHERE roles.permissions LIKE :gameId"),
})
@Cacheable(true)
public class Role extends AbstractEntity {

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
    private Set<String> permissions = new HashSet<>();

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

    @Override
    public void merge(AbstractEntity other) {
        Role r = (Role) other;
        this.setName(r.getName());
        this.setDescription(r.getDescription());
        this.setPermissions(r.getPermissions());
    }

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
