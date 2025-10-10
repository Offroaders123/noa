declare class DataStore<T extends Record<string, unknown>> {
    list: T[];
    hash: Record<number, T>;
    private _map: Record<number, number>;
    private _pendingRemovals: number[];
    add(id: number, stateObject: T): void;
    remove(id: number): void;
    dispose(): void;
    flush(): void;
}
export = ECS;
declare class ECS<T extends Record<string, unknown>> {
    components: Record<string, Component<T>>;
    comps: Record<string, Component<T>>;
    private _storage: Record<string, DataStore<T>>;
    private _systems: string[];
    private _renderSystems: string[];
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
