/**
 * Return an approximate value for ΔT (the difference between earth rotational
 * time and terrestial time) on the given date.
 *
 * Polynomial computations and algorithm as described on:
 * https://eclipse.gsfc.nasa.gov/SEcat5/deltatpoly.html
 *
 * @param date The date for which to compute ΔT. Must be a date between the
 *     years -1999 and 3000.
 * @returns An approximation of ΔT in seconds.
 */
export function ΔT(date: Date): number {
  const y = date.getUTCFullYear() + (date.getUTCMonth() + 0.5) / 12;

  if (y < -500) {
    return polynomial((y - 1820) / 100, [-20, 0, 32]);
  }

  if (y < 500) {
    return polynomial(
      y / 100,
      [
        10583.6, -1014.41, 33.78311, -5.952053, -0.1798452, 0.022174192,
        0.0090316521,
      ]
    );
  }

  if (y < 1600) {
    return polynomial(
      (y - 1000) / 100,
      [
        1574.2, -556.01, 71.23472, 0.319781, -0.8503463, -0.005050998,
        0.0083572073,
      ]
    );
  }

  if (y < 1700) {
    return polynomial(y - 1600, [120, -0.9808, -0.01532, 1 / 7129]);
  }

  if (y < 1800) {
    return polynomial(y - 1700, [
      8.83,
      0.1603,
      -0.0059285,
      0.00013336,
      -1 / 1174000,
    ]);
  }

  if (y < 1860) {
    return polynomial(
      y - 1800,
      [
        13.72, -0.332447, 0.0068612, 0.0041116, -0.00037436, 0.0000121272,
        -0.0000001699, 0.000000000875,
      ]
    );
  }

  if (y < 1900) {
    return polynomial(y - 1860, [
      7.62,
      0.5737,
      -0.251754,
      0.01680668,
      -0.0004473624,
      1 / 233174,
    ]);
  }

  if (y < 1920) {
    return polynomial(
      y - 1900,
      [-2.79, 1.494119, -0.0598939, 0.0061966, -0.000197]
    );
  }

  if (y < 1941) {
    return polynomial(y - 1920, [21.2, 0.84493, -0.0761, 0.0020936]);
  }

  if (y < 1961) {
    return polynomial(y - 1950, [29.07, 0.407, -1 / 233, 1 / 2547]);
  }

  if (y < 1986) {
    return polynomial(y - 1975, [45.45, 1.067, -1 / 260, -1 / 718]);
  }

  if (y < 2005) {
    return polynomial(
      y - 2000,
      [63.86, 0.3345, -0.060374, 0.0017275, 0.000651814, 0.00002373599]
    );
  }

  if (y < 2050) {
    return polynomial(y - 2000, [62.92, 0.32217, 0.005589]);
  }

  if (y < 2150) {
    return (-20 + 32 * ((y - 1820) / 100)) ^ (2 - 0.5628 * (2150 - y));
  }

  return polynomial((y - 1820) / 100, [-20, 0, 32]);
}

function polynomial(x: number, coefficients: number[]) {
  return coefficients.map((a, i) => a * x ** i).reduce((a, b) => a + b);
}
