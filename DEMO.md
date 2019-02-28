The full demo can be seen here: https://www.youtube.com/watch?v=HCCkVz25UU4&t=832

## Demo Prep

1. Set up your own clare-bot (instructions in [README](README.md))
1. Fork https://github.com/clareliguori/trivia-api/
1. Set up pull request builds for the trivia-api repo with AWS CodeBuild: https://docs.aws.amazon.com/codebuild/latest/userguide/sample-github-pull-request.html.  Use 'buildspec-ci.yml' for the buildspec name.

## Demo Script

This demo will walk through clare-bot previewing a pull request for the API service backing the [re:Invent Trivia application](https://www.reinvent-trivia.com/) in a temporary Fargate environment.

The live API service can be seen here: https://api.reinvent-trivia.com/api/trivia/question/1

An example pull request can be seen here: https://github.com/clareliguori/trivia-api/pull/3

On your trivia-api fork, create new pull request to merge the 'api-docs' branch into 'master'.

You should see your CodeBuild check start automatically, which uses the buildspec-ci.yml file to ensure the Docker image still builds successfully with the proposed changes: https://github.com/clareliguori/trivia-api/blob/master/buildspec-ci.yml

Comment in the pull request: `@your-bot-username preview this`.

Within 1 minute, you should see your bot respond that a build has started for the preview environment, with a link to the build.

The build will use the buildspec.yml file to build & push a Docker image, and to generate a CloudFormation template with the Cloud Development Kit (CDK): https://github.com/clareliguori/trivia-api/blob/master/buildspec.yml

The build will push the Docker file to ECR with a tag for this pull request.  For example: https://us-west-2.console.aws.amazon.com/ecr/repositories/clare-bot-preview-images/?region=us-west-2

Once the build has completed, the generated CloudFormation template will be deployed by your bot in a new CloudFormation stack, which can be seen in the CloudFormation console and the ECS console.  The code that generates the CloudFormation template can be seen here: https://github.com/clareliguori/trivia-api/blob/master/cdk/ecs-service.ts

Once the stack is deployed, the bot will provide the URL for the temporary trivia API endpoint in the pull request.  Add /api/docs to the end of the URL to see the new API docs.

Merge the pull request.

Within 1 minute, the bot will start cleaning up the environment, and you can see the CloudFormation stack in 'DELETING' state.