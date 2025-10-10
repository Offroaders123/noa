import type DataStore from "./dataStore.d.ts";
export = ECS;
declare class ECS<T extends Record<string, unknown>> {
    components: Record<string, Component<T>>;
    comps: Record<string, Component<T>>;
    UID: number;
    _storage: Record<string, DataStore<T>>;
    _systems: string[];
    _renderSystems: string[];
    _deferrals: {
        timeout: boolean;
        removals: any[];
        multiComps: any[];
    };
    createEntity(compList?: string[]): number;
    deleteEntity(entID: number): this;
    createComponent(compDefn: Component<T>): string;
    overwriteComponent(compName: string, compDefn: Component<T>): string;
    deleteComponent(compName: string): this;
    addComponent(entID: number, compName: string, state?: Component<T>): this;
    hasComponent(entID: number, compName: string): boolean;
    removeComponent(entID: number, compName: string): this;
    getState(entID: number, compName: string): T;
    getStatesList(compName: string): T[];
    getStateAccessor(compName: string): (id: number) => T;
    getComponentAccessor(compName: string): (id: number) => boolean;
    tick(dt: number): this;
    render(dt: number): this;
    removeMultiComponent(entID: number, compName: string, index: number): this;
    removeComponent__(entID: number, compName: string): void;
    removeMultiCompElement(entID: number, def: Component<T>, data: DataStore<T>, index: number): void;
    pingDeferrals(): void;
    deferralHandler(): void;
    doDeferredCleanup(): void;
    deferredMultiCompCleanup(list: any): void;
    deferredComponentCleanup(list: any): void;
}
declare namespace ECS {
    export { Component };
}
type Component<T> = {
    name: string;
    multi: boolean;
    order: number;
    state: T;
    onAdd: (entID: number, state: {
        __id: number;
    } & T & Component<T>) => void;
    onRemove: (entID: number, state: Component<T>) => void;
    system: ((dt: number, list: T[]) => void) | null;
    renderSystem: ((dt: number, list: T[]) => void) | null;
};
