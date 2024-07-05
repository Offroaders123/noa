declare module "voxel-aabb-sweep" {
  export = sweep;
  function sweep(getVoxel: (x: number, y: number, z: number) => boolean, box: {
      max: [number, number, number];
      base: [number, number, number];
      translate: (vec: [number, number, number]) => void;
  }, dir: [number, number, number], callback: (cumulative_t: number, axis: number, dir: number, left: [number, number, number]) => boolean, noTranslate: boolean, epsilon: number): number;  
}