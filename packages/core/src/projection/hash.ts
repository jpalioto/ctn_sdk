import type { TraitStrategy } from '@ctn/language';
import { createHash } from 'node:crypto';
import type { ProjectionMatrix } from './types.js';

/**
 * Computes a deterministic hash of a projection matrix for drift detection.
 *
 * The hash includes:
 * - Strategy name and version
 * - Dimension IDs
 * - All matrix components (baseline, weights, scale, clamps)
 *
 * @param matrix - The projection matrix
 * @param strategy - The trait strategy
 * @returns 128-bit hex hash (32 characters)
 */
export function computeProjectionHash(
  matrix: ProjectionMatrix,
  strategy: TraitStrategy
): string {
  const canonical = JSON.stringify(
    {
      strategyName: strategy.name,
      strategyVersion: strategy.version,
      dimensionIds: strategy.dimensions.map((d) => d.id),
      baseline: sortKeys(matrix.baseline),
      weights: sortKeys(matrix.weights),
      scale: sortKeys(matrix.scale),
      clamps: sortKeys(matrix.clamps),
    },
    null,
    0
  );

  return createHash('sha256').update(canonical).digest('hex').slice(0, 32);
}

/**
 * Sorts object keys for deterministic serialization.
 */
function sortKeys<T>(obj: Record<string, T>): Record<string, T> {
  return Object.keys(obj)
    .sort()
    .reduce(
      (acc, k) => {
        acc[k] = obj[k]!;
        return acc;
      },
      {} as Record<string, T>
    );
}
