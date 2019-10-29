# Running Wegas

## Install services

### PostgreSQL

#### Install
```shell
docker run -d -p 5432:5432 --name wegas_postgres -d postgres:11-alpine 
```

#### Configure
```shell
echo "CREATE USER \"user\" WITH PASSWORD '1234' SUPERUSER;
CREATE DATABASE \"wegas_dev\" OWNER \"user\";
CREATE DATABASE \"wegas_test\" OWNER \"user\";" | sudo -u postgres psql
```

### Jackrabbit backend (MongoDB)
#### Install
```shell
docker run -p 27017:27017 --name wegas_mongo -d mongo:4.0.11
```

## Build
```shell
mvn -f .. -DskipTests install
```

### Java 8 
If your default JVM is > 8, you must provide the path to a JVM 8 to maven. E.G:
```shell
JAVA_HOME="/usr/lib/jvm/java-8-openjdk-amd64/" mvn -DskipTests install
```



## Run

### Start
Run `./run` to start wegas.

#### Java 8
Wegas is designed to run on Java 8. If your default JVM is > 8, you must provide the path to a JVM 8 using the -j option.

#### Options
Option | Default Value | Description 
------ | ------------- | -----------
-d | 1 | number of populating daemon
-g | *unset* | to enable debug mode
-j | /usr/bin/ | path of the java executable
-m | 2G | heap size
-p | 9009 | debug port
-t | 9 | number of http threads
-w | ../wegas-app/target/Wegas | war to deploy

#### Clustering
Running several instance at the same time will automatically create a cluster.

#### Custom Properties
First run create `src/main/resources/wegas-override.properties` file.
Feel free to modify it.

#### Reload after wegas-core changes
```
mvn -f .. -pl wegas-app -am -DskipTests -DskipYarn install
touch ../wegas-app/target/Wegas/.reload
```
