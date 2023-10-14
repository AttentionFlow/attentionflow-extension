export function getCurrentDate(): string {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1; // Months are zero-based
    const day = now.getUTCDate();

    return `${year}-${month}-${day}`;
}
