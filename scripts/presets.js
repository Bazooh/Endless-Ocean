
export const PRESETS = {
  default: {
    noise_param: {
      frequency: 1,
      n_octaves: 4,
      persistence: 0.5,
      lacunarity: 2,
      threshold: 0,
    },
    time: {
      uTimeOfDay: 0,
      dayLength: 10,
      timeStatic: false,
    },
    atmosphere_param: {
      uSunIntensity: 1.0,
      uScatteringCoefficients: { r: 5.19673, g: 12.1427, b: 29.6453 },
      uAtmosphereHeight: 1.0,
      uEarthRadius: 6.371,
      uSunColor: { r: 1, g: 1, b: 1 },
      uRayNumberOfPoints: 40,
    },
  },
  cinematic: {
    noise_param: {
      frequency: 0.1,
      n_octaves: 8,
      persistence: 0.5,
      lacunarity: 2,
      threshold: 0,
    },
    time: {
      uTimeOfDay: 0,
      dayLength: 10,
      timeStatic: true,
    },
    atmosphere_param: {
      uSunIntensity: 1.0,
      uScatteringCoefficients: { r: 5.19673, g: 12.1427, b: 29.6453 },
      uAtmosphereHeight: 1.0,
      uEarthRadius: 6.371,
      uSunColor: { r: 1, g: 1, b: 1 },
      uRayNumberOfPoints: 40,
    },
  },
}