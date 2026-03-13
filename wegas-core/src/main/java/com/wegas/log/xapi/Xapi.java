/**
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013-2021 School of Management and Engineering Vaud, Comem, MEI
 * Licensed under the MIT License
 */
package com.wegas.log.xapi;

import com.wegas.core.Helper;
import com.wegas.core.XlsxSpreadsheet;
import com.wegas.core.ejb.RequestManager;
import com.wegas.core.ejb.VariableDescriptorFacade;
import com.wegas.core.persistence.game.DebugGame;
import com.wegas.core.persistence.game.DebugTeam;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.VariableDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
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
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import jakarta.ejb.Asynchronous;
import jakarta.ejb.LocalBean;
import jakarta.ejb.Stateless;
import jakarta.inject.Inject;
import jakarta.xml.bind.DatatypeConverter;
import org.apache.poi.ss.usermodel.CellStyle;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Stateless
@LocalBean
public class Xapi implements XapiI {

    private static final Logger logger = LoggerFactory.getLogger(Xapi.class);

    public static final String LOG_ID_PREFIX = "internal://wegas/log-id/";

    @Inject
    private RequestManager requestManager;

    @Inject
    private UserFacade userFacade;

    @Inject
    private VariableDescriptorFacade variableDescriptorFacade;

    @Inject
    private XapiTx xapiTx;

    public static final class Verbs {

        public static final String AUTHORED = "http://activitystrea.ms/schema/1.0/author";
        public static final String ANSWERED = "http://adlnet.gov/expapi/verbs/answered";

    }

    private LearningLockerClient getLearningLockerClient() {
        return new LearningLockerClient(Helper.getWegasProperty("xapi.ll.host"),
            "Basic " + Helper.getWegasProperty("xapi.auth"),
            Helper.getWegasProperty("xapi.agent.homepage", requestManager.getBaseUrl()));
    }

    @Override
    public Statement userStatement(final String verb, final IStatementObject object) {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Statement();
    }

    @Override
    public IStatementObject activity(String id) {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Activity();
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
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Activity();
    }

    @Override
    public Result result(String response) {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
        return new Result();
    }

    @Override
    public Result result() {
        logger.debug("Quietly, returns an empty object as xapi is deprecated");
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
        logger.debug("Quietly, do nothing as xapi is deprecated");
    }

    @Override
    public void post(List<Statement> stmts) {
        logger.debug("Quietly, do nothing as xapi is deprecated");
    }

    public Statement build(String verb, String activity) {
        return build(verb, activity, null);
    }

    @Override
    public void post(String verb, String activity) {
        logger.debug("Quietly, do nothing as xapi is deprecated");
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
        logger.debug("Quietly, do nothing as xapi is deprecated");
    }

