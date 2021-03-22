/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013, 2014, 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.unit.pmg;

import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Script;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.security.persistence.User;
import org.junit.Test;

/**
 *
 * @author Maxence Laurent <maxence.laurent at gmail.com>
 */
public class ArtosTestFSM extends PMGameAbstractTest {

    @Test
    public void testArtos() {
        //this.evalScript("testArtos()");
        this.evalScript("PMGTest.testAll()");
    }

    @Override
    protected String getGameModelPath() {
        return "src/main/webapp/wegas-private/wegas-pmg/db/wegas-pmg-gamemodel-Artos-FSM.json";
    }

    @Override
    protected String getScriptTestPath() {
        return "test-scripts/wegas-pmg-server-test-artos.js";
    }

    private Team createTeam(Game g, String name) {
        Team t = new Team(name);
        t.setGame(g);
        teamFacade.create(g.getId(), t);
        return t;
    }

    private Player createPlayer(Team t) {
        User u = new User();
        userFacade.create(u);

        return gameFacade.joinTeam(t.getId(), u.getId(), null);
    }

    @Test
    public void testMassiveJoin() throws Exception {
        int nbTeam = 10;
        int nbPlayer = 2;
        Game g = new Game("game");
        GameModel gameModel = this.getGameModel();
        g.setGameModel(gameModel);

        gameFacade.create(g);

        Player testPlayer = gameFacade.find(g.getId()).getTeams().get(0).getPlayers().get(0);

        for (int i = 0; i < nbTeam; i++) {
            Team t = createTeam(g, "T" + i);
            for (int j = 0; j < nbPlayer; j++) {
                createPlayer(t);
            }
        }
        
        NumberDescriptor playerCounter = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "playerCounter");
        NumberDescriptor teamCounter = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "teamCounter");
        NumberDescriptor gameCounter = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "gameCounter");

        NumberDescriptor other_p = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "otherCounter_p");
        NumberDescriptor other_t = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "otherCounter_t");
        NumberDescriptor other_g = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "otherCounter_g");

        NumberDescriptor playerCounter_ps = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "playerCounter_ps");
        NumberDescriptor teamCounter_ps = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "teamCounter_ps");
        NumberDescriptor gameCounter_ps = (NumberDescriptor) variableDescriptorFacade.find(gameModel, "gameCounter_ps");

        NumberInstance gameInstance;
        NumberInstance gameInstance_o;
        NumberInstance gameInstance_ps;

        gameInstance = gameCounter.getInstance(g.getTeams().get(0).getPlayers().get(0));
        gameInstance_ps = gameCounter_ps.getInstance(g.getTeams().get(0).getPlayers().get(0));
        gameInstance_o = other_g.getInstance(g.getTeams().get(0).getPlayers().get(0));

        System.out.println("GameInstance: " + gameInstance.getValue());
        System.out.println("GameInstance O: " + gameInstance_o.getValue());
        System.out.println("GameInstance PS: " + gameInstance_ps.getValue());
        g = gameFacade.find(g.getId());
        for (Team t : g.getTeams()) {
            t = teamFacade.find(t.getId());

            NumberInstance teamInstance = teamCounter.getInstance(t.getPlayers().get(0));
            System.out.println("TeamInstance: " + teamInstance.getValue());

            NumberInstance teamInstance_o = other_t.getInstance(t.getPlayers().get(0));
            System.out.println("TeamInstance O: " + teamInstance_o.getValue());

            NumberInstance teamInstance_ps = teamCounter_ps.getInstance(t.getPlayers().get(0));
            System.out.println("TeamInstance PS: " + teamInstance_ps.getValue());
            for (Player p : t.getPlayers()) {
                NumberInstance playerInstance = playerCounter.getInstance(p);
                System.out.println("PlayerInstance: " + playerInstance.getValue());

                NumberInstance playerInstance_o = other_p.getInstance(p);
                System.out.println("PlayerInstance O: " + playerInstance_o.getValue());

                NumberInstance playerInstance_ps = playerCounter_ps.getInstance(p);
                System.out.println("PlayerInstance PS: " + playerInstance_ps.getValue());
            }
        }

        String script = "Variable.find(gameModel, 'periodLimit').setValue(self, 1);Variable.find(gameModel, 'phaseLimit').setValue(self, 4);";

        scriptFacade.eval(testPlayer, new Script("JavaScript", script), null);
        requestFacade.commit();

        

        gameInstance = gameCounter.getInstance(g.getTeams().get(0).getPlayers().get(0));
        gameInstance_ps = gameCounter_ps.getInstance(g.getTeams().get(0).getPlayers().get(0));
        gameInstance_o = other_g.getInstance(g.getTeams().get(0).getPlayers().get(0));

        System.out.println("GameInstance: " + gameInstance.getValue());
        System.out.println("GameInstance O: " + gameInstance_o.getValue());
        System.out.println("GameInstance PS: " + gameInstance_ps.getValue());
        g = gameFacade.find(g.getId());
        for (Team t : g.getTeams()) {
            t = teamFacade.find(t.getId());

            NumberInstance teamInstance = teamCounter.getInstance(t.getPlayers().get(0));
            System.out.println("TeamInstance: " + teamInstance.getValue());

            NumberInstance teamInstance_o = other_t.getInstance(t.getPlayers().get(0));
            System.out.println("TeamInstance O: " + teamInstance_o.getValue());

            NumberInstance teamInstance_ps = teamCounter_ps.getInstance(t.getPlayers().get(0));
            System.out.println("TeamInstance PS: " + teamInstance_ps.getValue());
            for (Player p : t.getPlayers()) {
                NumberInstance playerInstance = playerCounter.getInstance(p);
                System.out.println("PlayerInstance: " + playerInstance.getValue());

                NumberInstance playerInstance_o = other_p.getInstance(p);
                System.out.println("PlayerInstance O: " + playerInstance_o.getValue());

                NumberInstance playerInstance_ps = playerCounter_ps.getInstance(p);
                System.out.println("PlayerInstance PS: " + playerInstance_ps.getValue());
            }
        }
         
    }

}
