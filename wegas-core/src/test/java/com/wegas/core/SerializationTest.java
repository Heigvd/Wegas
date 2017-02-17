/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2013 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */
package com.wegas.core;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wegas.core.event.client.CustomEvent;
import com.wegas.core.event.client.EntityUpdatedEvent;
import com.wegas.core.event.client.ExceptionEvent;
import com.wegas.core.event.client.WarningEvent;
import com.wegas.core.exception.client.WegasErrorMessage;
import com.wegas.core.exception.client.WegasOutOfBoundException;
import com.wegas.core.exception.client.WegasRuntimeException;
import com.wegas.core.exception.client.WegasScriptException;
import com.wegas.core.persistence.AbstractEntity;
import com.wegas.core.persistence.game.Game;
import com.wegas.core.persistence.game.GameModel;
import com.wegas.core.persistence.game.Player;
import com.wegas.core.persistence.game.Team;
import com.wegas.core.persistence.variable.ListDescriptor;
import com.wegas.core.persistence.variable.ListInstance;
import com.wegas.core.persistence.variable.primitive.BooleanDescriptor;
import com.wegas.core.persistence.variable.primitive.BooleanInstance;
import com.wegas.core.persistence.variable.primitive.NumberDescriptor;
import com.wegas.core.persistence.variable.primitive.NumberInstance;
import com.wegas.core.persistence.variable.primitive.ObjectDescriptor;
import com.wegas.core.persistence.variable.primitive.ObjectInstance;
import com.wegas.core.persistence.variable.primitive.StringDescriptor;
import com.wegas.core.persistence.variable.primitive.StringInstance;
import com.wegas.core.persistence.variable.primitive.TextDescriptor;
import com.wegas.core.persistence.variable.primitive.TextInstance;
import com.wegas.core.persistence.variable.statemachine.Coordinate;
import com.wegas.core.persistence.variable.statemachine.State;
import com.wegas.core.persistence.variable.statemachine.StateMachineDescriptor;
import com.wegas.core.persistence.variable.statemachine.StateMachineInstance;
import com.wegas.core.persistence.variable.statemachine.Transition;
import com.wegas.core.rest.util.JacksonMapperProvider;
import com.wegas.core.rest.util.ManagedResponse;
import com.wegas.core.rest.util.Views;
import com.wegas.core.security.facebook.FacebookAccount;
import com.wegas.core.security.guest.GuestJpaAccount;
import com.wegas.core.security.jparealm.GameAccount;
import com.wegas.core.security.jparealm.JpaAccount;
import com.wegas.core.security.persistence.Permission;
import com.wegas.core.security.persistence.User;
import com.wegas.mcq.persistence.ChoiceDescriptor;
import com.wegas.mcq.persistence.ChoiceInstance;
import com.wegas.mcq.persistence.QuestionDescriptor;
import com.wegas.mcq.persistence.QuestionInstance;
import com.wegas.mcq.persistence.Reply;
import com.wegas.mcq.persistence.Result;
import com.wegas.mcq.persistence.SingleResultChoiceDescriptor;
import com.wegas.messaging.persistence.InboxDescriptor;
import com.wegas.messaging.persistence.InboxInstance;
import com.wegas.messaging.persistence.Message;
import com.wegas.resourceManagement.persistence.Activity;
import com.wegas.resourceManagement.persistence.Assignment;
import com.wegas.resourceManagement.persistence.Occupation;
import com.wegas.resourceManagement.persistence.ResourceDescriptor;
import com.wegas.resourceManagement.persistence.ResourceInstance;
import com.wegas.resourceManagement.persistence.TaskDescriptor;
import com.wegas.resourceManagement.persistence.TaskInstance;
import com.wegas.resourceManagement.persistence.WRequirement;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import org.junit.After;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author Maxence Laurent (maxence.laurent at gmail.com)
 */
public class SerializationTest {

    ObjectMapper mapper;

    public SerializationTest() {
    }

    @Before
    public void setUp() {
        mapper = JacksonMapperProvider.getMapper();
    }

    @After
    public void tearDown() {
    }

    public void assertPropertyEquals(String json, String property, String expected) {
        String pattern = "\"" + property + "\":\"" + expected + "\"";
        assertTrue("Expected " + expected + ", found " + json, json.contains(pattern));
    }

