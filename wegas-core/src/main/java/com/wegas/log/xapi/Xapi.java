/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2019 School of Business and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;

import com.wegas.core.Helper;
import com.wegas.core.ejb.GameFacade;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.TeamFacade;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.security.ejb.UserFacade;
import com.wegas.core.security.persistence.User;
import com.wegas.log.xapi.jta.XapiTx;
import com.wegas.log.xapi.model.ProjectedStatement;
import com.wegas.mcq.ejb.QuestionDescriptorFacade;
import com.wegas.mcq.ejb.QuestionDescriptorFacade.ReplyValidate;
import com.wegas.mcq.persistence.wh.WhQuestionDescriptor;
import gov.adlnet.xapi.client.StatementClient;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import gov.adlnet.xapi.model.*;
import gov.adlnet.xapi.util.Base64;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import javax.ejb.Asynchronous;
import javax.xml.bind.DatatypeConverter;

@Stateless
@LocalBean
public class Xapi implements XapiI {

    private static final Logger logger = LoggerFactory.getLogger(Xapi.class);

    public static final String LOG_ID_PREFIX = "internal://wegas/log-id/";

    public static final class Verbs {

        public static final String AUTHORED = "http://activitystrea.ms/schema/1.0/author";
        public static final String ANSWERED = "http://adlnet.gov/expapi/verbs/answered";

    }

    @Inject
    private RequestManager manager;

    @Inject
    private TeamFacade teamFacade;

    @Inject
    private GameFacade gameFacade;

