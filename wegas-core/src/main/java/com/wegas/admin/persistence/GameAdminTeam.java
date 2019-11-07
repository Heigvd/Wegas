/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2018 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.admin.persistence;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import java.util.ArrayList;
import java.util.List;

/**
 * @author J. Hulaas (jarle.hulaas at heig-vd.ch)
 */

@JsonIgnoreProperties(ignoreUnknown = true)

public class GameAdminTeam {

    private String name;
    private Integer declaredSize;
    private List<String> playerNames;

    private List<String> getPlayerNames(Team t){
        final List<String> playerNames = new ArrayList<>();
        for (Player p : t.getPlayers()) {
            playerNames.add(p.getName());
        }
        return playerNames;
    }

    public GameAdminTeam(Team t) {
        this.name = t.getName();
        this.declaredSize = t.getDeclaredSize();
        this.playerNames = getPlayerNames(t);
    }

    public String getName(){
        return this.name;
    }

    public void setName(String name){
        this.name = name;
    }

    public Integer getDeclaredSize(){
        return this.declaredSize;
    }

    public void setDeclaredSize(Integer declaredSize){
        this.declaredSize = declaredSize;
    }

    public List<String> getPlayerNames(){
        return this.playerNames;
    }

    public void setPlayerNames(List<String> playerNames){
        this.playerNames = playerNames;
    }
}
