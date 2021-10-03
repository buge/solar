/**
 * @fileoverview Implements the Sun Position Algorithm (SPA) for Solar
 * Radiation Applications by the National Renewable Energy Laboratory (NREL) as
 * described in https://midcdmz.nrel.gov/spa/.
 *
 * This file uses the original greek letters of the paper to make it easy to
 * cross reference the implementation with the algorithm descripton. We expect
 * most clients to interact with the interface in `index.ts` and not with these
 * variables directly.
 */

export interface Params {
  /** The (Unix) date time for which to compute the solar position. */
  readonly date: Date;

  /** Difference of `UT1 − UTC` in seconds in the range of `[-0.9, 0.9]`. */
  readonly ΔUT1: number;

  /** Difference between Terrestial Time and Universal Time, `ΔT = TT - UT`. */
  readonly ΔT: number;

  /** Geographical longitude of the observer, in degrees. */
  readonly σ: number;

  /** Geographical latitude of the observer, in degrees. */
  readonly φ: number;

  /** Elevation of the observers, in meters above sea level. */
  readonly E: number;

  /** Atmospheric pressure at the location of the observer, in millibars. */
  readonly P: number;

  /** Atmospheric temperature at the location of the observer, in ºC. */
  readonly T: number;
}

export interface Result {
  /** Julian Date. */
  JD: number;

  /** Earth heliocentric longitude, in degrees. */
  L: number;

  /** Earth heliocentric latitude, in degrees. */
  B: number;

  /** Earth heliocentric radius, in Astronomical Units. */
  R: number;

  /** Geocentric longitude, in degrees. */
  Θ: number;

  /** Geocentric latitude, in degrees. */
  β: number;

  /** Nutation in longitude, in degrees. */
  Δψ: number;

  /** Nutation in latitude, in degrees. */
  Δε: number;

  /** True obliquity of the ecliptic, in degrees. */
  ε: number;

  /** Apparent sun longitude, in degrees. */
  λ: number;

  /** Geocentric sun right ascension, in degrees. */
  α: number;

  /** Geocentric sun declination, in degrees. */
  δ: number;

  /** Observer local hour angle, in degrees. */
  H: number;

  /** Topocentric sun right ascension, in degrees. */
  αʹ: number;

  /** Topocentric sun declination, in degrees. */
  δʹ: number;

  /** Topocentric local hour angle, in degrees. */
  Hʹ: number;

  /** Topocentric zenith angle, in degrees. */
  θ: number;

  /** Topocentric azimuth angle, in degrees. */
  Φ: number;
}

const {PI, asin, atan, atan2, cos, sin, tan} = Math;

