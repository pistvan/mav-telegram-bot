import MessageService from "../MessageService";

const report = async (error: unknown) => {
    await MessageService.reportError(error);
}

/**
 * Sends an error report, if an error occurs, then throws it forward.
 */
function reportError() {
    return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
        const { value } = descriptor;

        descriptor.value = function (...args: unknown[]) {
            let result: unknown;
            try {
                result = value.apply(this, args);
            } catch (error) {
                report(error);
                throw error;
            }

            if (result instanceof Promise) {
                result.catch(report);
            }
            return result;
        };

        return descriptor;
    }
}

export default reportError;
