import cron from 'node-cron';
import { Client } from '@line/bot-sdk';

import { lineConfig, LIFF_URL } from './line.config';

const scheduledTasks = new Map();
const client = new Client(lineConfig);

// Create a new cron schedule for the specified workspaceId
export function createSchedule(workspace, cronStr) {
  const isValid = cron.validate(cronStr);

  if (!isValid) {
    console.log(`Following schedule is invalid ${cronStr}`);
    return
  }

  const task = cron.schedule(cronStr, async () => {
    console.log(`Scheduled task running for workspace ${workspace.name}`);

    const userIds = workspace.members.map(data => data.id);
    try {
      await client.multicast(userIds, {
        type: 'text',
        text: 'start standup meeting right now!',
      });
    } catch (err) {
      console.log(err);
    }
  });
  scheduledTasks.set(workspace.id, task);
  console.log(`Created schedule for workspace ${workspace.name}`);
}

// Deactivate the cron schedule for the specified workspaceId
export function deSchedule(workspace) {
  const task = scheduledTasks.get(workspace.id);
  if (task) {
    task.stop();
    scheduledTasks.delete(workspace.id);
    console.log(`Deactivated schedule for workspace ${workspace.name}`);
  } else {
    console.log(`No schedule found for workspace ${workspace.name}`);
  }
}