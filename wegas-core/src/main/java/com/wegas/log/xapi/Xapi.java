package com.wegas.log.xapi;

import java.io.IOException;
import java.net.MalformedURLException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;

import com.wegas.core.Helper;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import gov.adlnet.xapi.client.StatementClient;
import gov.adlnet.xapi.model.*;

@Stateless
@LocalBean
public class Xapi implements XapiI {

    private static final Logger logger = LoggerFactory.getLogger(Xapi.class);

    @Inject
    private RequestManager manager;
    @Inject
    private UserFacade userFacade;

    @Override
    public Statement userStatement(final String verb, final IStatementObject object) {

        final Agent agent = this.agent(manager.getCurrentUser());
        final Verb v = new Verb(verb);
        final Statement stmt = new Statement(agent, v, object);

        stmt.setTimestamp(OffsetDateTime.now().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        return stmt;
    }

    @Override
    public IStatementObject activity(String id) {
        return new Activity(id);
    }

    @Override
    public Result result(String response) {
        final Result result = new Result();
        result.setResponse(response);
        return result;
    }

    @Override
    public Result result() {
        return new Result();
    }

    public String serialize(IStatementObject stmt) {
        return stmt.serialize().toString();
    }

    public String serialize(Statement stmt) {
        return stmt.serialize().toString();
    }

    @Override
    public void post(Statement stmt) {
        if (!isValid()) {
            logger.warn("Failed to persist an xapi statement, invalid context\n{}", serialize(stmt));
            return;
        }
        stmt.setContext(this.genContext());
        try {
            this.getClient().postStatement(stmt);
        } catch (IOException e) {
            logger.error(e.getMessage());

        }
    }

    @Override
    public void post(List<Statement> stmts) {
        if (!isValid()) {
            for (Statement s : stmts) {
                logger.warn("Failed to persist an xapi statement, invalid context\n{}", serialize(s));
            }
            return;
        }
        Context ctx = this.genContext();
        stmts.forEach(stmt -> stmt.setContext(ctx));
        try {
            this.getClient().postStatements(new ArrayList<>(stmts));
        } catch (IOException e) {
            logger.error(e.getMessage());
        }
    }

    private StatementClient getClient() throws MalformedURLException {
        return new StatementClient(Helper.getWegasProperty("xapi.host"), Helper.getWegasProperty("xapi.auth"));
    }

    private Context genContext() {
        final String logID = manager.getPlayer().getGameModel().getProperties().getLogID();
        final Game game = manager.getPlayer().getGame();

        final Context context = new Context();
        final List<User> instructorsUser = userFacade.findEditors("g" + game.getId());
        if (instructorsUser.size() > 0) {
            final ArrayList<Agent> instructorsAgent = new ArrayList<>();
            for (User u : instructorsUser) {
                instructorsAgent.add(this.agent(u));
            }
            context.setInstructor(new Group(instructorsAgent));
        }

        ContextActivities ctx = new ContextActivities();
        ctx.setCategory(new ArrayList<Activity>() {
            private static final long serialVersionUID = 1L;
            {
                add(new Activity("internal://wegas/log-id/" + logID));
            }
        });
        ctx.setGrouping(new ArrayList<Activity>() {
            private static final long serialVersionUID = 1L;
            {
                add(new Activity("internal://wegas/game/" + String.valueOf(game.getId())));
            }
        });
        context.setContextActivities(ctx);
        return context;
    }

    /**
     * Transform a user into an Agent
     */
    private Agent agent(User user) {
        return new Agent(null, new Account(String.valueOf(user.getId()), "https://wegas.albasim.ch"));
    }

    /**
     * Check if there is a current player, not Debug, there is a LogID and xapi is
     * configured
     */
    private Boolean isValid() {
        final Player player = manager.getPlayer();
        if (player == null || player.getTeam() instanceof DebugTeam || player.getTeam() instanceof DebugTeam
                || Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())
                || Helper.isNullOrEmpty(Helper.getWegasProperty("xapi.auth"))
                || Helper.isNullOrEmpty(Helper.getWegasProperty("xapi.host"))) {
            return false;
        }
        return true;
    }
}