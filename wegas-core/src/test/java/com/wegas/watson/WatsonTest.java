package com.wegas.watson;

import com.ibm.watson.developer_cloud.conversation.v1.ConversationService;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateExample;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateIntent;
import com.ibm.watson.developer_cloud.conversation.v1.model.CreateWorkspace;
import com.ibm.watson.developer_cloud.conversation.v1.model.MessageRequest;
import com.ibm.watson.developer_cloud.conversation.v1.model.MessageResponse;
import com.ibm.watson.developer_cloud.conversation.v1.model.WorkspaceResponse;
import org.junit.Test;

/**
 *
 * @author Pierre-Adrien Ghiringhelli
 */


public class WatsonTest {
    
    @Test
    public void test(){
        
        ConversationService service = WatsonProperties.WATSON_SERVICE;
        
        CreateWorkspace w = new CreateWorkspace.Builder().name("test_workspace")
                .description("ceci est un test de création de workpasce via l'API à l'aide du java jdk")
                .language("fr")
                .build();
        WorkspaceResponse r = service.createWorkspace(w).execute();
        
        CreateExample e = new CreateExample.Builder().text("coucou").build();
        CreateIntent i = new CreateIntent.Builder().examples(e).build();
        System.out.println(i.examples().get(0));
        
        MessageRequest newMessage = new MessageRequest.Builder().inputText("Fumes-tu?").alternateIntents(Boolean.TRUE)
        // Replace with the context obtained from the initial request
        //.context(...)
        .build();

        String workspaceId = r.getWorkspaceId();
        
        MessageResponse response = service
        .message(workspaceId, newMessage)
        .execute();
        System.out.println("reponse : ");
        System.out.println(response);
    }
}
