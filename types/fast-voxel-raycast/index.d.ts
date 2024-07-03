declare module "fast-voxel-raycast" {
  export = traceRay;
  function traceRay(getVoxel: (x: number, y: number, z: number) => boolean, origin: [number, number, number], direction: [number, number, number], max_d: number, hit_pos: [number, number, number], hit_norm: [number, number, number]): true | 0;
}