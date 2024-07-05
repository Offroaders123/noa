declare module "voxel-aabb-sweep" {
  import aabb from "aabb-3d";
  import vec3 from "gl-vec3";
  export = sweep;
  function sweep(getVoxel: (x: number, y: number, z: number) => boolean, box: aabb, dir: vec3, callback: (cumulative_t: number, axis: number, dir: number, left: vec3) => boolean, noTranslate: boolean, epsilon?: number): number;
}