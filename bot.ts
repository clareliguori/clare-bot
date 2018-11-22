#!/usr/bin/env node

/**
 * Retrieves @mention notifications of the bot user from GitHub,
 * and acts on commands.
 *
 * TODO:
 * - lock notifications so that multiple bot instances don't act on the same command
 * - Use last modified flag to get higher rate limit
 * - paginate notifications (max 100)
 * - success/failure metrics to CloudWatch
 * - handle new changes being pushed to the PR (should update any existing preview environment)
 */

import AWS = require('aws-sdk');
import octokitlib = require('@octokit/rest');
const octokit = new octokitlib();

const githubTokenParameter = process.env.githubTokenParameter || 'clare-bot-github-token';
let githubToken: string;

const botUser = process.env.botUser || 'clare-bot';

const whitelistedUsers = process.env.whitelistedUsers ? process.env.whitelistedUsers.split(',') : ['clareliguori'];

/**
 * Stand up a preview environment, including building and pushing the Docker image
 */
async function provisionPreviewStack(owner: string, repo: string, prNumber: number, requester: string) {
  octokit.issues.createComment({
    owner,
    repo,
    number: prNumber,
    body: "Ok @" + requester + ", I am provisioning a preview stack"
  });
}

/**
 * Tear down when the pull request is closed
 */
async function cleanupPreviewStack(owner: string, repo: string, prNumber: number) {
  octokit.issues.createComment({
    owner,
    repo,
    number: prNumber,
    body: "Cleaned up preview stack"
  });
}

/**
 * Determine the action associated with this notification
 */
async function handleNotification(notification: octokitlib.ActivityGetNotificationsResponseItem) {
  // Mark the notification as read
  await octokit.activity.markNotificationThreadAsRead({
    thread_id: parseInt(notification.id, 10)
  });

  // Validate the notification
  if (notification.reason != 'mention') {
    console.log("Ignoring because reason is not mention: " + notification.reason);
    return;
  }

  if (notification.subject.type != 'PullRequest') {
    console.log("Ignoring because type is not PullRequest: " + notification.subject.type);
    return;
  }

  // Format: https://api.github.com/repos/<owner>/<repo>/pulls/<pull request id>
  const pullRequestsUrl = notification.subject.url;
  let parts = pullRequestsUrl.replace('https://api.github.com/', '').split('/');
  const owner = parts[1];
  const repo = parts[2];
  const prNumber = parseInt(parts[4], 10);
  const pullRequestResponse = await octokit.pullRequests.get({
    owner,
    repo,
    number: prNumber
  });
  console.log(pullRequestResponse);

  if (pullRequestResponse.data.state == 'closed') {
    console.log("Cleaning up preview stack");
    cleanupPreviewStack(owner, repo, prNumber);
    return;
  } else {
    // Format: https://api.github.com/repos/<owner>/<repo>/issues/comments/<comment id>
    // TODO only getting the latest comment every minute means that some mentions might
    // be missed if someone else comments on the PR before the polling interval
    const commentUrl = notification.subject.latest_comment_url;

    if (commentUrl == pullRequestsUrl) {
      console.log("Ignoring because there were no new comments");
      return;
    }

    parts = commentUrl.replace('https://api.github.com/', '').split('/');
    const comment_id = parseInt(parts[5], 10);
    const commentResponse = await octokit.issues.getComment({
      owner,
      repo,
      comment_id
    });
    console.log(commentResponse);

    const login = commentResponse.data.user.login;
    if (!whitelistedUsers.includes(login)) {
      console.log("Ignoring because login is not whitelisted: " + login);
      return;
    }

    const commentBody = commentResponse.data.body;
    if (!commentBody.includes('@' + botUser)) {
      console.log("Ignoring because comment body does not mention the comment body: " + commentBody);
      return;
    }

    const requester = commentResponse.data.user.login;
    const command = commentBody.replace('@' + botUser, '').trim();
    if (command == 'preview this') {
      console.log("Provisioning preview stack");
      await provisionPreviewStack(owner, repo, prNumber, requester);
    } else {
      console.log("Ignoring because command is not understood: " + command);
      return;
    }
  }
}

/**
 * Retrieve notifications from GitHub and filter to those handled by this bot
 */
async function retrieveNotifications() {
  // Retrieve the plaintext github token
  if (!githubToken) {
    const ssm = new AWS.SSM();
    const params = {
      Name: githubTokenParameter,
      WithDecryption: true
    };
    const paramResult = await ssm.getParameter(params).promise();
    githubToken = paramResult.Parameter.Value;
  }
  octokit.authenticate({ type: 'token', token: githubToken });

  // Retrieve latest unread notifications
  const since = new Date();
  since.setHours(since.getHours() - 1); // last hour
  const response = await octokit.activity.getNotifications({
    all: false, // unread only
    since: since.toISOString(),
    participating: true, // only get @mentions
  });
  const notifications = response.data;

  console.log(response.headers);
  console.log("Notifications: " + notifications.length);
  for (const notification of notifications) {
    console.log(notification);
    handleNotification(notification);
  }
}

retrieveNotifications().catch(err => {
  console.error('There was an uncaught error', err);
  process.exit(1);
});