/** Computes the solar position from the given paramters. */
export function calculate(params: Params): Result {
  const {date, ΔT, E, P, T} = params;
  const φ = deg2rad(params.φ);
  const σ = deg2rad(params.σ);

  // 3.1 Calculate the Julian and Julian Ephemeris Day, Century and Millenium.
  // Simply assume T is 0 for now.
  const JD = julianDate(date);
  const JDE = JD + ΔT / 86400;
  const JC = (JD - 2451545) / 36525;
  const JCE = (JDE - 2451545) / 36525;
  const JME = JCE / 10;

  // 3.2 Calculate the Earth heliocentric longitude, latitude and radius
  // vector (L, B and R).
  const L = normalize(heliocentric(L_TERMS, JME));
  const B = heliocentric(B_TERMS, JME);
  const R = heliocentric(R_TERMS, JME);

  // 3.3. Calculate the geocentric longitude and latitude (Θ and β):
  const Θ = L + PI;
  const β = -B;

  // 3.4. Calculate the nutation in longitude and obliquity (Δψ and Δε):
  const {Δψ, Δε} = nutation(JCE);

  // 3.5. Calculate the true obliquity of the ecliptic, ε:
  const ε0 = polynomial(JME / 10, ε0_TERMS);
  const ε = deg2rad(ε0 / 3600) + Δε;

  // 3.6. Calculate the aberration correction, Δτ:
  const Δτ = deg2rad(-20.4898 / (3600 * R));

  // 3.7. Calculate the apparent sun longitude, λ:
  const λ = Θ + Δψ + Δτ;

  // 3.8. Calculate the apparent sidereal time at Greenwich at any given time, ν:
  const ν0 = normalize(
    deg2rad(
      280.46061837 +
        360.98564736629 * (JD - 2451545) +
        0.000387933 * JC ** 2 -
        JC ** 3 / 38710000
    )
  );
  const ν = ν0 + Δψ * cos(ε);

  // 3.9 Calculate the geocentric sun right ascension, α:
  const α = normalize(atan2(sin(λ) * cos(ε) - tan(β) * sin(ε), cos(λ)));

  // 3.10. Calculate the geocentric sun declination, δ:
  const δ = asin(sin(β) * cos(ε) + cos(β) * sin(ε) * sin(λ));

  // 3.11. Calculate the observer local hour angle, H:
  const H = normalize(ν + σ - α);

  // 3.12. Calculate the topocentric sun right ascension αʹ:
  const ξ = deg2rad(8.794 / (3600 * R));
  const u = atan(0.99664719 * tan(φ));
  const x = cos(u) + (E / 6378140) * cos(φ);
  const y = 0.99664719 * sin(u) + (E / 6378140) * sin(φ);
  const Δα = atan2(-x * sin(ξ) * sin(H), cos(δ) - x * sin(ξ) * cos(H));
  const αʹ = α + Δα;
  const δʹ = atan2(
    (sin(δ) - y * sin(ξ)) * cos(Δα),
    cos(δ) - x * sin(ξ) * cos(H)
  );
  // 3.13. Calculate the topocentric local hour angle, Hʹ
  const Hʹ = H - Δα;

  // 3.14. Calculate the topocentric zenith angle, θ:
  const e0 = asin(sin(φ) * sin(δʹ) + cos(φ) * cos(δʹ) * cos(Hʹ));
  const Δe = deg2rad(
    ((P / 1010) * (283 / (273 + T)) * 1.02) /
      (60 * tan(e0 + deg2rad(deg2rad(10.3)) / (e0 + deg2rad(5.11))))
  );
  const e = e0 + Δe;
  const θ = PI / 2 - e;

  // 3.15. Calculate the topocentric azimuth angle, Φ:
  const Γ = atan2(sin(Hʹ), cos(Hʹ) * sin(φ) - tan(δʹ) * cos(φ));
  const Φ = normalize(Γ + PI);

  return {
    JD,
    L: rad2deg(L),
    B: rad2deg(B),
    R,
    Θ: rad2deg(Θ),
    β: rad2deg(β),
    Δψ: rad2deg(Δψ),
    Δε: rad2deg(Δε),
    ε: rad2deg(ε),
    λ: rad2deg(λ),
    α: rad2deg(α),
    δ: rad2deg(δ),
    H: rad2deg(H),
    αʹ: rad2deg(αʹ),
    δʹ: rad2deg(δʹ),
    Hʹ: rad2deg(Hʹ),
    θ: rad2deg(θ),
    Φ: rad2deg(Φ),
  };
}

/** The Julian Date of the Unix epoch. */
const JULIAN_DAY_UNIX_EPOCH = 2440587.5;

/** Number of milliseconds in a day. */
const MSEC_PER_DAY = 1000 * 60 * 60 * 24;

export function julianDate(date: Date): number {
  // The algorithm for determining the Julian date is much more convoluted in
  // NREL SPA, but the result seems to be identical with this.
  return JULIAN_DAY_UNIX_EPOCH + date.getTime() / MSEC_PER_DAY;
}

function heliocentric(
  terms: {A: number; B: number; C: number}[][],
  JME: number
) {
  let L = 0;
  for (let n = 0; n < terms.length; n++) {
    let Ln = 0;
    for (const term of terms[n]) {
      Ln += term.A * cos(term.B + term.C * JME);
    }
    L += Ln * JME ** n;
  }
  return L / 1e8;
}

function xyTerms(JCE: number) {
  const xs = X_TERMS.map(xs => polynomial(JCE, xs));
  return Y_TERMS.map(ys => {
    let sum = 0;
    for (let j = 0; j <= 4; j++) {
      sum += xs[j] * ys[j];
    }
    return deg2rad(sum);
  });
}

function nutation(JCE: number) {
  const xy = xyTerms(JCE);

  return {
    Δψ: deg2rad(
      Δψ_TERMS
        .map((r, i) => (r[0] + r[1] * JCE) * sin(xy[i]))
        .reduce((a, b) => a + b) / 36000000
    ),
    Δε: deg2rad(
      Δε_TERMS
        .map((r, i) => (r[0] + r[1] * JCE) * cos(xy[i]))
        .reduce((a, b) => a + b) / 36000000
    ),
  };
}

function polynomial(x: number, coefficients: number[]) {
  return coefficients.map((a, i) => a * x ** i).reduce((a, b) => a + b);
}

