#!/bin/bash

. ../demo-magic/demo-magic.sh

ecs-cli local down --all

rm docker-compose.ecs-local.yml docker-compose.ecs-local.override.yml

clear

p "# ecs-cli now lets you easily run your task definitions locally!"

p "# Let's run locally a Fargate task definition I have registered in my account"

pe "aws ecs list-task-definition-families --family-prefix clare"

pe "ecs-cli local up -t clare-bot"

p "# My clare-bot service is now running locally"

pe "ecs-cli local ps --all"

pe "docker logs clare-bot_bot_1"

p "# The local task has the same environment variables and secrets as it does when it runs in ECS, and it can access my local IAM credentials"

p "# Behind the scenes, ecs-cli local uses Docker Compose to start your task"

pe "less docker-compose.ecs-local.yml"

p "# ecs-cli also creates a Compose override file that you can edit to change local settings and add more containers to the task, like a local database"

pe "emacs -nw docker-compose.ecs-local.override.yml"

pe "ecs-cli local up -t clare-bot"

pe "ecs-cli local ps --all"

p "# When I'm done developing, I can tear everything down"

pe "ecs-cli local down --all"

p "# I can also iterate on a local task definition file with ecs-cli local"

pe "aws ecs describe-task-definition --task-definition clare-bot --query 'taskDefinition' > task-definition.json"

pe "less task-definition.json"

pe "ecs-cli local up"

pe "ecs-cli local ps"

p "# Let's add a new environment variable to my task definition and test it locally"

pe "docker inspect --format='{{json .Config.Env}}' clare-bot_bot_1 | jq '.'"

pe "emacs -nw task-definition.json"

pe "ecs-cli local up"

pe "docker inspect --format='{{json .Config.Env}}' clare-bot_bot_1 | jq '.'"

p "# Enjoy running your ECS tasks locally!"

ecs-cli local down --all
