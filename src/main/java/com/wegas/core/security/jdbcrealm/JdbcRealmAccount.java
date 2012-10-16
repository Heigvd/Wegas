/*
 * Wegas
 * http://www.albasim.com/wegas/
 *
 * School of Business and Engineering Vaud, http://www.heig-vd.ch/
 * Media Engineering :: Information Technology Managment :: Comem
 *
 * Copyright (C) 2012
 */
package com.wegas.core.security.jdbcrealm;

import com.wegas.core.security.persistence.AbstractAccount;
import javax.persistence.Entity;
import javax.persistence.Transient;
import org.codehaus.jackson.annotate.JsonIgnoreProperties;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@JsonIgnoreProperties({"passwordConfirm"})
public class JdbcRealmAccount extends AbstractAccount {

    @Transient
    private String password;

    /**
     * @return the password
     */
    public String getPassword() {
        return password;
    }

    /**
     * @param password the password to set
     */
    public void setPassword(String password) {
        this.password = password;
    }
}
