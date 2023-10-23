/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.core.security.aai;

import ch.albasim.wegas.annotations.View;
import ch.albasim.wegas.annotations.WegasEntityProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.wegas.core.security.persistence.AbstractAccount;
import com.wegas.core.security.util.AaiAuthentication;
import com.wegas.core.security.util.AuthenticationMethod;
import com.wegas.editor.view.StringView;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Inheritance;
import jakarta.persistence.InheritanceType;
import jakarta.persistence.NamedQuery;

/**
 * @author Created by jarle.hulaas@heig-vd.ch on 07.03.2017.
 */
@NamedQuery(name = "AaiAccount.findByPersistentId", query = "SELECT a FROM AaiAccount a WHERE TYPE(a) = AaiAccount AND a.persistentId = :persistentId")
@NamedQuery(name = "AaiAccount.findExactClass", query = "SELECT a FROM AaiAccount a WHERE TYPE(a) = AaiAccount")
@Entity
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)
public class AaiAccount extends AbstractAccount {

    private static final long serialVersionUID = 1L;

    @Column(columnDefinition = "text")
    @WegasEntityProperty(ignoreNull = true,
        optional = false, nullable = false,
        view = @View(
            label = "Persistent Id",
            readOnly = true,
            value = StringView.class
        )
    )
    private String persistentId;

    @WegasEntityProperty(view = @View(label = "Organization", readOnly = true, value = StringView.class),
        optional = false, nullable = false)
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

    public static AaiAccount build(AaiUserDetails userDetails) {
        AaiAccount aaiAccount = new AaiAccount();
        aaiAccount.setPersistentId(userDetails.getPersistentId());
        aaiAccount.setEmail(userDetails.getEmail());
        // This information is very useful, e.g. for filtering, but should maybe not be stored as a username ...
        aaiAccount.setUsername("AAI: " + userDetails.getFirstname() + " " + userDetails.getLastname());
        aaiAccount.setFirstname(userDetails.getFirstname());
        aaiAccount.setLastname(userDetails.getLastname());
        aaiAccount.setHomeOrg(userDetails.getHomeOrg());

        return aaiAccount;
    }

    // This attribute should not be sent to the client side, hence the JsonIgnore:
    @JsonIgnore
    public String getPersistentId() {
        return persistentId;
    }

    public void setPersistentId(String persistentId) {
        this.persistentId = persistentId;
    }

    public String getHomeOrg() {
        return homeOrg;
    }

    public void setHomeOrg(String homeOrg) {
        this.homeOrg = homeOrg;
    }

    @Override
    public Boolean isVerified() {
        return true;
    }

    public void setVerified(Boolean verified) {
        // nothing to do, but define such a sette make Jackson happy
    }

    @Override
    public AuthenticationMethod getAuthenticationMethod() {
        return new AaiAuthentication();
    }
}
