/**
 * Multi-Agent Orchestration — Phase 3
 *
 * Coordinates multiple specialist agents for parallel and sequential
 * workloads in the Staff Engineer Auto AI system.  Integrates the
 * Navigation, TTS, CarPlay, and Hazard Detection modules into
 * composable pipelines.
 */

import { generateRoute } from '../navigation/index.js';
import { generateTurnPrompt, generateArrivalPrompt } from '../tts/index.js';
import { validateRouteForCarPlay, buildCarPlayScreen } from '../carplay/index.js';
import { detectHazards } from '../hazard_detection/index.js';

/**
 * @typedef {'pending'|'running'|'done'|'error'} TaskStatus
 */

/**
 * @typedef {object} AgentTask
 * @property {string} id - Unique task identifier
 * @property {string} agent - Agent name responsible for this task
 * @property {Function} run - Async function that executes the task
 * @property {TaskStatus} [status] - Execution status (populated after run)
 * @property {*} [result] - Task result (populated on success)
 * @property {Error} [error] - Execution error (populated on failure)
 */

/**
 * Runs an array of agent tasks in parallel and returns them with status,
 * result, or error populated.
 *
 * @param {AgentTask[]} tasks - Tasks to execute concurrently
 * @returns {Promise<AgentTask[]>} Settled tasks with updated status
 */
export async function runParallel(tasks) {
  const settled = await Promise.allSettled(tasks.map((task) => task.run()));
  return tasks.map((task, i) => {
    const outcome = settled[i];
    if (outcome.status === 'fulfilled') {
      return { ...task, status: 'done', result: outcome.value };
    }
    return { ...task, status: 'error', error: outcome.reason };
  });
}

/**
 * Runs an array of agent tasks one after another and returns them with
 * status, result, or error populated.
 *
 * @param {AgentTask[]} tasks - Tasks to execute in order
 * @returns {Promise<AgentTask[]>} Settled tasks with updated status
 */
export async function runSequential(tasks) {
  const results = [];
  for (const task of tasks) {
    try {
      const result = await task.run();
      results.push({ ...task, status: 'done', result });
    } catch (error) {
      results.push({ ...task, status: 'error', error });
    }
  }
  return results;
}

/**
 * Builds a standard navigation pipeline as an ordered array of agent tasks
 * covering route generation, CarPlay validation, TTS prompt generation, and
 * hazard detection.
 *
 * @param {object} config - Pipeline configuration
 * @param {{ lat: number, lng: number }} config.origin - Origin GPS coordinate
 * @param {{ lat: number, lng: number }} config.destination - Destination GPS coordinate
 * @param {string} [config.destinationName] - Human-readable destination name for TTS
 * @param {Array<{ centre: { lat: number, lng: number }, radiusKm: number, type: string }>} [config.hazardZones]
 *   Known hazard zones to check along the route
 * @returns {AgentTask[]} Ordered array of configured agent tasks
 */
export function buildNavigationPipeline(config) {
  const { origin, destination, destinationName, hazardZones = [] } = config;

  // Generate the route once and share it across tasks that need it.
  const route = generateRoute(origin, destination);

  /** @type {AgentTask[]} */
  const tasks = [
    {
      id: 'route-generation',
      agent: 'NavigationAgent',
      run: async () => route,
    },
    {
      id: 'carplay-validation',
      agent: 'CarPlayAgent',
      run: async () => {
        const validation = validateRouteForCarPlay(route);
        const screen = validation.valid ? buildCarPlayScreen(route) : null;
        return { validation, screen };
      },
    },
    {
      id: 'tts-prompts',
      agent: 'TTSAgent',
      run: async () => ({
        arrival: generateArrivalPrompt(destinationName),
        departure: generateTurnPrompt('straight', 0),
      }),
    },
    {
      id: 'hazard-detection',
      agent: 'HazardDetectionAgent',
      run: async () => detectHazards(origin, hazardZones),
    },
  ];

  return tasks;
}
