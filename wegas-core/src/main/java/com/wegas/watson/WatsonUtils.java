/*
 * Wegas
 * http://wegas.albasim.ch
 *
 * Copyright (c) 2015 School of Business and Engineering Vaud, Comem
 * Licensed under the MIT License
 */

package com.wegas.watson;

import com.ibm.watson.developer_cloud.conversation.v1.ConversationService;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateExample;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateIntent;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateWorkspace;
import com.ibm.watson.developer_cloud.conversation.v1.model.ExampleResponse;
import com.ibm.watson.developer_cloud.conversation.v1.model.IntentCollectionResponse;
import com.ibm.watson.developer_cloud.conversation.v1.model.IntentResponse;
import com.ibm.watson.developer_cloud.conversation.v1.model.WorkspaceResponse;
import com.wegas.core.Helper;
import com.wegas.core.persistence.game.GameModel;
import java.util.List;

/**
 * This class contains the methods used to access Watson Conversation services. It uses
 * the REST interface of watson to create, update or delete Workspaces, intents, examples
 * and more.
 * 
 * @author Pierre-Adrien Ghiringhelli
 */

public class WatsonUtils {
    
    public static final String WATSON_VERSION = Helper.getWegasProperty("watson.version", "");
    
    private static final String WATSON_USERNAME = Helper.getWegasProperty("watson.username", "");
    
    private static final String WATSON_PASSWORD = Helper.getWegasProperty("watson.password", "");
    
    public static final ConversationService WATSON_SERVICE;
    
    static{
        WATSON_SERVICE = new ConversationService(WATSON_VERSION);
        WATSON_SERVICE.setUsernameAndPassword(WATSON_USERNAME, WATSON_PASSWORD);
    }
    
    /**
     *
     * @return the Id of the created workpsace
     */
    public static String createWorkspace(String name){
        CreateWorkspace w = new CreateWorkspace.Builder().language("fr").build();
        WorkspaceResponse r = WATSON_SERVICE.createWorkspace(w).execute();
        return r.getWorkspaceId();
    }
    
    public static void deleteWorkspace(String workspaceId){
        WATSON_SERVICE.deleteWorkspace(workspaceId).execute();
    }
    
    /**
     *
     * @param gameModel
     * @return the intents of the workspace
     */
    public static IntentCollectionResponse getIntents(GameModel gameModel){
        String workspaceId = gameModel.getProperties().getWatsonWorkspaceId();
        IntentCollectionResponse intents = WatsonUtils.WATSON_SERVICE.listIntents(workspaceId, true, null, true, null, null).execute();
        return intents;
    }
    /**
     *
     * @param gameModel
     * @param name
     * @param description
     * @param examples
     * @return the name of the created intent
     */
    public static String createIntent(GameModel gameModel, String name, String description){
        if(Helper.isNullOrEmpty(gameModel.getProperties().getWatsonWorkspaceId())){
            gameModel.getProperties().setWatsonWorkspaceId(createWorkspace(gameModel.getName()));
        }
        IntentResponse r = WATSON_SERVICE.createIntent(gameModel.getProperties().getWatsonWorkspaceId(), name, description, null).execute();
        return r.getIntent();
    }
    
    /**
     *
     * @param gameModel
     * @param name
     * @param newName
     * @param description
     * @param examples
     * @return the the name of the updated intent
     */
    public static String updateIntent(GameModel gameModel, String name, String newName, String description){
        IntentResponse r = WATSON_SERVICE.updateIntent(gameModel.getProperties().getWatsonWorkspaceId(), name, newName, description, null).execute();
        return r.getIntent();
    }
    
    /**
     *
     * @param gameModel
     * @param name
     */
    public static void deleteIntent(GameModel gameModel, String name){
        WATSON_SERVICE.deleteIntent(gameModel.getProperties().getWatsonWorkspaceId(), name).execute();
    }
    
    /**
     *
     * @param gameModel
     * @param intent
     * @param text
     * @return the text of the created example
     */
    public static String createExample(GameModel gameModel, String intent, String text){
        ExampleResponse r = WATSON_SERVICE.createExample(gameModel.getProperties().getWatsonWorkspaceId(), intent, text).execute();
        return r.getText();
    }
    
    /**
     *
     * @param gameModel
     * @param intent
     * @param text
     * @param newText
     * @return the text of the updated example
     */
    public static String updateExample(GameModel gameModel, String intent, String text, String newText){
        ExampleResponse r = WATSON_SERVICE.updateExample(gameModel.getProperties().getWatsonWorkspaceId(), intent, text, newText).execute();
        return r.getText();
    }
    
    /**
     *
     * @param gameModel
     * @param intent
     * @param text
     */
    public static void deleteExample(GameModel gameModel, String intent, String text){
        WATSON_SERVICE.deleteExample(gameModel.getProperties().getWatsonWorkspaceId(), intent, text).execute();
    }
}
