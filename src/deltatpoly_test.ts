import {expect} from 'chai';
import {ΔT} from './deltatpoly';

describe('deltatpoly', () => {
  describe('ΔT', () => {
    const tests = [
      {year: -700, month: 0, ΔT: 20400},
      {year: -600, month: 0, ΔT: 18800},
      {year: -500, month: 0, ΔT: 17190},
      {year: -400, month: 0, ΔT: 15530},
      {year: -300, month: 0, ΔT: 14080},
      {year: -200, month: 0, ΔT: 12790},
      {year: -100, month: 0, ΔT: 11640},
      {year: 100, month: 0, ΔT: 9600},
      {year: 200, month: 0, ΔT: 8640},
      {year: 300, month: 0, ΔT: 7680},
      {year: 400, month: 0, ΔT: 6700},
      {year: 500, month: 0, ΔT: 5710},
      {year: 600, month: 0, ΔT: 4740},
      {year: 700, month: 0, ΔT: 3810},
      {year: 800, month: 0, ΔT: 2960},
      {year: 900, month: 0, ΔT: 2200},
      {year: 1000, month: 0, ΔT: 1570},
      {year: 1100, month: 0, ΔT: 1090},
      {year: 1200, month: 0, ΔT: 740},
      {year: 1300, month: 0, ΔT: 490},
      {year: 1400, month: 0, ΔT: 320},
      {year: 1500, month: 0, ΔT: 200},
      {year: 1600, month: 0, ΔT: 120},
      {year: 1747, month: 0, ΔT: 13},
      {year: 1758, month: 5, ΔT: 14.7},
      {year: 1846, month: 0, ΔT: 6.4},
      {year: 1855, month: 5, ΔT: 7.3},
      {year: 1868, month: 0, ΔT: 2.94},
      {year: 1910, month: 0, ΔT: 10.38},
      {year: 1915, month: 5, ΔT: 17.72},
      {year: 1923, month: 5, ΔT: 23.29},
      {year: 1933, month: 0, ΔT: 23.93},
      {year: 1944, month: 5, ΔT: 26.54},
      {year: 1946, month: 0, ΔT: 27.27},
      {year: 1962, month: 0, ΔT: 33.992},
      {year: 1975, month: 5, ΔT: 45.983},
      {year: 1984, month: 0, ΔT: 53.789},
      {year: 1984, month: 5, ΔT: 54.087},
      {year: 2000, month: 0, ΔT: 63.8285},
      {year: 2001, month: 0, ΔT: 64.0908},
      {year: 2002, month: 0, ΔT: 64.2998},
      {year: 2003, month: 0, ΔT: 64.4734},
      {year: 2004, month: 0, ΔT: 64.5736},
      {year: 2005, month: 0, ΔT: 64.6876},
      {year: 2006, month: 0, ΔT: 64.8452},
      {year: 2007, month: 0, ΔT: 65.1464},
      {year: 2008, month: 0, ΔT: 65.4574},
      {year: 2009, month: 0, ΔT: 65.7768},
      {year: 2010, month: 0, ΔT: 66.0699},
      {year: 2011, month: 0, ΔT: 66.3246},
      {year: 2012, month: 0, ΔT: 66.603},
      {year: 2013, month: 0, ΔT: 66.9069},
      {year: 2014, month: 0, ΔT: 67.281},
      {year: 2015, month: 0, ΔT: 67.6439},
      {year: 2016, month: 0, ΔT: 68.1024},
      {year: 2017, month: 0, ΔT: 68.5927},
      {year: 2018, month: 0, ΔT: 68.9677},
      {year: 2019, month: 0, ΔT: 69.2202},
      {year: 2020, month: 0, ΔT: 69.5},
    ];

    for (const test of tests) {
      it(`${test.year}.${test.month}`, () => {
        const date = new Date(Date.UTC(test.year, test.month, 1));
        const got = ΔT(date);
        const relErr = Math.abs(got - test.ΔT) / test.ΔT;
        expect(
          relErr,
          `expected ${got} to be close to ${test.ΔT}`
        ).to.be.lessThan(0.1);
      });
    }
  });
});
