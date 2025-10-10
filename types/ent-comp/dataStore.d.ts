export = DataStore;
declare class DataStore<T extends Record<string, unknown>> {
    list: T[];
    hash: Record<number, T>;
    _map: Record<number, number>;
    _pendingRemovals: number[];
    add(id: number, stateObject: T): void;
    remove(id: number): void;
    dispose(): void;
    flush(): void;
}
