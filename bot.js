'use strict';

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

const AWS = require('aws-sdk');
const octokit = require('@octokit/rest')();

const githubTokenParameter = process.env.githubTokenParameter || 'clare-bot-github-token';
let githubToken;

async function retrieveNotifications() {
  try {
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
    let notifications = await octokit.activity.getNotifications(params);
    console.log(notifications);
  } catch (err) {
    console.error(err);
  }
}

retrieveNotifications();