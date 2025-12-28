import type { KernelIR } from '@ctn/language';

/**
 * Renderer negotiation through capability iteration.
 *
 * Design principles:
 * - No switch statements on strategy or provider names
 * - Providers declare preferences as ordered function lists
 * - Negotiation is iteration: try each preference until one succeeds
 * - Framework mediates, neither side knows the other's internals
 */

/**
 * A renderer query function that attempts to render using a specific capability.
 *
 * Returns the rendered string if the strategy supports this capability,
 * or null if the strategy doesn't support it.
 *
 * @template S The strategy type
 */
export type RendererQuery<S> = (strategy: S, ir: KernelIR) => string | null;

/**
 * Error thrown when no compatible renderer is found.
 */
export class NoCompatibleRendererError extends Error {
  constructor(strategyName: string, preferenceCount: number) {
    super(
      `No compatible renderer found for strategy '${strategyName}' ` +
      `after trying ${preferenceCount} preference(s)`
    );
    this.name = 'NoCompatibleRendererError';
  }
}

/**
 * Renders a kernel IR using the first compatible renderer from the preference list.
 *
 * Iterates through the provider's renderer preferences in order.
 * Returns the result from the first preference that returns non-null.
 * Throws if no preference returns a result.
 *
 * @template S The strategy type
 * @param strategy The strategy that may implement rendering capabilities
 * @param ir The kernel IR to render
 * @param preferences Ordered list of renderer queries to try
 * @returns The rendered kernel string
 * @throws NoCompatibleRendererError if all preferences return null
 */
export function renderKernel<S extends { name: string }>(
  strategy: S,
  ir: KernelIR,
  preferences: readonly RendererQuery<S>[]
): string {
  for (const query of preferences) {
    const result = query(strategy, ir);
    if (result !== null) {
      return result;
    }
  }

  throw new NoCompatibleRendererError(strategy.name, preferences.length);
}
