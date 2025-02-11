type Body = Blob | ArrayBuffer | FormData | URLSearchParams | string | {};

const convertBody = (body: Body | undefined): RequestInit['body'] => {
    if (
        body instanceof Blob ||
        body instanceof ArrayBuffer ||
        body instanceof FormData ||
        body instanceof URLSearchParams ||
        body === undefined
    ) {
        return body;
    }

    return JSON.stringify(body);
}

const getContentType = (body: Body | undefined): string|undefined => {
    if (body instanceof Blob) {
        return body.type;
    }

    if (body === undefined || body instanceof ArrayBuffer || body instanceof FormData) {
        return undefined;
    }

    return 'application/json';
}

/**
 * A wrapper around fetch, which supports objects as body.
 */
export default async <T extends {}>(
    url: string | URL,
    body?: Body,
    options?: Omit<RequestInit, 'body'>,
) => {
    const actualbody = convertBody(body);
    const contentType = getContentType(body);

    const response = await fetch(url, {
        method: (body === undefined) ? 'GET' : 'POST',
        ...options,
        headers: {
            ...(contentType !== undefined ? { 'Content-Type': contentType } : {}),
            ...options?.headers,
        },
        body: actualbody,
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json() as T;
}
