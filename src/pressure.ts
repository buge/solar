import {Length, meters} from '@buge/ts-units/length';
import {Pressure, pascals} from '@buge/ts-units/pressure';

/**
 * Estimate the atmospheric pressure at the given altitude using the barometric
 * formula. This assumes lapse rates for within the troposphere.
 *
 * @param altitude The altitude above sea level.
 * @returns The estimated pressure at the given altitude above sea level.
 */
export function pressureAt(altitude: Length): Pressure {
  // Altitude in meters.
  const h = altitude.in(meters).amount;

  // Earth-surface gravitational acceleration in meters / second squared.
  const g = 9.80665;

  // Molar mass of dry air in kg/mol.
  const M = 0.02896968;

  // Sea level standard temperature in Kelvin
  const T0 = 288.16;

  // Universal gas constant in J/(mol·K).
  const R0 = 8.314462618;

  return atmospheres(Math.exp((-g * h * M) / (T0 * R0)));
}

// TODO(bunge): Move to ts-units.
const atmospheres = pascals.times(101325);
