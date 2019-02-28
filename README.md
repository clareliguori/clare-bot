## clare-bot

![](https://github.com/clareliguori/clare-bot/raw/master/assets/robot.png)

The clare-bot application polls for GitHub notifications like @clare-bot mentions and performs actions.  For example, whitelisted GitHub users (namely, @clareliguori) can mention @clare-bot with a command "preview this" in a pull request to provision a preview environment.  See [this pull request](https://github.com/clareliguori/trivia-api/pull/3) for an example interaction, and see [this presentation](https://youtu.be/HCCkVz25UU4) for a demo.

Built with GitHub APIs, AWS Fargate, AWS CodeBuild, Amazon ECR, and AWS CloudFormation

### How does clare-bot work?

The clare-bot container constantly polls the [GitHub Notifications APIs](https://developer.github.com/v3/activity/notifications/) for any mentions of the @clare-bot username on GitHub pull requests.  If the mentioner is whitelisted, clare-bot attempts to set up a preview environment in the same AWS account.  The clare-bot provisioning behavior is hard-coded to look for a buildspec.yml file in order to complete a CodeBuild build, and then to look for a template.yml file in the build artifact to use as a CloudFormation template for the preview environment.

### Set up your own bot

Create a GitHub user for your bot, like @clare-bot.

Update the user's [notification settings](https://github.com/settings/notifications) to select all "Web" notifications instead of "Email", and to "Automatically watch repositories".

Invite the bot as a collaborator of your GitHub Repository.

Create a [personal access token](https://github.com/settings/tokens) for the bot user with the following scopes:

* `repo` (Full control of private repositories)
* `notifications` (Access notifications)

Store the token in AWS Systems Manager Parameter Store:

```aws ssm put-parameter --region us-west-2 --name your-bot-name-github-token --type SecureString --value <personal access token>```

Provision the stack in CloudFormation:
```
aws cloudformation deploy --region us-west-2 \
--stack-name your-bot-name \
--template-file template.yml \
--capabilities CAPABILITY_NAMED_IAM \
--parameter-overrides \
    Vpc=<default VPC ID> \
    Subnets=<default VPC subnets> \
    BotUser=<bot's GitHub username> \
    WhitelistedUsers=<your GitHub username> \
    GitHubTokenParameter=your-bot-name-github-token
```

Build and push the Docker image:

```
ECR_REPO=`aws ecr describe-repositories --region us-west-2 --repository-names your-bot-name --output text --query 'repositories[0].repositoryUri'`
echo $ECR_REPO

$(aws ecr get-login --no-include-email --region us-west-2)

docker build -t your-bot-name .

docker tag your-bot-name $ECR_REPO

docker push $ECR_REPO
```

### Test Locally

```
docker run --rm -v $HOME/.aws:/root/.aws:ro -e AWS_REGION=us-west-2 your-bot-name
```