function rad2deg(radians: number) {
  return (180 / PI) * radians;
}

function deg2rad(degrees: number) {
  return (PI / 180) * degrees;
}

function normalize(radians: number) {
  const TwoPI = 2 * PI;
  return ((radians % TwoPI) + TwoPI) % TwoPI;
}

const L_TERMS = [
  [
    {A: 175347046.0, B: 0, C: 0},
    {A: 3341656.0, B: 4.6692568, C: 6283.07585},
    {A: 34894.0, B: 4.6261, C: 12566.1517},
    {A: 3497.0, B: 2.7441, C: 5753.3849},
    {A: 3418.0, B: 2.8289, C: 3.5231},
    {A: 3136.0, B: 3.6277, C: 77713.7715},
    {A: 2676.0, B: 4.4181, C: 7860.4194},
    {A: 2343.0, B: 6.1352, C: 3930.2097},
    {A: 1324.0, B: 0.7425, C: 11506.7698},
    {A: 1273.0, B: 2.0371, C: 529.691},
    {A: 1199.0, B: 1.1096, C: 1577.3435},
    {A: 990, B: 5.233, C: 5884.927},
    {A: 902, B: 2.045, C: 26.298},
    {A: 857, B: 3.508, C: 398.149},
    {A: 780, B: 1.179, C: 5223.694},
    {A: 753, B: 2.533, C: 5507.553},
    {A: 505, B: 4.583, C: 18849.228},
    {A: 492, B: 4.205, C: 775.523},
    {A: 357, B: 2.92, C: 0.067},
    {A: 317, B: 5.849, C: 11790.629},
    {A: 284, B: 1.899, C: 796.298},
    {A: 271, B: 0.315, C: 10977.079},
    {A: 243, B: 0.345, C: 5486.778},
    {A: 206, B: 4.806, C: 2544.314},
    {A: 205, B: 1.869, C: 5573.143},
    {A: 202, B: 2.458, C: 6069.777},
    {A: 156, B: 0.833, C: 213.299},
    {A: 132, B: 3.411, C: 2942.463},
    {A: 126, B: 1.083, C: 20.775},
    {A: 115, B: 0.645, C: 0.98},
    {A: 103, B: 0.636, C: 4694.003},
    {A: 102, B: 0.976, C: 15720.839},
    {A: 102, B: 4.267, C: 7.114},
    {A: 99, B: 6.21, C: 2146.17},
    {A: 98, B: 0.68, C: 155.42},
    {A: 86, B: 5.98, C: 161000.69},
    {A: 85, B: 1.3, C: 6275.96},
    {A: 85, B: 3.67, C: 71430.7},
    {A: 80, B: 1.81, C: 17260.15},
    {A: 79, B: 3.04, C: 12036.46},
    {A: 75, B: 1.76, C: 5088.63},
    {A: 74, B: 3.5, C: 3154.69},
    {A: 74, B: 4.68, C: 801.82},
    {A: 70, B: 0.83, C: 9437.76},
    {A: 62, B: 3.98, C: 8827.39},
    {A: 61, B: 1.82, C: 7084.9},
    {A: 57, B: 2.78, C: 6286.6},
    {A: 56, B: 4.39, C: 14143.5},
    {A: 56, B: 3.47, C: 6279.55},
    {A: 52, B: 0.19, C: 12139.55},
    {A: 52, B: 1.33, C: 1748.02},
    {A: 51, B: 0.28, C: 5856.48},
    {A: 49, B: 0.49, C: 1194.45},
    {A: 41, B: 5.37, C: 8429.24},
    {A: 41, B: 2.4, C: 19651.05},
    {A: 39, B: 6.17, C: 10447.39},
    {A: 37, B: 6.04, C: 10213.29},
    {A: 37, B: 2.57, C: 1059.38},
    {A: 36, B: 1.71, C: 2352.87},
    {A: 36, B: 1.78, C: 6812.77},
    {A: 33, B: 0.59, C: 17789.85},
    {A: 30, B: 0.44, C: 83996.85},
    {A: 30, B: 2.74, C: 1349.87},
    {A: 25, B: 3.16, C: 4690.48},
  ],
  [
    {A: 628331966747.0, B: 0, C: 0},
    {A: 206059.0, B: 2.678235, C: 6283.07585},
    {A: 4303.0, B: 2.6351, C: 12566.1517},
    {A: 425.0, B: 1.59, C: 3.523},
    {A: 119.0, B: 5.796, C: 26.298},
    {A: 109.0, B: 2.966, C: 1577.344},
    {A: 93, B: 2.59, C: 18849.23},
    {A: 72, B: 1.14, C: 529.69},
    {A: 68, B: 1.87, C: 398.15},
    {A: 67, B: 4.41, C: 5507.55},
    {A: 59, B: 2.89, C: 5223.69},
    {A: 56, B: 2.17, C: 155.42},
    {A: 45, B: 0.4, C: 796.3},
    {A: 36, B: 0.47, C: 775.52},
    {A: 29, B: 2.65, C: 7.11},
    {A: 21, B: 5.34, C: 0.98},
    {A: 19, B: 1.85, C: 5486.78},
    {A: 19, B: 4.97, C: 213.3},
    {A: 17, B: 2.99, C: 6275.96},
    {A: 16, B: 0.03, C: 2544.31},
    {A: 16, B: 1.43, C: 2146.17},
    {A: 15, B: 1.21, C: 10977.08},
    {A: 12, B: 2.83, C: 1748.02},
    {A: 12, B: 3.26, C: 5088.63},
    {A: 12, B: 5.27, C: 1194.45},
    {A: 12, B: 2.08, C: 4694},
    {A: 11, B: 0.77, C: 553.57},
    {A: 10, B: 1.3, C: 6286.6},
    {A: 10, B: 4.24, C: 1349.87},
    {A: 9, B: 2.7, C: 242.73},
    {A: 9, B: 5.64, C: 951.72},
    {A: 8, B: 5.3, C: 2352.87},
    {A: 6, B: 2.65, C: 9437.76},
    {A: 6, B: 4.67, C: 4690.48},
  ],
  [
    {A: 52919.0, B: 0, C: 0},
    {A: 8720.0, B: 1.0721, C: 6283.0758},
    {A: 309.0, B: 0.867, C: 12566.152},
    {A: 27, B: 0.05, C: 3.52},
    {A: 16, B: 5.19, C: 26.3},
    {A: 16, B: 3.68, C: 155.42},
    {A: 10, B: 0.76, C: 18849.23},
    {A: 9, B: 2.06, C: 77713.77},
    {A: 7, B: 0.83, C: 775.52},
    {A: 5, B: 4.66, C: 1577.34},
    {A: 4, B: 1.03, C: 7.11},
    {A: 4, B: 3.44, C: 5573.14},
    {A: 3, B: 5.14, C: 796.3},
    {A: 3, B: 6.05, C: 5507.55},
    {A: 3, B: 1.19, C: 242.73},
    {A: 3, B: 6.12, C: 529.69},
    {A: 3, B: 0.31, C: 398.15},
    {A: 3, B: 2.28, C: 553.57},
    {A: 2, B: 4.38, C: 5223.69},
    {A: 2, B: 3.75, C: 0.98},
  ],
  [
    {A: 289.0, B: 5.844, C: 6283.076},
    {A: 35, B: 0, C: 0},
    {A: 17, B: 5.49, C: 12566.15},
    {A: 3, B: 5.2, C: 155.42},
    {A: 1, B: 4.72, C: 3.52},
    {A: 1, B: 5.3, C: 18849.23},
    {A: 1, B: 5.97, C: 242.73},
  ],
  [
    {A: 114.0, B: 3.142, C: 0},
    {A: 8, B: 4.13, C: 6283.08},
    {A: 1, B: 3.84, C: 12566.15},
  ],
  [{A: 1, B: 3.14, C: 0}],
];

