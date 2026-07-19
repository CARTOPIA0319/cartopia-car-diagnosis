export async function judgeByAI(input) {
  return {
    success: true,
    useAi: true,
    category: "vehicle-search",
    confidence: "medium",
    keyword: input,
    message: "AI未接続",
  };
}
