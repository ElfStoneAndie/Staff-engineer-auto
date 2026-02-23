import { describe, it, expect } from '@jest/globals';
import {
  runParallel,
  runSequential,
  buildNavigationPipeline,
} from '../src/orchestration/index.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const sf = { lat: 37.7749, lng: -122.4194 };
const la = { lat: 34.0522, lng: -118.2437 };

function makeTask(id, value) {
  return { id, agent: 'TestAgent', run: async () => value };
}

function makeFailingTask(id, message) {
  return {
    id,
    agent: 'TestAgent',
    run: async () => {
      throw new Error(message);
    },
  };
}

// ---------------------------------------------------------------------------
// runParallel
// ---------------------------------------------------------------------------
describe('runParallel', () => {
  it('returns done status and result for successful tasks', async () => {
    const tasks = [makeTask('t1', 'alpha'), makeTask('t2', 'beta')];
    const results = await runParallel(tasks);

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({ id: 't1', status: 'done', result: 'alpha' });
    expect(results[1]).toMatchObject({ id: 't2', status: 'done', result: 'beta' });
  });

  it('marks failing tasks with error status and preserves the error', async () => {
    const tasks = [makeTask('t1', 42), makeFailingTask('t2', 'boom')];
    const results = await runParallel(tasks);

    expect(results[0].status).toBe('done');
    expect(results[1].status).toBe('error');
    expect(results[1].error).toBeInstanceOf(Error);
    expect(results[1].error.message).toBe('boom');
  });

  it('resolves all tasks even when some fail', async () => {
    const tasks = [
      makeFailingTask('a', 'err-a'),
      makeTask('b', 'ok'),
      makeFailingTask('c', 'err-c'),
    ];
    const results = await runParallel(tasks);

    expect(results).toHaveLength(3);
    expect(results.filter((r) => r.status === 'error')).toHaveLength(2);
    expect(results.filter((r) => r.status === 'done')).toHaveLength(1);
  });

  it('returns an empty array for an empty task list', async () => {
    const results = await runParallel([]);
    expect(results).toEqual([]);
  });

  it('does not mutate the original task objects', async () => {
    const original = makeTask('x', 1);
    await runParallel([original]);
    expect(original.status).toBeUndefined();
    expect(original.result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// runSequential
// ---------------------------------------------------------------------------
describe('runSequential', () => {
  it('runs tasks in order and returns done status with results', async () => {
    const order = [];
    const tasks = [
      { id: 'first', agent: 'A', run: async () => { order.push('first'); return 1; } },
      { id: 'second', agent: 'B', run: async () => { order.push('second'); return 2; } },
    ];
    const results = await runSequential(tasks);

    expect(order).toEqual(['first', 'second']);
    expect(results[0]).toMatchObject({ id: 'first', status: 'done', result: 1 });
    expect(results[1]).toMatchObject({ id: 'second', status: 'done', result: 2 });
  });

  it('marks failing tasks with error status and continues execution', async () => {
    const tasks = [makeFailingTask('fail', 'oops'), makeTask('ok', 'fine')];
    const results = await runSequential(tasks);

    expect(results[0].status).toBe('error');
    expect(results[0].error.message).toBe('oops');
    expect(results[1].status).toBe('done');
    expect(results[1].result).toBe('fine');
  });

  it('returns an empty array for an empty task list', async () => {
    const results = await runSequential([]);
    expect(results).toEqual([]);
  });

  it('does not mutate the original task objects', async () => {
    const original = makeTask('y', 99);
    await runSequential([original]);
    expect(original.status).toBeUndefined();
    expect(original.result).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// buildNavigationPipeline
// ---------------------------------------------------------------------------
describe('buildNavigationPipeline', () => {
  it('returns four tasks with the expected ids and agent names', () => {
    const tasks = buildNavigationPipeline({ origin: sf, destination: la });

    expect(tasks).toHaveLength(4);
    expect(tasks.map((t) => t.id)).toEqual([
      'route-generation',
      'carplay-validation',
      'tts-prompts',
      'hazard-detection',
    ]);
    expect(tasks.map((t) => t.agent)).toEqual([
      'NavigationAgent',
      'CarPlayAgent',
      'TTSAgent',
      'HazardDetectionAgent',
    ]);
  });

  it('each task has a callable run function', () => {
    const tasks = buildNavigationPipeline({ origin: sf, destination: la });
    tasks.forEach((task) => expect(typeof task.run).toBe('function'));
  });

  it('route-generation task returns a valid route', async () => {
    const [routeTask] = buildNavigationPipeline({ origin: sf, destination: la });
    const route = await routeTask.run();

    expect(route.origin).toEqual(sf);
    expect(route.destination).toEqual(la);
    expect(route.waypoints).toHaveLength(2);
    expect(route.type).toBe('direct');
  });

  it('carplay-validation task returns a valid validation and screen', async () => {
    const tasks = buildNavigationPipeline({ origin: sf, destination: la });
    const carplayTask = tasks.find((t) => t.id === 'carplay-validation');
    const { validation, screen } = await carplayTask.run();

    expect(validation.valid).toBe(true);
    expect(screen).not.toBeNull();
    expect(screen.title).toBe('Navigation');
  });

  it('tts-prompts task generates arrival and departure prompts', async () => {
    const tasks = buildNavigationPipeline({
      origin: sf,
      destination: la,
      destinationName: 'Los Angeles',
    });
    const ttsTask = tasks.find((t) => t.id === 'tts-prompts');
    const prompts = await ttsTask.run();

    expect(prompts.arrival).toContain('Los Angeles');
    expect(typeof prompts.departure).toBe('string');
  });

  it('hazard-detection task returns an empty array when no hazard zones given', async () => {
    const tasks = buildNavigationPipeline({ origin: sf, destination: la });
    const hazardTask = tasks.find((t) => t.id === 'hazard-detection');
    const hazards = await hazardTask.run();

    expect(hazards).toEqual([]);
  });

  it('hazard-detection task detects hazards near the origin', async () => {
    const zone = { centre: sf, radiusKm: 1, type: 'construction' };
    const tasks = buildNavigationPipeline({
      origin: sf,
      destination: la,
      hazardZones: [zone],
    });
    const hazardTask = tasks.find((t) => t.id === 'hazard-detection');
    const hazards = await hazardTask.run();

    expect(hazards).toHaveLength(1);
    expect(hazards[0].type).toBe('construction');
  });

  it('pipeline runs successfully end-to-end via runSequential', async () => {
    const tasks = buildNavigationPipeline({ origin: sf, destination: la });
    const results = await runSequential(tasks);

    expect(results.every((r) => r.status === 'done')).toBe(true);
  });

  it('pipeline runs successfully end-to-end via runParallel', async () => {
    const tasks = buildNavigationPipeline({ origin: sf, destination: la });
    const results = await runParallel(tasks);

    expect(results.every((r) => r.status === 'done')).toBe(true);
  });
});
