## clare-bot

![](https://github.com/clareliguori/clare-bot/raw/master/assets/robot.png)

The clare-bot application polls for GitHub notifications like @clare-bot mentions and performs actions.  For example, whitelisted GitHub users (namely, @clareliguori) can mention @clare-bot with a command "preview this" in a pull request to provision a preview environment.  See [this pull request](https://github.com/clareliguori/trivia-api/pull/3) for an example interaction, and see [this presentation](https://youtu.be/HCCkVz25UU4) for a demo.

Built with GitHub APIs, AWS Fargate, AWS CodeBuild, Amazon ECR, and AWS CloudFormation

### Set up the bot

Create a GitHub user for your bot, like @clare-bot.  Update the user's [notification settings](https://github.com/settings/notifications) to select all "Web" notifications instead of "Email", and to "Automatically watch repositories".

Invite the bot as a collaborator of your Github Repository

Create a [personal access token](https://github.com/settings/tokens) for the bot user with the following scopes:

* `repo` (Full control of private repositories)
* `notifications` (Access notifications)

Store the token in AWS Systems Manager Parameter Store:

```aws ssm put-parameter --region us-west-2 --name clare-bot-github-token --type SecureString --value <personal access token>```

Provision the stack in CloudFormation:
```
aws cloudformation deploy --region us-west-2 \
--stack-name clare-bot \
--template-file template.yml \
--capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides Vpc=<default VPC ID> Subnets=<default VPC subnets> botUser=<github bot username> whitelistedUsers<my github username>
```

Build and push the Docker image:

```
ECR_REPO=`aws ecr describe-repositories --region us-west-2 --repository-names clare-bot --output text --query 'repositories[0].repositoryUri'`
echo $ECR_REPO

$(aws ecr get-login --no-include-email --region us-west-2)

docker build -t clare-bot .

docker tag clare-bot $ECR_REPO

docker push $ECR_REPO
```

### Test Locally

```
docker run --rm -v $HOME/.aws:/root/.aws:ro -e AWS_REGION=us-west-2 clare-bot
```
