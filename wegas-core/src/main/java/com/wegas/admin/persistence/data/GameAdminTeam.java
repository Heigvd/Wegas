
/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2020 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.admin.persistence.data;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Populatable;
import com.wegas.core.persistence.game.Team;
import java.util.ArrayList;
import java.util.List;

/**
 * @author J. Hulaas (jarle.hulaas at heig-vd.ch)
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public class GameAdminTeam {

    private String name;
    private Populatable.Status status;

    private Integer declaredSize;

    private List<GameAdminPlayer> players = new ArrayList<>();

    public GameAdminTeam() {
        // empty constructor is used by JSON-b to deserialise
    }

    public GameAdminTeam(Team t) {
        this.name = t.getName();
        this.declaredSize = t.getDeclaredSize();
        this.status = t.getStatus();

        for (Player p : t.getPlayers()) {
            this.players.add(new GameAdminPlayer(p));
        }
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public Populatable.Status getStatus() {
        return status;
    }

    public void setStatus(Populatable.Status status) {
        this.status = status;
    }

    public List<GameAdminPlayer> getPlayers() {
        return players;
    }

    public void setPlayers(List<GameAdminPlayer> players) {
        this.players = players;
    }

    public Integer getDeclaredSize() {
        return this.declaredSize;
    }

    public void setDeclaredSize(Integer declaredSize) {
        this.declaredSize = declaredSize;
    }

    /**
     * Deserialise v1 from db
     *
     * @param playerNames
     */
    public void setPlayerNames(List<String> playerNames) {
        for (String name : playerNames) {
            this.players.add(new GameAdminPlayer(name, Populatable.Status.LIVE));
        }

        if (!players.isEmpty()) {
            this.setStatus(Populatable.Status.LIVE);
        }
    }
}
