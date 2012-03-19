Wegas
=======================
Web Game Authoring system is a jee-based framework for multiplayer web-games developement.

School of Business and Engineering Vaud, http://www.heig-vd.ch/
Media Engineering, Information Technology Managment, Comem
Copyright (C) 2011

Authors
*   Francois-Xavier Aeberhard fx@red-agent.com
*   Cyril Junod cyril.junod@gmail.com


Set up server
------------------------
*   PostgreSQL Server
    By default, Wegas will look for wegas_dev and wegas_test databases, using the username "user" and password "123"
*   Glassfish Server
    - Install glassfish v>3.1.1
    - Enable comet support:
      can be done in netbeans right click on server >> properties >> check enable comet
    - Enable websocket support:
      asadmin set configs.config.server-config.network-config.protocols.protocol.http-listener-1.http.websockets-support-enabled=true
    - Create PostgreSQL Connection pool
      (not required if launching from Netbeans, since it will automatically use glassfish-resources.xml)
      asadmin create-jdbc-connection-pool --datasourceclassname org.postgresql.ds.PGSimpleDataSource --restype javax.sql.DataSource --property portNumber=5432:password=123:user=user:serverName=localhost:databaseName=wegas_dev jdbc/wegas_dev_pool
      asadmin ping-connection-pool jdbc/wegas_dev_pool
      asadmin create-jdbc-resource --connectionpoolid jdbc/wegas_dev_pool jdbc/wegas_dev

Set up Github
------------------------
*  Set up git [http://help.github.com/win-set-up-git/]
*  git config --global user.name "Your Name"
*  git config --global user.email YourMail
*  mkdir Wegas
*  cd Wegas
*  clone git@github.com:fxaeberhard/Wegas.git

Set up Netbeans
------------------------
*  Force utf-8
   Addn -J-Dfile.encoding=UTF-8 to netbeans_default_options line in netbeans.conf.
	

