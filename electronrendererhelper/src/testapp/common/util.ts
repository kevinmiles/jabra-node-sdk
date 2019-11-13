// Reports back if app is running normall or as part of 
// an automated (gui) test.
export function isRunningInTestMode() : boolean
{
    return (process.env.NODE_ENV === 'test') 
}