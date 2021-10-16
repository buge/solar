import * as spa from './spa';
import {Angle, degrees} from '@buge/ts-units/angle';
import {Length, meters} from '@buge/ts-units/length';
import {Pressure, pascals} from '@buge/ts-units/pressure';
import {Temperature, celsius} from '@buge/ts-units/temperature';
import {pressureAt} from './pressure';
import {ΔT} from './deltatpoly';

/** Computes the position of the sun for a given day and observer on Earth. */
export interface Position {
  /**
   * The altitude of the sun (often denoted by symbol _a_) as seen by an
   * observer at the given longitude and latitude.
   *
   * Together with the `azimuth` this fully described the position of the sun
   * in the horizontal coordinate system.
   */
  readonly altitude: Angle;

  /**
   * The azimuth of the sun (often denoted by symbol _A_) as seen by an
   * observer at the given longitude and latitude.
   *
   * Together with the `altitude` this fully described the position of the sun
   * in the horizontal coordinate system.
   */
  readonly azimuth: Angle;
}

/**
 * Computes a new solar position for the given Javascript date
 *
 * @param date Date to compute the solar position for.
 * @param latitude Latitude of the observer on Earth.
 * @param longitude Longitude of the observer on Earth.
 * @param altitude Altitude of the observer above sea level. Assumes 0 meters
 *     if not given.
 * @param temperature Observed air temperature to compute atmospheric
 *    refraction effects. Assumes 21ºC if not specified.
 * @param pressure Observed air pressure to compute atmospheric refraction
 *    effects. Estimates the pressure from the observer altitude if not
 *    specified.
 */
export function calculate(
  date: Date,
  latitude: Angle,
  longitude: Angle,
  altitude: Length = meters(0),
  temperature: Temperature = celsius(21),
  pressure?: Pressure
): Position {
  if (pressure === undefined) {
    pressure = pressureAt(altitude);
  }

  const pos = spa.calculate({
    date,
    ΔUT1: 0,
    ΔT: ΔT(date),
    φ: latitude.in(degrees).amount,
    σ: longitude.in(degrees).amount,
    E: altitude.in(meters).amount,
    P: pressure.in(millibars).amount,
    T: temperature.in(celsius).amount,
  });

  return {altitude: degrees(90 - pos.θ), azimuth: degrees(pos.Φ)};
}

// TODO(bunge): Move to ts-units.
const millibars = pascals.times(100);
