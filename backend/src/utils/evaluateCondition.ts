/**
 * Evaluates a condition string against a given context object.
 * 
 * @param conditionString The condition to evaluate (e.g., "cv.score > 80")
 * @param contextData The data context available for the evaluation (e.g., { cv: { score: 85 } })
 * @returns boolean indicating if the condition is met
 */
export function evaluateCondition(conditionString: string, contextData: Record<string, any>): boolean {
    if (!conditionString) return true; // If no condition is provided, default to true

    try {
        // Extract keys and values from the contextData
        const paramNames = Object.keys(contextData);
        const paramValues = Object.values(contextData);

        // We use new Function to parse the expression.
        // It acts somewhat like eval() but scoped to only the variables we explicitly pass.
        // WARNING: Ensure `conditionString` is trusted (built via admin workflow builder)
        const evaluator = new Function(...paramNames, `return ${conditionString};`);

        // Apply evaluator function with the provided context values
        return Boolean(evaluator(...paramValues));
    } catch (error) {
        console.error(`Failed to evaluate condition: "${conditionString}"`, error);
        // By default, if a condition errors out (e.g. missing fields in context), we return false
        return false;
    }
}