    private Context genContext() {
        final Team team = requestManager.getCurrentTeam();
        final Game game = team.getGame();
        final String logID = game.getGameModel().getProperties().getLogID();

        final Context context = new Context();
        final List<User> instructorsUser = userFacade.findEditors("g" + game.getId());
        if (!instructorsUser.isEmpty()) {
            final ArrayList<Agent> instructorsAgent = new ArrayList<>();
            for (User u : instructorsUser) {
                instructorsAgent.add(this.agent(u));
            }
            context.setInstructor(new Group(instructorsAgent));
        }

        ContextActivities ctxActivities = new ContextActivities();

        ctxActivities.setCategory(new ArrayList<Activity>(List.of(
            new Activity(LOG_ID_PREFIX + logID)
        )));

        ctxActivities.setGrouping(new ArrayList<Activity>(List.of(
            new Activity("internal://wegas/team/" + team.getId()),
            new Activity("internal://wegas/game/" + game.getId())
        )));

        context.setContextActivities(ctxActivities);
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
     * Check if there is a current player, not Debug, there is a LogID and xapi is configured
     */
    private Boolean isValid() {
        final Team team = requestManager.getCurrentTeam();

        boolean logDebug = Helper.getWegasProperty("xapi.log_debug_player", "false").equals("true");

        if (team == null) {
            logger.debug("No player");
            return false;
        } else if (!logDebug && (team instanceof DebugTeam || team.getGame() instanceof DebugGame)) {
            logger.debug("Do not log statements for debug players");
            return false;
        } else if (Helper.isNullOrEmpty(team.getGame().getGameModel().getProperties().getLogID())) {
            logger.debug("No Log ID defined");
            return false;
        } else if (Helper.isNullOrEmpty(this.getAgentHomePage())) {
            logger.debug("No Agent homepage");
            return false;
        } else if (Helper.isNullOrEmpty(Helper.getWegasProperty("xapi.auth"))
            || Helper.isNullOrEmpty(Helper.getWegasProperty("xapi.host"))) {
            logger.debug("XAPI host/auth are not defined");
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
                if (item instanceof StringDescriptor) {
                    statements.add(
                        this.buildAuthorStringInstance((StringInstance) variableDescriptorFacade.getInstance(item, player)));
                } else if (item instanceof TextDescriptor) {
                    statements.add(
                        this.buildAuthorTextInstance((TextInstance) variableDescriptorFacade.getInstance(item, player)));
                } else if (item instanceof BooleanDescriptor) {
                    statements.add(
                        this.buildAuthorBooleanInstance((BooleanInstance) variableDescriptorFacade.getInstance(item, player)));
                }
                /*else if (item instanceof NumberDescriptor) {
                    // skip numbers as they as posted on their own
                }*/
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

    @Deprecated
    public List<Long> getAllGameIdByLogId(String logId) {
        try {
            return getLearningLockerClient().getAllGamesByLogId(logId);
        } catch (IOException ex) {
            return new ArrayList<>();
        }
    }

    /**
     * Find all logId from XAPI statements.
     *
     * @return list of all distinct logID
     */
    @Deprecated
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

    public XlsxSpreadsheet exportXLSX(String logId, List<Long> gameIds, String activityPattern) throws IOException {
        return mapStatementsToXlsx(getLearningLockerClient().getStatements(logId, gameIds, activityPattern));
    }

    public XlsxSpreadsheet exportXLSXyTeam(String logId, List<Long> teamIds, String activityPattern) throws IOException {
        return mapStatementsToXlsx(getLearningLockerClient().getStatementsByTeams(logId, teamIds, activityPattern));
    }

    private String digest(Map<String, String> registry, String salt, String value) {
        if (!Helper.isNullOrEmpty(value)) {
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
        } else {
            return "";
        }
    }

    private void digestIds(Map<String, String> registry, List<ProjectedStatement> statements) {
        String salt = Helper.getWegasProperty("xapi.salt");
        if (Helper.isNullOrEmpty(salt)) {
            salt = Helper.genToken(48);
        }
        // hash userId
        for (ProjectedStatement stmt : statements) {
            stmt.setActor(digest(registry, salt, stmt.getActor()));
            stmt.setTeam(digest(registry, salt, stmt.getTeam()));
            stmt.setGame(digest(registry, salt, stmt.getGame()));
        }
    }

    public StringBuilder mapStatementsToCSV(List<ProjectedStatement> statements, String fieldSeparator) throws IOException {

        Map<String, String> registry = new HashMap<>();

        digestIds(registry, statements);

        String sep = ",";
        StringBuilder csv = new StringBuilder();
        ProjectedStatement.writeCSVHeaders(csv, sep);
        for (ProjectedStatement s : statements) {
            s.writeCSVRecord(csv, sep);
        }

        return csv;
    }

    public XlsxSpreadsheet mapStatementsToXlsx(List<ProjectedStatement> statements) throws IOException {

        Map<String, String> registry = new HashMap<>();

        digestIds(registry, statements);

        XlsxSpreadsheet xlsx = new XlsxSpreadsheet();
        xlsx.addSheet("logs");
        CellStyle headerStyle = xlsx.createSmallerHeaderStyle();

        ProjectedStatement.writeXSLXHeaders(xlsx, headerStyle);
        for (ProjectedStatement s : statements) {
            s.writeXLSXRecord(xlsx, null);
        }

        xlsx.autoWidth();
        return xlsx;
    }

    public List<Map<String, Object>> getActivityCount(List<Long> gameIds) throws IOException {
        return getLearningLockerClient().getActivityCount(gameIds);
    }

    @Asynchronous
    public void asyncPost(List<Object> statements) {
        // quietly do nothing
    }
}
