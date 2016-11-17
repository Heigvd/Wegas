/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core.persistence.variable.scope;

import com.wegas.core.ejb.RequestFacade;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.VariableInstance;
import java.util.HashMap;
import java.util.Map;
import javax.persistence.*;

import com.wegas.core.ejb.VariableInstanceFacade;
import com.wegas.core.persistence.game.Team;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * @todo Needs to be implemented
 *
 * @author Francois-Xavier Aeberhard (fx at red-agent.com)
 */
@Entity
//@XmlType(name = "GameScope")
public class GameScope extends AbstractScope<Game> {

    private static final long serialVersionUID = 1L;
    private static final Logger logger = LoggerFactory.getLogger(GameScope.class);

    /*
    @OneToMany(cascade = {CascadeType.ALL}, fetch = FetchType.LAZY, orphanRemoval = true, mappedBy = "gameScope")
    @JoinColumn(name = "gamescope_id", referencedColumnName = "id")
    @MapKeyJoinColumn(name = "gamevariableinstances_key", referencedColumnName = "game_id")
    //@XmlTransient
    @JsonIgnore
    private Map<Game, VariableInstance> gameVariableInstances = new HashMap<>();*/
    /**
     *
     */
    //@PrePersist
    public void prePersist() {
        //this.propagateDefaultInstance(null);
    }

    @Override
    public void setVariableInstance(Game key, VariableInstance v) {
        v.setGame(key);
        v.setGameScope(this);
    }

    @Override
    public VariableInstance getVariableInstance(Player player) {
        return this.getVariableInstance(player.getGame());
    }

    public VariableInstance getVariableInstance(Game game) {
        return getVariableInstanceFacade().getGameInstance(this, game);
    }

    @Override
    public Map<Game, VariableInstance> getVariableInstances() {
        return getVariableInstanceFacade().getAllGameInstances(this);
    }

    @Override
    protected void propagate(Game g, boolean create) {
        VariableDescriptor vd = this.getVariableDescriptor();
        if (create) {
            VariableInstance clone = vd.getDefaultInstance().clone();
            g.getPrivateInstances().add(clone);
            this.setVariableInstance(g, clone);
        } else {
            VariableInstance vi = this.getVariableInstance(g);
            Long version = vi.getVersion();
            vi.merge(vd.getDefaultInstance());
            vi.setVersion(version);
        }
    }

    @Override
    public void propagateDefaultInstance(AbstractEntity context, boolean create) {
        if (context instanceof Player) {
            // Since player's game already exists, nothing to propagate
        } else if (context instanceof Team) {
            // Since teams's game already exists, nothing to propagate
        } else if (context instanceof Game) {
            propagate((Game) context, create);
        } else {
            propagate(getVariableDescriptor().getGameModel(), create);
        }
    }

    @Override
    public void merge(AbstractEntity a) {
        //
    }

    @Override
    public Map<Game, VariableInstance> getPrivateInstances() {
        Map<Game, VariableInstance> ret = new HashMap<>();
        Player cPlayer = RequestFacade.lookup().getPlayer();

        ret.put(cPlayer.getGame(), this.getVariableInstance(cPlayer));
        return ret;
    }
}