const B_TERMS = [
  [
    {A: 280.0, B: 3.199, C: 84334.662},
    {A: 102.0, B: 5.422, C: 5507.553},
    {A: 80, B: 3.88, C: 5223.69},
    {A: 44, B: 3.7, C: 2352.87},
    {A: 32, B: 4, C: 1577.34},
  ],
  [
    {A: 9, B: 3.9, C: 5507.55},
    {A: 6, B: 1.73, C: 5223.69},
  ],
];

const R_TERMS = [
  [
    {A: 100013989.0, B: 0, C: 0},
    {A: 1670700.0, B: 3.0984635, C: 6283.07585},
    {A: 13956.0, B: 3.05525, C: 12566.1517},
    {A: 3084.0, B: 5.1985, C: 77713.7715},
    {A: 1628.0, B: 1.1739, C: 5753.3849},
    {A: 1576.0, B: 2.8469, C: 7860.4194},
    {A: 925.0, B: 5.453, C: 11506.77},
    {A: 542.0, B: 4.564, C: 3930.21},
    {A: 472.0, B: 3.661, C: 5884.927},
    {A: 346.0, B: 0.964, C: 5507.553},
    {A: 329.0, B: 5.9, C: 5223.694},
    {A: 307.0, B: 0.299, C: 5573.143},
    {A: 243.0, B: 4.273, C: 11790.629},
    {A: 212.0, B: 5.847, C: 1577.344},
    {A: 186.0, B: 5.022, C: 10977.079},
    {A: 175.0, B: 3.012, C: 18849.228},
    {A: 110.0, B: 5.055, C: 5486.778},
    {A: 98, B: 0.89, C: 6069.78},
    {A: 86, B: 5.69, C: 15720.84},
    {A: 86, B: 1.27, C: 161000.69},
    {A: 65, B: 0.27, C: 17260.15},
    {A: 63, B: 0.92, C: 529.69},
    {A: 57, B: 2.01, C: 83996.85},
    {A: 56, B: 5.24, C: 71430.7},
    {A: 49, B: 3.25, C: 2544.31},
    {A: 47, B: 2.58, C: 775.52},
    {A: 45, B: 5.54, C: 9437.76},
    {A: 43, B: 6.01, C: 6275.96},
    {A: 39, B: 5.36, C: 4694},
    {A: 38, B: 2.39, C: 8827.39},
    {A: 37, B: 0.83, C: 19651.05},
    {A: 37, B: 4.9, C: 12139.55},
    {A: 36, B: 1.67, C: 12036.46},
    {A: 35, B: 1.84, C: 2942.46},
    {A: 33, B: 0.24, C: 7084.9},
    {A: 32, B: 0.18, C: 5088.63},
    {A: 32, B: 1.78, C: 398.15},
    {A: 28, B: 1.21, C: 6286.6},
    {A: 28, B: 1.9, C: 6279.55},
    {A: 26, B: 4.59, C: 10447.39},
  ],
  [
    {A: 103019.0, B: 1.10749, C: 6283.07585},
    {A: 1721.0, B: 1.0644, C: 12566.1517},
    {A: 702.0, B: 3.142, C: 0},
    {A: 32, B: 1.02, C: 18849.23},
    {A: 31, B: 2.84, C: 5507.55},
    {A: 25, B: 1.32, C: 5223.69},
    {A: 18, B: 1.42, C: 1577.34},
    {A: 10, B: 5.91, C: 10977.08},
    {A: 9, B: 1.42, C: 6275.96},
    {A: 9, B: 0.27, C: 5486.78},
  ],
  [
    {A: 4359.0, B: 5.7846, C: 6283.0758},
    {A: 124.0, B: 5.579, C: 12566.152},
    {A: 12, B: 3.14, C: 0},
    {A: 9, B: 3.63, C: 77713.77},
    {A: 6, B: 1.87, C: 5573.14},
    {A: 3, B: 5.47, C: 18849.23},
  ],
  [
    {A: 145.0, B: 4.273, C: 6283.076},
    {A: 7, B: 3.92, C: 12566.15},
  ],
  [{A: 4, B: 2.56, C: 6283.08}],
];

