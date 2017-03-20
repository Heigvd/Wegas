package com.wegas.core.security.aai;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.exception.client.WegasIncompatibleType;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.security.persistence.AbstractAccount;

import javax.persistence.*;
import java.util.Date;

/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) AlbaSim, School of Business and Engineering of Western Switzerland
 * Licensed under the MIT License
 * Created by jarle.hulaas@heig-vd.ch on 07.03.2017.
 */
@NamedQueries({
    @NamedQuery(name = "AaiAccount.findByPersistentId", query = "SELECT a FROM AaiAccount a WHERE TYPE(a) = AaiAccount AND a.persistentId = :persistentId"),
    @NamedQuery(name = "AaiAccount.findExactClass", query = "SELECT a FROM AaiAccount a WHERE TYPE(a) = AaiAccount")
})
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
public class AaiAccount extends AbstractAccount {

    private static final long serialVersionUID = 1L;

    private String persistentId;
    private String homeOrg;

    /*
    * Inherited from AbstractAccount:
    * private String username;  <- could be empty, but currently used as display name
    * private String firstname;
    * private String lastname;
    * private String email;
    * private Date agreedTime;
    */

    public AaiAccount() {
        // Default constructor required for persistence.
    }

    public AaiAccount(AaiUserDetails userDetails){
        this.setPersistentId(userDetails.getPersistentId());
        // This information is very useful, e.g. for filtering, but should maybe not be stored as a username ...
        this.setUsername("AAI: " + userDetails.getFirstname() + " " + userDetails.getLastname());
        this.setEmail(userDetails.getEmail());
        this.setFirstname(userDetails.getFirstname());
        this.setLastname(userDetails.getLastname());
        this.setHomeOrg(userDetails.getHomeOrg());
    }

    @Override
    public void merge(AbstractEntity other) {
        if (other instanceof AaiAccount) {
            super.merge(other);
            AaiAccount a = (AaiAccount) other;
            String persistentId = a.getPersistentId();
            // Don't propagate or persist missing (censored) information:
            if (persistentId != null && persistentId != "") {
                this.setPersistentId(a.getPersistentId());
            }
            this.setHomeOrg(a.getHomeOrg());
        } else {
            throw new WegasIncompatibleType(this.getClass().getSimpleName() + ".merge (" + other.getClass().getSimpleName() + ") is not possible");
        }
    }

    // This attribute should not be sent to the client side, hence the JsonIgnore:
    @JsonIgnore
    public String getPersistentId(){
        return persistentId;
    }

    public void setPersistentId(String persistentId){
        this.persistentId = persistentId;
    }

    public String getHomeOrg(){
        return homeOrg;
    }

    public void setHomeOrg(String homeOrg){
        this.homeOrg = homeOrg;
    }

}
