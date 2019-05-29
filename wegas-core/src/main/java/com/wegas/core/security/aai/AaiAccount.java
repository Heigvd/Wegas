/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.aai;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.merge.annotations.WegasEntityProperty;
import com.wegas.core.security.persistence.AbstractAccount;

import javax.persistence.*;

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

    @Column(columnDefinition = "text")
    @WegasEntityProperty(ignoreNull = true)
    private String persistentId;

    @WegasEntityProperty
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

    @Override
    public Boolean isVerified() {
        return true;
    }

    public void setVerified(Boolean verified){
        // nothing to do, but define such a sette make Jackson happy
    }
}
