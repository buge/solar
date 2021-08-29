import {Angle, asin, atan2, cos, degrees, sin, tan} from '@buge/ts-units/angle';
import {Length, astronomicalUnits} from '@buge/ts-units/length';

const JULIAN_DAY_UNIX_EPOCH = 2440587.5;
const MSEC_PER_DAY = 1000 * 60 * 60 * 24;

/** Computes the position of the sun for a given day and observer on Earth. */
export class Position {
  /** The latitude of the observer on Earth. */
  readonly latitude: Angle;

  /** The longitude of the observer on Earth. */
  readonly longitude: Angle;

  /**
   * The Julian Date. That is, the number of (fractional) days since Monday,
   * January 1, 4713 BC 12:00 UTC.
   */
  readonly julianDate: number;

  /**
   * Ecliptic longitude of the sun (often denoted by symbol λ). That is, the
   * angular distance of the sun along the ecliptic plane using the vernal
   * equinox as a reference point.
   *
   * We assume that the ecliptic latitude (the inclination of the Earth
   * relative to the ecliptic plane) is ≈ 0 so together with `distance` this
   * fully describes the position of the sun relative to the Earth.
   */
  readonly eclipticLongitude: Angle;

  /**
   * The distance between the sun and the Earth (often denoted by symbol Δ).
   */
  readonly distance: Length;

  /**
   * Right ascension (often denoted by symbol α) of the sun measured eastwards
   * along the celestial equator from the vernal equinox to the hour circle
   * passing through the object.
   *
   * Together with the `declination` this fully described the position of
   * the sun relative to the Earth in the equatorial coordinate system.
   */
  readonly rightAscension: Angle;

  /**
   * Declination (often denoted by symbol δ) of the sun perpendicular to the
   * celestial equator.
   *
   * Together with the `rightAscension` this fully describes the position of
   * the sun relative to the Earth in the equatorial coordinate system.
   */
  readonly declination: Angle;

  readonly localSiderealTime: Angle;

  /**
   * The local hour angle (LHA) measures the angular distance of the Sun
   * westward along the celestial equator to the observer's longitude.
   */
  readonly hourAngle: Angle;

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

  /**
   * Computes a new solar position for the given Julian date
   *
   * @param julianDay Fractional days since Monday, January 1, 4713 BC 12:00
   *     UTC.
   * @param latitude Latitude of the observer on Earth.
   * @param longitude Longitude of the observer on Earth.
   */
  constructor(julianDay: number, latitude: Angle, longitude: Angle);

  /**
   * Computes a new solar position for the given Javascript date

   * @param date Date to compute the solar position for.
   * @param latitude Latitude of the observer on Earth.
   * @param longitude Longitude of the observer on Earth.
   */
  constructor(date: Date, latitude: Angle, longitude: Angle);

  constructor(time: Date | number, latitude: Angle, longitude: Angle) {
    this.latitude = latitude;
    this.longitude = longitude;

    this.julianDate =
      typeof time === 'number'
        ? time
        : JULIAN_DAY_UNIX_EPOCH + time.getTime() / MSEC_PER_DAY;

    const jDays = this.julianDate - 2451545;
    const jCenturies = jDays / 36525.0;

    const gmstRA = normalize(
      degrees(
        280.46061837 +
          360.98564736629 * jDays +
          0.000387933 * (jDays / 36525) ** 2 -
          (jDays / 36525) ** 3 / 38710000
      )
    );
    this.localSiderealTime = normalize(gmstRA.plus(longitude));

    const meanAnomaly = normalize(degrees(357.5291 + 35999.0503 * jCenturies));

    const meanLongitude = normalize(
      degrees(
        280.46645 + 36000.76983 * jCenturies + 0.0003032 * jCenturies ** 2
      )
    );

    const equationOfCenter = degrees(
      (1.9146 - 0.004847 * jCenturies) * sin(meanAnomaly) +
        (0.019993 - 0.000101 * jCenturies) * sin(meanAnomaly.times(2)) +
        0.00029 * sin(meanAnomaly.times(3))
    );

    const omega = degrees(125.04 - 1934.136 * jCenturies);

    this.eclipticLongitude = meanLongitude
      .plus(equationOfCenter)
      .minus(degrees(0.00569 - 0.00478 * sin(omega)));

    this.distance = astronomicalUnits(
      1.00014 - 0.01671 * cos(meanAnomaly) - 0.00014 * cos(meanAnomaly.times(2))
    );

    const obliquityOfEcliptic = degrees(
      23.439291 -
        0.01300422 * jCenturies -
        0.16 * 10e-6 * jCenturies ** 2 +
        0.504 * 10e-6 * jCenturies ** 3
    );

    this.rightAscension = normalize(
      atan2(
        cos(obliquityOfEcliptic) * sin(this.eclipticLongitude),
        cos(this.eclipticLongitude)
      )
    );

    this.declination = asin(
      sin(obliquityOfEcliptic) * sin(this.eclipticLongitude)
    );

    this.hourAngle = this.localSiderealTime.minus(this.rightAscension);

    this.altitude = asin(
      sin(this.declination) * sin(this.latitude) +
        cos(this.declination) * cos(this.latitude) * cos(this.hourAngle)
    );

    this.azimuth = normalize(
      atan2(
        -sin(this.hourAngle),
        cos(this.latitude) * tan(this.declination) -
          sin(this.latitude) * cos(this.hourAngle)
      )
    );
  }
}

/** Normalizes an angle to be within [0º, 360º) */
function normalize(angle: Angle): Angle {
  return degrees(((angle.in(degrees).amount % 360) + 360) % 360);
}