    @Test
    public void testFSMSerialization() throws JsonProcessingException {
        StateMachineDescriptor smD = new StateMachineDescriptor();
        StateMachineInstance smI = new StateMachineInstance();
        smD.setDefaultInstance(smI);
        smI.setDefaultDescriptor(smD);

        State s1 = new State();
        Coordinate coord1 = new Coordinate();
        coord1.setX(100);
        coord1.setY(100);
        s1.setEditorPosition(coord1);
        s1.setLabel("label");
        smD.addState(1L, s1);

        State s2 = new State();
        Coordinate coord2 = new Coordinate();
        coord2.setX(500);
        coord2.setY(500);
        s2.setEditorPosition(coord2);
        smD.addState(2L, s2);

        Transition trans1 = new Transition();
        trans1.setNextStateId(2L);
        s1.addTransition(trans1);

        assertPropertyEquals(mapper.writeValueAsString(smD), "@class", "FSMDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(smI), "@class", "FSMInstance");

        assertPropertyEquals(mapper.writeValueAsString(s1), "@class", "State");
        assertPropertyEquals(mapper.writeValueAsString(coord1), "@class", "Coordinate");

        assertPropertyEquals(mapper.writeValueAsString(s2), "@class", "State");
        assertPropertyEquals(mapper.writeValueAsString(coord2), "@class", "Coordinate");

        assertPropertyEquals(mapper.writeValueAsString(trans1), "@class", "Transition");
    }

    @Test
    public void testVariableSerialization() throws JsonProcessingException {
        ListDescriptor listD = new ListDescriptor("LIST");
        ListInstance listI = new ListInstance();
        listD.setDefaultInstance(listI);
        listI.setDefaultDescriptor(listD);

        BooleanDescriptor blnD = new BooleanDescriptor("BlnD");
        BooleanInstance blnI = new BooleanInstance(true);
        blnD.setDefaultInstance(blnI);
        blnI.setDefaultDescriptor(blnD);
        listD.addItem(blnD);

        NumberDescriptor numD = new NumberDescriptor("numD");
        NumberInstance numI = new NumberInstance(12.3);
        numD.setDefaultInstance(numI);
        numI.setDefaultDescriptor(numD);
        listD.addItem(numD);

        ObjectDescriptor objD = new ObjectDescriptor();
        ObjectInstance objI = new ObjectInstance();
        objD.setDefaultInstance(objI);
        objI.setDefaultDescriptor(objD);
        objI.getProperties().put("Key", "Value");

        StringDescriptor stringD = new StringDescriptor();
        StringInstance stringI = new StringInstance();
        stringD.setDefaultInstance(stringI);
        stringI.setDefaultDescriptor(stringD);

        TextDescriptor textD = new TextDescriptor();
        TextInstance textI = new TextInstance();
        textD.setDefaultInstance(textI);
        textI.setDefaultDescriptor(textD);

        assertPropertyEquals(mapper.writeValueAsString(listD), "@class", "ListDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(listI), "@class", "ListInstance");

        assertPropertyEquals(mapper.writeValueAsString(blnD), "@class", "BooleanDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(blnI), "@class", "BooleanInstance");

        assertPropertyEquals(mapper.writeValueAsString(numD), "@class", "NumberDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(numI), "@class", "NumberInstance");

        assertPropertyEquals(mapper.writeValueAsString(objD), "@class", "ObjectDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(objI), "@class", "ObjectInstance");

        assertPropertyEquals(mapper.writeValueAsString(stringD), "@class", "StringDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(stringI), "@class", "StringInstance");

        assertPropertyEquals(mapper.writeValueAsString(textD), "@class", "TextDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(textI), "@class", "TextInstance");

    }

    @Test
    public void testGameSerialization() throws JsonProcessingException {
        GameModel gameModel = new GameModel("DasGameModel");
        gameModel.setId(999L);
        Game game = new Game("GameName", "Das-Token");
        gameModel.addGame(game);
        Team team1 = new Team("DasTeam");
        team1.setGame(game);
        game.addTeam(team1);

        FacebookAccount fbAccount = new FacebookAccount();
        GuestJpaAccount guAccount = new GuestJpaAccount();
        GameAccount gaAccount = new GameAccount(game);
        JpaAccount jpaAccount = new JpaAccount();

        User fbUser = new User(fbAccount);
        User guUser = new User(guAccount);
        User gaUser = new User(gaAccount);
        User jpaUser = new User(jpaAccount);

        Player fbPlayer = new Player("Facebook Player");
        Player guPlayer = new Player("Guest Player");
        Player gaPlayer = new Player("Game Player");
        Player jpaPlayer = new Player("JPA Player");

        team1.addPlayer(fbPlayer);
        team1.addPlayer(guPlayer);
        team1.addPlayer(gaPlayer);
        team1.addPlayer(jpaPlayer);

        fbUser.getPlayers().add(fbPlayer);
        gaUser.getPlayers().add(gaPlayer);
        guUser.getPlayers().add(guPlayer);
        jpaUser.getPlayers().add(jpaPlayer);

        Permission permission = new Permission();
        permission.setUser(jpaUser);
        jpaUser.addPermission(permission);

        assertPropertyEquals(mapper.writerWithView(Views.Public.class).writeValueAsString(game),
                "@class", "Game");
        assertPropertyEquals(mapper.writeValueAsString(team1), "@class", "Team");

        assertPropertyEquals(mapper.writeValueAsString(fbAccount), "@class", "FacebookAccount");
        assertPropertyEquals(mapper.writeValueAsString(gaAccount), "@class", "GameAccount");
        assertPropertyEquals(mapper.writeValueAsString(guAccount), "@class", "GuestJpaAccount");
        assertPropertyEquals(mapper.writeValueAsString(jpaAccount), "@class", "JpaAccount");

        assertPropertyEquals(mapper.writeValueAsString(jpaUser), "@class", "User");
        assertPropertyEquals(mapper.writeValueAsString(jpaPlayer), "@class", "Player");
        assertPropertyEquals(mapper.writeValueAsString(permission), "@class", "Permission");
    }

    @Test
    public void testMCQSerialization() throws JsonProcessingException {
        QuestionDescriptor questionD = new QuestionDescriptor();
        QuestionInstance questionI = new QuestionInstance();
        questionD.setDefaultInstance(questionI);
        questionI.setDefaultDescriptor(questionD);

        ChoiceDescriptor choiceD = new ChoiceDescriptor();
        ChoiceInstance choiceI = new ChoiceInstance();
        choiceD.setDefaultInstance(choiceI);
        choiceI.setDefaultDescriptor(choiceD);
        choiceD.setQuestion(questionD);
        questionD.addItem(choiceD);

        Result result11 = new Result("R1.1");
        Result result12 = new Result("R1.2");

        choiceD.addResult(result11);
        choiceD.addResult(result12);

        SingleResultChoiceDescriptor singleResult = new SingleResultChoiceDescriptor();
        ChoiceInstance singleChoiceI = new ChoiceInstance();
        singleChoiceI.setDefaultDescriptor(singleResult);
        singleResult.setDefaultInstance(singleChoiceI);
        Result result21 = new Result("R2.1");
        singleResult.addResult(result21);

        Reply reply = new Reply();
        questionI.addReply(reply);
        reply.setQuestionInstance(questionI);
        reply.setResult(result11);

        assertPropertyEquals(mapper.writeValueAsString(questionD), "@class", "QuestionDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(questionI), "@class", "QuestionInstance");

        assertPropertyEquals(mapper.writeValueAsString(questionD), "@class", "ChoiceDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(choiceI), "@class", "ChoiceInstance");

        assertPropertyEquals(mapper.writeValueAsString(result11), "@class", "Result");
        assertPropertyEquals(mapper.writeValueAsString(result12), "@class", "Result");

        assertPropertyEquals(mapper.writeValueAsString(singleResult), "@class", "SingleResultChoiceDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(singleChoiceI), "@class", "ChoiceInstance");
        assertPropertyEquals(mapper.writeValueAsString(result21), "@class", "Result");

        assertPropertyEquals(mapper.writeValueAsString(reply), "@class", "Reply");
    }

    @Test
    public void testMessagingSerialization() throws JsonProcessingException {
        InboxDescriptor inboxD = new InboxDescriptor();
        InboxInstance inboxI = new InboxInstance();
        inboxI.setDefaultDescriptor(inboxD);
        inboxD.setDefaultInstance(inboxI);
        Message msg1 = new Message("FROM", "SUBJECT", "CONTENT");
        Message msg2 = new Message("FROM", "SUBJECT", "CONTENT");
        msg1.setInboxInstance(inboxI);
        msg2.setInboxInstance(inboxI);
        inboxI.addMessage(msg1);
        inboxI.addMessage(msg2);

        assertPropertyEquals(mapper.writeValueAsString(inboxD), "@class", "InboxDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(inboxI), "@class", "InboxInstance");
        assertPropertyEquals(mapper.writeValueAsString(msg1), "@class", "Message");
        assertPropertyEquals(mapper.writeValueAsString(msg2), "@class", "Message");
    }

    @Test
    public void testResourceManagementSerialization() throws JsonProcessingException {
        /*
         *  RESOURCE MANAGEMENT  
         */
        TaskDescriptor taskD = new TaskDescriptor();
        TaskDescriptor taskD2 = new TaskDescriptor();
        taskD.setDescription("DESC");
        taskD.addPredecessor(taskD2);
        taskD.setName("taskD");
        TaskInstance taskI = new TaskInstance();
        taskI.setDefaultDescriptor(taskD);
        taskD.setDefaultInstance(taskI);
        taskI.getPlannification().add(1);
        taskI.getPlannification().add(2);

        assertPropertyEquals(mapper.writeValueAsString(taskD), "@class", "TaskDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(taskI), "@class", "TaskInstance");

        ResourceDescriptor resourceD = new ResourceDescriptor();
        resourceD.setName("resourceD");
        resourceD.setDescription("DESC");
        ResourceInstance resourceI = new ResourceInstance();
        resourceD.setDefaultInstance(resourceI);
        resourceI.setProperty("Level", "8");

        assertPropertyEquals(mapper.writeValueAsString(resourceD), "@class", "ResourceDescriptor");
        assertPropertyEquals(mapper.writeValueAsString(resourceI), "@class", "ResourceInstance");

        Activity activity = new Activity();
        taskD.addActivity(activity);

        Assignment assignment = new Assignment(taskD);
        assignment.setResourceInstance(resourceI);

        Occupation occupation = new Occupation(2.0);
        occupation.setResourceInstance(resourceI);

        WRequirement req = new WRequirement("Carpenter");
        taskI.getRequirements().add(req);

        activity.setRequirement(req);

        assertPropertyEquals(mapper.writeValueAsString(activity), "@class", "Activity");
        assertPropertyEquals(mapper.writeValueAsString(assignment), "@class", "Assignment");
        assertPropertyEquals(mapper.writeValueAsString(occupation), "@class", "Occupation");
        assertPropertyEquals(mapper.writeValueAsString(req), "@class", "WRequirement");
    }

    @Test
    public void testExceptionMapper() throws JsonProcessingException {
        NumberDescriptor nd = new NumberDescriptor("x");
        NumberInstance ns = new NumberInstance(0);

        nd.setDefaultInstance(ns);
        ns.setDefaultDescriptor(nd);

        nd.setMaxValue(10.0);
        //nd.setMinValue(0L);

        nd.getDefaultInstance().setValue(-10);

        String json = mapper.writeValueAsString(new WegasOutOfBoundException(nd.getMinValue(), nd.getMaxValue(), ns.getValue(), nd.getLabel()));
        System.out.println("WOOB: " + json);
        assertPropertyEquals(json, "@class", "WegasOutOfBoundException");

        json = mapper.writeValueAsString(WegasErrorMessage.error("This is an error"));
        assertPropertyEquals(json, "@class", "WegasErrorMessage");

        json = mapper.writeValueAsString(new WegasScriptException("var a = tagada;", 123, "script exception", null));
        assertPropertyEquals(json, "@class", "WegasScriptException");
    }

    @Test
    public void testManagedModeResponse() throws JsonProcessingException {
        String payload = "DummyPayload";
        NumberDescriptor ndPayload = new NumberDescriptor("x");
        NumberInstance niPayload = new NumberInstance(5);
        niPayload.setDefaultDescriptor(ndPayload);
        ndPayload.setDefaultInstance(niPayload);

        CustomEvent custom = new CustomEvent("Dummy CustomEvent", payload);
        WarningEvent warn = new WarningEvent("Warning Dummy Event", payload);

        List<WegasRuntimeException> exceptions = new ArrayList<>();
        exceptions.add(new WegasOutOfBoundException(0.0, 10.0, 15.0, ndPayload.getLabel()));
        exceptions.add(WegasErrorMessage.error("Error Message"));
        exceptions.add(new WegasScriptException("var a = truc;", 123, "OUPS"));

        List<AbstractEntity> instances = new ArrayList<>();
        instances.add(new NumberInstance(1));

        EntityUpdatedEvent update = new EntityUpdatedEvent(instances);

        ExceptionEvent ex = new ExceptionEvent(exceptions);

        ManagedResponse managedResponse = new ManagedResponse();
        managedResponse.getEvents().add(custom);
        managedResponse.getEvents().add(warn);
        managedResponse.getEvents().add(ex);
        managedResponse.getEvents().add(update);

        String json = mapper.writeValueAsString(managedResponse);

        System.out.println("JSON: " + json);

    }

    @Test
    public void testJpaAccount() throws JsonProcessingException, IOException {
        JpaAccount ja = new JpaAccount();
        ja.setFirstname("Alan");
        ja.setLastname("Smithee");
        ja.setEmail("alan@local");
        ja.setUsername("alan@local");

        String strJa = mapper.writeValueAsString(ja);

        mapper.readValue(strJa, JpaAccount.class);

        // 
    }

}
