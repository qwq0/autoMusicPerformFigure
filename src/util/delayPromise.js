/**
 * @param {number} time
 * @returns {Promise<void>}
 */
export function delayPromise(time)
{
    return new Promise(resolve =>
    {
        setTimeout(() =>
        {
            resolve();
        }, time);
    });
}