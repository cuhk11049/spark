const errorMessages: Record<number, string> = {
  40001: '缺少必要参数，请检查输入内容',
  40002: '参数格式不正确，请重新确认',
  40301: '无法接管已屏蔽会话',
  40302: '会话已被接管，请勿重复操作',
  40303: '小冰人未开启，请主人先开启服务',
  40401: '会话不存在，请刷新后重试',
  40402: '用户不存在，请确认当前身份',
  50001: '小冰人正在走神，请稍后重试',
};

export function getErrorMessage(code: number, fallback: string) {
  return errorMessages[code] ?? fallback;
}
