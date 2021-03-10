/* eslint-disable no-unused-vars */

module.exports = {
  historian: undefined,
  percentDataBad: 100,
  percentDataGood: 100,  // Therefore if all values are Good then the
  // quality will be Good, or if all values are Bad then the quality will be Bad, but if there is
  // some Good and some Bad then the quality will be Uncertain
  stepped: false, // Therefore SlopedInterpolation is used between data points.
  treatUncertainAsBad: false, // Therefore Uncertain values are included in Aggregate calls.
  useSlopedExtrapolation: false, // Therefore SteppedExtrapolation is used at end boundary conditions.
};
