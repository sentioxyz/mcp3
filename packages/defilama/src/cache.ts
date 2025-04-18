const cache = new Map<string, { data: string, timestamp: number }>();

export async function withCachedResult(key: string, page: number, pageSize: number, callback:  () => Promise<string>) {
    let result: string;
    if (!cache.has(key) || page == 0 ) {
        result = await callback();
        cache.set(key, {data: result, timestamp: Date.now()});
    } else {
        result = cache.get(key)?.data ?? '';
    }
    // Split the result into pages by pageSize
    const paged =  result.slice(page * pageSize, (page + 1) * pageSize);
    const totalPages = Math.ceil(result.length / pageSize);

    return paged + `... #${page}/${totalPages} pages`;
}