    @Inject
    private UserFacade userFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

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
            logger.info("Failed to persist an xapi statement, invalid context\n{}", serialize(stmt));
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
                logger.info("Failed to persist an xapi statement, invalid context\n{}", serialize(s));
            }
        }
    }

    public Statement build(String verb, String activity) {
        return build(verb, activity, null);
    }

    @Override
    public void post(String verb, String activity) {
        this.post(verb, activity, null);
    }

    public Statement build(String verb, String activity, String result) {
        Statement statement = userStatement(verb, activity(activity));
        if (!Helper.isNullOrEmpty(result)) {
            statement.setResult(result(result));
        }
        return statement;
    }

    @Override
    public void post(String verb, String activity, String result) {
        if (isValid()) {
            post(this.build(verb, activity, result));
        } else {
            logger.warn("Failed to persist an xapi statement, invalid context\n{}", verb, activity, result);
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

    private String getAgentHomePage() {
        return Helper.getWegasProperty("xapi.agent.homepage", "");
    }

    /**
     * Transform a user into an Agent
     */
    private Agent agent(User user) {
        return new Agent(null, new Account(String.valueOf(user.getId()),
                this.getAgentHomePage()));
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
        } else if (Helper.isNullOrEmpty(this.getAgentHomePage())) {
            logger.warn("No Agent homepage");
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

        Statement stmt = userStatement(Verbs.ANSWERED, activity);
        stmt.setResult(result(resultName));

        return stmt;
    }

    public void replyValidate(ReplyValidate reply) {
        if (isValid()) {
            Statement stmt = buildQuestionStatement(reply.question.getDescriptor().getName(),
                    reply.choice.getDescriptor().getName(),
                    reply.reply.getResultName());

            post(stmt);
        }
    }

    public void whValidate(QuestionDescriptorFacade.WhValidate whVal, Player player) {
        if (isValid()) {
            WhQuestionDescriptor whDesc = whVal.whDescriptor;

            List<Statement> statements = new ArrayList<>();

            for (VariableDescriptor item : whDesc.getItems()) {
                if (item instanceof NumberDescriptor) {
                    // skip numbers
                } else if (item instanceof StringDescriptor) {
                    statements.add(
                            this.buildAuthorStringInstance((StringInstance) variableDescriptorFacade.getInstance(item, player)));
                } else if (item instanceof TextDescriptor) {
                    statements.add(
                            this.buildAuthorTextInstance((TextInstance) variableDescriptorFacade.getInstance(item, player)));
                } else if (item instanceof BooleanDescriptor) {
                    statements.add(
                            this.buildAuthorBooleanInstance((BooleanInstance) variableDescriptorFacade.getInstance(item, player)));
                }
            }
            statements.add(this.build(Verbs.ANSWERED, "act:wegas/whQuestion/" + whDesc.getName()));
            this.post(statements);
        }
    }

    public Statement buildAuthorBooleanInstance(BooleanInstance n) {
        String activity = "act:wegas/text/" + n.getDescriptor().getName() + "/instance";
        return this.build(Xapi.Verbs.AUTHORED, activity, n.getValue() ? "true" : "false");
    }

    public Statement buildAuthorTextInstance(TextInstance n) {
        String activity = "act:wegas/boolean/" + n.getDescriptor().getName() + "/instance";
        return this.build(Xapi.Verbs.AUTHORED, activity, n.getValue());
    }

    public Statement buildAuthorStringInstance(StringInstance n) {
        String activity = "act:wegas/string/" + n.getDescriptor().getName() + "/instance";
        return this.build(Xapi.Verbs.AUTHORED, activity, n.getValue());
    }

    public Statement buildAuthorNumberInstance(NumberInstance n) {
        String activity = "act:wegas/number/" + n.getDescriptor().getName() + "/instance";
        return this.build(Xapi.Verbs.AUTHORED, activity, Double.toString(n.getValue()));
    }

    public void postAuthorNumberInstance(NumberInstance n) {
        this.post(this.buildAuthorNumberInstance(n));
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

    public StringBuilder exportCSV(String logId, List<Long> gameIds, String fieldSeparator, String activityPattern) throws IOException {
        return mapStatementsToCSV(getLearningLockerClient().getStatements(logId, gameIds, activityPattern), fieldSeparator);
    }

    public StringBuilder exportCSVByTeam(String logId, List<Long> teamIds, String fieldSeparator, String activityPattern) throws IOException {
        return mapStatementsToCSV(getLearningLockerClient().getStatementsByTeams(logId, teamIds, activityPattern), fieldSeparator);
    }

    private String digest(Map<String, String> registry, String salt, String value) {
        try {
            MessageDigest md = MessageDigest.getInstance("MD5");
            md.update(salt.getBytes(StandardCharsets.UTF_8));

            if (!registry.containsKey(value)) {
                String digest = DatatypeConverter.printHexBinary(md.digest(value.getBytes(StandardCharsets.UTF_8)));
                String shortDigest;

                int start = 0;
                do {
                    shortDigest = digest.substring(start, start + 7);
                    start++;
                } while (registry.containsValue(shortDigest));

                registry.put(value, shortDigest);
            }

            return registry.get(value);
        } catch (NoSuchAlgorithmException ex) {
            return value;
        }
    }

    public StringBuilder mapStatementsToCSV(List<ProjectedStatement> statements, String fieldSeparator) throws IOException {

        Map<String, String> registry = new HashMap<>();

        // hash userId
        for (ProjectedStatement stmt : statements) {
            try {
                User user = userFacade.find(Long.parseLong(stmt.getActor()));
                Team team = teamFacade.find(Long.parseLong(stmt.getTeam()));
                Game game = gameFacade.find(Long.parseLong(stmt.getGame()));

                if (user != null) {
                    stmt.setActor(digest(registry, user.getMainAccount().getSalt(), stmt.getActor()));
                }

                if (team != null) {
                    stmt.setTeam(digest(registry, team.getRefId(), stmt.getTeam()));
                }

                if (game != null) {
                    stmt.setGame(digest(registry, game.getRefId(), stmt.getGame()));
                }

            } catch (NumberFormatException ex) {
            }
        }

        String sep = ",";
        StringBuilder csv = new StringBuilder();
        ProjectedStatement.writeCSVHeaders(csv, sep);
        for (ProjectedStatement s : statements) {
            s.writeCSVRecord(csv, sep);
        }

        return csv;
    }

    public List<Map<String, Object>> getActivityCount(List<Long> gameIds) throws IOException {
        return getLearningLockerClient().getActivityCount(gameIds);
    }

    public StatementClient getClient() throws MalformedURLException {

        String host = Helper.getWegasProperty("xapi.host");
        String token = Helper.getWegasProperty("xapi.auth");

        /**
         * Bug in client when using token +filterWith...
         */
        byte[] bytes = Base64.decode(token, Base64.DEFAULT);
        String decoded = new String(bytes, StandardCharsets.US_ASCII);

        String user;
        String password;

        int indexOf = decoded.indexOf(":");

        if (indexOf <= 0) {
            throw new MalformedURLException("Authorization token is invalid");
        } else {
            user = decoded.substring(0, indexOf);
            password = decoded.substring(indexOf + 1);
        }

        return new StatementClient(host, user, password);
    }

    @Asynchronous
    public void asyncPost(List<Object> statements) {
        logger.trace("XAPI Tx Commit");
        try {
            StatementClient client = getClient();

            for (Object o : statements) {
                long start = System.currentTimeMillis();
                if (o instanceof Statement) {
                    try {
                        client.postStatement((Statement) o);

                    } catch (IOException ex) {
                        logger.error("XapiTx postStatement on commit error: {}", ex);
                    }
                } else if (o instanceof ArrayList) {
                    ArrayList<Statement> list = (ArrayList<Statement>) o;
                    try {
                        client.postStatements(list);
                    } catch (IOException ex) {
                        logger.error("XapiTx postStatements on commit error: {}", ex);
                    }
                }
                logger.trace("xAPI post duration: {}", System.currentTimeMillis() - start);
            }
            statements.clear();
        } catch (MalformedURLException ex) {
        }
    }

}
