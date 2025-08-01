type PlainObject = Record<string, any>;
type Data = PlainObject | ValidTypes[];
type Key = string | number;
type KeyType<P, D> = P | D extends any[] ? Key : keyof P | keyof D;
type ValidTypes = string | boolean | number | PlainObject;
type Value = ValidTypes | ValidTypes[];
interface TreeChanges<K> {
    added: (key?: K, value?: Value) => boolean;
    changed: (key?: K | string, actual?: Value, previous?: Value) => boolean;
    changedFrom: (key: K | string, previous: Value, actual?: Value) => boolean;
    decreased: (key: K, actual?: Value, previous?: Value) => boolean;
    emptied: (key?: K) => boolean;
    filled: (key?: K) => boolean;
    increased: (key: K, actual?: Value, previous?: Value) => boolean;
    removed: (key?: K, value?: Value) => boolean;
}

declare function treeChanges<P extends Data, D extends Data, K = KeyType<P, D>>(previousData: P, data: D): TreeChanges<K>;

export { type Data, type KeyType, type TreeChanges, type Value, treeChanges as default };
