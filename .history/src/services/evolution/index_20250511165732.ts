/**
 * Evolution Service - Entry Point
 * Exports all components of the enhanced evolution tracking system
 */

// Core components
export * from './evolution-types';
export * from './EvaluationLogger';
export * from './AgentMetricsManager';
export * from './evolution-service-enhanced';

// Default instances
import { evaluationLogger } from './EvaluationLogger';
import { agentMetricsManager } from './AgentMetricsManager';
import { createEnhancedEvolutionService } from './evolution-service-enhanced';

// Create the singleton instance
const evolutionService = createEnhancedEvolutionService();

// Export default instances
export {
  evaluationLogger,
  agentMetricsManager,
  evolutionService
};