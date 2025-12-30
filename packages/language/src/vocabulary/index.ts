/**
 * Vocabulary module - universal constraint definitions.
 *
 * This module provides the single source of truth for constraint names.
 * Both the parser and strategies import from here.
 */

export {
  // Types
  type ConstraintType,
  type UniversalConstraint,
  type ConstraintName,

  // Constants
  UNIVERSAL_CONSTRAINTS,
  KNOWN_CONSTRAINT_NAMES,

  // Functions
  getConstraintByName,
  isKnownConstraint,
  getSteeringConstraints,
  getMechanicalConstraints,
} from './constraints.js';
