
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
    light_param: {
      intensity: 100.0,
      color: 0xffffff,
      direction_theta: 2.2,
      direction_phi: Math.PI,
      angle: 1.0
    },
    atmosphere_param: {
      uSunIntensity: 1.0,
      uScatteringCoefficients: { r: 5.19673, g: 12.1427, b: 29.6453 },
      uAtmosphereHeight: 1.0,
      uEarthRadius: 6.371,
      uSunColor: { r: 1, g: 1, b: 1 },
      uRayNumberOfPoints: 40,
    },
    camera_param: {
      updateCamera: true,
      followSpeed: 1,
      offset: {
        x: 0,
        y: 4,
        z: 6,
      },
      lookPosition: {
        x: 0,
        y: 0,
        z: -2,
      },
    },
    player_param: {
      enableCollisions: true,
      horizontalAcceleration: 20,
      verticalAcceleration: 20,
      friction: 2,
      rotationSpeed: 1,
    }
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
      dayLength: 80,
      timeStatic: true,
    },
    light_param: {
      intensity: 40.0,
      color: 0xffffff,
      direction_theta: 2.2,
      direction_phi: Math.PI,
      angle: 1.3
    },
    atmosphere_param: {
      uSunIntensity: 1.0,
      uScatteringCoefficients: { r: 5.19673, g: 12.1427, b: 29.6453 },
      uAtmosphereHeight: 1.0,
      uEarthRadius: 6.371,
      uSunColor: { r: 1, g: 1, b: 1 },
      uRayNumberOfPoints: 100,
    },
    camera_param: {
      updateCamera: true,
      followSpeed: 0.2,
      offset: {
        x: -4,
        y: 4,
        z: 8,
      },
      lookPosition: {
        x: -2,
        y: 0,
        z: -6,
      },
    },
    player_param: {
      enableCollisions: false,
      horizontalAcceleration: 10,
      verticalAcceleration: 5,
      friction: 2,
      rotationSpeed: 0.5,
    }
  },
}