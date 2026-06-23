export function enrichGoal(goal: { targetAmount: number; currentAmount: number; [key: string]: any }) {
  const progressPercentage =
    goal.targetAmount > 0
      ? Math.round((goal.currentAmount / goal.targetAmount) * 10000) / 100
      : 0
  return {
    ...goal,
    progressPercentage,
    isCompleted: goal.currentAmount >= goal.targetAmount,
  }
}
