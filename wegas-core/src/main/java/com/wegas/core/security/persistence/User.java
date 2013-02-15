/*
 * Wegas
 * http://www.albasim.ch/wegas/
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.security.persistence;

import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Player;
import java.util.ArrayList;
import java.util.List;
import javax.persistence.*;
import javax.xml.bind.annotation.XmlTransient;
import org.codehaus.jackson.annotate.JsonManagedReference;

/**
 *
 * @author Francois-Xavier Aeberhard <fx@red-agent.com>
 */
@Entity
@Table(name = "users")
public class User extends AbstractEntity {

    /**
     *
     */
    @Id
    @GeneratedValue
    private Long id;
    /**
     *
     */
    @OneToMany(mappedBy = "user", cascade = {CascadeType.ALL})
    @JsonManagedReference(value = "player-user")
    private List<Player> players = new ArrayList<>();
    /**
     *
     */
    @OneToMany(mappedBy = "user", cascade = {CascadeType.ALL})
    @JsonManagedReference(value = "user-account")
    private List<AbstractAccount> accounts = new ArrayList<>();

    /**
     *
     */
    public User() {
    }

    /**
     *
     * @param acc
     */
    public User(AbstractAccount acc) {
        this.addAccount(acc);
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
     * @param a
     */
    @Override
    public void merge(AbstractEntity a) {
        throw new UnsupportedOperationException("Not supported yet.");
    }

    /**
     * @return the players
     */
    @XmlTransient
    @JsonManagedReference(value = "player-user")
    public List<Player> getPlayers() {
        return players;
    }

    /**
     * @param players the players to set
     */
    @JsonManagedReference(value = "player-user")
    public void setPlayers(List<Player> players) {
        this.players = players;
    }

    /**
     * @return the accounts
     */
    public List<AbstractAccount> getAccounts() {
        return accounts;
    }

    /**
     * @param accounts the accounts to set
     */
    public void setAccounts(List<AbstractAccount> accounts) {
        this.accounts = accounts;
    }

    /**
     *
     * @param account
     */
    public final void addAccount(AbstractAccount account) {
        this.accounts.add(account);
        account.setUser(this);
    }

    /**
     *
     * @return
     */
    @XmlTransient
    public final AbstractAccount getMainAccount() {
        if (!this.accounts.isEmpty()) {
            return this.accounts.get(0);
        } else {
            return null;
        }
    }

    /**
     *
     * @return
     */
    public String getName() {
        if (this.getMainAccount() != null) {
            return this.getMainAccount().getName();
        } else {
            return "unnamed";
        }
    }
}
