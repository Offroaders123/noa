declare module "aabb-3d" {
  import { vec3 } from "gl-matrix";
  import type { ReadonlyVec3 } from "gl-matrix";
  class AABB {
    constructor(pos: ReadonlyVec3, vec: ReadonlyVec3);
    base: vec3;
    vec: vec3;
    max: vec3;
    mag: number;
    width(): number;
    height(): number;
    depth(): number;
    x0(): number;
    y0(): number;
    z0(): number;
    x1(): number;
    y1(): number;
    z1(): number;
    translate(by: ReadonlyVec3): this;
    setPosition(pos: ReadonlyVec3): this;
    expand(aabb: AABB): AABB;
    intersects(aabb: AABB): boolean;
    touches(aabb: AABB): boolean;
    union(aabb: AABB): AABB | null;
  }
  export = AABB;
}