const X_TERMS = [
  [297.85036, 445267.11148, -0.0019142, 1 / 189474],
  [357.52772, 35999.05034, -0.0001603, -1 / 300000],
  [134.96298, 477198.867398, 0.0086972, 1 / 56250],
  [93.27191, 483202.017538, -0.0036825, 1 / 327270],
  [125.04452, -1934.136261, 0.0020708, 1 / 450000],
];

const Y_TERMS = [
  [0, 0, 0, 0, 1],
  [-2, 0, 0, 2, 2],
  [0, 0, 0, 2, 2],
  [0, 0, 0, 0, 2],
  [0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0],
  [-2, 1, 0, 2, 2],
  [0, 0, 0, 2, 1],
  [0, 0, 1, 2, 2],
  [-2, -1, 0, 2, 2],
  [-2, 0, 1, 0, 0],
  [-2, 0, 0, 2, 1],
  [0, 0, -1, 2, 2],
  [2, 0, 0, 0, 0],
  [0, 0, 1, 0, 1],
  [2, 0, -1, 2, 2],
  [0, 0, -1, 0, 1],
  [0, 0, 1, 2, 1],
  [-2, 0, 2, 0, 0],
  [0, 0, -2, 2, 1],
  [2, 0, 0, 2, 2],
  [0, 0, 2, 2, 2],
  [0, 0, 2, 0, 0],
  [-2, 0, 1, 2, 2],
  [0, 0, 0, 2, 0],
  [-2, 0, 0, 2, 0],
  [0, 0, -1, 2, 1],
  [0, 2, 0, 0, 0],
  [2, 0, -1, 0, 1],
  [-2, 2, 0, 2, 2],
  [0, 1, 0, 0, 1],
  [-2, 0, 1, 0, 1],
  [0, -1, 0, 0, 1],
  [0, 0, 2, -2, 0],
  [2, 0, -1, 2, 1],
  [2, 0, 1, 2, 2],
  [0, 1, 0, 2, 2],
  [-2, 1, 1, 0, 0],
  [0, -1, 0, 2, 2],
  [2, 0, 0, 2, 1],
  [2, 0, 1, 0, 0],
  [-2, 0, 2, 2, 2],
  [-2, 0, 1, 2, 1],
  [2, 0, -2, 0, 1],
  [2, 0, 0, 0, 1],
  [0, -1, 1, 0, 0],
  [-2, -1, 0, 2, 1],
  [-2, 0, 0, 0, 1],
  [0, 0, 2, 2, 1],
  [-2, 0, 2, 0, 1],
  [-2, 1, 0, 2, 1],
  [0, 0, 1, -2, 0],
  [-1, 0, 1, 0, 0],
  [-2, 1, 0, 0, 0],
  [1, 0, 0, 0, 0],
  [0, 0, 1, 2, 0],
  [0, 0, -2, 2, 2],
  [-1, -1, 1, 0, 0],
  [0, 1, 1, 0, 0],
  [0, -1, 1, 2, 2],
  [2, -1, -1, 2, 2],
  [0, 0, 3, 2, 2],
  [2, -1, 0, 2, 2],
];

