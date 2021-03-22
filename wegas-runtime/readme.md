# Running Wegas

## Install tools
### Mac OS
```
#Install brew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install.sh)"

#Install node and change version to 11.10.1
brew install node
npm install -g n 
n 11.10.1

#Install yarn
brew install yarn

#Install maven
brew install maven

#Install docker
brew cask install docker
#Press ⌘ + Space to bring up Spotlight Search and enter "Docker" to launch Docker

#Install OpenJDK 11
brew tap AdoptOpenJDK/openjdk
brew cask install adoptopenjdk11
```

## Install services

### PostgreSQL

#### Install
```shell
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=<YOUR_PASSWORD> --name wegas_postgres -d postgres:11-alpine 
```

#### Configure
```shell
echo "CREATE USER \"user\" WITH PASSWORD '1234' SUPERUSER;
CREATE DATABASE \"wegas_dev\" OWNER \"user\";
CREATE DATABASE \"wegas_test\" OWNER \"user\";" |  docker exec -it wegas_postgres psql -U postgres
```

### Jackrabbit backend (MongoDB)
#### Install
```shell
docker run -p 27017:27017 --name wegas_mongo -d mongo:4.2
```

## Build
```shell
mvn -f .. -DskipTests install
```

### Java 11
If your default JVM is <> 11, you must provide the path to a JVM-11 to maven. E.G:
```shell
JAVA_HOME="/usr/lib/jvm/java-11-openjdk-amd64/" mvn -DskipTests install
```



## Run

### Start
Run `./run` to start wegas.

#### Java 11
Wegas is designed to run on Java 11. If your default JVM is <> 11, you must provide the path to a JVM 11 using the -j option.

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
