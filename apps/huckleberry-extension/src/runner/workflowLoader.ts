import * as fs from 'fs/promises';
import * as path from 'path';
import { parse as parseYaml } from 'yaml';
import { WorkflowDefinition, validateWorkflowDefinition } from '../workflows';

/**
 * Loads and validates a workflow definition from disk.
 */
export async function loadWorkflowDefinition(loopFilePath: string): Promise<WorkflowDefinition> {
  const content = await fs.readFile(loopFilePath, 'utf8');
  const extension = path.extname(loopFilePath).toLowerCase();

  const parsed = extension === '.yaml' || extension === '.yml'
    ? parseYaml(content)
    : JSON.parse(content);

  const validation = validateWorkflowDefinition(parsed);
  if (!validation.valid) {
    const summary = validation.errors
      .map(error => `${error.code}@${error.path}`)
      .join(', ');
    throw new Error(`Invalid workflow definition: ${summary}`);
  }

  return parsed as WorkflowDefinition;
}
