/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2017 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.wegas.core.persistence.AbstractEntity;
import javax.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.merge.annotations.WegasEntityProperty;
import java.util.Objects;

/**
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
@NamedQueries({
    @NamedQuery(name = "Permission.findByPermissionAndUser", query = "SELECT p FROM Permission p WHERE p.value LIKE :permission AND p.user.id = :userId"),
    @NamedQuery(name = "Permission.findByPermission", query = "SELECT p FROM Permission p WHERE p.value LIKE :permission")
})
@Table(
    indexes = {
        @Index(columnList = "role_id"),
        @Index(columnList = "user_id")
    }
)
public class Permission extends AbstractEntity {

    private static final long serialVersionUID = 1L;
    /**
     *
     */
    @Basic
    @Column(name = "permissions")
    @WegasEntityProperty
    private String value;
    /**
     *
     */
    @Basic
    @WegasEntityProperty
    private String inducedPermission;
    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    /*@ManyToOne
     private AbstractAccount account;*/
    @ManyToOne
    @JsonIgnore
    private User user;
    /**
     *
     */
    @ManyToOne
    @JsonIgnore
    private Role role;

    /**
     *
     */
    public Permission() {
    }

    /**
     *
     * @param value
     */
    public Permission(String value) {
        this.value = value;
    }

    /**
     *
     * @param value
     * @param inducedPermission
     */
    public Permission(String value, String inducedPermission) {
        this.value = value;
        this.inducedPermission = inducedPermission;
    }

    @Override
    public void __merge(AbstractEntity other) {
    }

    @Override
    public boolean equals(Object obj) {
        if (super.equals(obj)) {
            return true;
        } else {
            return (obj != null
                    && obj instanceof Permission
                    && this.value.equals(((Permission) obj).getValue()));
        }

    }

    @Override
    public int hashCode() {
        int hash = 3;
        hash = 61 * hash + Objects.hashCode(this.value);
        return hash;
    }

    /**
     * @return the inducedPermission
     */
    public String getInducedPermission() {
        return inducedPermission;
    }

    /**
     * @param inducedPermission the inducedPermission to set
     */
    public void setInducedPermission(String inducedPermission) {
        this.inducedPermission = inducedPermission;
    }

    /**
     * @return the value
     */
    public String getValue() {
        return value;
    }

    /**
     * @param value the value to set
     */
    public void setValue(String value) {
        this.value = value;
    }

    @Override
    public String toString() {
        return "Permission(" + this.value + ")";
    }

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
     * get the user the permission is for
     *
     * @return the user or null whether the permission is for a Role
     */
    public User getUser() {
        return user;
    }

    /**
     * set the user the permission is for
     *
     * @param user the user
     */
    public void setUser(User user) {
        this.user = user;
    }

    /**
     * @return the role
     */
    public Role getRole() {
        return role;
    }

    /**
     * @param role the role to set
     */
    public void setRole(Role role) {
        this.role = role;
    }
}