const Δψ_TERMS = [
  [-171996, -174.2],
  [-13187, -1.6],
  [-2274, -0.2],
  [2062, 0.2],
  [1426, -3.4],
  [712, 0.1],
  [-517, 1.2],
  [-386, -0.4],
  [-301, 0],
  [217, -0.5],
  [-158, 0],
  [129, 0.1],
  [123, 0],
  [63, 0],
  [63, 0.1],
  [-59, 0],
  [-58, -0.1],
  [-51, 0],
  [48, 0],
  [46, 0],
  [-38, 0],
  [-31, 0],
  [29, 0],
  [29, 0],
  [26, 0],
  [-22, 0],
  [21, 0],
  [17, -0.1],
  [16, 0],
  [-16, 0.1],
  [-15, 0],
  [-13, 0],
  [-12, 0],
  [11, 0],
  [-10, 0],
  [-8, 0],
  [7, 0],
  [-7, 0],
  [-7, 0],
  [-7, 0],
  [6, 0],
  [6, 0],
  [6, 0],
  [-6, 0],
  [-6, 0],
  [5, 0],
  [-5, 0],
  [-5, 0],
  [-5, 0],
  [4, 0],
  [4, 0],
  [4, 0],
  [-4, 0],
  [-4, 0],
  [-4, 0],
  [3, 0],
  [-3, 0],
  [-3, 0],
  [-3, 0],
  [-3, 0],
  [-3, 0],
  [-3, 0],
  [-3, 0],
];

const Δε_TERMS = [
  [92025, 8.9],
  [5736, -3.1],
  [977, -0.5],
  [-895, 0.5],
  [54, -0.1],
  [-7, 0],
  [224, -0.6],
  [200, 0],
  [129, -0.1],
  [-95, 0.3],
  [0, 0],
  [-70, 0],
  [-53, 0],
  [0, 0],
  [-33, 0],
  [26, 0],
  [32, 0],
  [27, 0],
  [0, 0],
  [-24, 0],
  [16, 0],
  [13, 0],
  [0, 0],
  [-12, 0],
  [0, 0],
  [0, 0],
  [-10, 0],
  [0, 0],
  [-8, 0],
  [7, 0],
  [9, 0],
  [7, 0],
  [6, 0],
  [0, 0],
  [5, 0],
  [3, 0],
  [-3, 0],
  [0, 0],
  [3, 0],
  [3, 0],
  [0, 0],
  [-3, 0],
  [-3, 0],
  [3, 0],
  [3, 0],
  [0, 0],
  [3, 0],
  [3, 0],
  [3, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
  [0, 0],
];

const ε0_TERMS = [
  84381.448,
  -4680.93,
  -1.55,
  1999.25,
  -51.38,
  -249.67,
  -39.05,
  7.12,
  27.87,
  5.79,
  2.45,
];
