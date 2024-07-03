declare module "fast-voxel-raycast" {
  import vec3 from "gl-vec3";
  export = traceRay;
  function traceRay(getVoxel: (x: number, y: number, z: number) => boolean, origin: vec3, direction: vec3, max_d: number, hit_pos: vec3, hit_norm: vec3): true | 0;
}