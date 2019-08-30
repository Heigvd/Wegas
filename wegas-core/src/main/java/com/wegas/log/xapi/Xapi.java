package com.wegas.log.xapi;

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
import com.wegas.core.persistence.game.Team;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import com.wegas.log.xapi.jta.XapiTx;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.ejb.QuestionDescriptorFacade.ReplyValidate;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import gov.adlnet.xapi.model.*;
import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Stateless
@LocalBean
public class Xapi implements XapiI {

    private static final Logger logger = LoggerFactory.getLogger(Xapi.class);

    public static final String LOG_ID_PREFIX = "internal://wegas/log-id/";

    @Inject
    private RequestManager manager;

    @Inject
    private UserFacade userFacade;

    @Inject
    private XapiTx xapiTx;

    private LearningLockerClient getLearningLockerClient() {
        return new LearningLockerClient(Helper.getWegasProperty("xapi.ll.host"),
                "Basic " + Helper.getWegasProperty("xapi.auth"),
                manager.getBaseUrl());
    }

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

    private HashMap<String, String> convertToHashMap(Map<String, String> map) {
        HashMap<String, String> hashMap = new HashMap<>();
        hashMap.putAll(map);
        return hashMap;
    }

    @Override
    public IStatementObject activity(String id, String activityType,
            Map<String, String> name,
            Map<String, String> definition) {
        Activity activity = new Activity(id);
        ActivityDefinition def = new ActivityDefinition();
        def.setType(activityType);
        def.setName(convertToHashMap(name));
        def.setDescription(convertToHashMap(definition));
        activity.setDefinition(def);
        return activity;
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
        if (isValid()) {
            stmt.setContext(this.genContext());
            xapiTx.post(stmt);
        } else {
            logger.warn("Failed to persist an xapi statement, invalid context\n{}", serialize(stmt));
        }
    }

    @Override
    public void post(List<Statement> stmts) {
        if (isValid()) {
            Context ctx = this.genContext();
            stmts.forEach(stmt -> stmt.setContext(ctx));

            xapiTx.post(new ArrayList<>(stmts));
        } else {
            for (Statement s : stmts) {
                logger.warn("Failed to persist an xapi statement, invalid context\n{}", serialize(s));
            }
        }
    }

    private Context genContext() {
        final String logID = manager.getPlayer().getGameModel().getProperties().getLogID();
        final Team team = manager.getPlayer().getTeam();
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
                add(new Activity(LOG_ID_PREFIX + logID));
            }
        });
        ctx.setGrouping(new ArrayList<Activity>() {
            private static final long serialVersionUID = 1L;

            {
                add(new Activity("internal://wegas/team/" + String.valueOf(team.getId())));
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
        return new Agent(null, new Account(String.valueOf(user.getId()), manager.getBaseUrl()));
    }

    /**
     * Check if there is a current player, not Debug, there is a LogID and xapi is
     * configured
     */
    private Boolean isValid() {
        final Player player = manager.getPlayer();

        boolean logDebug = Helper.getWegasProperty("xapi.log_debug_player", "false").equals("true");

        if (player == null) {
            logger.warn("No player");
            return false;
        } else if (!logDebug && (player.getTeam() instanceof DebugTeam || player.getTeam() instanceof DebugTeam)) {
            logger.warn("Do not log statements for debug players");
            return false;
        } else if (Helper.isNullOrEmpty(player.getGameModel().getProperties().getLogID())) {
            logger.warn("No Log ID defined");
            return false;
        } else if (Helper.isNullOrEmpty(Helper.getWegasProperty("xapi.auth"))
                || Helper.isNullOrEmpty(Helper.getWegasProperty("xapi.host"))) {
            logger.warn("XAPI host/auth are not defined");
            return false;
        }
        return true;
    }

    public Statement buildQuestionStatement(String questionName, String choiceName, String resultName) {
        IStatementObject activity = activity("act:wegas/question/"
                + questionName + "/choice/" + choiceName);

        Statement stmt = userStatement("http://adlnet.gov/expapi/verbs/answered", activity);
        stmt.setResult(result(resultName));

        return stmt;
    }

    public void replyValidate(ReplyValidate reply) {
        Statement stmt = buildQuestionStatement(reply.question.getDescriptor().getName(),
                reply.choice.getDescriptor().getName(),
                reply.reply.getResultName());

        post(stmt);
    }

    public void whValidate(QuestionDescriptorFacade.WhValidate whVal) {
    }

    public List<Long> getAllGameIdByLogId(String logId) {
        try {
            return getLearningLockerClient().getAllGamesByLogId(logId);
        } catch (IOException ex) {
            return new ArrayList<>();
        }
    }

    public List<String> getAllLogId() {

        try {
            return getLearningLockerClient().getAllLogIds();
        } catch (IOException ex) {
            return new ArrayList<>();
        }
    }

    public String getQuestionActivityId(String questionName, String choiceName) {
        return "act:wegas/question/" + questionName + "/choice/" + choiceName;
    }

    public List<Map<String, String>> getQuestionReplies(String logId, String questionName, List<Long> gameIds) throws IOException {
        LearningLockerClient client = getLearningLockerClient();
        return client.getQuestionReplies(logId, gameIds, questionName);
    }
}
