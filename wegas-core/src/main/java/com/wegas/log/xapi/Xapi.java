package com.wegas.log.xapi;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import javax.ejb.LocalBean;
import javax.ejb.Stateless;
import javax.inject.Inject;
import com.wegas.core.ejb.RequestManager;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import gov.adlnet.xapi.model.*;

@Stateless
@LocalBean
public class Xapi implements XapiI {

    private static final Logger logger = LoggerFactory.getLogger(Xapi.class);

    @Inject
    private RequestManager manager;

    @Override
    public Statement userStatement(final String verb, final IStatementObject object) {
        final Long userId = manager.getCurrentUser().getId();
        final Agent agent = new Agent(null, new Account(String.valueOf(userId), "https://wegas.albasim.ch"));
        final Verb v = new Verb(verb);
        final Statement stmt = new Statement(agent, v, object);
        // @TODO: fill context
        final Context context = new Context();
        stmt.setContext(context);
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
        logger.info("[post]{}", this.serialize(stmt));
    }
}