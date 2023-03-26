import cron from 'node-cron';

const scheduledTasks = new Map();

// Create a new cron schedule for the specified workspaceId
export function createSchedule(workspace, cronStr) {
  const isValid = cron.validate(cronStr);

  if (!isValid) {
    console.log(`Following schedule is invalid ${cronStr}`);
    return
  }

  const task = cron.schedule(cronStr, () => {
    console.log(`Scheduled task running for workspace ${workspace.name}`);
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