#!/usr/bin/env node

/**
 * Retrieves @mention notifications of the bot user from GitHub,
 * and acts on commands.
 *
 * TODO:
 * - lock notifications in DynamoDB so that multiple bot instances don't act on the same command
 * - store last modified flag in DynamoDB and pass to next call to get higher rate limit
 * - paginate notifications (max 100)
 * - success/failure metrics to CloudWatch
 */

import AWS = require('aws-sdk');
import octokitlib = require('@octokit/rest');
const octokit = new octokitlib();

const githubTokenParameter = process.env.githubTokenParameter || 'clare-bot-github-token';
let githubToken: string;

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
  const params = {
    all: false, // unread only
    participating: true, // only get @mentions
  };
  const response = await octokit.activity.getNotifications(params);
  const notifications = response.data;
  console.log(notifications);
}

retrieveNotifications().catch(err => {
  console.error('There was an uncaught error', err);
  process.exit(1);
});
