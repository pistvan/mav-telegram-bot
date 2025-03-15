import { ValueTransformer } from "typeorm";

class TypeORMJsonTransformer implements ValueTransformer {
    to(value: unknown): string {
        return JSON.stringify(value);
    }

    from(value: unknown): unknown {
        if (typeof value !== 'string') {
            throw new Error('Value must be a string.');
        }
        return JSON.parse(value);
    }
}

export default new TypeORMJsonTransformer();
