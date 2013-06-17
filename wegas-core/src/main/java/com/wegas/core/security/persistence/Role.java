/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.wegas.core.persistence.AbstractEntity;
import java.util.ArrayList;
import java.util.List;
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
//    @ElementCollection(fetch = FetchType.EAGER)
    @OneToMany(cascade = CascadeType.ALL,orphanRemoval = true)
    private List<Permission> permissions = new ArrayList<>();

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
    public List<Permission> getPermissions() {
        return permissions;
    }

    /**
     *
     * @param permissions
     */
    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
    }

    public boolean addPermission(String permission) {
        return this.addPermission(new Permission(permission));
    }

    public boolean addPermission(Permission permission) {
        if (!this.permissions.contains(permission)) {
            return this.permissions.add(permission);
        } else {
            return false;
        }
    }

    public boolean removePermission(String permission) {
        return this.permissions.remove(new Permission(permission));
    }

    @Override
    public String toString() {
        return "Role(" + this.id + ", " + this.name + ")";
    }
}
