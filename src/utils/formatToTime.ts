export default (date: Date) => {
    return date.toLocaleTimeString('hu-HU', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
