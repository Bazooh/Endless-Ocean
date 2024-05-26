import * as THREE from 'three';
import {SpawnFish, Step} from './fishSpawner.js';
import {FishData, BoidData} from './fish.js';


var current_time;
var prev_time;

export function Run() {
  var clownfishData = new BoidData(5, 3, 4, 0.1, 1, 1, 1);
  var clownfish = new FishData("Clownfish", "Clownfish.obj", "Clownfish.mtl", clownfishData);
  clownfish.setColour(new THREE.Color(1, 0.4, 0), 0, 0.3);

  var bluetangData = new BoidData(3, 2, 4, 0.1, 1, 1, 1);
  var bluetang = new FishData("Bluetang", "Dory.obj", "Dory.mtl", bluetangData);
  bluetang.setColour(new THREE.Color(0.2, 0.2, 0.8), 0, 0.3)

  SpawnFish(clownfish, 0);
  SpawnFish(bluetang, 0);

  current_time = performance.now();
  prev_time = current_time;
  requestAnimationFrame(MyUpdateLoop);

}


var MyUpdateLoop = function ( )
{
    current_time = performance.now();
    var delta = (current_time - prev_time) / 1000;
    prev_time = current_time;

    if (delta < 3)  Step(delta);

    requestAnimationFrame(MyUpdateLoop);

};

